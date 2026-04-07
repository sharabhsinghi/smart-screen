"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Settings, X } from "lucide-react";

import BackgroundSlideshow from "@/components/BackgroundSlideshow";
import WidgetWrapper, { SIZE_SPANS } from "@/components/WidgetWrapper";
import EditModePanel from "@/components/EditModePanel";
import WidgetSettingsModal from "@/components/WidgetSettingsModal";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import ClockWidget from "@/components/widgets/ClockWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import TasksWidget from "@/components/widgets/TasksWidget";
import SmartHomeWidget from "@/components/widgets/SmartHomeWidget";
import {
  DEFAULT_SLIDE_INTERVAL_MS,
  normalizeSlideIntervalMs,
} from "@/lib/slideshow";
import {
  DEFAULT_SLIDESHOW_IMAGES,
  isAndroidNativePlatform,
  loadPersistedSlideshowImages,
  persistSlideshowImages,
  pickAndImportSlideshowImages,
  removeStoredSlideshowImages,
} from "@/lib/slideshowMedia";
import type {
  WidgetConfig,
  WidgetType,
  WidgetSize,
  CalendarSettings,
  ClockSettings,
  WeatherSettings,
  SmartHomeSettings,
  SlideshowImage,
} from "@/types";

const GRID_COLS = 4;
const GRID_ROWS = 3;
const SLIDESHOW_INTERVAL_STORAGE_KEY = "smart-screen:slideshow-interval:v1";

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "clock", type: "clock", size: "small", position: { col: 1, row: 1 } },
  { id: "weather", type: "weather", size: "small", position: { col: 1, row: 3 } },
  { id: "tasks", type: "tasks", size: "medium", position: { col: 2, row: 2 } },
  { id: "smarthome", type: "smarthome", size: "small", position: { col: 3, row: 1 } },
  { id: "calendar", type: "calendar", size: "medium", position: { col: 3, row: 2 } },
];

// Widgets that have configurable settings
const WIDGETS_WITH_SETTINGS: WidgetType[] = ["clock", "weather", "calendar", "smarthome"];

/** Returns all grid cells occupied by a widget */
function getOccupiedCells(widget: WidgetConfig) {
  const { colSpan, rowSpan } = SIZE_SPANS[widget.size];
  const cells: { col: number; row: number }[] = [];
  for (let r = widget.position.row; r < widget.position.row + rowSpan; r++) {
    for (let c = widget.position.col; c < widget.position.col + colSpan; c++) {
      cells.push({ col: c, row: r });
    }
  }
  return cells;
}

/** Checks if a target position is in bounds and not overlapping other widgets */
function isValidDrop(
  draggingId: string,
  targetCol: number,
  targetRow: number,
  size: WidgetSize,
  widgets: WidgetConfig[]
): boolean {
  const { colSpan, rowSpan } = SIZE_SPANS[size];
  if (targetCol < 1 || targetCol + colSpan - 1 > GRID_COLS) return false;
  if (targetRow < 1 || targetRow + rowSpan - 1 > GRID_ROWS) return false;
  const targetCells: { col: number; row: number }[] = [];
  for (let r = targetRow; r < targetRow + rowSpan; r++) {
    for (let c = targetCol; c < targetCol + colSpan; c++) {
      targetCells.push({ col: c, row: r });
    }
  }
  return !widgets.some((w) => {
    if (w.id === draggingId) return false;
    const wCells = getOccupiedCells(w);
    return targetCells.some((tc) =>
      wCells.some((wc) => wc.col === tc.col && wc.row === tc.row)
    );
  });
}

/** Calculates which grid cell the pointer is over */
function getGridCell(
  gridEl: HTMLElement,
  clientX: number,
  clientY: number
): { col: number; row: number } {
  const rect = gridEl.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const col = Math.max(1, Math.min(GRID_COLS, Math.ceil((x / rect.width) * GRID_COLS)));
  const row = Math.max(1, Math.min(GRID_ROWS, Math.ceil((y / rect.height) * GRID_ROWS)));
  return { col, row };
}

/** Finds the first free position for a widget of the given size */
function findFreePosition(size: WidgetSize, existing: WidgetConfig[]): { col: number; row: number } {
  const { colSpan, rowSpan } = SIZE_SPANS[size];
  for (let row = 1; row <= GRID_ROWS - rowSpan + 1; row++) {
    for (let col = 1; col <= GRID_COLS - colSpan + 1; col++) {
      const targetCells: { col: number; row: number }[] = [];
      for (let r = row; r < row + rowSpan; r++) {
        for (let c = col; c < col + colSpan; c++) {
          targetCells.push({ col: c, row: r });
        }
      }
      const occupied = existing.some((w) => {
        const wCells = getOccupiedCells(w);
        return targetCells.some((tc) =>
          wCells.some((wc) => wc.col === tc.col && wc.row === tc.row)
        );
      });
      if (!occupied) return { col, row };
    }
  }
  return { col: 1, row: 1 };
}

function renderWidget(widget: WidgetConfig) {
  switch (widget.type) {
    case "clock":
      return <ClockWidget settings={widget.settings as ClockSettings | undefined} />;
    case "weather":
      return <WeatherWidget settings={widget.settings as WeatherSettings | undefined} />;
    case "calendar":
      return <CalendarWidget settings={widget.settings as CalendarSettings | undefined} />;
    case "tasks":
      return <TasksWidget />;
    case "smarthome":
      return (
        <SmartHomeWidget settings={widget.settings as SmartHomeSettings | undefined} />
      );
    default:
      return null;
  }
}

export default function SmartDisplayPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [slideshowImages, setSlideshowImages] = useState<SlideshowImage[]>(DEFAULT_SLIDESHOW_IMAGES);
  const [slideshowIntervalMs, setSlideshowIntervalMs] = useState(DEFAULT_SLIDE_INTERVAL_MS);
  const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);
  const [slideshowImportPending, setSlideshowImportPending] = useState(false);
  const [slideshowImportError, setSlideshowImportError] = useState<string | null>(null);

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ col: number; row: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const slideshowLoadedRef = useRef(false);

  // Initialize Capacitor plugins (status bar + navigation bar)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initCapacitor = async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.hide();
      } catch {
        // Not running inside Capacitor (web dev mode)
      }

      try {
        const { NavigationBar, NavigationBarColor } = await import("@capgo/capacitor-navigation-bar");
        await NavigationBar.setNavigationBarColor({ color: NavigationBarColor.TRANSPARENT, darkButtons: false });
      } catch {
        // Not running inside Capacitor (web dev mode)
      }

      try {
        const { KeepAwake } = await import("@capacitor-community/keep-awake");
        await KeepAwake.keepAwake();
      } catch {
        // Not running inside Capacitor (web dev mode)
      }
    };

    initCapacitor();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadSlideshowSettings = async () => {
      const [storedImages] = await Promise.all([loadPersistedSlideshowImages()]);
      const storedInterval = window.localStorage.getItem(SLIDESHOW_INTERVAL_STORAGE_KEY);

      if (cancelled) {
        return;
      }

      if (storedImages && storedImages.length > 0) {
        setSlideshowImages(storedImages);
      }

      if (storedInterval) {
        setSlideshowIntervalMs(normalizeSlideIntervalMs(Number(storedInterval)));
      }

      slideshowLoadedRef.current = true;
    };

    void loadSlideshowSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !slideshowLoadedRef.current) return;
    persistSlideshowImages(slideshowImages);
  }, [slideshowImages]);

  useEffect(() => {
    if (typeof window === "undefined" || !slideshowLoadedRef.current) return;
    window.localStorage.setItem(
      SLIDESHOW_INTERVAL_STORAGE_KEY,
      String(slideshowIntervalMs)
    );
  }, [slideshowIntervalMs]);

  const handleSlideshowImagesChange = useCallback((nextImages: SlideshowImage[]) => {
    setSlideshowImportError(null);
    setSlideshowImages((previousImages) => {
      if (nextImages.length === 0) {
        return previousImages;
      }

      const retainedPaths = new Set(
        nextImages
          .map((image) => image.filePath)
          .filter((filePath): filePath is string => Boolean(filePath))
      );
      const removedImages = previousImages.filter(
        (image) => image.filePath && !retainedPaths.has(image.filePath)
      );

      void removeStoredSlideshowImages(removedImages);
      return nextImages;
    });
  }, []);

  const importSlideshowImages = useCallback(
    async (mode: "replace" | "append") => {
      if (slideshowImportPending) {
        return;
      }

      setSlideshowImportPending(true);
      setSlideshowImportError(null);

      try {
        const importedImages = await pickAndImportSlideshowImages();
        if (importedImages.length === 0) {
          return;
        }

        setSlideshowImages((previousImages) => {
          const nextImages =
            mode === "replace"
              ? importedImages
              : [...previousImages, ...importedImages];

          if (mode === "replace") {
            void removeStoredSlideshowImages(previousImages);
          }

          return nextImages;
        });
      } catch (error) {
        console.error(error);
        setSlideshowImportError(
          "Could not import photos. Check that Google Photos or Gallery access is available on this device and try again."
        );
      } finally {
        setSlideshowImportPending(false);
      }
    },
    [slideshowImportPending]
  );

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const resizeWidget = useCallback((id: string, size: WidgetSize) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size } : w))
    );
  }, []);

  const addWidget = useCallback((type: WidgetType) => {
    const id = `${type}-${Date.now()}`;
    setWidgets((prev) => {
      const position = findFreePosition("medium", prev);
      return [...prev, { id, type, size: "medium", position }];
    });
  }, []);

  const moveWidget = useCallback((id: string, col: number, row: number) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position: { col, row } } : w))
    );
  }, []);

  const updateWidgetSettings = useCallback(
    (id: string, settings: WidgetConfig["settings"]) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === id ? { ...w, settings } : w))
      );
    },
    []
  );

  // Grid drag-and-drop handlers
  const handleGridDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!draggingId || !gridRef.current) return;
      const dragging = widgets.find((w) => w.id === draggingId);
      if (!dragging) return;
      const { col, row } = getGridCell(gridRef.current, e.clientX, e.clientY);
      if (isValidDrop(draggingId, col, row, dragging.size, widgets)) {
        setDropTarget({ col, row });
        e.dataTransfer.dropEffect = "move";
      } else {
        setDropTarget(null);
        e.dataTransfer.dropEffect = "none";
      }
    },
    [draggingId, widgets]
  );

  const handleGridDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (draggingId && dropTarget) {
        moveWidget(draggingId, dropTarget.col, dropTarget.row);
      }
      setDraggingId(null);
      setDropTarget(null);
    },
    [draggingId, dropTarget, moveWidget]
  );

  const handleGridDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      // Only clear if we're leaving the grid entirely
      if (!gridRef.current || !e.relatedTarget || !gridRef.current.contains(e.relatedTarget as Node)) {
        setDropTarget(null);
      }
    },
    []
  );

  const settingsWidget = settingsWidgetId
    ? widgets.find((w) => w.id === settingsWidgetId) ?? null
    : null;

  // The widget being dragged (for drop indicator size)
  const draggingWidget = draggingId ? widgets.find((w) => w.id === draggingId) : null;

  return (
    <div className="relative isolate min-h-dvh w-full overflow-x-hidden bg-black select-none">
      {/* Background slideshow */}
      <BackgroundSlideshow
        images={slideshowImages}
        intervalMs={slideshowIntervalMs}
      />

      {/* Main content area */}
      <div className="relative z-10 flex min-h-dvh w-full flex-col gap-4 p-6">
        {/* Widget grid */}
        <div
          ref={gridRef}
          className="flex-1 grid grid-cols-4 grid-rows-3 gap-4 auto-rows-fr relative"
          onDragOver={editMode ? handleGridDragOver : undefined}
          onDrop={editMode ? handleGridDrop : undefined}
          onDragLeave={editMode ? handleGridDragLeave : undefined}
        >
          {/* Drop target indicator */}
          {editMode && dropTarget && draggingWidget && (() => {
            const { colSpan, rowSpan } = SIZE_SPANS[draggingWidget.size];
            return (
              <div
                className="rounded-2xl border-2 border-dashed border-white/60 bg-white/10 pointer-events-none z-0 transition-all duration-100"
                style={{
                  gridColumnStart: dropTarget.col,
                  gridColumnEnd: `span ${colSpan}`,
                  gridRowStart: dropTarget.row,
                  gridRowEnd: `span ${rowSpan}`,
                }}
              />
            );
          })()}

          <AnimatePresence mode="popLayout">
            {widgets.map((widget) => (
              <WidgetWrapper
                key={widget.id}
                id={widget.id}
                size={widget.size}
                position={widget.position}
                editMode={editMode}
                isDragging={draggingId === widget.id}
                hasSettings={WIDGETS_WITH_SETTINGS.includes(widget.type)}
                onRemove={removeWidget}
                onResize={resizeWidget}
                onDragStart={setDraggingId}
                onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                onSettings={setSettingsWidgetId}
              >
                {renderWidget(widget)}
              </WidgetWrapper>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom control bar */}
        <div className="flex justify-end items-center gap-3">
          {editMode && (
            <span className="text-white/50 text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              Drag ⠿ to move · ⤢ resize · ⚙ configure · ✕ remove
            </span>
          )}
          <button
            onClick={() => {
              if (!editMode) {
                setEditMode(true);
                setEditPanelOpen(true);
              } else {
                setEditMode(false);
                setEditPanelOpen(false);
                setDraggingId(null);
                setDropTarget(null);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium transition-all
              ${editMode
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10"
              }
            `}
          >
            {editMode ? <X size={16} /> : <Settings size={16} />}
            {editMode ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {/* Edit mode side panel */}
      <EditModePanel
        open={editPanelOpen}
        widgets={widgets}
        onAdd={addWidget}
        onClose={() => setEditPanelOpen(false)}
        slideshowImages={slideshowImages}
        slideshowIntervalMs={slideshowIntervalMs}
        onSlideshowImagesChange={handleSlideshowImagesChange}
        onSlideshowIntervalChange={(intervalMs) => {
          setSlideshowIntervalMs(normalizeSlideIntervalMs(intervalMs));
        }}
        canImportFromDevice={isAndroidNativePlatform()}
        importPending={slideshowImportPending}
        importError={slideshowImportError}
        onImportFromDevice={(mode) => {
          void importSlideshowImages(mode);
        }}
      />

      {/* Widget settings modal */}
      {settingsWidget && (
        <WidgetSettingsModal
          widget={settingsWidget}
          onSave={(settings) => updateWidgetSettings(settingsWidget.id, settings)}
          onClose={() => setSettingsWidgetId(null)}
        />
      )}
    </div>
  );
}
