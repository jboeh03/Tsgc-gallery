/**
 * Hub ⇄ "TSGC Schedule" Google Calendar, via the same Apps Script bridge the
 * iMessage booking flow uses (CalendarApp runs as Jeff — no OAuth, no service
 * account). Both calls are best-effort: a calendar hiccup never blocks a
 * booking. Requires the Apps Script (integrations/apps-script-endpoint.js) to be
 * deployed with the calendar_create / calendar_list handlers.
 */

import { SITE } from "@/lib/site";

function endpoint(): string {
  return process.env.APPS_SCRIPT_URL || SITE.quoteEndpoint;
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
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "calendar_create", ...input }),
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; eventId?: string; calendarUrl?: string }
      | null;
    if (!data?.ok || !data.eventId) return null;
    return { eventId: data.eventId, calendarUrl: data.calendarUrl ?? "" };
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

/** Read upcoming TSGC Schedule events (defaults to the next 14 days). */
export async function listCalendarEvents(fromISO?: string, toISO?: string): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "calendar_list", fromISO, toISO }),
    });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; events?: CalendarEvent[] }
      | null;
    return data?.events ?? [];
  } catch {
    return [];
  }
}
