"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Images } from "lucide-react";
import type { SlideshowSettings } from "@/types";
import { DEFAULT_SLIDESHOW_IMAGES } from "@/lib/slideshowMedia";
import { DEFAULT_SLIDE_INTERVAL_MS } from "@/lib/slideshow";

interface Props {
  settings?: SlideshowSettings;
}

const GRADIENT_FALLBACKS = [
  "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  "linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%)",
  "linear-gradient(135deg, #11001c 0%, #1a0533 50%, #240046 100%)",
  "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)",
];

export default function SlideshowWidget({ settings }: Props) {
  const images = settings?.images ?? DEFAULT_SLIDESHOW_IMAGES;
  const intervalMs = settings?.intervalMs ?? DEFAULT_SLIDE_INTERVAL_MS;
  const [current, setCurrent] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const prevImagesRef = useRef(images);

  // Reset to first image when the images array reference changes (settings updated)
  if (prevImagesRef.current !== images) {
    prevImagesRef.current = images;
    setCurrent(0);
  }

  const safeCurrent = current % images.length;
  const currentImage = images[safeCurrent];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

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
              className="h-full w-full object-cover"
              onError={() => setFailedImages((prev) => new Set(prev).add(currentImage.src))}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
