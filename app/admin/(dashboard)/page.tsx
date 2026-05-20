import Link from "next/link";
import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import KpiCard from "@/components/admin/KpiCard";
import EmptyState from "@/components/admin/EmptyState";
import LeadsByDay, { type DailyPoint } from "@/components/admin/charts/LeadsByDay";
import DonutBreakdown, { type BreakdownItem } from "@/components/admin/charts/DonutBreakdown";
import { readLeads, readJobs, checkSheetHealth } from "@/lib/admin/sheets";
import { resolveRange, inRange, parseSheetTimestamp, formatRangeLabel } from "@/lib/admin/range";
import { format, eachDayOfInterval } from "date-fns";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const session = await auth();
  const range = resolveRange(searchParams.range);
  const health = await checkSheetHealth();

  if (!health.configured) {
    return (
      <>
        <Header email={session?.user?.email} title="Overview" showRange={false} />
        <div className="p-6">
          <EmptyState
            title="Sheets API not configured"
            body="Set GOOGLE_SHEETS_API_KEY and GOOGLE_SHEET_ID on the Vercel project, then reload. See Settings for the exact values."
            cta={
              <Link
                href="/admin/settings"
                className="inline-flex rounded-md bg-burgundy text-bone px-4 py-2 text-sm font-semibold"
              >
                Open settings →
              </Link>
            }
          />
        </div>
      </>
    );
  }

  if (!health.ok) {
    return (
      <>
        <Header email={session?.user?.email} title="Overview" showRange={false} />
        <div className="p-6">
          <EmptyState
            title="Couldn't read the sheet"
            body={health.error || "Unknown error talking to Google Sheets."}
          />
        </div>
      </>
    );
  }

  const [leads, jobs] = await Promise.all([readLeads(), readJobs()]);

  const inWindow = leads.filter((l) => inRange(l.timestamp, range));
  const total = inWindow.length;

  // Conversion: jobs in window that have a Completed-ish status
  const completedStatuses = new Set([
    "completed",
    "done",
    "paid",
    "closed",
    "complete",
  ]);
  const jobsInWindow = jobs.filter((j) => inRange(j.date, range));
  const completedCount = jobsInWindow.filter((j) =>
    completedStatuses.has(j.status.toLowerCase())
  ).length;
  const conversionPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Top source
  const sourceCounts = countBy(inWindow.map((l) => normalizeSource(l.source)));
  const topSource = topEntry(sourceCounts);

  // Daily series
  const series = buildDailySeries(inWindow, range);

  // Status mix
  const statusCounts = countBy(inWindow.map((l) => l.status || "New Lead"));
  const statusBreakdown: BreakdownItem[] = Object.entries(statusCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const sourceBreakdown: BreakdownItem[] = Object.entries(sourceCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const recent = [...inWindow]
    .sort((a, b) =>
      (parseSheetTimestamp(b.timestamp)?.getTime() ?? 0) -
      (parseSheetTimestamp(a.timestamp)?.getTime() ?? 0)
    )
    .slice(0, 10);

  return (
    <>
      <Header email={session?.user?.email} title="Overview" />
      <div className="p-6 space-y-6">
        <p className="text-xs text-muted">{formatRangeLabel(range, range.id as never)}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Leads" value={total} hint="in selected range" />
          <KpiCard
            label="Booked / completed"
            value={completedCount}
            hint={`${conversionPct}% conversion`}
          />
          <KpiCard
            label="Top source"
            value={topSource?.label ?? "—"}
            hint={topSource ? `${topSource.value} of ${total}` : undefined}
          />
          <KpiCard
            label="Avg / day"
            value={range.id === "all" ? "—" : (total / Math.max(1, daysInRange(range))).toFixed(1)}
            hint="leads per day"
          />
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base text-navy">Leads per day</h2>
            <Link
              href="/admin/leads"
              className="text-xs uppercase tracking-wider text-burgundy hover:underline"
            >
              See all leads →
            </Link>
          </div>
          {series.length > 0 ? (
            <LeadsByDay data={series} />
          ) : (
            <EmptyState title="No leads in this window" />
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-display text-base text-navy mb-3">Source breakdown</h2>
            {sourceBreakdown.length > 0 ? (
              <>
                <DonutBreakdown data={sourceBreakdown} totalLabel="leads" />
                <BreakdownLegend items={sourceBreakdown} />
              </>
            ) : (
              <p className="text-sm text-ink/60">No data.</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-display text-base text-navy mb-3">Status mix</h2>
            {statusBreakdown.length > 0 ? (
              <>
                <DonutBreakdown data={statusBreakdown} totalLabel="leads" />
                <BreakdownLegend items={statusBreakdown} />
              </>
            ) : (
              <p className="text-sm text-ink/60">No data.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display text-base text-navy">Recent leads</h2>
            <Link
              href="/admin/leads"
              className="text-xs uppercase tracking-wider text-burgundy hover:underline"
            >
              All leads →
            </Link>
          </div>
          {recent.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Phone</th>
                  <th className="px-5 py-3 font-semibold">Services</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((l) => (
                  <tr key={l.rowNumber} className="hover:bg-bone/40">
                    <td className="px-5 py-3 font-medium text-navy">{l.name}</td>
                    <td className="px-5 py-3 text-ink/75">{l.phone || "—"}</td>
                    <td className="px-5 py-3 text-ink/75">{l.services || "—"}</td>
                    <td className="px-5 py-3 text-ink/75">{l.source || "—"}</td>
                    <td className="px-5 py-3 text-ink/60 whitespace-nowrap">
                      {formatRelative(l.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5">
              <EmptyState title="No leads in this window" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function BreakdownLegend({ items }: { items: BreakdownItem[] }) {
  const COLORS = ["#8B1F2F", "#1A3055", "#3D6390", "#A82B3D", "#6E1825", "#2C4A6E"];
  const total = items.reduce((s, x) => s + x.value, 0);
  return (
    <ul className="mt-4 grid grid-cols-2 gap-y-1.5 text-xs">
      {items.map((it, i) => (
        <li key={it.label} className="flex items-center justify-between gap-3 pr-2">
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-ink/75 truncate">{it.label}</span>
          </span>
          <span className="text-ink/55 tabular-nums">
            {it.value} · {total ? Math.round((it.value / total) * 100) : 0}%
          </span>
        </li>
      ))}
    </ul>
  );
}

function countBy<T extends string>(arr: T[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of arr) {
    if (!v) continue;
    out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

function topEntry(counts: Record<string, number>) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  return { label: entries[0][0], value: entries[0][1] };
}

function normalizeSource(raw: string): string {
  const s = (raw || "").trim();
  if (!s) return "Unknown";
  const lower = s.toLowerCase();
  if (lower.includes("website") || lower.includes("form")) return "Website";
  if (lower.includes("facebook") || lower.includes("fb")) return "Facebook";
  if (lower.includes("instagram") || lower.includes("ig")) return "Instagram";
  if (lower.includes("google")) return "Google";
  if (lower.includes("referral") || lower.includes("referred")) return "Referral";
  if (lower.includes("memorial")) return "Memorial Day";
  return s;
}

function buildDailySeries(
  leads: { timestamp: string }[],
  range: { start: Date; end: Date; id: string }
): DailyPoint[] {
  if (range.id === "all" || leads.length === 0) {
    // For "all time" or empty, bucket by day across the actual data window.
    const dates = leads
      .map((l) => parseSheetTimestamp(l.timestamp))
      .filter((d): d is Date => d != null)
      .sort((a, b) => a.getTime() - b.getTime());
    if (dates.length === 0) return [];
    const start = dates[0];
    const end = dates[dates.length - 1];
    return bucketize(dates, start, end);
  }
  const dates = leads
    .map((l) => parseSheetTimestamp(l.timestamp))
    .filter((d): d is Date => d != null);
  return bucketize(dates, range.start, range.end);
}

function bucketize(dates: Date[], start: Date, end: Date): DailyPoint[] {
  const days = eachDayOfInterval({ start, end });
  const byKey = new Map<string, number>();
  for (const day of days) byKey.set(format(day, "yyyy-MM-dd"), 0);
  for (const d of dates) {
    const k = format(d, "yyyy-MM-dd");
    if (byKey.has(k)) byKey.set(k, (byKey.get(k) ?? 0) + 1);
  }
  return Array.from(byKey.entries()).map(([date, count]) => ({ date, count }));
}

function daysInRange(range: { start: Date; end: Date }): number {
  return Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000));
}

function formatRelative(ts: string): string {
  const d = parseSheetTimestamp(ts);
  if (!d) return ts;
  const diffMs = Date.now() - d.getTime();
  const m = Math.round(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d ago`;
  return format(d, "MMM d");
}
