"use client";

import { useClock } from "@/hooks/useClock";

export default function ClockWidget() {
  const { time, seconds, dateStr } = useClock();

  return (
    <div className="flex flex-col items-start justify-center h-full gap-1 select-none">
      <div className="flex items-end gap-2">
        <span className="text-7xl font-light tracking-tight text-white drop-shadow-lg leading-none">
          {time}
        </span>
        <span className="text-3xl font-light text-white/70 mb-1 drop-shadow">
          {seconds}
        </span>
      </div>
      <p className="text-lg font-light text-white/80 drop-shadow tracking-wide">
        {dateStr}
      </p>
    </div>
  );
}
