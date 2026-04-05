"use client";

import { useState, useEffect } from "react";

const PLACEHOLDER_TIME = "--:--";
const PLACEHOLDER_SECONDS = "--";

export function useClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on mount (client-only to avoid hydration mismatch)
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return { time: PLACEHOLDER_TIME, seconds: PLACEHOLDER_SECONDS, dateStr: "" };
  }

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  const dateStr = now.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return { time: `${hours}:${minutes}`, seconds, dateStr };
}
