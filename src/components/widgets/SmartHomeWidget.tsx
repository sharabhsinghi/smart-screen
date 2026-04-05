"use client";

import { useState } from "react";
import {
  Lightbulb,
  Tv2,
  Thermometer,
  Speaker,
  Coffee,
  Lock,
  Loader2,
} from "lucide-react";
import type { SmartDevice, SmartHomeSettings, DeviceIcon } from "@/types";

export const ICONS: Record<DeviceIcon, React.ComponentType<{ size?: number }>> = {
  lightbulb: Lightbulb,
  tv: Tv2,
  thermostat: Thermometer,
  speaker: Speaker,
  coffee: Coffee,
  lock: Lock,
};

// Configure your Home Assistant / SmartThings base URL via env
const HA_BASE = process.env.NEXT_PUBLIC_HA_URL ?? "";
const HA_TOKEN = process.env.NEXT_PUBLIC_HA_TOKEN ?? "";

export const DEFAULT_DEVICES: SmartDevice[] = [
  { id: "1", name: "Living Room", room: "Lights", icon: "lightbulb", endpoint: "light.living_room" },
  { id: "2", name: "Bedroom", room: "Lights", icon: "lightbulb", endpoint: "light.bedroom" },
  { id: "3", name: "TV", room: "Living Room", icon: "tv", endpoint: "media_player.tv" },
  { id: "4", name: "Thermostat", room: "Home", icon: "thermostat", endpoint: "climate.home" },
  { id: "5", name: "Speaker", room: "Kitchen", icon: "speaker", endpoint: "media_player.kitchen" },
  { id: "6", name: "Front Door", room: "Security", icon: "lock", endpoint: "lock.front_door" },
];

interface Props {
  settings?: SmartHomeSettings;
}

async function callHA(device: SmartDevice, turnOn: boolean): Promise<void> {
  if (!HA_BASE) return; // demo mode — no-op
  const domain = device.endpoint.split(".")[0];
  const service = turnOn ? "turn_on" : "turn_off";
  await fetch(`${HA_BASE}/api/services/${domain}/${service}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HA_TOKEN}`,
    },
    body: JSON.stringify({ entity_id: device.endpoint }),
  });
}

export default function SmartHomeWidget({ settings }: Props) {
  const deviceList = settings?.devices ?? DEFAULT_DEVICES;

  // Runtime on/off state keyed by device id (undefined = use device default)
  const [onStates, setOnStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const isDemoMode = !HA_BASE;

  const isOn = (device: SmartDevice) => onStates[device.id] ?? false;

  const handleToggle = async (device: SmartDevice) => {
    const next = !isOn(device);
    setLoading(device.id);
    setOnStates((prev) => ({ ...prev, [device.id]: next }));
    try {
      await callHA(device, next);
    } catch {
      // revert on error
      setOnStates((prev) => ({ ...prev, [device.id]: !next }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 text-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/70 uppercase tracking-wider">
          Smart Home
        </span>
        {isDemoMode && (
          <span className="text-[10px] text-white/30 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
            demo
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1">
        {deviceList.map((device) => {
          const Icon = ICONS[device.icon];
          const isLoading = loading === device.id;
          const on = isOn(device);
          return (
            <button
              key={device.id}
              onClick={() => handleToggle(device)}
              disabled={isLoading}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-all duration-200
                ${on
                  ? "bg-yellow-400/20 border border-yellow-400/40 text-yellow-300"
                  : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                }
                ${isLoading ? "opacity-60 cursor-wait" : "cursor-pointer active:scale-95"}
              `}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Icon size={20} />
              )}
              <span className="text-xs font-medium leading-tight text-center">{device.name}</span>
              <span className="text-[10px] text-current/60 opacity-60">{device.room}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
