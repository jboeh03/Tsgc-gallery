"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BrandIndexEntry } from "@/lib/grill-repair-brands";

/**
 * Type-to-find grill brand selector for the /grill-repair hub. Filters the
 * known brands as the customer types; Enter or click jumps to that brand's
 * repair page. Falls back to /quote for anything not listed.
 */
export default function GrillBrandFinder({ brands }: { brands: BrandIndexEntry[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return brands.filter((b) => b.name.toLowerCase().includes(term)).slice(0, 6);
  }, [q, brands]);

  return (
    <div className="relative max-w-xl">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (matches[0]) router.push(matches[0].href);
            else router.push("/quote");
          }
        }}
        placeholder="Start typing your grill brand — Weber, Napoleon, Traeger…"
        aria-label="Find your grill brand"
        className="w-full rounded-md border border-border bg-white px-4 py-3.5 text-ink shadow-sm focus:border-navy focus:outline-none"
      />
      {q.trim() ? (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-border bg-white shadow-lg">
          {matches.length > 0 ? (
            matches.map((b) => (
              <Link
                key={b.href}
                href={b.href}
                className="flex items-center justify-between px-4 py-3 text-sm text-ink hover:bg-bone/60"
              >
                <span className="font-medium">{b.name}</span>
                <span className="text-xs uppercase tracking-wider text-muted">Repair guide →</span>
              </Link>
            ))
          ) : (
            <Link href="/quote" className="block px-4 py-3 text-sm text-ink hover:bg-bone/60">
              Don&apos;t see your brand? <span className="font-semibold text-burgundy">Get a free quote →</span>
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
