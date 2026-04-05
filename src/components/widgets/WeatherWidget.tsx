"use client";

import { Droplets, Wind, Thermometer, RefreshCw, CloudOff } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import Image from "next/image";

export default function WeatherWidget() {
  const { weather, loading, error, refresh } = useWeather();

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
    <div className="flex flex-col h-full gap-3 text-white">
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
        <Image
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          width={64}
          height={64}
          unoptimized
        />
        <div>
          <div className="text-5xl font-light leading-none">{weather.temp}°</div>
          <div className="text-sm text-white/70 capitalize mt-1">{weather.description}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-auto">
        <StatItem icon={<Thermometer size={14} />} label="Feels" value={`${weather.feelsLike}°`} />
        <StatItem icon={<Droplets size={14} />} label="Humidity" value={`${weather.humidity}%`} />
        <StatItem icon={<Wind size={14} />} label="Wind" value={`${weather.windSpeed}km/h`} />
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
    <div className="flex flex-col items-center gap-1 bg-white/5 rounded-lg p-2">
      <span className="text-white/50">{icon}</span>
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
