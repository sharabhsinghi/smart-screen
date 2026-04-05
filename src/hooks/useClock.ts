"use client";

import { useState, useEffect, useMemo } from "react";

export function useClock(timezone: string = "local", format24h: boolean = true) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on mount (client-only to avoid hydration mismatch)
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatters = useMemo(() => {
    const tz = timezone === "local" ? undefined : timezone;
    return {
      parts: new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: !format24h,
      }),
      date: new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  }, [timezone, format24h]);

  if (!now) {
    return { time: "--:--", seconds: "--", period: "", dateStr: "" };
  }

  const parts = formatters.parts.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const hours = get("hour");
  const minutes = get("minute");
  const seconds = get("second");
  const period = get("dayPeriod"); // "AM" / "PM" in 12-hour mode, "" in 24-hour mode

  const dateStr = formatters.date.format(now);

  return { time: `${hours}:${minutes}`, seconds, period, dateStr };
}
