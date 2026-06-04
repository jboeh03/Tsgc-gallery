/**
 * Supabase-backed source for the public "this week" route map. Merges live
 * appointments (booked from the /admin inbox) with the seeded static stops in
 * data/schedule.json, then runs the same week-picker. Falls back to the static
 * file alone when Supabase is unconfigured or unreachable — the page never
 * goes blank.
 *
 * Only the neighborhood (area_id) and date are read — never a customer's
 * service_address. The public map plots area centroids only.
 */

import data from "@/data/schedule.json";
import { pickWeek, type ScheduleStop, type ScheduleWeek } from "./schedule";
import { getSupabase, isSupabaseConfigured } from "./db/supabase";

export async function getScheduleWeekFromDb(now: Date = new Date()): Promise<ScheduleWeek | null> {
  const staticStops = data.stops as ScheduleStop[];
  if (!isSupabaseConfigured()) return pickWeek(staticStops, now);

  try {
    const { data: appts, error } = await getSupabase()
      .from("appointments")
      .select("id, area_id, scheduled_date, status")
      .neq("status", "canceled");
    if (error) throw new Error(error.message);

    const dbStops: ScheduleStop[] = (appts ?? [])
      .filter((a) => a.area_id && a.scheduled_date)
      .map((a) => ({
        id: `appt-${a.id}`,
        areaId: a.area_id as string,
        date: a.scheduled_date as string,
      }));

    return pickWeek([...staticStops, ...dbStops], now);
  } catch {
    return pickWeek(staticStops, now);
  }
}
