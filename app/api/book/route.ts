/**
 * Customer self-serve booking. The page at /book (shared by link, not in the
 * public nav) posts here: we upsert the contact, open a 'new' job + a
 * 'proposed' appointment in Supabase, text Jeff a heads-up, and send the
 * customer a confirmation. Jeff confirms the slot from /admin.
 *
 * Open + fail-soft, like the quote form.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { upsertContactByPhone, createAppointment, logEvent } from "@/lib/db/writes";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { normalizeE164 } from "@/lib/db/ingest";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const NOTIFY_TO = process.env.BOOKING_NOTIFY_TO || "+16578314276";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ ok: false, error: "Booking is temporarily unavailable." }, { status: 503 });
  }
  const b = (await req.json().catch(() => ({}))) as {
    firstName?: string; lastName?: string; phone?: string; email?: string;
    serviceAddress?: string; areaId?: string; preferredDate?: string;
    preferredTime?: string; grillModel?: string; notes?: string;
  };

  const phone = normalizeE164(b.phone);
  if (!phone || !b.preferredDate) {
    return Response.json({ ok: false, error: "A valid phone and a preferred date are required." }, { status: 400 });
  }

  try {
    const name = [b.firstName, b.lastName].filter(Boolean).join(" ").trim() || null;
    const contact = await upsertContactByPhone(
      phone,
      {
        name,
        email: b.email || null,
        service_address: b.serviceAddress || null,
        grill_model: b.grillModel || null,
        source: "booking-page",
      },
      { markConsent: true }
    );

    const sb = getSupabase();
    const { data: job } = await sb
      .from("jobs")
      .insert({ contact_id: contact.id, status: "new", source: "booking-page", notes: b.notes || null, grill_model: b.grillModel || null })
      .select("id")
      .single();
    const jobId = (job as { id: string } | null)?.id ?? null;

    const appt = await createAppointment({
      contact_id: contact.id,
      job_id: jobId,
      status: "proposed",
      scheduled_date: b.preferredDate,
      scheduled_start: b.preferredTime || null,
      area_id: b.areaId || null,
      service_address: b.serviceAddress || null,
    });

    await logEvent("appointment_created", { contactId: contact.id, jobId }, {
      via: "booking-page",
      appointmentId: appt.id,
      proposed: true,
    });

    // Heads-up to Jeff + confirmation to the customer (best-effort).
    if (isTwilioConfigured()) {
      const when = b.preferredTime ? `${b.preferredDate} ${b.preferredTime}` : b.preferredDate;
      try {
        await sendSms({
          to: NOTIFY_TO,
          body: `New booking request: ${name || phone} wants ${when}${b.serviceAddress ? ` @ ${b.serviceAddress}` : ""}. Confirm in /admin.`,
        });
      } catch { /* best-effort */ }
      try {
        await sendSms({
          to: phone,
          body: `Thanks${b.firstName ? `, ${b.firstName}` : ""}! We got your request for ${when}. We'll text to confirm shortly. Reply STOP to opt out. — ${SITE.name}`,
        });
      } catch { /* best-effort */ }
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : "Something went wrong." }, { status: 500 });
  }
}
