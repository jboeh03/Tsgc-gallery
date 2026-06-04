import Link from "next/link";
import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import { readCrmRows, type CrmRow } from "@/lib/db/reads";
import { checkDbHealth } from "@/lib/db/supabase";
import { format, formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

// "Closed" = the pipeline has ended; everything else is new/ongoing ("active").
const CLOSED = new Set(["paid", "lost"]);
type Filter = "active" | "closed" | "all";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: { filter?: string; q?: string };
}) {
  const session = await auth();
  const filter: Filter =
    searchParams.filter === "closed" ? "closed" : searchParams.filter === "all" ? "all" : "active";
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const health = await checkDbHealth();

  if (!health.ok) {
    return (
      <>
        <Header email={session?.user?.email} title="CRM" showRange={false} />
        <div className="p-6">
          <EmptyState
            title={health.configured ? "Database error" : "Database not configured"}
            body={health.error}
          />
        </div>
      </>
    );
  }

  const all = await readCrmRows();
  const counts = {
    active: all.filter((r) => !CLOSED.has(r.status)).length,
    closed: all.filter((r) => CLOSED.has(r.status)).length,
    all: all.length,
  };

  const filtered = all
    .filter((r) => (filter === "all" ? true : filter === "closed" ? CLOSED.has(r.status) : !CLOSED.has(r.status)))
    .filter((r) => {
      if (!q) return true;
      const hay = `${r.name} ${r.phone} ${r.email} ${r.zip} ${r.service} ${r.source} ${r.status}`.toLowerCase();
      return hay.includes(q);
    });

  const tabs: { id: Filter; label: string; n: number }[] = [
    { id: "active", label: "New & ongoing", n: counts.active },
    { id: "closed", label: "Closed", n: counts.closed },
    { id: "all", label: "All", n: counts.all },
  ];

  return (
    <>
      <Header email={session?.user?.email} title="CRM" showRange={false} />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`/admin/leads?filter=${t.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={[
                  "rounded-md px-3 py-1.5 text-xs uppercase tracking-wider transition",
                  filter === t.id ? "bg-navy text-bone" : "text-ink/65 hover:bg-bone",
                ].join(" ")}
              >
                {t.label} <span className="opacity-60">({t.n})</span>
              </Link>
            ))}
          </div>
          <form className="flex items-center gap-2" action="" method="get">
            <input type="hidden" name="filter" value={filter} />
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
              Search
            </button>
          </form>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-5">
            <EmptyState title="No records match" />
          </div>
        ) : (
          <>
            {/* Mobile: tappable cards */}
            <ul className="lg:hidden space-y-2.5">
              {filtered.map((r) => (
                <CrmCard key={r.jobId} r={r} />
              ))}
            </ul>

            {/* Desktop: full table */}
            <div className="hidden lg:block rounded-xl border border-border bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted bg-bone/40">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Added</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">ZIP</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Quote</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Last activity</th>
                    <th className="px-4 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => (
                    <Row key={r.jobId} r={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="text-xs text-muted">
          Click any row to edit contact info, quote, status, and notes. Saves write straight to your database · cache refreshes every 60s.
        </p>
      </div>
    </>
  );
}

function CrmCard({ r }: { r: CrmRow }) {
  return (
    <li>
      <Link
        href={`/admin/leads/${r.jobId}`}
        className="block rounded-xl border border-border bg-white p-4 active:bg-bone/50 transition"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-navy truncate">{r.name || "Unnamed lead"}</p>
            <p className="text-sm text-ink/60 truncate">
              {r.phone || "no phone"}
              {r.zip ? ` · ${r.zip}` : ""}
            </p>
          </div>
          <StatusChip s={r.status} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
          <span className="text-ink/70 truncate">{r.service || "—"}</span>
          <span className="text-ink/70 whitespace-nowrap">{r.quoteAmount != null ? `$${r.quoteAmount}` : ""}</span>
        </div>
        {r.lastActivity && (
          <p className="mt-2 text-xs text-ink/55 truncate border-t border-border pt-2">
            {r.lastChannel === "email" ? "✉️ " : "💬 "}
            {r.lastDirection === "outbound" ? "You: " : ""}
            {r.lastActivity}
            {r.lastActivityAt && (
              <span className="text-muted"> · {formatDistanceToNow(new Date(r.lastActivityAt), { addSuffix: true })}</span>
            )}
          </p>
        )}
      </Link>
    </li>
  );
}

function Row({ r }: { r: CrmRow }) {
  const d = r.createdAt ? new Date(r.createdAt) : null;
  return (
    <tr className="hover:bg-bone/40">
      <td className="px-4 py-3 text-ink/60 whitespace-nowrap">
        <Link href={`/admin/leads/${r.jobId}`} className="block">
          {d ? format(d, "MMM d") : "—"}
        </Link>
      </td>
      <td className="px-4 py-3 font-medium text-navy">
        <Link href={`/admin/leads/${r.jobId}`} className="block hover:text-burgundy">
          {r.name || "—"}
        </Link>
      </td>
      <td className="px-4 py-3 text-ink/75">
        <Link href={`/admin/leads/${r.jobId}`} className="block">{r.phone || "—"}</Link>
      </td>
      <td className="px-4 py-3 text-ink/75">
        <Link href={`/admin/leads/${r.jobId}`} className="block">{r.zip || "—"}</Link>
      </td>
      <td className="px-4 py-3 text-ink/75">
        <Link href={`/admin/leads/${r.jobId}`} className="block">{r.service || "—"}</Link>
      </td>
      <td className="px-4 py-3 text-ink/75">
        <Link href={`/admin/leads/${r.jobId}`} className="block">
          {r.quoteAmount != null ? `$${r.quoteAmount}` : "—"}
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link href={`/admin/leads/${r.jobId}`} className="block">
          <StatusChip s={r.status} />
        </Link>
      </td>
      <td className="px-4 py-3 text-ink/75 max-w-[15rem]">
        <Link href={`/admin/leads/${r.jobId}`} className="block">
          {r.lastActivity ? (
            <>
              <span className="block truncate">
                {r.lastChannel === "email" ? "✉️ " : "💬 "}
                {r.lastDirection === "outbound" ? "You: " : ""}
                {r.lastActivity}
              </span>
              {r.lastActivityAt && (
                <span className="text-[11px] text-muted">
                  {formatDistanceToNow(new Date(r.lastActivityAt), { addSuffix: true })}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted">—</span>
          )}
        </Link>
      </td>
      <td className="px-4 py-3 text-right">
        <Link href={`/admin/leads/${r.jobId}`} className="text-xs uppercase tracking-wider text-burgundy hover:underline">
          Edit
        </Link>
      </td>
    </tr>
  );
}

function StatusChip({ s }: { s: string }) {
  const lower = (s || "").toLowerCase();
  let cls = "bg-navy/10 text-navy";
  if (!s) cls = "bg-muted/20 text-muted";
  else if (lower === "new") cls = "bg-burgundy/15 text-burgundy";
  else if (lower.includes("schedul") || lower === "booked") cls = "bg-blue-100 text-blue-700";
  else if (lower === "completed" || lower === "paid") cls = "bg-emerald-100 text-emerald-700";
  else if (lower === "lost") cls = "bg-muted/30 text-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {s || "—"}
    </span>
  );
}
