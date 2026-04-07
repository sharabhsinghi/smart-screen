const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const SESSION_STORAGE_KEY = "smart-screen:google-calendar-session:v1";
const EXPIRY_SKEW_MS = 60_000;

export interface GoogleCalendarSession {
  accessToken: string;
  expiresAt: number;
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  primary: boolean;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink?: string;
}

type GoogleTokenClient = {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void;
            error_callback?: (error: { type: string }) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

export function hasGoogleCalendarClientId() {
  return GOOGLE_CLIENT_ID.length > 0;
}

function loadGoogleIdentityScript() {
  if (!isBrowser()) {
    return Promise.reject(new Error("Google Calendar is only available in the browser."));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google Identity Services."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

function readStoredSession(): GoogleCalendarSession | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as GoogleCalendarSession;
    if (!parsed.accessToken || !parsed.expiresAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session: GoogleCalendarSession) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearGoogleCalendarSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getStoredGoogleCalendarSession() {
  const session = readStoredSession();
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now() + EXPIRY_SKEW_MS) {
    clearGoogleCalendarSession();
    return null;
  }

  return session;
}

async function requestGoogleCalendarSession(interactive: boolean): Promise<GoogleCalendarSession> {
  if (!hasGoogleCalendarClientId()) {
    throw new Error("Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to connect Google Calendar.");
  }

  await loadGoogleIdentityScript();

  return new Promise<GoogleCalendarSession>((resolve, reject) => {
    const tokenClient = window.google?.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_CALENDAR_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token || !response.expires_in) {
          reject(new Error("Google Calendar authorization failed."));
          return;
        }

        const session = {
          accessToken: response.access_token,
          expiresAt: Date.now() + response.expires_in * 1000,
        };

        writeStoredSession(session);
        resolve(session);
      },
      error_callback: () => {
        reject(new Error("Google Calendar authorization was cancelled."));
      },
    });

    if (!tokenClient) {
      reject(new Error("Google Identity Services is unavailable."));
      return;
    }

    tokenClient.requestAccessToken({ prompt: interactive ? "consent" : "" });
  });
}

export async function ensureGoogleCalendarSession(interactive: boolean) {
  const stored = getStoredGoogleCalendarSession();
  if (stored) {
    return stored;
  }

  return requestGoogleCalendarSession(interactive);
}

async function fetchFromGoogleCalendar<T>(url: string, interactive: boolean): Promise<T> {
  const session = await ensureGoogleCalendarSession(interactive);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (response.status === 401) {
    clearGoogleCalendarSession();
    throw new Error("Google Calendar authorization expired. Reconnect to continue.");
  }

  if (!response.ok) {
    throw new Error("Google Calendar request failed.");
  }

  return (await response.json()) as T;
}

export async function fetchGoogleCalendars(interactive: boolean) {
  const response = await fetchFromGoogleCalendar<{
    items?: Array<{ id: string; summary?: string; primary?: boolean }>;
  }>("https://www.googleapis.com/calendar/v3/users/me/calendarList", interactive);

  return (response.items ?? [])
    .map((calendar) => ({
      id: calendar.id,
      summary: calendar.summary ?? "Untitled calendar",
      primary: Boolean(calendar.primary),
    }))
    .sort((left, right) => Number(right.primary) - Number(left.primary) || left.summary.localeCompare(right.summary));
}

export async function fetchGoogleCalendarEvents(options: {
  calendarId: string;
  timeMin: string;
  timeMax: string;
  maxResults: number;
  interactive: boolean;
}) {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: options.timeMin,
    timeMax: options.timeMax,
    maxResults: String(options.maxResults),
  });

  const response = await fetchFromGoogleCalendar<{
    items?: Array<{
      id: string;
      summary?: string;
      description?: string;
      location?: string;
      htmlLink?: string;
      start?: { date?: string; dateTime?: string };
      end?: { date?: string; dateTime?: string };
    }>;
  }>(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(options.calendarId)}/events?${params.toString()}`,
    options.interactive
  );

  return (response.items ?? [])
    .filter((event) => (event.start?.date ?? event.start?.dateTime) && (event.end?.date ?? event.end?.dateTime))
    .map((event) => ({
      id: event.id,
      summary: event.summary ?? "Untitled event",
      description: event.description,
      location: event.location,
      htmlLink: event.htmlLink,
      start: event.start?.dateTime ?? event.start?.date ?? "",
      end: event.end?.dateTime ?? event.end?.date ?? "",
      allDay: Boolean(event.start?.date && !event.start?.dateTime),
    }));
}