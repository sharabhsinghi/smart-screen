"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Link2, Loader2, RefreshCw } from "lucide-react";
import type { CalendarSettings } from "@/types";
import {
  ensureGoogleCalendarSession,
  fetchGoogleCalendarEvents,
  hasGoogleCalendarClientId,
  type GoogleCalendarEvent,
} from "@/lib/googleCalendar";

interface Props {
  settings?: CalendarSettings;
}

const DEFAULT_MAX_EVENTS = 4;
const REFRESH_INTERVAL_MS = 5 * 60_000;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getGridStart(date: Date) {
  const monthStart = getMonthStart(date);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  return gridStart;
}

function formatDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonthCells(date: Date) {
  const cells: Date[] = [];
  const gridStart = getGridStart(date);

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    cells.push(cellDate);
  }

  return cells;
}

function eventDayKeys(event: GoogleCalendarEvent) {
  if (!event.start || !event.end) {
    return [];
  }

  if (event.allDay) {
    const start = new Date(`${event.start}T00:00:00`);
    const endExclusive = new Date(`${event.end}T00:00:00`);
    const keys: string[] = [];
    const cursor = new Date(start);

    while (cursor < endExclusive) {
      keys.push(formatDayKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return keys;
  }

  const start = new Date(event.start);
  const end = new Date(event.end);
  const keys: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor <= last) {
    keys.push(formatDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function formatEventTime(event: GoogleCalendarEvent, today: Date) {
  if (event.allDay) {
    return "All day";
  }

  const start = new Date(event.start);
  const sameDay = formatDayKey(start) === formatDayKey(today);

  return new Intl.DateTimeFormat(undefined, {
    weekday: sameDay ? undefined : "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
}

export default function CalendarWidget({ settings }: Props) {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [interactiveLoading, setInteractiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState(() => new Date());

  const clientConfigured = hasGoogleCalendarClientId();
  const calendarId = settings?.calendarId || "primary";
  const calendarLabel = settings?.calendarName || "Primary calendar";
  const maxEvents = settings?.maxEvents ?? DEFAULT_MAX_EVENTS;
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  const monthAnchor = useMemo(
    () => new Date(currentYear, currentMonth, 1),
    [currentMonth, currentYear]
  );
  const startOfToday = useMemo(
    () => new Date(currentYear, currentMonth, currentDate),
    [currentDate, currentMonth, currentYear]
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setToday(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!clientConfigured) {
      return;
    }

    let cancelled = false;

    const loadEvents = async () => {
      setLoading(true);

      try {
        const nextEvents = await fetchGoogleCalendarEvents({
          calendarId,
          timeMin: getGridStart(monthAnchor).toISOString(),
          timeMax: getMonthEnd(monthAnchor).toISOString(),
          maxResults: 50,
          interactive: false,
        });

        if (!cancelled) {
          setEvents(nextEvents);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : "Could not load Google Calendar events.";
          setError(message);
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadEvents();
    const intervalId = window.setInterval(() => {
      void loadEvents();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [calendarId, clientConfigured, monthAnchor]);

  const connectCalendar = async () => {
    if (!clientConfigured) {
      return;
    }

    setInteractiveLoading(true);

    try {
      await ensureGoogleCalendarSession(true);
      const nextEvents = await fetchGoogleCalendarEvents({
        calendarId,
        timeMin: getGridStart(monthAnchor).toISOString(),
        timeMax: getMonthEnd(monthAnchor).toISOString(),
        maxResults: 50,
        interactive: false,
      });
      setEvents(nextEvents);
      setError(null);
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : "Could not connect Google Calendar.";
      setError(message);
    } finally {
      setInteractiveLoading(false);
    }
  };

  const monthCells = useMemo(() => getMonthCells(monthAnchor), [monthAnchor]);

  const eventCountByDay = useMemo(
    () =>
      events.reduce<Record<string, number>>((counts, event) => {
        for (const key of eventDayKeys(event)) {
          counts[key] = (counts[key] ?? 0) + 1;
        }
        return counts;
      }, {}),
    [events]
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => {
          const eventDate = new Date(event.allDay ? `${event.start}T00:00:00` : event.start);
          return eventDate >= startOfToday;
        })
        .slice(0, maxEvents),
    [events, maxEvents, startOfToday]
  );

  return (
    <div className="flex h-full flex-col gap-3 text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-white/60" />
            <span className="truncate text-sm font-medium text-white/80">{calendarLabel}</span>
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/35">
            {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(today)}
          </p>
        </div>
        <button
          onClick={connectCalendar}
          disabled={!clientConfigured || interactiveLoading}
          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          {interactiveLoading ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
          {error ? "Reconnect" : "Sync"}
        </button>
      </div>

      {!clientConfigured ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 text-center text-sm text-white/45">
          Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google Calendar.
        </div>
      ) : error && events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 text-center">
          <p className="text-sm text-white/55">{error}</p>
          <p className="text-xs text-white/35">Use Sync here or widget settings to connect your Google account.</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.18em] text-white/35">
              {WEEKDAY_LABELS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((day) => {
                const isCurrentMonth = day.getMonth() === today.getMonth();
                const isToday = formatDayKey(day) === formatDayKey(today);
                const eventCount = eventCountByDay[formatDayKey(day)] ?? 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-xs ${
                      isToday
                        ? "border-cyan-300/60 bg-cyan-300/15 text-white"
                        : isCurrentMonth
                          ? "border-white/10 bg-white/5 text-white/80"
                          : "border-white/5 bg-white/[0.03] text-white/25"
                    }`}
                  >
                    <span>{day.getDate()}</span>
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full ${eventCount > 0 ? "bg-emerald-300" : "bg-transparent"}`} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/35">
              <span>Upcoming</span>
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <span>{upcomingEvents.length}</span>}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto scrollbar-hide">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <a
                    key={event.id}
                    href={event.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white/90">{event.summary}</p>
                      <p className="truncate text-xs text-white/45">
                        {formatEventTime(event, today)}
                        {event.location ? ` • ${event.location}` : ""}
                      </p>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-white/25" />
                  </a>
                ))
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 px-3 text-center text-sm text-white/40">
                  No upcoming events this month.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}