"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { GripVertical, Settings } from "lucide-react";
import type { WidgetSize } from "@/types";

interface WidgetWrapperProps {
  id: string;
  size: WidgetSize;
  position: { col: number; row: number };
  /** Override the size-based column span (used by the slideshow widget) */
  colSpan?: number;
  /** Override the size-based row span (used by the slideshow widget) */
  rowSpan?: number;
  editMode: boolean;
  isDragging?: boolean;
  hasSettings?: boolean;
  /** No glass card background — the child fills the rounded frame edge-to-edge */
  transparent?: boolean;
  onRemove?: (id: string) => void;
  onResize?: (id: string, size: WidgetSize) => void;
  /** Custom span resize — replaces the small/medium/large menu when provided */
  onResizeCustom?: (id: string, colSpan: number, rowSpan: number) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onSettings?: (id: string) => void;
  children: React.ReactNode;
}

export const SIZE_SPANS: Record<WidgetSize, { colSpan: number; rowSpan: number }> = {
  small: { colSpan: 1, rowSpan: 1 },
  medium: { colSpan: 2, rowSpan: 1 },
  large: { colSpan: 2, rowSpan: 2 },
};

const GRID_COLS = 4;
const GRID_ROWS = 3;

const SIZE_OPTIONS: WidgetSize[] = ["small", "medium", "large"];

export default function WidgetWrapper({
  id,
  size,
  position,
  colSpan: colSpanProp,
  rowSpan: rowSpanProp,
  editMode,
  isDragging = false,
  hasSettings = false,
  transparent = false,
  onRemove,
  onResize,
  onResizeCustom,
  onDragStart,
  onDragEnd,
  onSettings,
  children,
}: WidgetWrapperProps) {
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const effectiveColSpan = colSpanProp ?? SIZE_SPANS[size].colSpan;
  const effectiveRowSpan = rowSpanProp ?? SIZE_SPANS[size].rowSpan;

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
      className="relative h-full"
      style={{
        gridColumnStart: position.col,
        gridColumnEnd: `span ${effectiveColSpan}`,
        gridRowStart: position.row,
        gridRowEnd: `span ${effectiveRowSpan}`,
        opacity: isDragging ? 0.4 : 1,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {/* Drag handle — only in edit mode */}
      {editMode && (
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("widgetId", id);
            e.dataTransfer.effectAllowed = "move";
            onDragStart?.(id);
          }}
          onDragEnd={() => onDragEnd?.()}
          className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-white/10 transition-colors"
          title="Drag to move"
        >
          <GripVertical size={14} className="text-white/40 hover:text-white/70" />
        </div>
      )}

      <div
        className={[
          "h-full rounded-2xl",
          transparent
            ? "overflow-hidden"
            : "p-4 backdrop-blur-md bg-white/[0.08] border border-white/[0.12] shadow-2xl",
          editMode ? "ring-2 ring-white/30 ring-offset-1 ring-offset-transparent" : "",
        ].filter(Boolean).join(" ")}
      >
        {children}
      </div>

      {editMode && (
        <div className="absolute -top-2.5 -right-2.5 flex gap-1.5 z-10">
          {/* Settings button */}
          {hasSettings && (
            <button
              onClick={() => onSettings?.(id)}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center shadow-lg transition-colors"
              title="Widget settings"
            >
              <Settings size={11} />
            </button>
          )}

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
              <div className="absolute right-0 top-8 bg-gray-900/90 backdrop-blur border border-white/20 rounded-lg overflow-hidden shadow-xl z-20 min-w-[120px]">
                {onResizeCustom ? (
                  /* Custom span steppers for slideshow widget */
                  <div className="px-3 py-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-white/50">Cols</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onResizeCustom(id, Math.max(1, effectiveColSpan - 1), effectiveRowSpan)}
                          className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white/70 text-xs flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-xs text-white">{effectiveColSpan}</span>
                        <button
                          onClick={() => onResizeCustom(id, Math.min(GRID_COLS, effectiveColSpan + 1), effectiveRowSpan)}
                          className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white/70 text-xs flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-white/50">Rows</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onResizeCustom(id, effectiveColSpan, Math.max(1, effectiveRowSpan - 1))}
                          className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white/70 text-xs flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-xs text-white">{effectiveRowSpan}</span>
                        <button
                          onClick={() => onResizeCustom(id, effectiveColSpan, Math.min(GRID_ROWS, effectiveRowSpan + 1))}
                          className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white/70 text-xs flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard size menu for regular widgets */
                  SIZE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleResize(s)}
                      className={`block w-full px-4 py-1.5 text-xs text-left hover:bg-white/10 transition-colors
                        ${s === size ? "text-blue-400 font-semibold" : "text-white/70"}
                      `}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))
                )}
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
