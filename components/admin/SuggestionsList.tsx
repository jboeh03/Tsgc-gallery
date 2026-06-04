"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Suggestion } from "@/lib/admin/suggestions";

export default function SuggestionsList({ suggestions }: { suggestions: Suggestion[] }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const key = (s: Suggestion) => `${s.jobId}:${s.kind}`;
  const visible = suggestions.filter((s) => !dismissed.has(key(s)));

  async function approve(s: Suggestion) {
    const k = key(s);
    setBusy(k);
    setError(null);
    try {
      const res = await fetch("/api/admin/suggestions/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId: s.jobId, kind: s.kind }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed (${res.status})`);
      }
      setDismissed((d) => new Set(d).add(k));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
        <p className="font-display text-lg text-navy">All caught up 🎉</p>
        <p className="mt-2 text-sm text-ink/60">No CRM updates need your attention right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {visible.map((s) => {
        const k = key(s);
        return (
          <div key={k} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-4">
            <div className="min-w-0">
              <p className="font-medium text-navy">{s.title}</p>
              <p className="text-sm text-ink/60">{s.detail}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {s.actionable ? (
                <button
                  type="button"
                  onClick={() => approve(s)}
                  disabled={busy === k}
                  className="rounded-md bg-burgundy px-3.5 py-2 text-xs uppercase tracking-wider text-bone hover:bg-burgundy/90 disabled:opacity-40"
                >
                  {busy === k ? "…" : "Approve"}
                </button>
              ) : (
                <a
                  href="/admin/leads"
                  className="rounded-md border border-navy px-3.5 py-2 text-xs uppercase tracking-wider text-navy hover:bg-navy hover:text-bone"
                >
                  Review
                </a>
              )}
              <button
                type="button"
                onClick={() => setDismissed((d) => new Set(d).add(k))}
                className="text-xs uppercase tracking-wider text-muted hover:text-ink"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
