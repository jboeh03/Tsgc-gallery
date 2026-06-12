/**
 * Fulfill a paid parts-storefront order. Called by the Stripe webhook on
 * checkout.session.completed AND by the /parts/success page as a reconcile
 * fallback — so it MUST be idempotent. The compare-and-set claim on
 * parts_orders.fulfilled_at (null -> now) guarantees exactly-once fulfillment
 * even under duplicate/delayed deliveries.
 *
 * Reuses the existing HQ helpers (contact upsert, job, appointment, calendar,
 * SMS). Two paths:
 *   - install: create a job + confirmed appointment + calendar event, and text
 *     both the customer and Jeff — the part gets installed on a service visit.
 *   - ship: record the order as a paid job and text Jeff to order & ship it;
 *     no appointment.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { upsertContactByPhone, createAppointment, updateJob, updateAppointment, logEvent } from "@/lib/db/writes";
import { createCalendarEvent } from "@/lib/calendar";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { SITE } from "@/lib/site";
import type { JobRow, AppointmentRow, PartsOrderRow, PartsOrderLineItem } from "@/lib/db/types";

const NOTIFY_TO = process.env.ALERT_TO || process.env.BOOKING_NOTIFY_TO || "+16578314276";

function summarizeItems(items: PartsOrderLineItem[]): string {
  return items.map((l) => `${l.qty}× ${l.brand} ${l.name} (#${l.partNumber})`).join("; ");
}

export async function fulfillPartsOrder(pendingId: string, sessionId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabase();

  // CAS claim: only the first caller flips fulfilled_at from null.
  const { data: claimedRow } = await sb
    .from("parts_orders")
    .update({ status: "fulfilling", fulfilled_at: new Date().toISOString() })
    .eq("id", pendingId)
    .is("fulfilled_at", null)
    .select("*")
    .maybeSingle();
  const order = claimedRow as PartsOrderRow | null;
  if (!order || !order.phone_e164) return; // already handled (or unusable)

  const today = new Date().toISOString().slice(0, 10);
  const name = [order.first_name, order.last_name].filter(Boolean).join(" ") || null;
  const items = Array.isArray(order.line_items) ? order.line_items : [];
  const itemsSummary = summarizeItems(items);
  const isInstall = order.fulfillment === "install";
  const address = isInstall ? order.service_address : order.ship_address;

  const contact = await upsertContactByPhone(
    order.phone_e164,
    {
      name,
      email: order.email,
      service_address: address,
      source: "parts-store",
    },
    { markConsent: true }
  );

  const jobInsert: Partial<JobRow> = {
    contact_id: contact.id,
    status: isInstall ? "scheduled" : "paid",
    source: "parts-store",
    service: isInstall ? "OEM parts install" : "OEM parts order (ship)",
    quote_amount: order.amount,
    invoice_amount: order.amount,
    date_paid: today,
    pay_method: "stripe",
    job_address: address,
    notes: [
      `Parts order paid in full ($${order.amount}) via the storefront.`,
      `Fulfillment: ${isInstall ? "install on a service visit" : "ship to customer"}.`,
      itemsSummary,
    ]
      .filter(Boolean)
      .join("\n"),
  };
  const { data: jobRow, error: jobErr } = await sb.from("jobs").insert(jobInsert).select("id").single();
  if (jobErr || !jobRow) throw new Error(jobErr?.message ?? "job insert failed");
  const jobId = (jobRow as { id: string }).id;

  if (isInstall) {
    const appt: AppointmentRow = await createAppointment({
      contact_id: contact.id,
      job_id: jobId,
      status: "confirmed",
      scheduled_date: order.preferred_date,
      scheduled_start: order.preferred_time,
      service_address: order.service_address,
      confirmed_at: new Date().toISOString(),
    });

    if (order.preferred_date) {
      try {
        const cal = await createCalendarEvent({
          title: `Parts install — ${name ?? order.phone_e164}`,
          date: order.preferred_date,
          start: order.preferred_time,
          durationHours: 2,
          location: order.service_address,
          description: `Paid in full ($${order.amount}).\n${itemsSummary}`,
        });
        if (cal) {
          await updateJob(jobId, { gcal_event_id: cal.eventId });
          await updateAppointment(appt.id, { gcal_event_id: cal.eventId, gcal_url: cal.calendarUrl });
        }
      } catch {
        /* calendar is best-effort */
      }
    }
  }

  // SMS confirmations (best-effort; ride the A2P-gated line).
  if (isTwilioConfigured()) {
    if (isInstall) {
      const when = (order.preferred_date ?? "") + (order.preferred_time ? ` ${order.preferred_time}` : "");
      try {
        await sendSms({
          to: NOTIFY_TO,
          body: `🔧 Parts install booked + paid: ${name ?? order.phone_e164} · $${order.amount} · ${when} · ${order.service_address ?? ""}\n${itemsSummary}`.slice(0, 600),
        });
      } catch {
        /* best-effort */
      }
      try {
        await sendSms({
          to: order.phone_e164,
          body: `You're booked with ${SITE.name} for ${when || "your install"} and paid in full — thank you! We'll source the parts and confirm the window. Reply here with any questions.`,
        });
      } catch {
        /* best-effort */
      }
    } else {
      try {
        await sendSms({
          to: NOTIFY_TO,
          body: `📦 Parts order paid — ORDER & SHIP: ${name ?? order.phone_e164} · $${order.amount}\nShip to: ${order.ship_address ?? ""}\n${itemsSummary}`.slice(0, 600),
        });
      } catch {
        /* best-effort */
      }
      try {
        await sendSms({
          to: order.phone_e164,
          body: `Thanks from ${SITE.name}! Your parts order is paid ($${order.amount}). We'll order your part(s) and ship to ${order.ship_address ?? "your address"} — we'll text tracking when it's on the way.`,
        });
      } catch {
        /* best-effort */
      }
    }
  }

  await logEvent("appointment_confirmed", { contactId: contact.id, jobId }, {
    via: "parts-store",
    session: sessionId,
    amount: order.amount,
    fulfillment: order.fulfillment,
  });

  await sb.from("parts_orders").update({ status: "fulfilled", fulfilled_job_id: jobId }).eq("id", pendingId);
}
