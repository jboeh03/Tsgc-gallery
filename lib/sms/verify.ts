/**
 * Twilio inbound webhook signature validation.
 *
 * Twilio signs every webhook with HMAC-SHA1 over the full request URL + the
 * sorted POST params, using your auth token. Validating it is the one real
 * security gate on app/api/sms/route.ts — an unvalidated webhook is an open
 * door for spoofed inbound messages writing to the DB.
 *
 * IMPORTANT: the URL must be the exact public URL Twilio called (scheme +
 * host + path + query), which can differ from what Next sees behind Vercel's
 * proxy. Set TWILIO_WEBHOOK_URL to pin it if header-derived host is wrong.
 */

import { validateRequest } from "twilio";

export function verifyTwilioSignature(args: {
  signature: string | null;
  url: string;
  params: Record<string, string>;
}): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !args.signature) return false;
  try {
    return validateRequest(token, args.signature, args.url, args.params);
  } catch {
    return false;
  }
}

/**
 * Reconstruct the public webhook URL Twilio used. Prefers an explicit override,
 * else builds from forwarded headers (Vercel sets x-forwarded-host/proto).
 */
export function resolveWebhookUrl(req: Request, pathname: string): string {
  const override = process.env.TWILIO_WEBHOOK_URL;
  if (override) return override;
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  return `${proto}://${host}${pathname}`;
}
