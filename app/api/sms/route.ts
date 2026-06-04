/**
 * Twilio inbound SMS webhook.
 *
 * Order matters: validate signature → upsert contact/conversation → append
 * message (idempotent on twilio_sid) → auto-draft a reply → revalidate the
 * inbox. We ALWAYS return 200 TwiML, even on internal error, so Twilio never
 * enters a retry storm; failures are swallowed (and best-effort logged).
 *
 * This route must NOT be auth-gated — Twilio is the caller. The signature
 * check is the security gate. (middleware.ts only gates /admin, /preview,
 * /studio, so /api/sms is already open.)
 */

import { revalidateTag } from "next/cache";
import { verifyTwilioSignature, resolveWebhookUrl } from "@/lib/sms/verify";
import {
  upsertContactByPhone, getOrCreateConversation, appendMessage,
  touchConversation, logEvent,
} from "@/lib/db/writes";
import { isSupabaseConfigured } from "@/lib/db/supabase";
import { generateDraftForConversation } from "@/lib/comms/generate";

export const runtime = "nodejs";

const OPT_OUT = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const OPT_IN = new Set(["START", "YES", "UNSTOP"]);

const TWIML_OK = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
function ok() {
  return new Response(TWIML_OK, { status: 200, headers: { "content-type": "text/xml" } });
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return ok();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  // Security gate: reject anything not signed by Twilio.
  const url = resolveWebhookUrl(req, "/api/sms");
  const valid = verifyTwilioSignature({
    signature: req.headers.get("x-twilio-signature"),
    url,
    params,
  });
  if (!valid) return new Response("invalid signature", { status: 403 });

  if (!isSupabaseConfigured()) return ok(); // nowhere to store it yet — ack so Twilio doesn't retry

  try {
    const from = params.From;
    const to = params.To;
    const body = params.Body ?? "";
    const sid = params.MessageSid || params.SmsSid || null;
    const numMedia = parseInt(params.NumMedia ?? "0", 10) || 0;
    const mediaUrls: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const u = params[`MediaUrl${i}`];
      if (u) mediaUrls.push(u);
    }

    // Honor opt-out / opt-in keywords (carrier also enforces STOP, but record it
    // so we never attempt an outbound send to someone who opted out).
    const keyword = body.trim().toUpperCase();
    if (OPT_OUT.has(keyword)) {
      await upsertContactByPhone(from, { sms_opt_out: true });
    } else if (OPT_IN.has(keyword)) {
      await upsertContactByPhone(from, { sms_opt_out: false });
    }

    const contact = await upsertContactByPhone(from, {}, { markConsent: true });
    const conv = await getOrCreateConversation(contact.id, to);

    const inserted = await appendMessage({
      conversationId: conv.id,
      direction: "inbound",
      body,
      mediaUrls,
      fromE164: from,
      toE164: to,
      twilioSid: sid,
      status: "received",
    });

    // inserted === null means this twilio_sid was already processed (retry) — skip side effects.
    if (inserted) {
      await touchConversation(conv.id, { lastDirection: "inbound", unread: true });
      await logEvent("message_in", { contactId: contact.id, conversationId: conv.id }, { sid });
      if (!OPT_OUT.has(keyword)) {
        await generateDraftForConversation(conv.id);
        await logEvent("draft_generated", { contactId: contact.id, conversationId: conv.id });
      }
      revalidateTag("admin-inbox");
    }
  } catch {
    /* swallow — never make Twilio retry; the message may be reprocessed safely thanks to idempotency */
  }

  return ok();
}
