/**
 * Father's Day booking availability. Combines the date rules (Mon–Thu, ≥72h,
 * from lib/campaign-fathers-day.ts) with real capacity: a slot is taken once an
 * appointment exists on that date at the slot's start time. Best-effort — if
 * Supabase is unreadable we show every slot rather than blocking a booking.
 *
 * Used server-side by the /fathers-day/book page (to render the picker) and by
 * /api/fathers-day/checkout (to re-validate before charging).
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { FD_SLOTS, fathersDayCandidateDates, type FdSlotId } from "@/lib/campaign-fathers-day";

export type AvailableSlot = { id: FdSlotId; label: string; start: string; available: boolean };
export type AvailableDay = { date: string; slots: AvailableSlot[]; anyOpen: boolean };

/** Set of "date|start" keys already booked among the candidate dates. */
async function takenKeys(dates: string[]): Promise<Set<string>> {
  const taken = new Set<string>();
  if (dates.length === 0 || !isSupabaseConfigured()) return taken;
  try {
    const { data } = await getSupabase()
      .from("appointments")
      .select("scheduled_date, scheduled_start, status")
      .in("scheduled_date", dates)
      .in("status", ["proposed", "confirmed"]);
    for (const row of (data ?? []) as { scheduled_date: string | null; scheduled_start: string | null }[]) {
      if (row.scheduled_date && row.scheduled_start) {
        taken.add(`${row.scheduled_date}|${row.scheduled_start}`);
      }
    }
  } catch {
    /* best-effort — fall back to all-open */
  }
  return taken;
}

export async function getFathersDayAvailability(now: Date = new Date()): Promise<AvailableDay[]> {
  const dates = fathersDayCandidateDates(now);
  const taken = await takenKeys(dates);
  return dates.map((date) => {
    const slots: AvailableSlot[] = FD_SLOTS.map((s) => ({
      id: s.id,
      label: s.label,
      start: s.start,
      available: !taken.has(`${date}|${s.start}`),
    }));
    return { date, slots, anyOpen: slots.some((s) => s.available) };
  });
}

/** Server-side re-check used by checkout: is this exact date+slot still open? */
export async function isFathersDaySlotOpen(date: string, start: string, now: Date = new Date()): Promise<boolean> {
  const valid = fathersDayCandidateDates(now).includes(date);
  if (!valid) return false;
  const taken = await takenKeys([date]);
  return !taken.has(`${date}|${start}`);
}
