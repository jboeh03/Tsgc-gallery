/**
 * Fulfill a paid Father's Day "book + pay $299" booking. Called by the Stripe
 * webhook on checkout.session.completed AND by the /fathers-day/booked page as
 * a reconcile fallback — so it MUST be idempotent. CAS on
 * pending_bookings.fulfilled_at (null -> now) guarantees exactly-once.
 *
 * The Weber and Father's Day flows share the pending_bookings table; which
 * fulfiller runs is decided by the Stripe session metadata (tsgc_campaign), not
 * by the row. Reuses the same HQ helpers as lib/weber/fulfill.ts.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { upsertContactByPhone, createAppointment, updateJob, updateAppointment, logEvent } from "@/lib/db/writes";
import { createCalendarEvent } from "@/lib/calendar";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { fdSlotByStart, FD_BOOKING_DEPOSIT } from "@/lib/campaign-fathers-day";
import { SITE } from "@/lib/site";
import type { JobRow, AppointmentRow, PendingBookingRow } from "@/lib/db/types";

const NOTIFY_TO = process.env.ALERT_TO || process.env.BOOKING_NOTIFY_TO || "+16578314276";

const DEPOSIT_NOTE =
  `Paid $${FD_BOOKING_DEPOSIT} to book (Father's Day 25% off). $${FD_BOOKING_DEPOSIT} is full price for most grills; ` +
  `for a larger/premium grill it's a deposit credited toward the full price — confirm balance within 24–48h.`;

export async function fulfillFathersDayBooking(pendingId: string, sessionId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabase();

  // CAS claim: only the first caller flips fulfilled_at from null.
  const { data: claimedRow } = await sb
    .from("pending_bookings")
    .update({ status: "fulfilling", fulfilled_at: new Date().toISOString() })
    .eq("id", pendingId)
    .is("fulfilled_at", null)
    .select("*")
    .maybeSingle();
  const claimed = claimedRow as PendingBookingRow | null;
  if (!claimed || !claimed.phone_e164) return; // already handled (or unusable)

  const today = new Date().toISOString().slice(0, 10);
  const name = [claimed.first_name, claimed.last_name].filter(Boolean).join(" ") || null;
  const slot = fdSlotByStart(claimed.preferred_time);
  const slotLabel = slot?.label ?? claimed.preferred_time ?? "";
  const when = (claimed.preferred_date ?? "") + (slotLabel ? ` · ${slotLabel}` : "");

  const contact = await upsertContactByPhone(
    claimed.phone_e164,
    {
      name,
      email: claimed.email,
      service_address: claimed.service_address,
      grill_model: claimed.grill_model,
      source: "fathers-day",
    },
    { markConsent: true }
  );

  const jobInsert: Partial<JobRow> = {
    contact_id: contact.id,
    status: "scheduled",
    source: "fathers-day",
    service: "Father's Day deep clean",
    grill_model: claimed.grill_model,
    quote_amount: claimed.amount,
    date_paid: today,
    pay_method: "stripe",
    job_address: claimed.service_address,
    notes: DEPOSIT_NOTE,
  };
  const { data: jobRow, error: jobErr } = await sb.from("jobs").insert(jobInsert).select("id").single();
  if (jobErr || !jobRow) throw new Error(jobErr?.message ?? "job insert failed");
  const jobId = (jobRow as { id: string }).id;

  const appt: AppointmentRow = await createAppointment({
    contact_id: contact.id,
    job_id: jobId,
    status: "confirmed",
    scheduled_date: claimed.preferred_date,
    scheduled_start: claimed.preferred_time,
    service_address: claimed.service_address,
    confirmed_at: new Date().toISOString(),
  });

  // Calendar (best-effort).
  if (claimed.preferred_date) {
    try {
      const cal = await createCalendarEvent({
        title: `Father's Day clean — ${name ?? claimed.phone_e164}`,
        date: claimed.preferred_date,
        start: claimed.preferred_time,
        durationHours: 3,
        location: claimed.service_address,
        description: `${DEPOSIT_NOTE}\n${claimed.grill_model ?? ""}`.trim(),
      });
      if (cal) {
        await updateJob(jobId, { gcal_event_id: cal.eventId });
        await updateAppointment(appt.id, { gcal_event_id: cal.eventId, gcal_url: cal.calendarUrl });
      }
    } catch {
      /* calendar is best-effort */
    }
  }

  // SMS confirmations (best-effort; ride the A2P-gated line).
  if (isTwilioConfigured()) {
    try {
      await sendSms({
        to: NOTIFY_TO,
        body: `🎁 Father's Day booked + paid: ${name ?? claimed.phone_e164} · $${claimed.amount} · ${when} · ${claimed.service_address ?? ""}`.slice(0, 320),
      });
    } catch {
      /* best-effort */
    }
    try {
      await sendSms({
        to: claimed.phone_e164,
        body: `You're booked with ${SITE.name} for ${when} and your $${claimed.amount} is in — thank you! For larger/premium grills the $${claimed.amount} is a credit toward the full price; we'll confirm any balance within 24–48h. We'll text to confirm the window.`,
      });
    } catch {
      /* best-effort */
    }
  }

  await logEvent("appointment_confirmed", { contactId: contact.id, jobId }, {
    via: "fathers-day",
    session: sessionId,
    amount: claimed.amount,
  });

  await sb.from("pending_bookings").update({ status: "fulfilled", fulfilled_job_id: jobId }).eq("id", pendingId);
}
