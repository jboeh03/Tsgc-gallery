"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MarketingDraftRow } from "@/lib/db/types";

export default function MarketingDrafts({ drafts }: { drafts: MarketingDraftRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function act(id: string, action: "used" | "dismiss") {
    setBusy(id);
    try {
      await fetch("/api/admin/marketing-drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (drafts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-base text-navy">
        Weekly post drafts <span className="text-sm font-normal text-muted">({drafts.length} from finished jobs)</span>
      </h2>
      {drafts.map((d) => (
        <div key={d.id} className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-burgundy">Social post · review &amp; post</span>
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider">
              <button
                type="button"
                onClick={async () => { await navigator.clipboard.writeText(d.body || "").catch(() => {}); setCopied(d.id); setTimeout(() => setCopied(null), 1500); }}
                className="text-burgundy hover:underline"
              >
                {copied === d.id ? "Copied ✓" : "Copy"}
              </button>
              <button type="button" onClick={() => act(d.id, "used")} disabled={busy === d.id} className="text-navy hover:underline disabled:opacity-40">Posted</button>
              <button type="button" onClick={() => act(d.id, "dismiss")} disabled={busy === d.id} className="text-muted hover:text-ink disabled:opacity-40">Dismiss</button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm text-ink leading-relaxed">{d.body}</pre>
        </div>
      ))}
    </div>
  );
}
