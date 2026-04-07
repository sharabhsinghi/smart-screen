"use client";

import { useState, useEffect, useCallback } from "react";
import type { WeatherData } from "@/types";
import { resolveWeatherCity } from "@/lib/weather";

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

type OpenMeteoForecastResponse = {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
};

function mapWeatherCodeToDescription(code: number) {
  switch (code) {
    case 0:
      return "Clear sky";
    case 1:
      return "Mainly clear";
    case 2:
      return "Partly cloudy";
    case 3:
      return "Overcast";
    case 45:
    case 48:
      return "Fog";
    case 51:
    case 53:
    case 55:
      return "Drizzle";
    case 56:
    case 57:
      return "Freezing drizzle";
    case 61:
    case 63:
    case 65:
      return "Rain";
    case 66:
    case 67:
      return "Freezing rain";
    case 71:
    case 73:
    case 75:
    case 77:
      return "Snow";
    case 80:
    case 81:
    case 82:
      return "Rain showers";
    case 85:
    case 86:
      return "Snow showers";
    case 95:
      return "Thunderstorm";
    case 96:
    case 99:
      return "Thunderstorm with hail";
    default:
      return "Current conditions";
  }
}

function mapWeatherCodeToIcon(code: number, isDay: boolean) {
  switch (code) {
    case 0:
      return isDay ? "clear-day" : "clear-night";
    case 1:
    case 2:
      return isDay ? "partly-cloudy-day" : "partly-cloudy-night";
    case 3:
      return "cloudy";
    case 45:
    case 48:
      return "fog";
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return "rain";
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return "snow";
    case 95:
    case 96:
    case 99:
      return "storm";
    default:
      return "cloudy";
  }
}

export function useWeather(
  city: string = "Barrie,ON,CA",
  units: "metric" | "imperial" = "metric",
  storedLatitude?: number,
  storedLongitude?: number,
) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      const location =
        storedLatitude !== undefined && storedLongitude !== undefined
          ? { id: city, label: city, latitude: storedLatitude, longitude: storedLongitude }
          : await resolveWeatherCity(city);

      const forecastRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day&temperature_unit=${units === "metric" ? "celsius" : "fahrenheit"}&wind_speed_unit=${units === "metric" ? "kmh" : "mph"}&timezone=auto`
      );
      if (!forecastRes.ok) throw new Error(`Forecast HTTP ${forecastRes.status}`);

      const forecastData = (await forecastRes.json()) as OpenMeteoForecastResponse;
      if (!forecastData.current) {
        throw new Error("Weather data unavailable");
      }

      const current = forecastData.current;
      setWeather({
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        description: mapWeatherCodeToDescription(current.weather_code),
        icon: mapWeatherCodeToIcon(current.weather_code, current.is_day === 1),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        windUnit: units === "metric" ? "km/h" : "mph",
        city: location.label,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }, [city, units, storedLatitude, storedLongitude]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, loading, error, refresh: fetchWeather };
}
