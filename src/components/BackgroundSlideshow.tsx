"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  DEFAULT_SLIDE_INTERVAL_MS,
  normalizeSlideIntervalMs,
} from "@/lib/slideshow";

interface BackgroundSlideshowProps {
  images?: string[];
  intervalMs?: number;
}

// Gradient fallbacks are CSS strings shown when image URLs fail to load
const GRADIENT_FALLBACKS = [
  "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  "linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%)",
  "linear-gradient(135deg, #11001c 0%, #1a0533 50%, #240046 100%)",
  "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)",
];

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=80",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1920&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80",
];

export default function BackgroundSlideshow({
  images = DEFAULT_IMAGES,
  intervalMs = DEFAULT_SLIDE_INTERVAL_MS,
}: BackgroundSlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const normalizedIntervalMs = normalizeSlideIntervalMs(intervalMs);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, normalizedIntervalMs);
    return () => clearInterval(timer);
  }, [images.length, normalizedIntervalMs]);

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  return (
    <div className="fixed inset-0 z-0 h-full w-full overflow-hidden pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          style={
            failedImages.has(current)
              ? { background: GRADIENT_FALLBACKS[current % GRADIENT_FALLBACKS.length] }
              : undefined
          }
        >
          {!failedImages.has(current) && (
            <Image
              src={images[current]}
              alt={`Slideshow background ${current + 1}`}
              fill
              priority
              className="object-cover"
              sizes="100vw"
              unoptimized
              onError={() => handleImageError(current)}
            />
          )}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
