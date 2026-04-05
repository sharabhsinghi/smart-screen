"use client";

import { useState } from "react";
import { X, Plus, Trash2, Settings } from "lucide-react";
import type {
  WidgetConfig,
  ClockSettings,
  WeatherSettings,
  SmartHomeSettings,
  SmartDevice,
  DeviceIcon,
} from "@/types";
import { DEFAULT_DEVICES, ICONS } from "@/components/widgets/SmartHomeWidget";

interface Props {
  widget: WidgetConfig;
  onSave: (settings: WidgetConfig["settings"]) => void;
  onClose: () => void;
}

const TIMEZONES: { label: string; value: string }[] = [
  { label: "Auto (local)", value: "local" },
  { label: "New York (ET)", value: "America/New_York" },
  { label: "Chicago (CT)", value: "America/Chicago" },
  { label: "Denver (MT)", value: "America/Denver" },
  { label: "Los Angeles (PT)", value: "America/Los_Angeles" },
  { label: "Toronto (ET)", value: "America/Toronto" },
  { label: "London (GMT)", value: "Europe/London" },
  { label: "Paris (CET)", value: "Europe/Paris" },
  { label: "Berlin (CET)", value: "Europe/Berlin" },
  { label: "Moscow (MSK)", value: "Europe/Moscow" },
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "Kolkata (IST)", value: "Asia/Kolkata" },
  { label: "Shanghai (CST)", value: "Asia/Shanghai" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Sydney (AEST)", value: "Australia/Sydney" },
  { label: "Auckland (NZST)", value: "Pacific/Auckland" },
];

const DEVICE_ICON_OPTIONS: DeviceIcon[] = [
  "lightbulb",
  "tv",
  "thermostat",
  "speaker",
  "coffee",
  "lock",
];

export default function WidgetSettingsModal({ widget, onSave, onClose }: Props) {
  const [localSettings, setLocalSettings] = useState<WidgetConfig["settings"]>(
    widget.settings
  );

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-[400px] max-h-[80vh] flex flex-col rounded-2xl bg-gray-950/95 backdrop-blur border border-white/15 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-base">
            {widget.type === "clock" && "Clock Settings"}
            {widget.type === "weather" && "Weather Settings"}
            {widget.type === "smarthome" && "Smart Home Devices"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {widget.type === "clock" && (
            <ClockSettingsForm
              settings={localSettings as ClockSettings | undefined}
              onChange={(s) => setLocalSettings(s)}
            />
          )}
          {widget.type === "weather" && (
            <WeatherSettingsForm
              settings={localSettings as WeatherSettings | undefined}
              onChange={(s) => setLocalSettings(s)}
            />
          )}
          {widget.type === "smarthome" && (
            <SmartHomeSettingsForm
              settings={localSettings as SmartHomeSettings | undefined}
              onChange={(s) => setLocalSettings(s)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl text-sm text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-xl text-sm text-white font-medium bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Clock ─────────────────────────────────────────────── */

function ClockSettingsForm({
  settings,
  onChange,
}: {
  settings?: ClockSettings;
  onChange: (s: ClockSettings) => void;
}) {
  const current: ClockSettings = {
    timezone: settings?.timezone ?? "local",
    format24h: settings?.format24h ?? true,
  };

  return (
    <div className="flex flex-col gap-5">
      <Field label="Time Zone">
        <select
          value={current.timezone}
          onChange={(e) => onChange({ ...current, timezone: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/30"
        >
          {TIMEZONES.map(({ label, value }) => (
            <option key={value} value={value} className="bg-gray-900">
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Time Format">
        <div className="flex gap-2">
          {[
            { label: "24-hour", value: true },
            { label: "12-hour", value: false },
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => onChange({ ...current, format24h: value })}
              className={`flex-1 px-3 py-2 rounded-xl text-sm border transition-colors
                ${current.format24h === value
                  ? "bg-blue-600/30 border-blue-500/50 text-blue-300"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

/* ─── Weather ────────────────────────────────────────────── */

function WeatherSettingsForm({
  settings,
  onChange,
}: {
  settings?: WeatherSettings;
  onChange: (s: WeatherSettings) => void;
}) {
  const current: WeatherSettings = {
    city: settings?.city ?? "Barrie,ON,CA",
    units: settings?.units ?? "metric",
  };

  return (
    <div className="flex flex-col gap-5">
      <Field label="City">
        <input
          type="text"
          value={current.city}
          onChange={(e) => onChange({ ...current, city: e.target.value })}
          placeholder="e.g. Toronto,ON,CA or London,UK"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
        />
        <p className="text-xs text-white/30 mt-1">
          Use OpenWeatherMap format: City,State,Country
        </p>
      </Field>

      <Field label="Units">
        <div className="flex gap-2">
          {[
            { label: "Metric (°C, km/h)", value: "metric" as const },
            { label: "Imperial (°F, mph)", value: "imperial" as const },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onChange({ ...current, units: value })}
              className={`flex-1 px-3 py-2 rounded-xl text-xs border transition-colors
                ${current.units === value
                  ? "bg-blue-600/30 border-blue-500/50 text-blue-300"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

/* ─── Smart Home ─────────────────────────────────────────── */

function SmartHomeSettingsForm({
  settings,
  onChange,
}: {
  settings?: SmartHomeSettings;
  onChange: (s: SmartHomeSettings) => void;
}) {
  const devices: SmartDevice[] = settings?.devices ?? DEFAULT_DEVICES;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SmartDevice | null>(null);

  const update = (newDevices: SmartDevice[]) => onChange({ devices: newDevices });

  const startEdit = (device: SmartDevice) => {
    setEditingId(device.id);
    setEditDraft({ ...device });
  };

  const saveEdit = () => {
    if (!editDraft) return;
    update(devices.map((d) => (d.id === editDraft.id ? editDraft : d)));
    setEditingId(null);
    setEditDraft(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const removeDevice = (id: string) => {
    update(devices.filter((d) => d.id !== id));
    if (editingId === id) cancelEdit();
  };

  const addDevice = () => {
    const newDevice: SmartDevice = {
      id: `device-${Date.now()}`,
      name: "New Device",
      room: "Room",
      icon: "lightbulb",
      endpoint: "light.new_device",
    };
    update([...devices, newDevice]);
    startEdit(newDevice);
  };

  return (
    <div className="flex flex-col gap-3">
      {devices.map((device) => {
        const Icon = ICONS[device.icon];
        const isEditing = editingId === device.id;

        if (isEditing && editDraft) {
          return (
            <div
              key={device.id}
              className="bg-white/5 border border-white/15 rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <InputField
                  label="Name"
                  value={editDraft.name}
                  onChange={(v) => setEditDraft((d) => d && { ...d, name: v })}
                />
                <InputField
                  label="Room"
                  value={editDraft.room}
                  onChange={(v) => setEditDraft((d) => d && { ...d, room: v })}
                />
              </div>
              <InputField
                label="HA Entity ID"
                value={editDraft.endpoint}
                onChange={(v) => setEditDraft((d) => d && { ...d, endpoint: v })}
                placeholder="e.g. light.living_room"
              />
              <div>
                <p className="text-xs text-white/40 mb-2">Icon</p>
                <div className="flex gap-2 flex-wrap">
                  {DEVICE_ICON_OPTIONS.map((icon) => {
                    const Ic = ICONS[icon];
                    return (
                      <button
                        key={icon}
                        onClick={() => setEditDraft((d) => d && { ...d, icon })}
                        className={`p-2 rounded-lg border transition-colors
                          ${editDraft.icon === icon
                            ? "bg-blue-600/30 border-blue-500/50 text-blue-300"
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                          }`}
                      >
                        <Ic size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={cancelEdit}
                  className="flex-1 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 py-1.5 rounded-lg text-xs text-white font-medium bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={device.id}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5"
          >
            <div className="text-white/50">
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white leading-none">{device.name}</p>
              <p className="text-xs text-white/40 mt-0.5">{device.room}</p>
            </div>
            <button
              onClick={() => startEdit(device)}
              className="text-white/30 hover:text-white/70 transition-colors p-1"
              title="Edit device"
            >
              <Settings size={13} />
            </button>
            <button
              onClick={() => removeDevice(device.id)}
              className="text-white/30 hover:text-red-400 transition-colors p-1"
              title="Remove device"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}

      <button
        onClick={addDevice}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 transition-colors"
      >
        <Plus size={14} />
        Add Device
      </button>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
      />
    </div>
  );
}