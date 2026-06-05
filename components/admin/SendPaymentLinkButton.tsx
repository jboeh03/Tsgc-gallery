"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Send a Stripe payment link for a (reviewed) Weber request. Reuses the admin
 * invoice endpoint — it finalizes + emails the customer a hosted pay link and
 * marks the job invoiced. On payment, the webhook schedules the job.
 */
export default function SendPaymentLinkButton({
  jobId,
  amount,
}: {
  jobId: string;
  amount: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  async function send() {
    if (amount == null) { setMsg("Set a quote amount first."); return; }
    if (!confirm(`Send a payment link for $${amount}? This emails the customer a Stripe pay link.`)) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId, amountUsd: amount, description: "Weber deep clean" }),
      });
      const d = (await res.json()) as { hostedUrl?: string; error?: string };
      if (!res.ok) throw new Error(d.error || "Failed to send");
      setMsg("Payment link sent ✓");
      setUrl(d.hostedUrl ?? null);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="rounded-md bg-burgundy px-4 py-2 text-xs uppercase tracking-wider text-bone hover:bg-burgundy-700 disabled:opacity-40"
      >
        {busy ? "Sending…" : `Send payment link${amount != null ? ` · $${amount}` : ""}`}
      </button>
      {msg && <span className="text-xs text-ink/70">{msg}</span>}
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-burgundy underline">
          Open pay link ↗
        </a>
      )}
    </div>
  );
}
