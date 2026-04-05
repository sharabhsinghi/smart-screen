"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CloudSun,
  CalendarDays,
  Lightbulb,
  X,
  LayoutGrid,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import type { WidgetType, WidgetConfig } from "@/types";

const DEFAULT_SLIDESHOW_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=80",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1920&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80",
];

const PRESET_ALBUMS: { label: string; images: string[] }[] = [
  {
    label: "Nature",
    images: DEFAULT_SLIDESHOW_IMAGES,
  },
  {
    label: "Cities",
    images: [
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80",
      "https://images.unsplash.com/photo-1514565131-fce0801e6175?w=1920&q=80",
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=80",
      "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1920&q=80",
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1920&q=80",
    ],
  },
  {
    label: "Abstract",
    images: [
      "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&q=80",
      "https://images.unsplash.com/photo-1567359781514-81173b801d3b?w=1920&q=80",
      "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=1920&q=80",
      "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&q=80",
      "https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=1920&q=80",
    ],
  },
  {
    label: "Space",
    images: [
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80",
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80",
      "https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1920&q=80",
      "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80",
    ],
  },
];

interface EditModePanelProps {
  open: boolean;
  widgets: WidgetConfig[];
  onAdd: (type: WidgetType) => void;
  onClose: () => void;
  slideshowImages: string[];
  onSlideshowImagesChange: (images: string[]) => void;
}

const WIDGET_CATALOG: { type: WidgetType; label: string; icon: React.ReactNode }[] = [
  { type: "clock", label: "Clock", icon: <Clock size={18} /> },
  { type: "weather", label: "Weather", icon: <CloudSun size={18} /> },
  { type: "calendar", label: "Tasks", icon: <CalendarDays size={18} /> },
  { type: "smarthome", label: "Smart Home", icon: <Lightbulb size={18} /> },
];

export default function EditModePanel({
  open,
  widgets,
  onAdd,
  onClose,
  slideshowImages,
  onSlideshowImagesChange,
}: EditModePanelProps) {
  const activeTypes = new Set(widgets.map((w) => w.type));
  const [newImageUrl, setNewImageUrl] = useState("");

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    onSlideshowImagesChange([...slideshowImages, url]);
    setNewImageUrl("");
  };

  const removeImage = (index: number) => {
    if (slideshowImages.length <= 1) return; // keep at least one
    onSlideshowImagesChange(slideshowImages.filter((_, i) => i !== index));
  };

  const applyAlbum = (images: string[]) => {
    onSlideshowImagesChange(images);
  };

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
          <div className="flex-1 overflow-y-auto backdrop-blur-xl bg-black/50 border-l border-white/10 p-6 flex flex-col gap-6">
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

            {/* Add widget */}
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

            {/* Slideshow */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={14} className="text-white/40" />
                <p className="text-xs text-white/40 uppercase tracking-wider">Slideshow</p>
              </div>

              {/* Preset albums */}
              <p className="text-xs text-white/30 mb-2">Preset albums</p>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {PRESET_ALBUMS.map(({ label, images }) => (
                  <button
                    key={label}
                    onClick={() => applyAlbum(images)}
                    className="py-1.5 px-3 rounded-lg text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Current images */}
              <p className="text-xs text-white/30 mb-2">Current images ({slideshowImages.length})</p>
              <div className="flex flex-col gap-1.5 mb-3">
                {slideshowImages.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="flex-1 text-xs text-white/40 truncate">{url}</span>
                    <button
                      onClick={() => removeImage(i)}
                      disabled={slideshowImages.length <= 1}
                      className="text-white/20 hover:text-red-400 disabled:opacity-30 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add custom URL */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addImage()}
                  placeholder="Paste image URL…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/30 min-w-0"
                />
                <button
                  onClick={addImage}
                  disabled={!newImageUrl.trim()}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white/60 hover:text-white transition-colors flex-shrink-0"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Tip */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Tip</p>
              <p className="text-xs text-white/40 leading-relaxed">
                Drag ⠿ to move widgets. Use <span aria-label="resize">⤢</span> to resize, ⚙ to configure, and <span aria-label="remove">✕</span> to remove.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
