/**
 * Tiny DB-backed rate limiter for the public endpoints (quote ingest, booking).
 * Counts recent hits per "bucket" (e.g. ip:1.2.3.4 or phone:+1513…) in a window.
 * Fail-OPEN: a limiter bug must never block a real customer.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";

/** Returns true if the action is allowed (under the limit), false if over. */
export async function rateLimit(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  try {
    const sb = getSupabase();
    const since = new Date(Date.now() - windowMs).toISOString();
    const { count } = await sb
      .from("rate_events")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .gte("created_at", since);
    if ((count ?? 0) >= limit) return false;
    await sb.from("rate_events").insert({ bucket });
    return true;
  } catch {
    return true; // fail open
  }
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

const HOUR = 3_600_000;
const DAY = 86_400_000;

/** Combined IP + identity check for a public form. Allowed unless either bucket is over. */
export async function publicFormAllowed(scope: string, ip: string, identity?: string | null): Promise<boolean> {
  const ipOk = await rateLimit(`${scope}:ip:${ip}`, 6, HOUR);
  if (!ipOk) return false;
  if (identity) {
    const idOk = await rateLimit(`${scope}:id:${identity}`, 3, DAY);
    if (!idOk) return false;
  }
  return true;
}
