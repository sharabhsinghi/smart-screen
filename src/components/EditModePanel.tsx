"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CloudSun,
  CalendarDays,
  CheckCircle2,
  Lightbulb,
  X,
  LayoutGrid,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import type { WidgetType, WidgetConfig, SlideshowImage } from "@/types";
import {
  MAX_SLIDE_INTERVAL_MS,
  MIN_SLIDE_INTERVAL_MS,
} from "@/lib/slideshow";
import {
  PRESET_ALBUMS,
  createRemoteSlideshowImage,
} from "@/lib/slideshowMedia";

interface EditModePanelProps {
  open: boolean;
  widgets: WidgetConfig[];
  onAdd: (type: WidgetType) => void;
  onClose: () => void;
  slideshowImages: SlideshowImage[];
  slideshowIntervalMs: number;
  onSlideshowImagesChange: (images: SlideshowImage[]) => void;
  onSlideshowIntervalChange: (intervalMs: number) => void;
  canImportFromDevice: boolean;
  importPending: boolean;
  importError: string | null;
  onImportFromDevice: (mode: "replace" | "append") => void;
}

const WIDGET_CATALOG: { type: WidgetType; label: string; icon: React.ReactNode }[] = [
  { type: "clock", label: "Clock", icon: <Clock size={18} /> },
  { type: "weather", label: "Weather", icon: <CloudSun size={18} /> },
  { type: "calendar", label: "Calendar", icon: <CalendarDays size={18} /> },
  { type: "tasks", label: "Tasks", icon: <CheckCircle2 size={18} /> },
  { type: "smarthome", label: "Smart Home", icon: <Lightbulb size={18} /> },
];

export default function EditModePanel({
  open,
  widgets,
  onAdd,
  onClose,
  slideshowImages,
  slideshowIntervalMs,
  onSlideshowImagesChange,
  onSlideshowIntervalChange,
  canImportFromDevice,
  importPending,
  importError,
  onImportFromDevice,
}: EditModePanelProps) {
  const activeTypes = new Set(widgets.map((w) => w.type));
  const [newImageUrl, setNewImageUrl] = useState("");

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    onSlideshowImagesChange([
      ...slideshowImages,
      createRemoteSlideshowImage(url),
    ]);
    setNewImageUrl("");
  };

  const removeImage = (index: number) => {
    if (slideshowImages.length <= 1) return; // keep at least one
    onSlideshowImagesChange(slideshowImages.filter((_, i) => i !== index));
  };

  const applyAlbum = (images: SlideshowImage[]) => {
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

              {canImportFromDevice && (
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-white/30 mb-2">Google Photos or gallery</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => onImportFromDevice("replace")}
                      disabled={importPending}
                      className="py-2 px-3 rounded-lg text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 disabled:opacity-40 border border-white/10 transition-colors"
                    >
                      Replace set
                    </button>
                    <button
                      onClick={() => onImportFromDevice("append")}
                      disabled={importPending}
                      className="py-2 px-3 rounded-lg text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 disabled:opacity-40 border border-white/10 transition-colors"
                    >
                      Add photos
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-white/30 leading-relaxed">
                    Opens Android&apos;s photo picker so you can choose a set of pictures from Gallery or supported cloud providers such as Google Photos.
                  </p>
                  {importError && (
                    <p className="mt-2 text-[11px] text-amber-300/90 leading-relaxed">
                      {importError}
                    </p>
                  )}
                </div>
              )}

              {/* Preset albums */}
              <p className="text-xs text-white/30 mb-2">Built-in albums</p>
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

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/30">Slide timer</p>
                  <span className="text-xs text-white/50">{Math.round(slideshowIntervalMs / 1000)}s</span>
                </div>
                <input
                  type="number"
                  min={MIN_SLIDE_INTERVAL_MS / 1000}
                  max={MAX_SLIDE_INTERVAL_MS / 1000}
                  step={1}
                  value={Math.round(slideshowIntervalMs / 1000)}
                  onChange={(e) => onSlideshowIntervalChange(Number(e.target.value) * 1000)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                />
                <p className="mt-1 text-[11px] text-white/30">Set how many seconds each background image stays visible.</p>
              </div>

              {/* Current images */}
              <p className="text-xs text-white/30 mb-2">Current images ({slideshowImages.length})</p>
              <div className="flex flex-col gap-1.5 mb-3">
                {slideshowImages.map((image, i) => (
                  <div
                    key={image.id}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/55 truncate">{image.label}</p>
                      <p className="text-[10px] text-white/30 truncate">
                        {image.origin === "device" ? "Selected from device" : image.src}
                      </p>
                    </div>
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
