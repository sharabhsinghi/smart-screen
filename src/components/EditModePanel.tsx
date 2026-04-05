"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CloudSun,
  CalendarDays,
  Lightbulb,
  X,
  LayoutGrid,
} from "lucide-react";
import type { WidgetType, WidgetConfig } from "@/types";

interface EditModePanelProps {
  open: boolean;
  widgets: WidgetConfig[];
  onAdd: (type: WidgetType) => void;
  onClose: () => void;
}

const WIDGET_CATALOG: { type: WidgetType; label: string; icon: React.ReactNode }[] = [
  { type: "clock", label: "Clock", icon: <Clock size={18} /> },
  { type: "weather", label: "Weather", icon: <CloudSun size={18} /> },
  { type: "calendar", label: "Tasks", icon: <CalendarDays size={18} /> },
  { type: "smarthome", label: "Smart Home", icon: <Lightbulb size={18} /> },
];

export default function EditModePanel({ open, widgets, onAdd, onClose }: EditModePanelProps) {
  const activeTypes = new Set(widgets.map((w) => w.type));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 h-full w-72 z-50 flex flex-col"
        >
          <div className="flex-1 backdrop-blur-xl bg-black/50 border-l border-white/10 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <LayoutGrid size={18} />
                <h2 className="text-lg font-semibold">Edit Widgets</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white transition-colors rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Add widget</p>
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_CATALOG.map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => onAdd(type)}
                    disabled={activeTypes.has(type)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                      ${activeTypes.has(type)
                        ? "border-white/5 bg-white/5 text-white/20 cursor-not-allowed"
                        : "border-white/20 bg-white/10 text-white hover:bg-white/20 active:scale-95"
                      }
                    `}
                  >
                    {icon}
                    <span className="text-xs font-medium">{label}</span>
                    {activeTypes.has(type) && (
                      <span className="text-[9px] text-white/30">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Tip</p>
              <p className="text-xs text-white/40 leading-relaxed">
              Use the <span aria-label="remove">✕</span> button on each widget to remove it.
              Use <span aria-label="resize">⤢</span> to resize between small, medium, and large.
            </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
