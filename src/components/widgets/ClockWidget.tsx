"use client";

import { useClock } from "@/hooks/useClock";
import type { ClockSettings } from "@/types";

interface Props {
  settings?: ClockSettings;
}

export default function ClockWidget({ settings }: Props) {
  const { time, seconds, period, dateStr } = useClock(
    settings?.timezone ?? "local",
    settings?.format24h ?? true
  );

  return (
    <div className="flex flex-col items-start justify-center h-full gap-1 select-none">
      <div className="flex items-end gap-2">
        <span className="text-7xl font-light tracking-tight text-white drop-shadow-lg leading-none">
          {time}
        </span>
        <div className="flex flex-col items-start mb-1">
          <span className="text-3xl font-light text-white/70 drop-shadow">
            {seconds}
          </span>
          {period && (
            <span className="text-sm font-medium text-white/60 leading-none">
              {period}
            </span>
          )}
        </div>
      </div>
      <p className="text-lg font-light text-white/80 drop-shadow tracking-wide">
        {dateStr}
      </p>
    </div>
  );
}
