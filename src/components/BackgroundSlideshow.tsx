"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DEFAULT_SLIDE_INTERVAL_MS,
  normalizeSlideIntervalMs,
} from "@/lib/slideshow";
import { DEFAULT_SLIDESHOW_IMAGES } from "@/lib/slideshowMedia";
import type { SlideshowImage } from "@/types";

interface BackgroundSlideshowProps {
  images?: SlideshowImage[];
  intervalMs?: number;
  /** Dominant color extracted from the slideshow widget (rgba string) */
  accentColor?: string;
}

// Gradient fallbacks are CSS strings shown when image URLs fail to load
const GRADIENT_FALLBACKS = [
  "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  "linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%)",
  "linear-gradient(135deg, #11001c 0%, #1a0533 50%, #240046 100%)",
  "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)",
];

export default function BackgroundSlideshow({
  images = DEFAULT_SLIDESHOW_IMAGES,
  intervalMs = DEFAULT_SLIDE_INTERVAL_MS,
  accentColor,
}: BackgroundSlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const normalizedIntervalMs = normalizeSlideIntervalMs(intervalMs);
  const hasImages = images.length > 0;
  const safeCurrent = hasImages ? current % images.length : 0;
  const currentImage = hasImages ? images[safeCurrent] : null;

  useEffect(() => {
    if (!hasImages) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, normalizedIntervalMs);
    return () => clearInterval(timer);
  }, [hasImages, images.length, normalizedIntervalMs]);

  const handleImageError = (src: string) => {
    setFailedImages((prev) => new Set(prev).add(src));
  };

  return (
    <div className="fixed inset-0 z-0 h-full w-full overflow-hidden pointer-events-none bg-black">
      {hasImages && currentImage && (
        <AnimatePresence>
          <motion.div
            key={currentImage.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            style={
              failedImages.has(currentImage.src)
                ? { background: GRADIENT_FALLBACKS[safeCurrent % GRADIENT_FALLBACKS.length] }
                : undefined
            }
          >
            {!failedImages.has(currentImage.src) && (
              // Local Capacitor file URLs are more reliable here than next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage.src}
                alt={`Slideshow background ${safeCurrent + 1}`}
                className="h-full w-full object-cover"
                onError={() => handleImageError(currentImage.src)}
              />
            )}
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Ambient color from the slideshow widget */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ backgroundColor: accentColor ?? "transparent" }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </div>
  );
}
