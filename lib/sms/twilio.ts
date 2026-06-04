/**
 * Twilio REST wrapper. Fail-soft like the rest of the app: if the env vars
 * are absent, sendSms throws a typed "not configured" error that route
 * handlers turn into a clear admin-facing message rather than a crash.
 *
 * Env vars (set on Vercel):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE_NUMBER   the Tri-State Twilio number (forwarded from 657-831-4276)
 */

import twilio, { type Twilio } from "twilio";

const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_PHONE_NUMBER;
// When set, outbound sends route through the A2P-registered Messaging Service
// (correct for 10DLC) instead of the bare from-number.
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

export type TwilioHealth = {
  configured: boolean;
  ok: boolean;
  error?: string;
  number?: string;
};

export function isTwilioConfigured(): boolean {
  return Boolean(SID && TOKEN && FROM);
}

let _client: Twilio | null = null;

function getClient(): Twilio {
  if (!SID || !TOKEN) throw new Error("Twilio not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)");
  if (!_client) _client = twilio(SID, TOKEN);
  return _client;
}

export async function sendSms(input: {
  to: string;
  body: string;
  mediaUrls?: string[];
}): Promise<{ sid: string; status: string }> {
  if (!MESSAGING_SERVICE_SID && !FROM) {
    throw new Error("Twilio not configured (TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER)");
  }
  const sender = MESSAGING_SERVICE_SID
    ? { messagingServiceSid: MESSAGING_SERVICE_SID }
    : { from: FROM as string };
  const msg = await getClient().messages.create({
    to: input.to,
    ...sender,
    body: input.body,
    ...(input.mediaUrls?.length ? { mediaUrl: input.mediaUrls } : {}),
  });
  return { sid: msg.sid, status: msg.status };
}

/** Lightweight health check: verifies the credentials resolve to an account. */
export async function checkTwilioHealth(): Promise<TwilioHealth> {
  if (!isTwilioConfigured()) {
    return { configured: false, ok: false, error: "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER not set" };
  }
  try {
    await getClient().api.accounts(SID as string).fetch();
    return { configured: true, ok: true, number: FROM };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      number: FROM,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
