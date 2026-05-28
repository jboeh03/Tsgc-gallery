import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import LeadsTabs from "@/components/admin/LeadsTabs";
import { readLeads, checkSheetHealth, SHEET_ID, type Lead } from "@/lib/admin/sheets";
import { resolveRange, inRange, parseSheetTimestamp, formatRangeLabel } from "@/lib/admin/range";
import { qualifyLeadSync, tierBadgeColor, classifyTier } from "@/lib/leads/qualify";
import type { LeadTier } from "@/lib/leads/types";
import { format } from "date-fns";

type LeadWithScore = Lead & {
  computedScore: number;
  computedTier: LeadTier;
  /** "sheet" if the row already had a score; "computed" if we just scored it for display. */
  scoreSource: "sheet" | "computed";
};

function deriveLeadScore(l: Lead): LeadWithScore {
  const sheetScore = parseInt(l.score, 10);
  if (Number.isFinite(sheetScore) && sheetScore >= 0) {
    const tier = (l.tier || "").toLowerCase();
    const computedTier: LeadTier =
      tier === "hot" || tier === "warm" || tier === "cool" || tier === "cold"
        ? (tier as LeadTier)
        : classifyTier(sheetScore);
    return { ...l, computedScore: sheetScore, computedTier, scoreSource: "sheet" };
  }
  // Older row without score columns — recompute on the fly (sync — no
  // returning-customer lookup since we don't want a Sheets fan-out here).
  const q = qualifyLeadSync(
    {
      name: l.name || null,
      phone: l.phone || null,
      email: l.email || null,
      zip: l.zip || null,
      address: null,
      grillDescription: l.grillModel || null,
      estimatedPriceLow: null,
      estimatedPriceHigh: null,
      agreedPriceUsd: null,
      services: l.services || null,
      notes: l.notes || null,
    },
    "unknown"
  );
  return { ...l, computedScore: q.score, computedTier: q.tier, scoreSource: "computed" };
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { range?: string; q?: string; sort?: string };
}) {
  const session = await auth();
  const range = resolveRange(searchParams.range);
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const sort = (searchParams.sort ?? "recent").toLowerCase();
  const health = await checkSheetHealth();

  if (!health.ok) {
    return (
      <>
        <Header email={session?.user?.email} title="Leads" showRange={false} />
        <LeadsTabs current="all" />
        <div className="p-6">
          <EmptyState
            title={health.configured ? "Sheets error" : "Sheets not configured"}
            body={health.error}
          />
        </div>
      </>
    );
  }

  const all = await readLeads();
  const enriched = all
    .filter((l) => inRange(l.timestamp, range))
    .filter((l) => {
      if (!q) return true;
      const hay =
        `${l.name} ${l.phone} ${l.email} ${l.zip} ${l.services} ${l.source} ${l.notes}`.toLowerCase();
      return hay.includes(q);
    })
    .map(deriveLeadScore);

  const filtered =
    sort === "score"
      ? enriched.sort((a, b) => b.computedScore - a.computedScore)
      : enriched.sort(
          (a, b) =>
            (parseSheetTimestamp(b.timestamp)?.getTime() ?? 0) -
            (parseSheetTimestamp(a.timestamp)?.getTime() ?? 0)
        );

  return (
    <>
      <Header email={session?.user?.email} title="Leads" />
      <LeadsTabs current="all" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {formatRangeLabel(range, range.id as never)} ·{" "}
            <strong className="text-ink">{filtered.length}</strong> shown
            {q && (
              <>
                {" "}
                · filtered by &ldquo;<span className="text-burgundy">{q}</span>&rdquo;
              </>
            )}
          </p>
          <form className="flex items-center gap-2" action="" method="get">
            <input type="hidden" name="range" value={range.id} />
            <select
              name="sort"
              defaultValue={sort}
              className="text-sm rounded-md border border-border px-2 py-1.5 bg-white"
              aria-label="Sort leads"
            >
              <option value="recent">Most recent</option>
              <option value="score">Highest score</option>
            </select>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search name, phone, ZIP…"
              className="text-sm rounded-md border border-border px-3 py-1.5 bg-white w-64"
            />
            <button
              type="submit"
              className="text-xs uppercase tracking-wider text-bone bg-navy hover:bg-navy-700 rounded-md px-3 py-1.5"
            >
              Apply
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-white overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No leads match" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted bg-bone/40">
                <tr>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">When</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">ZIP</th>
                  <th className="px-4 py-3 font-semibold">Services</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((l) => {
                  const d = parseSheetTimestamp(l.timestamp);
                  return (
                    <tr key={l.rowNumber} className="hover:bg-bone/40">
                      <td className="px-4 py-3 text-ink/60 whitespace-nowrap">
                        {d ? format(d, "MMM d, h:mma") : l.timestamp}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <TierBadge
                          tier={l.computedTier}
                          score={l.computedScore}
                          isComputed={l.scoreSource === "computed"}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-navy">{l.name || "—"}</td>
                      <td className="px-4 py-3 text-ink/75">
                        {l.phone ? (
                          <a className="hover:text-burgundy" href={`tel:${l.phone}`}>
                            {l.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink/75">
                        {l.email ? (
                          <a className="hover:text-burgundy" href={`mailto:${l.email}`}>
                            {l.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink/75">{l.zip || "—"}</td>
                      <td className="px-4 py-3 text-ink/75">{l.services || "—"}</td>
                      <td className="px-4 py-3 text-ink/75">{l.source || "—"}</td>
                      <td className="px-4 py-3">
                        <StatusChip s={l.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-muted">
          Source of truth:{" "}
          <a
            href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-burgundy"
          >
            CRM sheet ↗
          </a>{" "}
          · Cache refreshes every 60s.
        </p>
      </div>
    </>
  );
}

function TierBadge({
  tier,
  score,
  isComputed,
}: {
  tier: LeadTier;
  score: number;
  isComputed: boolean;
}) {
  const c = tierBadgeColor(tier);
  return (
    <span
      title={
        isComputed
          ? "Score recomputed at display time (older row, no stored score)"
          : "Score written at intake"
      }
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}
    >
      <span>{c.label}</span>
      <span className="opacity-75 tabular-nums">{score}</span>
      {isComputed && <span className="opacity-60">·</span>}
    </span>
  );
}

function StatusChip({ s }: { s: string }) {
  const lower = (s || "").toLowerCase();
  let cls = "bg-navy/10 text-navy";
  if (!s) cls = "bg-muted/20 text-muted";
  else if (lower.includes("new")) cls = "bg-burgundy/15 text-burgundy";
  else if (lower.includes("schedul")) cls = "bg-blue-100 text-blue-700";
  else if (lower.includes("complet") || lower.includes("done") || lower.includes("paid"))
    cls = "bg-emerald-100 text-emerald-700";
  else if (lower.includes("lost") || lower.includes("dead"))
    cls = "bg-muted/30 text-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {s || "—"}
    </span>
  );
}
