"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Inbox composer. Prefilled with the AI suggested draft (if any). Send posts
 * to /api/sms/send (human-in-the-loop — a person clicks Send). Regenerate
 * re-runs the AI draft. Mirrors the QuoteForm status state-machine.
 */
export default function Composer({
  conversationId,
  initialDraft,
  hasDraft,
  optedOut,
}: {
  conversationId: string;
  initialDraft: string;
  hasDraft: boolean;
  optedOut: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialDraft);
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "drafting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // If the user hasn't edited and the draft is unchanged from what came in,
  // sending counts as "from draft" (for analytics on ai_generated).
  const fromDraft = hasDraft && !touched && body === initialDraft;

  async function send() {
    if (!body.trim() || state === "sending") return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId, body, fromDraft }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Send failed (${res.status})`);
      }
      setBody("");
      setTouched(false);
      setState("idle");
      router.refresh();
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Send failed");
    }
  }

  async function regenerate() {
    if (state === "drafting") return;
    setState("drafting");
    setError(null);
    try {
      const res = await fetch("/api/sms/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Draft failed (${res.status})`);
      if (j.draft?.body) {
        setBody(j.draft.body);
        setTouched(false);
      }
      setState("idle");
      router.refresh();
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Draft failed");
    }
  }

  if (optedOut) {
    return (
      <div className="rounded-lg border border-border bg-bone/40 px-4 py-3 text-sm text-muted">
        This contact has opted out of SMS. Sending is disabled.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hasDraft && !touched && (
        <p className="text-[11px] uppercase tracking-wider text-burgundy">AI suggested draft</p>
      )}
      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setTouched(true);
        }}
        rows={3}
        placeholder="Type a reply…"
        className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={regenerate}
          disabled={state === "drafting" || state === "sending"}
          className="text-xs uppercase tracking-wider text-navy hover:text-burgundy disabled:opacity-40"
        >
          {state === "drafting" ? "Drafting…" : "↻ Regenerate draft"}
        </button>
        <button
          type="button"
          onClick={send}
          disabled={!body.trim() || state === "sending"}
          className="rounded-md bg-burgundy px-4 py-2 text-xs uppercase tracking-wider text-bone hover:bg-burgundy/90 disabled:opacity-40"
        >
          {state === "sending" ? "Sending…" : "Send text"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
