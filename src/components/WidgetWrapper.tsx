"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

type WidgetSize = "small" | "medium" | "large";

interface WidgetWrapperProps {
  id: string;
  size: WidgetSize;
  editMode: boolean;
  onRemove?: (id: string) => void;
  onResize?: (id: string, size: WidgetSize) => void;
  children: React.ReactNode;
}

const SIZE_CLASSES: Record<WidgetSize, string> = {
  small: "col-span-1 row-span-1",
  medium: "col-span-2 row-span-1",
  large: "col-span-2 row-span-2",
};

const SIZE_OPTIONS: WidgetSize[] = ["small", "medium", "large"];

export default function WidgetWrapper({
  id,
  size,
  editMode,
  onRemove,
  onResize,
  children,
}: WidgetWrapperProps) {
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback(
    (newSize: WidgetSize) => {
      onResize?.(id, newSize);
      setShowSizeMenu(false);
    },
    [id, onResize]
  );

  return (
    <motion.div
      layout
      className={`relative ${SIZE_CLASSES[size]}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`h-full rounded-2xl p-4 backdrop-blur-md bg-white/[0.08] border border-white/[0.12] shadow-2xl
          ${editMode ? "ring-2 ring-white/30 ring-offset-1 ring-offset-transparent" : ""}
        `}
      >
        {children}
      </div>

      {editMode && (
        <div className="absolute -top-2.5 -right-2.5 flex gap-1.5 z-10">
          {/* Resize button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowSizeMenu((v) => !v)}
              className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold flex items-center justify-center shadow-lg transition-colors"
              title="Resize widget"
            >
              ⤢
            </button>
            {showSizeMenu && (
              <div className="absolute right-0 top-8 bg-gray-900/90 backdrop-blur border border-white/20 rounded-lg overflow-hidden shadow-xl z-20">
                {SIZE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleResize(s)}
                    className={`block w-full px-4 py-1.5 text-xs text-left hover:bg-white/10 transition-colors
                      ${s === size ? "text-blue-400 font-semibold" : "text-white/70"}
                    `}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Remove button */}
          <button
            onClick={() => onRemove?.(id)}
            className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs font-bold flex items-center justify-center shadow-lg transition-colors"
            title="Remove widget"
          >
            ✕
          </button>
        </div>
      )}
    </motion.div>
  );
}
