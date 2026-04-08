"use client";

import {
  Cloud,
  CloudFog,
  CloudMoon,
  CloudOff,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Thermometer,
  RefreshCw,
  Droplets,
  Wind,
  Zap,
} from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import type { WeatherSettings } from "@/types";

interface Props {
  settings?: WeatherSettings;
}

function WeatherGlyph({ icon }: { icon: string }) {
  switch (icon) {
    case "clear-day":
      return <Sun size={62} strokeWidth={1.5} className="text-amber-200" />;
    case "clear-night":
      return <CloudMoon size={62} strokeWidth={1.5} className="text-sky-100" />;
    case "partly-cloudy-day":
      return <CloudSun size={62} strokeWidth={1.5} className="text-amber-100" />;
    case "partly-cloudy-night":
      return <CloudMoon size={62} strokeWidth={1.5} className="text-slate-100" />;
    case "fog":
      return <CloudFog size={62} strokeWidth={1.5} className="text-slate-100" />;
    case "rain":
      return <CloudRain size={62} strokeWidth={1.5} className="text-sky-100" />;
    case "snow":
      return <CloudSnow size={62} strokeWidth={1.5} className="text-slate-100" />;
    case "storm":
      return <Zap size={62} strokeWidth={1.5} className="text-yellow-200" />;
    default:
      return <Cloud size={62} strokeWidth={1.5} className="text-white/90" />;
  }
}

export default function WeatherWidget({ settings }: Props) {
  const { weather, loading, error, refresh } = useWeather(
    settings?.city ?? "Barrie, ON, Canada",
    settings?.units ?? "metric",
    settings?.latitude,
    settings?.longitude,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-white/70">
        <CloudOff size={32} />
        <span className="text-sm text-center">{error ?? "No data"}</span>
        <button
          onClick={refresh}
          className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2 text-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/70 uppercase tracking-wider">
          {weather.city}
        </span>
        <button
          onClick={refresh}
          className="text-white/40 hover:text-white/80 transition-colors"
          aria-label="Refresh weather"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <WeatherGlyph icon={weather.icon} />
        <div>
          <div className="text-4xl font-light leading-none">{weather.temp}°</div>
          <div className="text-sm text-white/70 capitalize mt-1">{weather.description}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-auto">
        <StatItem icon={<Thermometer size={14} />} label="Feels" value={`${weather.feelsLike}°`} />
        <StatItem icon={<Droplets size={14} />} label="Humidity" value={`${weather.humidity}%`} />
        <StatItem icon={<Wind size={14} />} label="Wind" value={`${weather.windSpeed}${weather.windUnit}`} />
      </div>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white/5 rounded-lg p-1">
      <span className="text-white/50">{icon}</span>
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
