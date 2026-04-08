"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Images } from "lucide-react";
import type { SlideshowSettings } from "@/types";
import { DEFAULT_SLIDESHOW_IMAGES } from "@/lib/slideshowMedia";
import { DEFAULT_SLIDE_INTERVAL_MS } from "@/lib/slideshow";

interface Props {
  settings?: SlideshowSettings;
  onColorChange?: (color: string) => void;
}

function extractDominantColor(img: HTMLImageElement): string | null {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const size = 16;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    let r = 0, g = 0, b = 0;
    const count = size * size;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i + 1]; b += data[i + 2];
    }
    return `rgba(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}, 0.55)`;
  } catch {
    return null;
  }
}

const GRADIENT_FALLBACKS = [
  "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  "linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%)",
  "linear-gradient(135deg, #11001c 0%, #1a0533 50%, #240046 100%)",
  "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)",
];

export default function SlideshowWidget({ settings, onColorChange }: Props) {
  const images = settings?.images ?? DEFAULT_SLIDESHOW_IMAGES;
  const intervalMs = settings?.intervalMs ?? DEFAULT_SLIDE_INTERVAL_MS;
  const [current, setCurrent] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const prevImagesRef = useRef(images);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset to first image when the images array reference changes (settings updated)
  if (prevImagesRef.current !== images) {
    prevImagesRef.current = images;
    setCurrent(0);
  }

  const safeCurrent = current % images.length;
  const currentImage = images[safeCurrent];

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, intervalMs);
  }, [images.length, intervalMs]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length);
    startTimer();
  }, [images.length, startTimer]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
    startTimer();
  }, [images.length, startTimer]);

  if (images.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-white/30">
        <Images size={32} strokeWidth={1.5} />
        <p className="text-xs">No images — configure via ⚙</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Left click zone — previous image */}
      <div
        onClick={goPrev}
        className="absolute left-0 top-0 z-10 h-full w-1/8 cursor-pointer"
        aria-label="Previous image"
        role="button"
      />
      {/* Right click zone — next image */}
      <div
        onClick={goNext}
        className="absolute right-0 top-0 z-10 h-full w-1/8 cursor-pointer"
        aria-label="Next image"
        role="button"
      />
      <AnimatePresence>
        <motion.div
          key={currentImage.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={
            failedImages.has(currentImage.src)
              ? { background: GRADIENT_FALLBACKS[safeCurrent % GRADIENT_FALLBACKS.length] }
              : undefined
          }
        >
          {!failedImages.has(currentImage.src) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage.src}
              alt={currentImage.label}
              crossOrigin="anonymous"
              className="h-full w-full object-cover"
              onLoad={(e) => {
                const color = extractDominantColor(e.currentTarget);
                if (color) onColorChange?.(color);
              }}
              onError={() => setFailedImages((prev) => new Set(prev).add(currentImage.src))}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
