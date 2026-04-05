"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Settings, X } from "lucide-react";

import BackgroundSlideshow from "@/components/BackgroundSlideshow";
import WidgetWrapper, { SIZE_SPANS } from "@/components/WidgetWrapper";
import EditModePanel from "@/components/EditModePanel";
import WidgetSettingsModal from "@/components/WidgetSettingsModal";
import ClockWidget from "@/components/widgets/ClockWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import SmartHomeWidget from "@/components/widgets/SmartHomeWidget";
import type {
  WidgetConfig,
  WidgetType,
  WidgetSize,
  ClockSettings,
  WeatherSettings,
  SmartHomeSettings,
} from "@/types";

const GRID_COLS = 4;
const GRID_ROWS = 3;

const DEFAULT_SLIDESHOW_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=80",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1920&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80",
];

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "clock", type: "clock", size: "medium", position: { col: 1, row: 1 } },
  { id: "weather", type: "weather", size: "small", position: { col: 3, row: 1 } },
  { id: "calendar", type: "calendar", size: "medium", position: { col: 1, row: 2 } },
  { id: "smarthome", type: "smarthome", size: "large", position: { col: 3, row: 2 } },
];

// Widgets that have configurable settings
const WIDGETS_WITH_SETTINGS: WidgetType[] = ["clock", "weather", "smarthome"];

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
      return <CalendarWidget />;
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
  const [slideshowImages, setSlideshowImages] = useState<string[]>(DEFAULT_SLIDESHOW_IMAGES);
  const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ col: number; row: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
    <div className="relative isolate w-screen h-screen overflow-hidden bg-black select-none">
      {/* Background slideshow */}
      <BackgroundSlideshow images={slideshowImages} />

      {/* Main content area */}
      <div className="relative z-10 w-full h-full flex flex-col p-6 gap-4">
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
        onSlideshowImagesChange={setSlideshowImages}
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
