"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BacklogRow } from "@/lib/db/types";

const PRIORITY_CLS: Record<string, string> = {
  high: "bg-burgundy/15 text-burgundy",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-navy/10 text-navy",
};
const CATEGORY_CLS: Record<string, string> = {
  feature: "bg-emerald-100 text-emerald-700",
  growth: "bg-blue-100 text-blue-700",
  improvement: "bg-navy/10 text-navy",
  bug: "bg-red-100 text-red-700",
};

export default function BacklogList({ items }: { items: BacklogRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "done" | "dismiss") {
    setBusy(id);
    try {
      await fetch("/api/admin/backlog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
        <p className="font-display text-lg text-navy">Backlog is clear</p>
        <p className="mt-2 text-sm text-ink/60">The PM agent files new ideas here each week.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.id} className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PRIORITY_CLS[it.priority || "low"] || PRIORITY_CLS.low}`}>
                  {it.priority || "low"}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_CLS[it.category || "improvement"] || CATEGORY_CLS.improvement}`}>
                  {it.category || "improvement"}
                </span>
                <span className="font-medium text-navy">{it.title}</span>
              </div>
              {it.detail && <p className="mt-1.5 text-sm text-ink/70">{it.detail}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => act(it.id, "done")}
                disabled={busy === it.id}
                className="rounded-md bg-navy px-3 py-1.5 text-xs uppercase tracking-wider text-bone hover:bg-navy/90 disabled:opacity-40"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => act(it.id, "dismiss")}
                disabled={busy === it.id}
                className="text-xs uppercase tracking-wider text-muted hover:text-ink"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
