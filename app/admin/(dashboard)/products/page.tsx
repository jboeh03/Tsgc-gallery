import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import KpiCard from "@/components/admin/KpiCard";
import EmptyState from "@/components/admin/EmptyState";
import { readAffiliateClicks } from "@/lib/db/reads";
import { checkDbHealth } from "@/lib/db/supabase";
import { resolveRange, inRange, parseSheetTimestamp, formatRangeLabel } from "@/lib/admin/range";
import { PRODUCTS } from "@/lib/products";
import { format } from "date-fns";

export default async function AffiliatePage({
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
        <Header email={session?.user?.email} title="Affiliate" showRange={false} />
        <div className="p-6">
          <EmptyState
            title={health.configured ? "Database error" : "Database not configured"}
            body={health.error}
          />
        </div>
      </>
    );
  }

  const clicks = await readAffiliateClicks();
  const inWindow = clicks.filter((c) => inRange(c.timestamp, range));

  const byProduct = new Map<string, number>();
  for (const c of inWindow) {
    byProduct.set(c.productId, (byProduct.get(c.productId) ?? 0) + 1);
  }
  const productCount = PRODUCTS.length;
  const productsWithClicks = byProduct.size;

  const productRows = PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    affiliate: p.affiliate,
    clicks: byProduct.get(p.id) ?? 0,
  })).sort((a, b) => b.clicks - a.clicks);

  const recent = [...inWindow]
    .sort(
      (a, b) =>
        (parseSheetTimestamp(b.timestamp)?.getTime() ?? 0) -
        (parseSheetTimestamp(a.timestamp)?.getTime() ?? 0)
    )
    .slice(0, 20);

  return (
    <>
      <Header email={session?.user?.email} title="Affiliate" />
      <div className="p-6 space-y-6">
        <p className="text-xs text-muted">{formatRangeLabel(range, range.id as never)}</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Clicks (window)" value={inWindow.length} />
          <KpiCard label="Products listed" value={productCount} />
          <KpiCard
            label="Products with clicks"
            value={productsWithClicks}
            hint={`${productCount > 0 ? Math.round((productsWithClicks / productCount) * 100) : 0}% of catalog`}
          />
        </div>

        <div className="rounded-xl border border-border bg-white overflow-x-auto">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-display text-base text-navy">By product</h2>
          </div>
          {productRows.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No products in catalog" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted bg-bone/40">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Affiliate</th>
                  <th className="px-4 py-3 font-semibold tabular-nums">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productRows.map((r) => (
                  <tr key={r.id} className="hover:bg-bone/40">
                    <td className="px-4 py-3 font-medium text-navy">{r.name}</td>
                    <td className="px-4 py-3 text-ink/70 text-xs uppercase tracking-wider">
                      {r.affiliate}
                    </td>
                    <td className="px-4 py-3 text-ink/85 tabular-nums">{r.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-border bg-white overflow-x-auto">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-display text-base text-navy">Recent click stream</h2>
          </div>
          {recent.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No clicks yet"
                body="Clicks start logging the moment the Apps Script is redeployed with the affiliate_click handler. See Settings for the redeploy steps."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted bg-bone/40">
                <tr>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">When</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Referer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((c) => {
                  const d = parseSheetTimestamp(c.timestamp);
                  return (
                    <tr key={c.id} className="hover:bg-bone/40">
                      <td className="px-4 py-3 text-ink/65 whitespace-nowrap">
                        {d ? format(d, "MMM d, h:mma") : c.timestamp}
                      </td>
                      <td className="px-4 py-3 text-ink/80">{c.productName || c.productId}</td>
                      <td className="px-4 py-3 text-ink/55 max-w-xs truncate">{c.referer || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
