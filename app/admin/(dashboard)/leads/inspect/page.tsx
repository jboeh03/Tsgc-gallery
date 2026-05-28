import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import LeadsTabs from "@/components/admin/LeadsTabs";
import { readLeads, checkSheetHealth, SHEET_ID, type Lead } from "@/lib/admin/sheets";
import { parseSheetTimestamp } from "@/lib/admin/range";
import { qualifyLead, tierBadgeColor } from "@/lib/leads/qualify";
import { proximityLabel } from "@/lib/leads/serviceArea";
import { valueLabel } from "@/lib/leads/valueEstimator";
import type { LeadInput, QualifiedLead } from "@/lib/leads/types";
import { format } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Dry-run qualifier inspector — picks the most recent N leads from
 * the 🌐 Website Leads tab, runs each through qualifyLead() (with the
 * full async returning-customer lookup), and shows the per-dimension
 * breakdown plus the exact SMS body + email subject that WOULD be
 * sent if this lead came in fresh today.
 *
 * Zero side effects: no Apps Script call, no sheet write, no SMS,
 * no customer email. Just read + score + display. Safe to refresh.
 *
 * Defaults to the 5 most recent; ?count=N overrides (capped at 25 so
 * we don't accidentally fan out 100+ Sheets API calls per page load).
 */

const DEFAULT_COUNT = 5;
const MAX_COUNT = 25;

function leadInputFrom(l: Lead): LeadInput {
  return {
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
  };
}

function smsBodyFor(name: string, phone: string, services: string, qualTag: string): string {
  return [`${qualTag} ${name || "(no name)"}`, phone, services.split(",")[0]?.trim() || ""]
    .filter(Boolean)
    .join(" · ");
}

function emailSubjectFor(name: string, services: string, qualTag: string): string {
  return `${qualTag} New Website Lead: ${name || "(no name)"} — ${services.split(",")[0]?.trim() || ""}`;
}

export default async function LeadsInspectPage({
  searchParams,
}: {
  searchParams: { count?: string };
}) {
  const session = await auth();
  const health = await checkSheetHealth();

  const rawCount = parseInt(searchParams.count ?? "", 10);
  const count = Math.min(
    MAX_COUNT,
    Number.isFinite(rawCount) && rawCount > 0 ? rawCount : DEFAULT_COUNT
  );

  if (!health.ok) {
    return (
      <>
        <Header email={session?.user?.email} title="Leads" showRange={false} />
        <LeadsTabs current="inspect" />
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
  const recent = all
    .slice()
    .sort(
      (a, b) =>
        (parseSheetTimestamp(b.timestamp)?.getTime() ?? 0) -
        (parseSheetTimestamp(a.timestamp)?.getTime() ?? 0)
    )
    .slice(0, count);

  // Run the FULL async qualifier so returning-customer detection
  // actually queries the CRM + legacy Squarespace sheet (vs the
  // shortcut path on /admin/leads which uses "unknown" to avoid
  // fanning out per-row lookups across hundreds of rows).
  const scored: Array<{ lead: Lead; qualification: QualifiedLead }> = await Promise.all(
    recent.map(async (lead) => ({
      lead,
      qualification: await qualifyLead(leadInputFrom(lead)),
    }))
  );

  return (
    <>
      <Header email={session?.user?.email} title="Leads" showRange={false} />
      <LeadsTabs current="inspect" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">
              Running the lead qualifier on the{" "}
              <strong className="text-ink">{scored.length}</strong> most recent
              lead{scored.length === 1 ? "" : "s"}. No SMS sent, no row written,
              no customer emailed — pure dry-run.
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              Returning-customer lookup queries the live CRM tabs and the
              legacy Squarespace sheet.
            </p>
          </div>
          <form className="flex items-center gap-2" action="" method="get">
            <label className="text-xs uppercase tracking-wider text-muted">
              Show
            </label>
            <input
              type="number"
              name="count"
              defaultValue={count}
              min={1}
              max={MAX_COUNT}
              className="text-sm rounded-md border border-border px-2 py-1.5 bg-white w-20"
            />
            <button
              type="submit"
              className="text-xs uppercase tracking-wider text-bone bg-navy hover:bg-navy-700 rounded-md px-3 py-1.5"
            >
              Apply
            </button>
          </form>
        </div>

        {scored.length === 0 ? (
          <EmptyState title="No leads in the sheet yet" />
        ) : (
          <div className="space-y-4">
            {scored.map(({ lead, qualification }) => (
              <LeadCard key={lead.rowNumber} lead={lead} q={qualification} />
            ))}
          </div>
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
          </a>{" "}
          · Algorithm: <code className="text-ink">lib/leads/qualify.ts</code> ·{" "}
          ZIPs: <code className="text-ink">lib/leads/serviceArea.ts</code>
        </p>
      </div>
    </>
  );
}

function LeadCard({ lead, q }: { lead: Lead; q: QualifiedLead }) {
  const d = parseSheetTimestamp(lead.timestamp);
  const tierColor = tierBadgeColor(q.tier);
  const qualTag = `[${q.tier.toUpperCase()} ${q.score}]`;
  const services = lead.services || "";
  const smsBody = smsBodyFor(lead.name, lead.phone, services, qualTag);
  const emailSubject = emailSubjectFor(lead.name, services, qualTag);

  // Pull through what the sheet has stored vs what we just computed,
  // so Jeff can spot drift between the at-intake score and the current
  // algorithm.
  const storedScore = parseInt(lead.score, 10);
  const driftLabel =
    Number.isFinite(storedScore) && storedScore !== q.score
      ? `(sheet has ${storedScore})`
      : null;

  return (
    <article className="rounded-xl border border-border bg-white overflow-hidden">
      <header className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-3 bg-bone/30">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tierColor.bg} ${tierColor.text}`}
          >
            <span>{tierColor.label}</span>
            <span className="opacity-80 tabular-nums">{q.score}</span>
          </span>
          {driftLabel && (
            <span className="text-[11px] text-muted" title="Stored score differs from currently-computed score">
              {driftLabel}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-navy truncate">
            {lead.name || "(no name)"}
          </h3>
          <p className="text-xs text-muted">
            {d ? format(d, "MMM d, yyyy h:mma") : lead.timestamp || "no timestamp"}
            {lead.source ? ` · ${lead.source}` : ""}
          </p>
        </div>
      </header>

      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2 p-5">
        <section>
          <h4 className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-2">
            Parsed fields
          </h4>
          <dl className="text-sm space-y-1.5">
            <Field label="Phone" value={lead.phone} kind="phone" />
            <Field label="Email" value={lead.email} kind="email" />
            <Field label="ZIP" value={lead.zip} />
            <Field label="Grill" value={lead.grillModel} />
            <Field label="Services" value={lead.services} />
            <Field label="Notes" value={lead.notes} mono={false} truncate />
          </dl>
        </section>

        <section>
          <h4 className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-2">
            Score breakdown
          </h4>
          <ul className="text-sm space-y-2">
            <ScoreRow
              label="Proximity"
              detail={proximityLabel(q.breakdown.proximity.tier)}
              points={q.breakdown.proximity.points}
              max={30}
            />
            <ScoreRow
              label="Value tier"
              detail={
                valueLabel(q.breakdown.value.tier) +
                (q.breakdown.value.estimatedJobUsdLow
                  ? ` · est $${q.breakdown.value.estimatedJobUsdLow}-${q.breakdown.value.estimatedJobUsdHigh}`
                  : "")
              }
              points={q.breakdown.value.points}
              max={30}
            />
            <ScoreRow
              label="Customer type"
              detail={q.breakdown.customer.type}
              points={q.breakdown.customer.points}
              max={15}
            />
            <ScoreRow
              label="Completeness"
              detail={
                q.breakdown.completeness.missing.length > 0
                  ? `missing: ${q.breakdown.completeness.missing.join(", ")}`
                  : "all fields filled"
              }
              points={q.breakdown.completeness.points}
              max={25}
            />
          </ul>
        </section>
      </div>

      <footer className="border-t border-border bg-bone/20 px-5 py-4 space-y-2.5">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-1">
            📱 SMS that would fire (→ 5135784019@vtext.com)
          </div>
          <code className="block text-xs text-ink bg-white border border-border rounded-md px-3 py-2 break-all">
            {smsBody}
          </code>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-1">
            ✉ Email subject (→ jeff@cincygrillcleaning.com)
          </div>
          <code className="block text-xs text-ink bg-white border border-border rounded-md px-3 py-2 break-all">
            {emailSubject}
          </code>
        </div>
      </footer>
    </article>
  );
}

function Field({
  label,
  value,
  kind,
  truncate,
}: {
  label: string;
  value: string;
  kind?: "phone" | "email";
  mono?: boolean;
  truncate?: boolean;
}) {
  if (!value) {
    return (
      <div className="grid grid-cols-[5.5rem_1fr] gap-2">
        <dt className="text-muted">{label}</dt>
        <dd className="text-muted/60 italic">—</dd>
      </div>
    );
  }
  let display: React.ReactNode = value;
  if (kind === "phone") display = <a className="hover:text-burgundy" href={`tel:${value}`}>{value}</a>;
  if (kind === "email") display = <a className="hover:text-burgundy" href={`mailto:${value}`}>{value}</a>;
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-ink ${truncate ? "truncate" : ""}`}>{display}</dd>
    </div>
  );
}

function ScoreRow({
  label,
  detail,
  points,
  max,
}: {
  label: string;
  detail: string;
  points: number;
  max: number;
}) {
  const pct = Math.max(0, Math.min(100, (points / max) * 100));
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink">
          {label}{" "}
          <span className="text-muted text-xs">— {detail}</span>
        </span>
        <span className="tabular-nums text-ink/80 text-xs whitespace-nowrap">
          {points} <span className="text-muted">/ {max}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-bone overflow-hidden">
        <div
          className="h-full bg-navy"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </li>
  );
}
