/**
 * Hub ⇄ "TSGC Schedule" Google Calendar — via the Google Calendar REST API,
 * authenticated with the admin's own Google login (OAuth). No Apps Script, no
 * service account.
 *
 * The refresh token is captured once at sign-in (lib/auth/oauth.ts, with the
 * calendar scope + access_type=offline) and stored in Supabase
 * (lib/google/tokens.ts); here we exchange it for short-lived access tokens.
 * Reuses the existing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET — no
 * new credentials. GOOGLE_CALENDAR_ID overrides the default TSGC Schedule cal.
 *
 * Both calls are best-effort: a calendar hiccup never blocks a booking.
 */

import { getStoredRefreshToken } from "@/lib/google/tokens";

const DEFAULT_CALENDAR_ID =
  "fba3241fed3c4b5c56442ddb9a890342f0ad6835d1bc6ca8d5b7cbafb6407138@group.calendar.google.com";
const TIME_ZONE = "America/New_York";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function calendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_ID;
}

// Cache the access token across invocations (valid ~1h).
let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) return null; // admin hasn't re-consented with calendar scope yet

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null;
  if (!data?.access_token) return null;
  cachedToken = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
  return data.access_token;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Add hours to a yyyy-mm-dd + HH:mm wall-clock time, returning wall-clock fields. */
function wallClockEnd(date: string, start: string, durationHours: number): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mm] = start.split(":").map(Number);
  // Treat as UTC purely for arithmetic; the timeZone is sent separately so
  // Google reads these as wall-clock times in America/New_York.
  const base = new Date(Date.UTC(y, mo - 1, d, hh, mm));
  const end = new Date(base.getTime() + durationHours * 3_600_000);
  return `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}T${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}:00`;
}

export type CalendarEventInput = {
  title: string;
  date: string; // yyyy-mm-dd
  start?: string | null; // HH:mm (24h); omit for an all-day event
  durationHours?: number;
  location?: string | null;
  description?: string | null;
};

/** Create an event on TSGC Schedule. Returns null on any failure. */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<{ eventId: string; calendarUrl: string } | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const body: Record<string, unknown> = {
      summary: input.title,
      ...(input.location ? { location: input.location } : {}),
      ...(input.description ? { description: input.description } : {}),
    };
    if (input.start) {
      const startDateTime = `${input.date}T${input.start.length === 5 ? input.start : input.start.slice(0, 5)}:00`;
      body.start = { dateTime: startDateTime, timeZone: TIME_ZONE };
      body.end = { dateTime: wallClockEnd(input.date, input.start, input.durationHours ?? 1.5), timeZone: TIME_ZONE };
    } else {
      const [y, mo, d] = input.date.split("-").map(Number);
      const next = new Date(Date.UTC(y, mo - 1, d + 1));
      body.start = { date: input.date };
      body.end = { date: `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}` };
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { id?: string; htmlLink?: string } | null;
    if (!data?.id) return null;
    return { eventId: data.id, calendarUrl: data.htmlLink ?? "" };
  } catch {
    return null;
  }
}

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  location: string;
  description: string;
  allDay: boolean;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Bookable dates for the Weber form: next ~21 days, weekdays only, at least 24h
 * out, excluding any day blocked on the TSGC Schedule calendar (an all-day
 * event, or a day already full with 3+ jobs). Returns yyyy-mm-dd strings.
 */
export async function getWeberAvailableDates(daysAhead = 21): Promise<string[]> {
  const now = Date.now();
  const events = await listCalendarEvents(new Date(now).toISOString(), new Date(now + daysAhead * 86_400_000).toISOString());

  const dayInfo = new Map<string, { count: number; allDay: boolean }>();
  for (const e of events) {
    const d = (e.start || "").slice(0, 10);
    if (!d) continue;
    const cur = dayInfo.get(d) || { count: 0, allDay: false };
    cur.count += 1;
    if (e.allDay) cur.allDay = true;
    dayInfo.set(d, cur);
  }
  const blocked = (d: string) => {
    const info = dayInfo.get(d);
    return Boolean(info && (info.allDay || info.count >= 3));
  };

  const minMs = now + 24 * 3_600_000;
  const endMs = now + daysAhead * 86_400_000;
  const out: string[] = [];
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  while (cur.getTime() <= endMs) {
    const dow = cur.getDay(); // 0 Sun … 6 Sat
    const iso = `${cur.getFullYear()}-${pad2(cur.getMonth() + 1)}-${pad2(cur.getDate())}`;
    if (cur.getTime() >= minMs && dow !== 0 && dow !== 6 && !blocked(iso)) out.push(iso);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Read upcoming TSGC Schedule events (defaults to the next 14 days). */
export async function listCalendarEvents(fromISO?: string, toISO?: string): Promise<CalendarEvent[]> {
  try {
    const token = await getAccessToken();
    if (!token) return [];
    const timeMin = fromISO || new Date().toISOString();
    const timeMax = toISO || new Date(Date.now() + 14 * 86_400_000).toISOString();
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events` +
      `?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=250`;
    const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as {
      items?: Array<{
        id: string;
        summary?: string;
        location?: string;
        description?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }>;
    } | null;
    return (data?.items ?? []).map((e) => ({
      id: e.id,
      title: e.summary ?? "(no title)",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date ?? "",
      location: e.location ?? "",
      description: e.description ?? "",
      allDay: Boolean(e.start?.date && !e.start?.dateTime),
    }));
  } catch {
    return [];
  }
}
