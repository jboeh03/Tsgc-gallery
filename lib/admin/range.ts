import { subDays, startOfDay, endOfDay, format } from "date-fns";

export const RANGE_PRESETS = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "365d", label: "Last 12 months", days: 365 },
  { id: "all", label: "All time", days: null as number | null },
] as const;

export type RangeId = (typeof RANGE_PRESETS)[number]["id"];

export function resolveRange(rangeId: string | undefined) {
  const preset = RANGE_PRESETS.find((p) => p.id === rangeId) ?? RANGE_PRESETS[1];
  const end = endOfDay(new Date());
  const start = preset.days == null ? new Date(0) : startOfDay(subDays(new Date(), preset.days - 1));
  return { id: preset.id, label: preset.label, start, end };
}

/**
 * Parse the sheet's timestamp strings, which the Apps Script emits via
 * Date.toLocaleString('en-US', { timeZone: 'America/New_York' }).
 * That format is e.g. "5/20/2026, 9:14:32 AM".
 *
 * Returns null on garbage so callers can drop bad rows.
 */
export function parseSheetTimestamp(ts: string): Date | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d;
  // Fallback: handle just-date strings ("2026-05-20") or M/D/YYYY without time.
  const m = ts.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const [, mo, dy, yr] = m;
    const fb = new Date(Number(yr), Number(mo) - 1, Number(dy));
    if (!isNaN(fb.getTime())) return fb;
  }
  return null;
}

export function inRange(ts: string, range: { start: Date; end: Date }): boolean {
  const d = parseSheetTimestamp(ts);
  if (!d) return false;
  return d >= range.start && d <= range.end;
}

export function formatRangeLabel(range: { start: Date; end: Date }, id: RangeId): string {
  if (id === "all") return "All time";
  return `${format(range.start, "MMM d")} – ${format(range.end, "MMM d, yyyy")}`;
}
