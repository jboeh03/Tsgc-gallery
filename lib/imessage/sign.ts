/**
 * HMAC helpers for the iMessage flow.
 *
 * Two distinct secrets:
 *
 * - IMESSAGE_RELAY_SECRET — shared between the Mac relay and the
 *   /api/imessage/ingest webhook. The relay signs `{timestamp}.{body}`;
 *   the webhook rejects skew >5 minutes (replay protection) and any
 *   signature mismatch.
 *
 * - IMESSAGE_CONFIRM_SECRET — signs the one-tap confirm tokens that
 *   the ntfy notification embeds. The token is a base64url JSON
 *   payload + a separate HMAC, with a short TTL.
 */

import crypto from "node:crypto";

const REQUEST_SKEW_MS = 5 * 60 * 1000;
const CONFIRM_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export function signRelayRequest(
  secret: string,
  timestamp: number,
  rawBody: string
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}

export type RelayVerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing_headers" | "skew" | "bad_signature" };

export function verifyRelayRequest(args: {
  secret: string;
  rawBody: string;
  timestampHeader: string | null;
  signatureHeader: string | null;
  now?: number;
}): RelayVerifyResult {
  const { secret, rawBody, timestampHeader, signatureHeader } = args;
  if (!timestampHeader || !signatureHeader) {
    return { ok: false, reason: "missing_headers" };
  }
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) return { ok: false, reason: "missing_headers" };

  const now = args.now ?? Date.now();
  if (Math.abs(now - ts) > REQUEST_SKEW_MS) {
    return { ok: false, reason: "skew" };
  }
  const expected = signRelayRequest(secret, ts, rawBody);
  return timingSafeEqualHex(expected, signatureHeader)
    ? { ok: true }
    : { ok: false, reason: "bad_signature" };
}

export type ConfirmTokenPayload = {
  pendingId: string;
  chatGuid: string;
  /** Issued-at ms epoch. */
  iat: number;
};

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  return Buffer.from(
    s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad),
    "base64"
  );
}

export function signConfirmToken(
  secret: string,
  payload: ConfirmTokenPayload
): string {
  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return `${body}.${sig}`;
}

export type ConfirmVerifyResult =
  | { ok: true; payload: ConfirmTokenPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyConfirmToken(
  secret: string,
  token: string,
  now: number = Date.now()
): ConfirmVerifyResult {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return { ok: false, reason: "malformed" };
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  if (!timingSafeEqualHex(expected, sig)) {
    return { ok: false, reason: "bad_signature" };
  }
  let payload: ConfirmTokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(body).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!payload?.pendingId || !payload?.chatGuid || !Number.isFinite(payload.iat)) {
    return { ok: false, reason: "malformed" };
  }
  if (now - payload.iat > CONFIRM_TTL_MS) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}

export function newPendingId(): string {
  return crypto.randomBytes(8).toString("hex");
}
