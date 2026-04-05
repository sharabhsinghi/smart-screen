export const DEFAULT_SLIDE_INTERVAL_MS = 8000;
export const MIN_SLIDE_INTERVAL_MS = 3000;
export const MAX_SLIDE_INTERVAL_MS = 60000;

export function normalizeSlideIntervalMs(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_SLIDE_INTERVAL_MS;
  }

  return Math.min(MAX_SLIDE_INTERVAL_MS, Math.max(MIN_SLIDE_INTERVAL_MS, Math.round(value)));
}