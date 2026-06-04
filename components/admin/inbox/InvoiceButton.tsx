"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Create + send a Stripe invoice for the linked job and text the customer the
 * pay link. Requires an explicit amount — this is the only path that collects
 * real money, so it's deliberately a two-step action.
 */
export default function InvoiceButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function send() {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0 || state === "sending") return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/admin/invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId, amountUsd: amt }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Failed (${res.status})`);
      setLink(j.hostedUrl ?? null);
      setState("done");
      router.refresh();
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  if (state === "done") {
    return (
      <div className="text-xs text-emerald-700">
        ✓ Invoice sent &amp; texted.
        {link && (
          <>
            {" "}
            <a href={link} target="_blank" rel="noopener noreferrer" className="underline">
              view
            </a>
          </>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-navy px-3 py-2 text-xs uppercase tracking-wider text-navy hover:bg-navy hover:text-bone transition"
      >
        $ Send invoice
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-[11px] uppercase tracking-wider text-muted">
        Amount (USD)
        <div className="mt-1 flex items-center gap-1">
          <span className="text-ink/60">$</span>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="349"
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </div>
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={send}
          disabled={!amount || state === "sending"}
          className="rounded-md bg-burgundy px-3 py-1.5 text-xs uppercase tracking-wider text-bone hover:bg-burgundy/90 disabled:opacity-40"
        >
          {state === "sending" ? "Sending…" : "Send invoice"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs uppercase tracking-wider text-muted hover:text-ink">
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
