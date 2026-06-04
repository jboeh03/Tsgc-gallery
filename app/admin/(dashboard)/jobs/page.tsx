import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import KpiCard from "@/components/admin/KpiCard";
import EmptyState from "@/components/admin/EmptyState";
import { readJobs } from "@/lib/db/reads";
import { checkDbHealth } from "@/lib/db/supabase";
import { listCalendarEvents } from "@/lib/calendar";
import { SHEET_ID } from "@/lib/admin/sheets";
import { resolveRange, inRange, parseSheetTimestamp, formatRangeLabel } from "@/lib/admin/range";
import { format } from "date-fns";

const COMPLETED = new Set(["completed", "done", "paid", "closed", "complete"]);

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const session = await auth();
  const range = resolveRange(searchParams.range);
  const health = await checkDbHealth();

  if (!health.ok) {
    return (
      <>
        <Header email={session?.user?.email} title="Jobs" showRange={false} />
        <div className="p-6">
          <EmptyState
            title={health.configured ? "Sheets error" : "Sheets not configured"}
            body={health.error}
          />
        </div>
      </>
    );
  }

  const all = await readJobs();
  const inWindow = all.filter((j) => inRange(j.date, range));
  const completed = inWindow.filter((j) => COMPLETED.has(j.status.toLowerCase()));

  // Upcoming scheduled jobs come from the live TSGC Schedule calendar (next 30
  // days), not the CRM jobs table — that's where the real schedule lives.
  const upcoming = await listCalendarEvents(
    new Date().toISOString(),
    new Date(Date.now() + 30 * 86_400_000).toISOString()
  );

  // Group by month for the table
  const byMonth = new Map<string, typeof completed>();
  for (const j of completed) {
    const d = parseSheetTimestamp(j.date);
    if (!d) continue;
    const key = format(d, "yyyy-MM");
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(j);
  }
  const months = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <>
      <Header email={session?.user?.email} title="Jobs" />
      <div className="p-6 space-y-6">
        <p className="text-xs text-muted">{formatRangeLabel(range, range.id as never)}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Jobs (window)" value={inWindow.length} hint="all statuses" />
          <KpiCard label="Completed" value={completed.length} />
          <KpiCard label="Upcoming" value={upcoming.length} hint="next 30 days · calendar" />
          <KpiCard
            label="Active customers"
            value={new Set(inWindow.map((j) => `${j.name}|${j.phone}`)).size}
            hint="unique name+phone"
          />
        </div>

        {/* Upcoming jobs from the TSGC Schedule Google Calendar */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-base text-navy">Upcoming · TSGC Schedule</h2>
            <span className="text-xs text-muted">{upcoming.length} on the calendar</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Nothing upcoming on the calendar"
                body="Connect the calendar (re-consent at sign-in) or add jobs to the TSGC Schedule calendar."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted bg-bone/40">
                <tr>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">When</th>
                  <th className="px-4 py-3 font-semibold">Job</th>
                  <th className="px-4 py-3 font-semibold">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {upcoming.map((e) => {
                  const start = e.start ? new Date(e.allDay ? `${e.start}T12:00:00` : e.start) : null;
                  const when = start
                    ? e.allDay
                      ? format(start, "EEE, MMM d")
                      : format(start, "EEE, MMM d · h:mma")
                    : "—";
                  return (
                    <tr key={e.id} className="hover:bg-bone/40 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-ink/65">{when}</td>
                      <td className="px-4 py-3 font-medium text-navy">{e.title || "—"}</td>
                      <td className="px-4 py-3 text-ink/65 max-w-xs">{e.location || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {months.length === 0 ? (
          <EmptyState
            title="No completed jobs in this window"
            body="Make sure the 📋 CRM + Jobs tab has Date and Status columns filled in."
          />
        ) : (
          months.map(([month, list]) => (
            <div key={month} className="rounded-xl border border-border bg-white overflow-x-auto">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-base text-navy">
                  {format(parseSheetTimestamp(`${month}-01`) ?? new Date(), "MMMM yyyy")}
                </h2>
                <span className="text-xs text-muted">{list.length} jobs</span>
              </div>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted bg-bone/40">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Grill</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {list
                    .sort(
                      (a, b) =>
                        (parseSheetTimestamp(b.date)?.getTime() ?? 0) -
                        (parseSheetTimestamp(a.date)?.getTime() ?? 0)
                    )
                    .map((j) => {
                      const d = parseSheetTimestamp(j.date);
                      return (
                        <tr key={j.rowNumber} className="hover:bg-bone/40">
                          <td className="px-4 py-3 whitespace-nowrap text-ink/65">
                            {d ? format(d, "MMM d") : j.date}
                          </td>
                          <td className="px-4 py-3 font-medium text-navy">
                            {j.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-ink/75">{j.service || "—"}</td>
                          <td className="px-4 py-3 text-ink/75">{j.grillModel || "—"}</td>
                          <td className="px-4 py-3 text-ink/75">{j.source || "—"}</td>
                          <td className="px-4 py-3 text-ink/75">{j.status || "—"}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ))
        )}

        <p className="text-xs text-muted">
          Source of truth:{" "}
          <a
            href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-burgundy"
          >
            CRM sheet ↗
          </a>
        </p>
      </div>
    </>
  );
}
