/**
 * Edge-safe session cookie helpers for the /admin password gate.
 *
 * Kept in its own module (no `next/headers` import) so it can be
 * called from middleware.ts, which runs on Vercel's Edge runtime
 * and can't use the Node `crypto` module. Web Crypto works on both
 * Edge and Node, hence the async signatures.
 *
 * Cookie format: `<iat>.<hex-hmac>` where the HMAC key is derived
 * from the admin password — rotating the password automatically
 * invalidates every existing session.
 */

export const SESSION_COOKIE_NAME = "tsgc-admin-session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const ADMIN_PRINCIPAL = "admin@tsgc";

const FALLBACK_PASSWORD = "cincygrills";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || FALLBACK_PASSWORD;
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function fromHex(s: string): Uint8Array {
  const len = s.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(s.substr(i * 2, 2), 16);
  }
  return out;
}

function constantTimeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function constantTimeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder();
  return constantTimeEqualBytes(enc.encode(a), enc.encode(b));
}

async function deriveSecret(password: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode("tsgc-admin-session-v1::" + password);
  return crypto.subtle.digest("SHA-256", data);
}

async function importHmacKey(password: string): Promise<CryptoKey> {
  const secret = await deriveSecret(password);
  return crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(iat: number, password = getAdminPassword()): Promise<string> {
  const key = await importHmacKey(password);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(String(iat))
  );
  return `${iat}.${toHex(sig)}`;
}

/**
 * Verify a session cookie value. Returns the issued-at timestamp on
 * success, null on failure (malformed / bad signature / expired).
 */
export async function verifySession(
  value: string | undefined | null,
  now: number = Date.now()
): Promise<number | null> {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot <= 0) return null;
  const iatStr = value.slice(0, dot);
  const sigHex = value.slice(dot + 1);
  if (!/^\d+$/.test(iatStr) || !/^[0-9a-f]+$/i.test(sigHex)) return null;
  const iat = Number(iatStr);
  if (!Number.isFinite(iat) || iat <= 0) return null;
  if (now - iat > SESSION_TTL_MS) return null;

  const key = await importHmacKey(getAdminPassword());
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    fromHex(sigHex),
    new TextEncoder().encode(iatStr)
  );
  return ok ? iat : null;
}
