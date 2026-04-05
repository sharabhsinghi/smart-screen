"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Settings, X } from "lucide-react";

import BackgroundSlideshow from "@/components/BackgroundSlideshow";
import WidgetWrapper from "@/components/WidgetWrapper";
import EditModePanel from "@/components/EditModePanel";
import ClockWidget from "@/components/widgets/ClockWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import SmartHomeWidget from "@/components/widgets/SmartHomeWidget";
import type { WidgetConfig, WidgetType, WidgetSize } from "@/types";

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "clock", type: "clock", size: "medium", position: { col: 1, row: 1 } },
  { id: "weather", type: "weather", size: "small", position: { col: 3, row: 1 } },
  { id: "calendar", type: "calendar", size: "medium", position: { col: 1, row: 2 } },
  { id: "smarthome", type: "smarthome", size: "large", position: { col: 3, row: 2 } },
];

function renderWidget(type: WidgetType) {
  switch (type) {
    case "clock":
      return <ClockWidget />;
    case "weather":
      return <WeatherWidget />;
    case "calendar":
      return <CalendarWidget />;
    case "smarthome":
      return <SmartHomeWidget />;
    default:
      return null;
  }
}

export default function SmartDisplayPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);
  const [editPanelOpen, setEditPanelOpen] = useState(false);

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
        // Make navigation bar transparent/black to blend with the app
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
    setWidgets((prev) => [
      ...prev,
      { id, type, size: "medium", position: { col: 1, row: prev.length + 1 } },
    ]);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Background slideshow */}
      <BackgroundSlideshow />

      {/* Main content area */}
      <div className="relative z-10 w-full h-full flex flex-col p-6 gap-4">
        {/* Widget grid */}
        <div className="flex-1 grid grid-cols-4 grid-rows-3 gap-4 auto-rows-fr">
          <AnimatePresence mode="popLayout">
            {widgets.map((widget) => (
              <WidgetWrapper
                key={widget.id}
                id={widget.id}
                size={widget.size}
                editMode={editMode}
                onRemove={removeWidget}
                onResize={resizeWidget}
              >
                {renderWidget(widget.type)}
              </WidgetWrapper>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom control bar */}
        <div className="flex justify-end items-center gap-3">
          {editMode && (
            <span className="text-white/50 text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              Edit mode — tap widgets to resize or remove
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
      />
    </div>
  );
}
