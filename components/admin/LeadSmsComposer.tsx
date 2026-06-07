"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Draft + one-click text to a lead from the CRM detail view. Prefills the
 * AI-suggested draft (editable). Send is gated until A2P clears (sendEnabled);
 * the button shows a "paused" state and the endpoint enforces the same gate.
 */
export default function LeadSmsComposer({
  contactId,
  phone,
  initialDraft,
  sendEnabled,
}: {
  contactId: string;
  phone: string;
  initialDraft: string;
  sendEnabled: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    if (!body.trim()) return;
    if (!confirm(`Send this text to ${phone}?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/lead-sms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contactId, body }),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !d.ok) throw new Error(d.error || "Send failed");
      setMsg("Sent ✓");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-wider text-navy">Text customer</h2>
        {!sendEnabled && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
            A2P pending
          </span>
        )}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Write a text to this lead…"
        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-navy focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={busy || !sendEnabled || !body.trim()}
          title={sendEnabled ? "" : "Sending unlocks once A2P 10DLC verification clears"}
          className="rounded-md bg-burgundy px-4 py-2 text-xs uppercase tracking-wider text-bone hover:bg-burgundy-700 disabled:opacity-40"
        >
          {busy ? "Sending…" : sendEnabled ? "Send text" : "Send (paused)"}
        </button>
        {initialDraft && body !== initialDraft && (
          <button type="button" onClick={() => setBody(initialDraft)} className="text-xs uppercase tracking-wider text-muted hover:text-ink">
            Reset to draft
          </button>
        )}
        {msg && <span className="text-xs text-ink/70">{msg}</span>}
      </div>
      {!sendEnabled && (
        <p className="text-[11px] text-muted">
          One-click send is wired to your Twilio number — it unlocks once A2P 10DLC verification clears (set SMS_SEND_ENABLED=true).
        </p>
      )}
    </section>
  );
}
