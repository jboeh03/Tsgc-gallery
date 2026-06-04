import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import KpiCard from "@/components/admin/KpiCard";
import EmptyState from "@/components/admin/EmptyState";
import CalendarJobList from "@/components/admin/CalendarJobList";
import SyncCompletedButton from "@/components/admin/SyncCompletedButton";
import { listCalendarEvents, type CalendarEvent } from "@/lib/calendar";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

function fmtWhen(e: CalendarEvent): string {
  if (!e.start) return "—";
  const d = new Date(e.allDay ? `${e.start}T12:00:00` : e.start);
  return e.allDay ? format(d, "EEE, MMM d") : format(d, "EEE, MMM d · h:mma");
}

export default async function JobsPage() {
  const session = await auth();
  const now = Date.now();

  // Everything is driven by the TSGC Schedule calendar now.
  const [upcoming, pastAsc] = await Promise.all([
    listCalendarEvents(new Date(now).toISOString(), new Date(now + 30 * 86_400_000).toISOString()),
    listCalendarEvents(new Date(now - 150 * 86_400_000).toISOString(), new Date(now).toISOString()),
  ]);
  const past = [...pastAsc].reverse(); // most-recent-first

  const weekAgo = now - 7 * 86_400_000;
  const recentCount = past.filter((e) => e.start && new Date(e.start).getTime() >= weekAgo).length;
  const initialCount = Math.max(recentCount, 5);

  return (
    <>
      <Header email={session?.user?.email} title="Jobs" showRange={false} />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Upcoming" value={upcoming.length} hint="next 30 days" />
          <KpiCard label="Completed" value={past.length} hint="on the calendar" />
          <KpiCard label="This week" value={recentCount} hint="last 7 days" />
        </div>

        {/* Upcoming — future calendar events */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-base text-navy">Upcoming · TSGC Schedule</h2>
            <span className="text-xs text-muted">{upcoming.length} on the calendar</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Nothing upcoming on the calendar"
                body="Add jobs to the TSGC Schedule calendar (or schedule from the inbox) and they'll show here."
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
                {upcoming.map((e) => (
                  <tr key={e.id} className="hover:bg-bone/40 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-ink/65">{fmtWhen(e)}</td>
                    <td className="px-4 py-3 font-medium text-navy">{e.title || "—"}</td>
                    <td className="px-4 py-3 text-ink/65 max-w-xs">{e.location || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Completed — past calendar events, last week by default + see all */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base text-navy">Completed · TSGC Schedule</h2>
            <SyncCompletedButton />
          </div>
          <CalendarJobList events={past} initialCount={initialCount} />
        </div>

        <p className="text-xs text-muted">
          Pulled live from your <strong className="text-ink">TSGC Schedule</strong> Google Calendar.
        </p>
      </div>
    </>
  );
}
