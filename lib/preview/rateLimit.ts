/**
 * In-memory rate limiter. Resets when the serverless function recycles —
 * good enough for an MVP but not abuse-proof. For production, swap to
 * Vercel KV / Upstash Redis with the same shape.
 */

type Bucket = { count: number; resetAt: number };

const ipBuckets = new Map<string, Bucket>();
const emailBuckets = new Map<string, Bucket>();

const DAY_MS = 24 * 60 * 60 * 1000;

function hit(map: Map<string, Bucket>, key: string, limit: number): boolean {
  const now = Date.now();
  const existing = map.get(key);
  if (!existing || existing.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + DAY_MS });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

export function checkRateLimit(args: {
  ip: string;
  email: string;
}): { ok: true } | { ok: false; reason: "ip" | "email" } {
  if (!hit(ipBuckets, args.ip, 3)) return { ok: false, reason: "ip" };
  if (!hit(emailBuckets, args.email.toLowerCase(), 1))
    return { ok: false, reason: "email" };
  return { ok: true };
}
