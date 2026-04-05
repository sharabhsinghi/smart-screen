export type WidgetType =
  | "clock"
  | "weather"
  | "calendar"
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
  settings?: ClockSettings | WeatherSettings | SmartHomeSettings;
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
}
