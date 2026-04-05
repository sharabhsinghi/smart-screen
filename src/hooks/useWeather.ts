"use client";

import { useState, useEffect, useCallback } from "react";
import type { WeatherData } from "@/types";

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ?? "";
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const MS_TO_KMH = 3.6; // meters/second → kilometers/hour

export function useWeather(
  city: string = "Barrie,ON,CA",
  units: "metric" | "imperial" = "metric"
) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!WEATHER_API_KEY) {
      setError("No API key configured");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=${units}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const windSpeed =
        units === "metric"
          ? Math.round(data.wind.speed * MS_TO_KMH)
          : Math.round(data.wind.speed);
      setWeather({
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed,
        windUnit: units === "metric" ? "km/h" : "mph",
        city: data.name,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }, [city, units]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, loading, error, refresh: fetchWeather };
}
