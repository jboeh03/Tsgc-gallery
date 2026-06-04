/**
 * Create an appointment — the "Add to schedule" action from the inbox (and,
 * later, the customer booking link). Self-gated to admins. Creates the
 * appointment, advances the linked job to 'scheduled', and optionally texts
 * the customer a confirmation.
 */

import { revalidateTag } from "next/cache";
import { auth, isAdmin } from "@/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import {
  createAppointment, setJobStatus, appendMessage, touchConversation, logEvent,
} from "@/lib/db/writes";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { SITE } from "@/lib/site";
import type { ContactRow } from "@/lib/db/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const b = (await req.json().catch(() => ({}))) as {
    conversationId?: string;
    contactId?: string;
    jobId?: string | null;
    scheduledDate?: string;
    scheduledStart?: string | null;
    areaId?: string | null;
    sendConfirmation?: boolean;
  };
  if (!b.contactId || !b.scheduledDate) {
    return Response.json({ error: "contactId and scheduledDate required" }, { status: 400 });
  }

  try {
    const appt = await createAppointment({
      contact_id: b.contactId,
      job_id: b.jobId ?? null,
      status: "confirmed",
      scheduled_date: b.scheduledDate,
      scheduled_start: b.scheduledStart ?? null,
      area_id: b.areaId ?? null,
      confirmed_at: new Date().toISOString(),
    });

    if (b.jobId) await setJobStatus(b.jobId, "scheduled");
    await logEvent("appointment_created", { contactId: b.contactId, jobId: b.jobId ?? null }, {
      appointmentId: appt.id,
      date: b.scheduledDate,
    });

    // Optional confirmation text.
    if (b.sendConfirmation && isTwilioConfigured()) {
      const { data: contact } = await getSupabase()
        .from("contacts")
        .select("*")
        .eq("id", b.contactId)
        .maybeSingle();
      const c = contact as ContactRow | null;
      if (c?.phone_e164 && !c.sms_opt_out) {
        const when = b.scheduledStart ? `${b.scheduledDate} at ${b.scheduledStart}` : b.scheduledDate;
        const body = `You're booked with ${SITE.name} on ${when}. Reply here if anything changes. — Jeff`;
        try {
          const sent = await sendSms({ to: c.phone_e164, body });
          if (b.conversationId) {
            await appendMessage({
              conversationId: b.conversationId,
              direction: "outbound",
              body,
              toE164: c.phone_e164,
              fromE164: process.env.TWILIO_PHONE_NUMBER ?? null,
              twilioSid: sent.sid,
              status: sent.status,
            });
            await touchConversation(b.conversationId, { lastDirection: "outbound", unread: false });
          }
        } catch {
          /* confirmation text is best-effort; the appointment still stands */
        }
      }
    }

    revalidateTag("admin-inbox");
    revalidateTag("admin-schedule");
    return Response.json({ ok: true, appointment: appt });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "failed to schedule" },
      { status: 500 }
    );
  }
}
