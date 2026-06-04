/**
 * Outbound SMS send — called from the /admin inbox composer.
 *
 * Self-gated: middleware.ts does not cover /api, so this route calls auth()
 * and 401s unless the caller is an allowlisted admin. Blocks sends to
 * opted-out contacts (TCPA). Human-in-the-loop: there is no auto-send here —
 * a person clicked Send in /admin.
 */

import { revalidateTag } from "next/cache";
import { auth, isAdmin } from "@/auth";
import { readConversation } from "@/lib/db/reads";
import { appendMessage, touchConversation, markDraftSent, logEvent } from "@/lib/db/writes";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { conversationId, body, fromDraft } = (await req.json().catch(() => ({}))) as {
    conversationId?: string;
    body?: string;
    fromDraft?: boolean;
  };
  if (!conversationId || !body?.trim()) {
    return Response.json({ error: "conversationId and body required" }, { status: 400 });
  }
  if (!isTwilioConfigured()) {
    return Response.json({ error: "Twilio not configured" }, { status: 503 });
  }

  const thread = await readConversation(conversationId);
  const phone = thread?.contact?.phone_e164;
  if (!phone) return Response.json({ error: "conversation has no phone" }, { status: 400 });
  if (thread?.contact?.sms_opt_out) {
    return Response.json({ error: "contact has opted out of SMS" }, { status: 403 });
  }

  try {
    const sent = await sendSms({ to: phone, body });
    await appendMessage({
      conversationId,
      direction: "outbound",
      body,
      toE164: phone,
      fromE164: process.env.TWILIO_PHONE_NUMBER ?? null,
      twilioSid: sent.sid,
      status: sent.status,
      aiGenerated: Boolean(fromDraft),
    });
    await touchConversation(conversationId, { lastDirection: "outbound", unread: false });
    await markDraftSent(conversationId);
    await logEvent("message_out", {
      contactId: thread?.contact?.id ?? null,
      conversationId,
    }, { sid: sent.sid });
    revalidateTag("admin-inbox");
    return Response.json({ ok: true, sid: sent.sid });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "send failed" },
      { status: 502 }
    );
  }
}
