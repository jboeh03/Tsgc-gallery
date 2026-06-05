/**
 * Fulfill a paid Weber-sprint booking. Called by the Stripe webhook on
 * checkout.session.completed AND by the /weber/success page as a reconcile
 * fallback — so it MUST be idempotent. The compare-and-set claim on
 * pending_bookings.fulfilled_at (null → now) guarantees exactly-once
 * fulfillment even under duplicate/delayed deliveries.
 *
 * Reuses the existing HQ helpers: contact upsert, appointment, calendar, SMS.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import {
  upsertContactByPhone, createAppointment, updateJob, updateAppointment, logEvent,
} from "@/lib/db/writes";
import { createCalendarEvent } from "@/lib/calendar";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { SITE } from "@/lib/site";
import type { JobRow, AppointmentRow, PendingBookingRow } from "@/lib/db/types";

const NOTIFY_TO = process.env.ALERT_TO || process.env.BOOKING_NOTIFY_TO || "+16578314276";

function formatAssessment(a: Record<string, unknown> | null): string {
  if (!a) return "";
  const severity = typeof a.conditionSeverity === "string" ? a.conditionSeverity : "";
  const issues = Array.isArray(a.conditionIssues) ? (a.conditionIssues as string[]).join("; ") : "";
  const rec = typeof a.recommendation === "string" ? a.recommendation : "";
  return [severity ? `Condition: ${severity}` : "", issues ? `Issues: ${issues}` : "", rec].filter(Boolean).join("\n");
}

export async function fulfillWeberBooking(pendingId: string, sessionId: string): Promise<void> {
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
  const assessmentNote = formatAssessment(claimed.assessment);

  const contact = await upsertContactByPhone(
    claimed.phone_e164,
    {
      name,
      email: claimed.email,
      service_address: claimed.service_address,
      grill_brand: "Weber",
      grill_model: claimed.grill_model,
      grill_burner_count: claimed.burner_count,
      source: "weber-sprint",
    },
    { markConsent: true }
  );

  const jobInsert: Partial<JobRow> = {
    contact_id: contact.id,
    status: "scheduled",
    source: "weber-sprint",
    service: "Weber deep clean",
    grill_brand: "Weber",
    grill_model: claimed.grill_model,
    burner_count: claimed.burner_count,
    quote_amount: claimed.amount,
    date_paid: today,
    pay_method: "stripe",
    job_address: claimed.service_address,
    notes: [`Paid in full ($${claimed.amount}) via Weber sprint.`, assessmentNote].filter(Boolean).join("\n"),
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
        title: `Weber clean — ${name ?? claimed.phone_e164}`,
        date: claimed.preferred_date,
        start: claimed.preferred_time,
        durationHours: 3,
        location: claimed.service_address,
        description: `Paid in full ($${claimed.amount}). ${claimed.grill_model ?? "Weber"}.\n${assessmentNote}`,
      });
      if (cal) {
        await updateJob(jobId, { gcal_event_id: cal.eventId });
        await updateAppointment(appt.id, { gcal_event_id: cal.eventId, gcal_url: cal.calendarUrl });
      }
    } catch { /* calendar is best-effort */ }
  }

  // SMS confirmations (best-effort; ride the A2P-gated line).
  if (isTwilioConfigured()) {
    const when = claimed.preferred_date + (claimed.preferred_time ? ` ${claimed.preferred_time}` : "");
    try {
      await sendSms({ to: NOTIFY_TO, body: `💳 Weber booked + paid: ${name ?? claimed.phone_e164} · $${claimed.amount} · ${when} · ${claimed.service_address ?? ""}`.slice(0, 320) });
    } catch { /* best-effort */ }
    try {
      await sendSms({ to: claimed.phone_e164, body: `You're booked with ${SITE.name} for ${when} and paid in full — thank you! We'll confirm the window. Reply here with any questions.` });
    } catch { /* best-effort */ }
  }

  await logEvent("appointment_confirmed", { contactId: contact.id, jobId }, {
    via: "weber-sprint", session: sessionId, amount: claimed.amount,
  });

  await sb.from("pending_bookings").update({ status: "fulfilled", fulfilled_job_id: jobId }).eq("id", pendingId);
}
