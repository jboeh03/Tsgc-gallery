/**
 * Apps Script bridge for the iMessage booking flow.
 *
 * The existing pattern in this repo is "Apps Script owns all Google writes"
 * (lib/admin/events.ts), so we keep that here too. Two new kinds:
 *
 *   kind: "imessage_pending_booking" → write a row to the "📱 iMessage Pending"
 *     tab with status "Pending Jeff confirmation". Returns { pendingId }.
 *
 *   kind: "imessage_confirm_booking" → look up the pending row by id,
 *     create the Google Calendar event on the TSGC schedule calendar via
 *     CalendarApp (runs as Jeff, no OAuth needed), then flip the row's
 *     status to "Booked" and append it to the CRM tab. Returns { eventId,
 *     calendarUrl }.
 *
 * Apps Script writes are best-effort but here we DO await — these are
 * user-facing actions (Jeff is waiting on the confirm response), not the
 * fire-and-forget logging events.
 */

import { SITE } from "@/lib/site";
import type { PendingBookingPayload } from "./types";

function endpoint(): string {
  return process.env.APPS_SCRIPT_URL || SITE.quoteEndpoint;
}

export async function writePendingBooking(
  payload: PendingBookingPayload
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "imessage_pending_booking", ...payload }),
  });
  if (!res.ok) {
    return {
      ok: false,
      error: `Apps Script ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`,
    };
  }
  return { ok: true };
}

export type ConfirmAppsScriptResult = {
  ok: boolean;
  eventId?: string;
  calendarUrl?: string;
  error?: string;
};

export async function confirmBookingInAppsScript(
  pendingId: string
): Promise<ConfirmAppsScriptResult> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "imessage_confirm_booking", pendingId }),
  });
  if (!res.ok) {
    return {
      ok: false,
      error: `Apps Script ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`,
    };
  }
  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; eventId?: string; calendarUrl?: string; error?: string }
    | null;
  if (!data) return { ok: false, error: "Empty Apps Script response" };
  if (data.error || data.ok === false) {
    return { ok: false, error: data.error || "Unknown Apps Script error" };
  }
  return { ok: true, eventId: data.eventId, calendarUrl: data.calendarUrl };
}
