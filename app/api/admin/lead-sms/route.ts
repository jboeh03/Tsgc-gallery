/**
 * Send a text to a lead straight from the CRM detail view. Mirrors
 * /api/sms/send but keyed by contactId (get-or-creates the conversation), and
 * gated by SMS_SEND_ENABLED so one-click send stays dark until the Twilio A2P
 * 10DLC registration clears. Admin-only, human-in-the-loop (a person clicks).
 */

import { auth, isAdmin } from "@/auth";
import { getSupabase } from "@/lib/db/supabase";
import { getOrCreateConversation, appendMessage, touchConversation, markDraftSent, logEvent } from "@/lib/db/writes";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";

export const runtime = "nodejs";

export function smsSendEnabled(): boolean {
  return process.env.SMS_SEND_ENABLED === "true";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (!smsSendEnabled()) {
    return Response.json({ error: "SMS sending is paused until A2P verification clears." }, { status: 503 });
  }
  const { contactId, body } = (await req.json().catch(() => ({}))) as { contactId?: string; body?: string };
  if (!contactId || !body?.trim()) return Response.json({ error: "contactId and body required" }, { status: 400 });
  if (!isTwilioConfigured()) return Response.json({ error: "Twilio not configured" }, { status: 503 });

  const sb = getSupabase();
  const { data: c } = await sb.from("contacts").select("id, phone_e164, sms_opt_out").eq("id", contactId).maybeSingle();
  const contact = c as { id: string; phone_e164: string | null; sms_opt_out: boolean } | null;
  if (!contact?.phone_e164) return Response.json({ error: "contact has no phone" }, { status: 400 });
  if (contact.sms_opt_out) return Response.json({ error: "contact has opted out of SMS" }, { status: 403 });

  const twilioNumber = process.env.TWILIO_PHONE_NUMBER || "+15137904040";
  const conv = await getOrCreateConversation(contactId, twilioNumber);
  try {
    const sent = await sendSms({ to: contact.phone_e164, body });
    await appendMessage({
      conversationId: conv.id,
      direction: "outbound",
      body,
      toE164: contact.phone_e164,
      fromE164: twilioNumber,
      twilioSid: sent.sid,
      status: sent.status,
      aiGenerated: false,
    });
    await touchConversation(conv.id, { lastDirection: "outbound", unread: false });
    await markDraftSent(conv.id);
    await logEvent("message_out", { contactId, conversationId: conv.id }, { sid: sent.sid });
    return Response.json({ ok: true, sid: sent.sid });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "send failed" }, { status: 502 });
  }
}
