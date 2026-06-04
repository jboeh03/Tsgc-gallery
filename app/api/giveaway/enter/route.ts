/**
 * Giveaway entry intake → Supabase (migrated off Apps Script). Public endpoint
 * the /giveaway EntryForm posts to. Best-effort: requires an email or phone,
 * then inserts a row. The entry-weight math is computed client-side and passed
 * through (mirrors the prior Apps Script behavior).
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { normalizeE164 } from "@/lib/db/ingest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const d = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const num = (v: unknown, fallback = 0) => {
    const n = parseInt(String(v ?? ""), 10);
    return Number.isNaN(n) ? fallback : n;
  };

  const email = str(d.email).toLowerCase();
  const phone = normalizeE164(str(d.phone));
  if (!email && !phone) {
    return Response.json({ error: "email or phone required" }, { status: 400 });
  }
  if (!isSupabaseConfigured()) return Response.json({ ok: true }); // nowhere to store; don't error the form

  try {
    await getSupabase().from("giveaway_entries").insert({
      giveaway_id: str(d.giveawayId) || null,
      first_name: str(d.firstName) || null,
      last_name: str(d.lastName) || null,
      email: email || null,
      phone: phone,
      zip: str(d.zip) || null,
      booking_ref: str(d.bookingRef) || null,
      base_entries: num(d.baseEntries, 1),
      bonus_booking: num(d.bonusBooking),
      bonus_share: num(d.bonusShare),
      bonus_follow: num(d.bonusFollow),
      total_entries: num(d.totalEntries, 1),
      source: str(d.source) || "giveaway-entry-form",
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "insert failed" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
