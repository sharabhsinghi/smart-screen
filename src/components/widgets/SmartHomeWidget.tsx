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

interface Device {
  id: string;
  name: string;
  room: string;
  on: boolean;
  icon: keyof typeof ICONS;
  endpoint: string;
}

const ICONS = {
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

const INITIAL_DEVICES: Device[] = [
  { id: "1", name: "Living Room", room: "Lights", on: false, icon: "lightbulb", endpoint: "light.living_room" },
  { id: "2", name: "Bedroom", room: "Lights", on: false, icon: "lightbulb", endpoint: "light.bedroom" },
  { id: "3", name: "TV", room: "Living Room", on: false, icon: "tv", endpoint: "media_player.tv" },
  { id: "4", name: "Thermostat", room: "Home", on: true, icon: "thermostat", endpoint: "climate.home" },
  { id: "5", name: "Speaker", room: "Kitchen", on: false, icon: "speaker", endpoint: "media_player.kitchen" },
  { id: "6", name: "Front Door", room: "Security", on: true, icon: "lock", endpoint: "lock.front_door" },
];

async function toggleDevice(device: Device): Promise<void> {
  if (!HA_BASE) return; // demo mode — no-op

  const domain = device.endpoint.split(".")[0];
  const service = device.on ? `turn_off` : `turn_on`;

  await fetch(`${HA_BASE}/api/services/${domain}/${service}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HA_TOKEN}`,
    },
    body: JSON.stringify({ entity_id: device.endpoint }),
  });
}

export default function SmartHomeWidget() {
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [loading, setLoading] = useState<string | null>(null);
  const isDemoMode = !HA_BASE;

  const handleToggle = async (device: Device) => {
    setLoading(device.id);
    try {
      await toggleDevice(device);
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, on: !d.on } : d))
      );
    } catch {
      // silently fail in demo mode
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
        {devices.map((device) => {
          const Icon = ICONS[device.icon];
          const isLoading = loading === device.id;
          return (
            <button
              key={device.id}
              onClick={() => handleToggle(device)}
              disabled={isLoading}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-all duration-200
                ${device.on
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
