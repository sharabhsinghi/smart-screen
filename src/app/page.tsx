"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Settings, X, PanelRight } from "lucide-react";

import WidgetWrapper, { SIZE_SPANS } from "@/components/WidgetWrapper";
import BackgroundSlideshow from "@/components/BackgroundSlideshow";
import EditModePanel from "@/components/EditModePanel";
import WidgetSettingsModal from "@/components/WidgetSettingsModal";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import ClockWidget from "@/components/widgets/ClockWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import TasksWidget from "@/components/widgets/TasksWidget";
import SmartHomeWidget from "@/components/widgets/SmartHomeWidget";
import SlideshowWidget from "@/components/widgets/SlideshowWidget";
import type {
  WidgetConfig,
  WidgetType,
  WidgetSize,
  CalendarSettings,
  ClockSettings,
  WeatherSettings,
  SmartHomeSettings,
  SlideshowSettings,
} from "@/types";

const GRID_COLS = 4;
const GRID_ROWS = 3;
const WIDGETS_STORAGE_KEY = "smart-screen:widgets:v2";

/**
 * Widget types whose natural "medium" orientation is vertical (1 col × 2 rows)
 * rather than the default horizontal (2 cols × 1 row).
 */
const WIDGET_MEDIUM_VERTICAL = new Set<WidgetType>(["weather", "tasks"]);

const DEFAULT_WIDGETS: WidgetConfig[] = [
  // Col 1, Row 1 — clock (small 1×1)
  { id: "clock", type: "clock", size: "small", position: { col: 1, row: 1 } },
  // Cols 2–3, Row 1 — smarthome (medium 2×1 horizontal)
  { id: "smarthome", type: "smarthome", size: "medium", position: { col: 2, row: 1 } },
  // Col 4, Rows 1–2 — weather (medium 1×2 vertical)
  { id: "weather", type: "weather", size: "medium", position: { col: 4, row: 1 }, colSpan: 1, rowSpan: 2 },
  // Col 1, Rows 2–3 — tasks (medium 1×2 vertical)
  { id: "tasks", type: "tasks", size: "medium", position: { col: 1, row: 2 }, colSpan: 1, rowSpan: 2 },
  // Cols 2–3, Row 2 — calendar (medium 2×1 horizontal)
  { id: "calendar", type: "calendar", size: "medium", position: { col: 2, row: 2 } },
];

// Widgets that have configurable settings
const WIDGETS_WITH_SETTINGS: WidgetType[] = ["clock", "weather", "calendar", "smarthome", "slideshow"];

/** Returns all grid cells occupied by a widget */
function getOccupiedCells(widget: WidgetConfig) {
  const colSpan = widget.colSpan ?? SIZE_SPANS[widget.size].colSpan;
  const rowSpan = widget.rowSpan ?? SIZE_SPANS[widget.size].rowSpan;
  const cells: { col: number; row: number }[] = [];
  for (let r = widget.position.row; r < widget.position.row + rowSpan; r++) {
    for (let c = widget.position.col; c < widget.position.col + colSpan; c++) {
      cells.push({ col: c, row: r });
    }
  }
  return cells;
}

/** Checks if a target position is in bounds and not overlapping other widgets.
 * Non-slideshow widgets are allowed to overlap slideshow widgets.
 * Slideshow widgets may not overlap anything.
 */
function isValidDrop(
  draggingId: string,
  draggingType: WidgetType,
  targetCol: number,
  targetRow: number,
  size: WidgetSize,
  widgets: WidgetConfig[],
  overrideColSpan?: number,
  overrideRowSpan?: number
): boolean {
  const colSpan = overrideColSpan ?? SIZE_SPANS[size].colSpan;
  const rowSpan = overrideRowSpan ?? SIZE_SPANS[size].rowSpan;
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
    // Non-slideshow widgets may overlap slideshow widgets (they sit on top)
    if (draggingType !== "slideshow" && w.type === "slideshow") return false;
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

/** Finds the first free position for a widget of the given size.
 * When placing a non-slideshow widget, cells occupied only by slideshow widgets are treated as free.
 */
function findFreePosition(size: WidgetSize, existing: WidgetConfig[], overrideColSpan?: number, overrideRowSpan?: number, type?: WidgetType): { col: number; row: number } {
  const colSpan = overrideColSpan ?? SIZE_SPANS[size].colSpan;
  const rowSpan = overrideRowSpan ?? SIZE_SPANS[size].rowSpan;
  for (let row = 1; row <= GRID_ROWS - rowSpan + 1; row++) {
    for (let col = 1; col <= GRID_COLS - colSpan + 1; col++) {
      const targetCells: { col: number; row: number }[] = [];
      for (let r = row; r < row + rowSpan; r++) {
        for (let c = col; c < col + colSpan; c++) {
          targetCells.push({ col: c, row: r });
        }
      }
      const occupied = existing.some((w) => {
        // Non-slideshow widgets can occupy the same cells as slideshow widgets
        if (type !== "slideshow" && w.type === "slideshow") return false;
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
      return <TasksWidget size={widget.size} />;
    case "smarthome":
      return (
        <SmartHomeWidget settings={widget.settings as SmartHomeSettings | undefined} />
      );
    case "slideshow":
      return <SlideshowWidget settings={widget.settings as SlideshowSettings | undefined} />;
    default:
      return null;
  }
}

export default function SmartDisplayPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);
  const [slideshowGlowColor, setSlideshowGlowColor] = useState<string | undefined>(undefined);

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ col: number; row: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const initialLoadDoneRef = useRef(false);

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

    const storedWidgets = window.localStorage.getItem(WIDGETS_STORAGE_KEY);
    if (storedWidgets) {
      try {
        const parsed = JSON.parse(storedWidgets) as WidgetConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWidgets(parsed);
        }
      } catch {
        // corrupted storage — fall back to defaults
      }
    }

    initialLoadDoneRef.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !initialLoadDoneRef.current) return;
    window.localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const resizeWidget = useCallback((id: string, size: WidgetSize) => {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (size === "medium" && WIDGET_MEDIUM_VERTICAL.has(w.type)) {
          return { ...w, size, colSpan: 1, rowSpan: 2 };
        }
        // For all other sizes / orientations, clear any span overrides so
        // SIZE_SPANS drives the dimensions.
        return { ...w, size, colSpan: undefined, rowSpan: undefined };
      })
    );
  }, []);

  const resizeSlideshowWidget = useCallback((id: string, colSpan: number, rowSpan: number) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, colSpan, rowSpan } : w))
    );
  }, []);

  const addWidget = useCallback((type: WidgetType) => {
    const id = `${type}-${Date.now()}`;
    setWidgets((prev) => {
      if (type === "slideshow") {
        const position = findFreePosition("medium", prev, 2, 2, "slideshow");
        return [...prev, { id, type, size: "medium", position, colSpan: 2, rowSpan: 2 }];
      }
      if (WIDGET_MEDIUM_VERTICAL.has(type)) {
        const position = findFreePosition("medium", prev, 1, 2, type);
        return [...prev, { id, type, size: "medium", position, colSpan: 1, rowSpan: 2 }];
      }
      const position = findFreePosition("medium", prev, undefined, undefined, type);
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
      if (isValidDrop(draggingId, dragging.type, col, row, dragging.size, widgets, dragging.colSpan, dragging.rowSpan)) {
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
    <div className="relative isolate h-dvh w-full overflow-x-hidden bg-black select-none">
      {/* Background with ambient color from slideshow widget */}
      <BackgroundSlideshow images={[]} accentColor={slideshowGlowColor} />

      {/* Main content area */}
      <div className="relative z-10 flex h-dvh w-full flex-col gap-4 overflow-y-auto p-6">
        {/* Widget grid */}
        <div
          ref={gridRef}
          className="flex-1 grid landscape:max-h-[95dvh] grid-cols-4 grid-rows-3 gap-4 auto-rows-fr relative"
          onDragOver={editMode ? handleGridDragOver : undefined}
          onDrop={editMode ? handleGridDrop : undefined}
          onDragLeave={editMode ? handleGridDragLeave : undefined}
        >
          {/* Drop target indicator */}
          {editMode && dropTarget && draggingWidget && (() => {
            const colSpan = draggingWidget.colSpan ?? SIZE_SPANS[draggingWidget.size].colSpan;
            const rowSpan = draggingWidget.rowSpan ?? SIZE_SPANS[draggingWidget.size].rowSpan;
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
            {[...widgets].sort((a, b) => (a.type === "slideshow" ? -1 : b.type === "slideshow" ? 1 : 0)).map((widget) => (
              <WidgetWrapper
                key={widget.id}
                id={widget.id}
                size={widget.size}
                position={widget.position}
                colSpan={widget.colSpan}
                rowSpan={widget.rowSpan}
                transparent={widget.type === "slideshow"}
                editMode={editMode}
                isDragging={draggingId === widget.id}
                hasSettings={WIDGETS_WITH_SETTINGS.includes(widget.type)}
                onRemove={removeWidget}
                onResize={widget.type !== "slideshow" ? resizeWidget : undefined}
                onResizeCustom={widget.type === "slideshow" ? resizeSlideshowWidget : undefined}
                onDragStart={setDraggingId}
                onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                onSettings={setSettingsWidgetId}
              >
                {widget.type === "slideshow"
                  ? <SlideshowWidget settings={widget.settings as SlideshowSettings | undefined} onColorChange={setSlideshowGlowColor} />
                  : renderWidget(widget)}
              </WidgetWrapper>
            ))}
          </AnimatePresence>
        </div>

      </div>

      {/* Fixed bottom-right cluster: hints + widgets + edit/done */}
      <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2">
        {editMode && (
          <>
            <span className="flex items-center text-white/50 text-xs px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              Drag ⠿ to move · ⤢ resize · ⚙ configure · ✕ remove
            </span>
            {!editPanelOpen && (
              <button
                onClick={() => setEditPanelOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md text-sm font-medium transition-all bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10"
              >
                <PanelRight size={15} />
                Widgets
              </button>
            )}
          </>
        )}
        <button
          onClick={() => {
            if (!editMode) {
              setEditMode(true);
            } else {
              setEditMode(false);
              setEditPanelOpen(false);
              setDraggingId(null);
              setDropTarget(null);
            }
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md text-sm font-medium transition-all
            ${editMode
              ? "bg-white/20 text-white border border-white/30"
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10"
            }
          `}
        >
          {editMode ? <X size={15} /> : <Settings size={15} />}
          {editMode ? "Done" : "Edit"}
        </button>
      </div>

      {/* Edit mode side panel */}
      <EditModePanel
        open={editPanelOpen}
        widgets={widgets}
        onAdd={addWidget}
        onClose={() => setEditPanelOpen(false)}
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
