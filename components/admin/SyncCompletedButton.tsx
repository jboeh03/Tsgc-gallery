"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncCompletedButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/backfill-completed", { method: "POST" });
      const d = (await res.json()) as { created?: number; matched?: number; skipped?: number; total?: number; error?: string };
      if (!res.ok) throw new Error(d.error || "failed");
      setMsg(`Imported ${d.created ?? 0} (${d.matched ?? 0} matched, ${d.skipped ?? 0} already in CRM) of ${d.total ?? 0} calendar jobs.`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-md bg-navy px-3 py-1.5 text-xs uppercase tracking-wider text-bone hover:bg-navy-700 disabled:opacity-40"
      >
        {busy ? "Syncing…" : "Sync completed → CRM"}
      </button>
      {msg && <span className="text-xs text-ink/65">{msg}</span>}
    </div>
  );
}
