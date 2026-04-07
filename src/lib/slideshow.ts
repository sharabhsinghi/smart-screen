export const DEFAULT_SLIDE_INTERVAL_MS = 5 * 60_000; // 5 minutes
export const MIN_SLIDE_INTERVAL_MS = 60_000; // 1 minute
export const MAX_SLIDE_INTERVAL_MS = 24 * 60 * 60_000; // 24 hours

export function normalizeSlideIntervalMs(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_SLIDE_INTERVAL_MS;
  }

  return Math.min(MAX_SLIDE_INTERVAL_MS, Math.max(MIN_SLIDE_INTERVAL_MS, Math.round(value)));
}

export function formatSlideInterval(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 3600) {
    const minutes = Math.round(totalSeconds / 60);
    return minutes === 1 ? "1 min" : `${minutes} min`;
  }
  const hours = Math.round(totalSeconds / 3600);
  return hours === 1 ? "1 hr" : `${hours} hr`;
}