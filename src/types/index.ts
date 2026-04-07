export type WidgetType =
  | "clock"
  | "weather"
  | "calendar"
  | "tasks"
  | "smarthome";

export type WidgetSize = "small" | "medium" | "large";

export type DeviceIcon = "lightbulb" | "tv" | "thermostat" | "speaker" | "coffee" | "lock";

export interface ClockSettings {
  timezone: string; // IANA timezone string or "local"
  format24h: boolean;
}

export interface WeatherSettings {
  city: string;
  units: "metric" | "imperial";
  /** Stored when the user picks a city from geocoding suggestions — bypasses geocoding on re-render */
  latitude?: number;
  longitude?: number;
}

export interface CalendarSettings {
  calendarId: string;
  calendarName?: string;
  maxEvents: number;
}

export interface SmartDevice {
  id: string;
  name: string;
  room: string;
  icon: DeviceIcon;
  endpoint: string;
}

export interface SmartHomeSettings {
  devices: SmartDevice[];
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  position: { col: number; row: number };
  settings?: ClockSettings | WeatherSettings | CalendarSettings | SmartHomeSettings;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windUnit: string;
  city: string;
}

export interface Task {
  id: string;
  title: string;
  time?: string;
  done: boolean;
  completedAt?: number;
}

export type SlideshowImageOrigin = "preset" | "url" | "device";

export interface SlideshowImage {
  id: string;
  src: string;
  label: string;
  origin: SlideshowImageOrigin;
  filePath?: string;
}
