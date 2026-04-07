"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, Settings, CalendarDays, Link2, Loader2 } from "lucide-react";
import type {
  WidgetConfig,
  ClockSettings,
  WeatherSettings,
  CalendarSettings,
  SmartHomeSettings,
  SmartDevice,
  DeviceIcon,
} from "@/types";
import { DEFAULT_DEVICES, ICONS } from "@/components/widgets/SmartHomeWidget";
import { searchWeatherCities, type WeatherCitySuggestion } from "@/lib/weather";
import {
  clearGoogleCalendarSession,
  fetchGoogleCalendars,
  getStoredGoogleCalendarSession,
  hasGoogleCalendarClientId,
  type GoogleCalendarListEntry,
} from "@/lib/googleCalendar";

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
  const [canSave, setCanSave] = useState(true);

  useEffect(() => {
    setLocalSettings(widget.settings);
    setCanSave(true);
  }, [widget]);

  const handleSave = () => {
    if (!canSave) {
      return;
    }

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
            {widget.type === "calendar" && "Calendar Settings"}
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
              onChange={setLocalSettings as (s: ClockSettings) => void}
            />
          )}
          {widget.type === "weather" && (
            <WeatherSettingsForm
              settings={localSettings as WeatherSettings | undefined}
              onChange={setLocalSettings as (s: WeatherSettings) => void}
              onValidityChange={setCanSave}
            />
          )}
          {widget.type === "calendar" && (
            <CalendarSettingsForm
              settings={localSettings as CalendarSettings | undefined}
              onChange={setLocalSettings as (s: CalendarSettings) => void}
            />
          )}
          {widget.type === "smarthome" && (
            <SmartHomeSettingsForm
              settings={localSettings as SmartHomeSettings | undefined}
              onChange={setLocalSettings as (s: SmartHomeSettings) => void}
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
            disabled={!canSave}
            className="flex-1 px-4 py-2 rounded-xl text-sm text-white font-medium bg-blue-600 transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:text-white/50"
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
  onValidityChange,
}: {
  settings?: WeatherSettings;
  onChange: (s: WeatherSettings) => void;
  onValidityChange: (valid: boolean) => void;
}) {
  const current: WeatherSettings = {
    city: settings?.city ?? "Barrie,ON,CA",
    units: settings?.units ?? "metric",
  };
  const [cityInput, setCityInput] = useState(current.city);
  const [suggestions, setSuggestions] = useState<WeatherCitySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [cityConfirmed, setCityConfirmed] = useState(Boolean(current.city));
  const latestRequestRef = useRef(0);

  useEffect(() => {
    setCityInput(current.city);
    setCityConfirmed(Boolean(current.city));
    setSuggestions([]);
    setSuggestionError(null);
    onValidityChange(Boolean(current.city));
  }, [current.city, onValidityChange]);

  useEffect(() => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    const trimmedInput = cityInput.trim();

    if (!trimmedInput) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setSuggestionError(null);
      onValidityChange(false);
      return;
    }

    if (cityConfirmed && trimmedInput === current.city) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setSuggestionError(null);
      onValidityChange(true);
      return;
    }

    setLoadingSuggestions(true);
    setSuggestionError(null);

    const timeoutId = window.setTimeout(() => {
      void searchWeatherCities(trimmedInput)
        .then((nextSuggestions) => {
          if (latestRequestRef.current !== requestId) {
            return;
          }

          setSuggestions(nextSuggestions);
          setSuggestionError(nextSuggestions.length === 0 ? "No matching cities found." : null);
        })
        .catch((error) => {
          if (latestRequestRef.current !== requestId) {
            return;
          }

          setSuggestions([]);
          setSuggestionError(
            error instanceof Error ? error.message : "Could not load city suggestions."
          );
        })
        .finally(() => {
          if (latestRequestRef.current === requestId) {
            setLoadingSuggestions(false);
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [cityConfirmed, cityInput, current.city, onValidityChange]);

  return (
    <div className="flex flex-col gap-5">
      <Field label="City">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={cityInput}
            onChange={(event) => {
              setCityInput(event.target.value);
              setCityConfirmed(false);
              onValidityChange(false);
            }}
            placeholder="Search for a city"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
          />

          {loadingSuggestions && (
            <div className="flex items-center gap-2 text-xs text-white/45">
              <Loader2 size={12} className="animate-spin" />
              Loading city suggestions...
            </div>
          )}

          {!loadingSuggestions && suggestions.length > 0 && (
            <div className="max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-1 scrollbar-hide">
              {suggestions.map((suggestion) => {
                const selected = suggestion.label === current.city;

                return (
                  <button
                    key={suggestion.id}
                    onClick={() => {
                      setCityInput(suggestion.label);
                      setCityConfirmed(true);
                      setSuggestions([]);
                      setSuggestionError(null);
                      onChange({ ...current, city: suggestion.label, latitude: suggestion.latitude, longitude: suggestion.longitude });
                      onValidityChange(true);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? "bg-blue-600/20 text-blue-200"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {suggestion.label}
                  </button>
                );
              })}
            </div>
          )}

          {suggestionError && (
            <p className="text-xs text-amber-300/90">{suggestionError}</p>
          )}
        </div>
        <p className="text-xs text-white/30 mt-1">
          Pick a city from the suggestions so the widget only saves supported locations.
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

/* ─── Calendar ───────────────────────────────────────────── */

function CalendarSettingsForm({
  settings,
  onChange,
}: {
  settings?: CalendarSettings;
  onChange: (s: CalendarSettings) => void;
}) {
  const [calendars, setCalendars] = useState<GoogleCalendarListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current: CalendarSettings = {
    calendarId: settings?.calendarId ?? "primary",
    calendarName: settings?.calendarName,
    maxEvents: settings?.maxEvents ?? 4,
  };

  const clientConfigured = hasGoogleCalendarClientId();
  const hasStoredSession = Boolean(getStoredGoogleCalendarSession());

  useEffect(() => {
    if (!clientConfigured || !hasStoredSession) {
      return;
    }

    let cancelled = false;

    const loadCalendars = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextCalendars = await fetchGoogleCalendars(false);
        if (cancelled) {
          return;
        }

        setCalendars(nextCalendars);

        const selectedCalendar = nextCalendars.find((calendar) => calendar.id === current.calendarId)
          ?? nextCalendars.find((calendar) => calendar.primary)
          ?? nextCalendars[0];

        if (selectedCalendar) {
          onChange({
            calendarId: selectedCalendar.id,
            calendarName: selectedCalendar.summary,
            maxEvents: current.maxEvents,
          });
        }
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Could not load Google Calendars.";
        setError(message);
        setCalendars([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCalendars();

    return () => {
      cancelled = true;
    };
  }, [clientConfigured, current.calendarId, current.calendarName, current.maxEvents, hasStoredSession, onChange]);

  const connectCalendar = async () => {
    if (!clientConfigured) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextCalendars = await fetchGoogleCalendars(true);
      setCalendars(nextCalendars);
      const selectedCalendar = nextCalendars.find((calendar) => calendar.id === current.calendarId)
        ?? nextCalendars.find((calendar) => calendar.primary)
        ?? nextCalendars[0];

      if (selectedCalendar) {
        onChange({
          calendarId: selectedCalendar.id,
          calendarName: selectedCalendar.summary,
          maxEvents: current.maxEvents,
        });
      }
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : "Could not connect Google Calendar.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {!clientConfigured ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/45">
          Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment before connecting Google Calendar.
        </div>
      ) : (
        <>
          <Field label="Google Account">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-white/80">
                    <CalendarDays size={14} />
                    <span className="text-sm">{hasStoredSession ? "Connected" : "Not connected"}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/35">
                    {hasStoredSession
                      ? "Choose which Google Calendar to show in the widget."
                      : "Grant read-only access to your Google Calendar events."}
                  </p>
                </div>
                <button
                  onClick={connectCalendar}
                  disabled={loading}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-40"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                  {hasStoredSession ? "Refresh" : "Connect"}
                </button>
              </div>
              {hasStoredSession && (
                <button
                  onClick={() => {
                    clearGoogleCalendarSession();
                    setCalendars([]);
                    setError(null);
                    onChange({
                      calendarId: "primary",
                      calendarName: undefined,
                      maxEvents: current.maxEvents,
                    });
                  }}
                  className="mt-3 text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  Forget Google connection
                </button>
              )}
              {error && (
                <p className="mt-3 text-xs text-amber-300/90">{error}</p>
              )}
            </div>
          </Field>

          <Field label="Calendar">
            <select
              value={current.calendarId}
              onChange={(event) => {
                const selected = calendars.find((calendar) => calendar.id === event.target.value);
                onChange({
                  calendarId: event.target.value,
                  calendarName: selected?.summary,
                  maxEvents: current.maxEvents,
                });
              }}
              disabled={calendars.length === 0}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white disabled:opacity-40 focus:border-white/30 focus:outline-none"
            >
              {calendars.length === 0 ? (
                <option value={current.calendarId} className="bg-gray-900">
                  Connect Google Calendar first
                </option>
              ) : (
                calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id} className="bg-gray-900">
                    {calendar.primary ? `${calendar.summary} (Primary)` : calendar.summary}
                  </option>
                ))
              )}
            </select>
          </Field>

          <Field label="Upcoming Events">
            <input
              type="number"
              min={1}
              max={8}
              value={current.maxEvents}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                onChange({
                  calendarId: current.calendarId,
                  calendarName: current.calendarName,
                  maxEvents: Number.isFinite(nextValue) ? Math.min(Math.max(nextValue, 1), 8) : 4,
                });
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            />
            <p className="mt-1 text-xs text-white/30">
              Controls how many upcoming events appear beneath the calendar grid.
            </p>
          </Field>
        </>
      )}
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