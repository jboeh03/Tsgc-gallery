import data from "@/data/schedule.json";

/**
 * One stop on the weekly route. `areaId` keys into `lib/areas.ts` for the pin
 * location; `jobId` (once set) links to a finished gallery job, which is what
 * flips the pin from "scheduled grill" to "clickable before/after".
 */
export type ScheduleStop = {
  id: string;
  areaId: string;
  date: string; // ISO yyyy-mm-dd
  jobId?: string;
};

export type ScheduleWeek = {
  /** Monday of the chosen week, ISO yyyy-mm-dd. */
  weekStart: string;
  /** Sunday of the chosen week, ISO yyyy-mm-dd. */
  weekEnd: string;
  /** Human label, e.g. "June 1–7". */
  label: string;
  stops: ScheduleStop[];
};

/**
 * Returns the week of stops to show. Picks the week containing `now`; if that
 * week has no stops, rolls forward to the next upcoming week that does, and
 * failing that falls back to the most recent past week. This keeps the page
 * meaningful as the schedule is kept current, instead of going blank the moment
 * the calendar turns over.
 */
export function getScheduleWeek(now: Date = new Date()): ScheduleWeek | null {
  return pickWeek(data.stops as ScheduleStop[], now);
}

/**
 * Pure week-picker over an arbitrary stop list — shared by the static JSON
 * source (above) and the Supabase appointments source (lib/schedule-db.ts).
 */
export function pickWeek(allStops: ScheduleStop[], now: Date = new Date()): ScheduleWeek | null {
  const stops = allStops
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  if (stops.length === 0) return null;

  const byWeek = new Map<string, ScheduleStop[]>();
  for (const stop of stops) {
    const key = mondayISO(parseISO(stop.date));
    const bucket = byWeek.get(key);
    if (bucket) bucket.push(stop);
    else byWeek.set(key, [stop]);
  }

  const currentKey = mondayISO(now);
  const weekKeys = [...byWeek.keys()].sort();
  const chosen =
    (byWeek.has(currentKey) && currentKey) ||
    weekKeys.find((k) => k >= currentKey) || // next upcoming week with stops
    weekKeys[weekKeys.length - 1]; // else most recent

  const weekStart = chosen;
  const weekEnd = addDaysISO(weekStart, 6);
  return {
    weekStart,
    weekEnd,
    label: formatRange(weekStart, weekEnd),
    stops: byWeek.get(chosen) ?? [],
  };
}

// --- date helpers (Monday-based ISO weeks, computed in local time) ---

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO date of the Monday on or before `d`. */
function mondayISO(d: Date): string {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (copy.getDay() + 6) % 7; // Mon=0 … Sun=6
  copy.setDate(copy.getDate() - dow);
  return toISO(copy);
}

function addDaysISO(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

function formatRange(startISO: string, endISO: string): string {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const month = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long" });
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${month(start)} ${start.getDate()}–${end.getDate()}`
    : `${month(start)} ${start.getDate()} – ${month(end)} ${end.getDate()}`;
}
