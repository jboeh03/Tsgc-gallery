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
import { SITE } from "@/lib/site";

/**
 * Validate the Twilio signature against ANY of the candidate URLs. Behind
 * Vercel's proxy the host Twilio called (apex domain, www, or *.vercel.app)
 * may not match what we reconstruct from headers — so a single guess produces
 * false 403s that silently drop real inbound texts. Trying every plausible
 * public URL fixes that WITHOUT weakening the gate: a forged request still has
 * to carry a valid HMAC over the auth token for one of them.
 */
export function verifyTwilioSignature(args: {
  signature: string | null;
  url: string | string[];
  params: Record<string, string>;
}): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !args.signature) return false;
  const urls = Array.isArray(args.url) ? args.url : [args.url];
  for (const url of urls) {
    try {
      if (validateRequest(token, args.signature, url, args.params)) return true;
    } catch {
      /* try the next candidate */
    }
  }
  return false;
}

/**
 * Every public URL Twilio could have used to call this webhook. An explicit
 * TWILIO_WEBHOOK_URL override always wins; otherwise we offer the
 * header-derived host AND the canonical/public hosts so the signature matches
 * regardless of which one Twilio is configured with.
 */
export function resolveWebhookUrl(req: Request, pathname: string): string | string[] {
  const override = process.env.TWILIO_WEBHOOK_URL;
  if (override) return override;
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const candidates = new Set<string>();
  const fwdHost = h.get("x-forwarded-host");
  const host = h.get("host");
  if (fwdHost) candidates.add(`${proto}://${fwdHost}${pathname}`);
  if (host) candidates.add(`${proto}://${host}${pathname}`);
  candidates.add(`${SITE.canonicalUrl.replace(/\/$/, "")}${pathname}`);
  for (const ph of SITE.publicHosts) candidates.add(`https://${ph}${pathname}`);
  return [...candidates];
}
