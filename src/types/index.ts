export type WidgetType =
  | "clock"
  | "weather"
  | "calendar"
  | "smarthome";

export type WidgetSize = "small" | "medium" | "large";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  position: { col: number; row: number };
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
}

export interface SmartDevice {
  id: string;
  name: string;
  room: string;
  on: boolean;
  icon: string;
}

export interface Task {
  id: string;
  title: string;
  time?: string;
  done: boolean;
}
