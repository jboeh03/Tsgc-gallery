import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import KpiCard from "@/components/admin/KpiCard";
import { readLeads, readJobs } from "@/lib/db/reads";
import { checkDbHealth } from "@/lib/db/supabase";
import { resolveRange, inRange, formatRangeLabel } from "@/lib/admin/range";

// Mirrors the PROMO_CODES table in integrations/apps-script-endpoint.js
const KNOWN_PROMOS: Record<string, string> = {
  MOTHERSDAY2026: "Mother's Day 2026 Promo",
  SUMMER2026: "Summer 2026 Promo",
  MEMORIAL2026: "Memorial Day 2026",
  LABORDAY2026: "Labor Day 2026",
  GIVEAWAY2026: "Weber Spirit II Giveaway 2026",
  JASON10: "Jason Referral — 10% off",
  FACEBOOK10: "Facebook Promo — 10% off",
};

const COMPLETED = new Set(["completed", "done", "paid", "closed", "complete"]);

export default async function CampaignsPage({
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
        <Header email={session?.user?.email} title="Campaigns" showRange={false} />
        <div className="p-6">
          <EmptyState
            title={health.configured ? "Sheets error" : "Sheets not configured"}
            body={health.error}
          />
        </div>
      </>
    );
  }

  const [leads, jobs] = await Promise.all([readLeads(), readJobs()]);
  const leadsIn = leads.filter((l) => inRange(l.timestamp, range));
  const jobsIn = jobs.filter((j) => inRange(j.date, range));

  // Aggregate by promo code
  type Row = { code: string; label: string; leads: number; booked: number };
  const byCode = new Map<string, Row>();
  function ensure(code: string): Row {
    const c = code.toUpperCase();
    if (!byCode.has(c)) {
      byCode.set(c, {
        code: c,
        label: KNOWN_PROMOS[c] || `Custom: ${c}`,
        leads: 0,
        booked: 0,
      });
    }
    return byCode.get(c)!;
  }
  for (const l of leadsIn) {
    const code = (l.promoCode || "").replace(/^.*?:\s*/, "").trim();
    if (!code) continue;
    ensure(code).leads += 1;
  }
  for (const j of jobsIn) {
    if (!COMPLETED.has(j.status.toLowerCase())) continue;
    const notesPromo = (j.notes || "").match(/promo:\s*([A-Z0-9]+)/i)?.[1];
    if (!notesPromo) continue;
    ensure(notesPromo).booked += 1;
  }
  const rows = Array.from(byCode.values()).sort((a, b) => b.leads - a.leads);
  const totalPromoLeads = rows.reduce((s, r) => s + r.leads, 0);
  const totalBooked = rows.reduce((s, r) => s + r.booked, 0);

  return (
    <>
      <Header email={session?.user?.email} title="Campaigns" />
      <div className="p-6 space-y-6">
        <p className="text-xs text-muted">{formatRangeLabel(range, range.id as never)}</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Leads w/ promo code" value={totalPromoLeads} />
          <KpiCard label="Booked from promos" value={totalBooked} />
          <KpiCard
            label="Conversion (promos)"
            value={
              totalPromoLeads > 0
                ? `${Math.round((totalBooked / totalPromoLeads) * 100)}%`
                : "—"
            }
          />
        </div>

        <div className="rounded-xl border border-border bg-white overflow-x-auto">
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No promo codes used in this window"
                body="Add a code to PROMO_CODES in integrations/apps-script-endpoint.js to track a new campaign."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted bg-bone/40">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold tabular-nums">Leads</th>
                  <th className="px-4 py-3 font-semibold tabular-nums">Booked</th>
                  <th className="px-4 py-3 font-semibold tabular-nums">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.code} className="hover:bg-bone/40">
                    <td className="px-4 py-3">
                      <code className="bg-bone px-2 py-0.5 rounded text-xs">{r.code}</code>
                    </td>
                    <td className="px-4 py-3 text-ink/85">{r.label}</td>
                    <td className="px-4 py-3 text-ink/75 tabular-nums">{r.leads}</td>
                    <td className="px-4 py-3 text-ink/75 tabular-nums">{r.booked}</td>
                    <td className="px-4 py-3 text-ink/75 tabular-nums">
                      {r.leads > 0 ? `${Math.round((r.booked / r.leads) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-border bg-bone/40 p-5">
          <p className="text-xs uppercase tracking-wider text-burgundy font-semibold">
            How this tracks
          </p>
          <p className="mt-2 text-sm text-ink/75">
            The Apps Script attaches a normalized promo label to each lead in the{" "}
            <code className="bg-white px-1.5 rounded">Promo Code</code> column.
            Bookings are matched by reading <code className="bg-white px-1.5 rounded">Notes</code>{" "}
            on the CRM tab for the <code className="bg-white px-1.5 rounded">Promo: CODE</code>{" "}
            pattern. Update the CRM &quot;Notes&quot; field on a job to credit a sale to a code.
            Giveaway entries land in the <code className="bg-white px-1.5 rounded">🎁 Giveaway Entries</code> tab
            of the same sheet and are tracked separately from leads.
          </p>
        </div>
      </div>
    </>
  );
}
