"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { MessageRow } from "@/lib/db/types";

/**
 * Read-only conversation thread for the CRM detail view. Collapsed by default
 * to the latest message; expands inline to the full history. Replying still
 * happens in the inbox (the composer + draft live there).
 */
export default function CrmConversation({
  conversationId,
  messages,
}: {
  conversationId: string | null;
  messages: MessageRow[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (!conversationId || messages.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-navy mb-2">Conversation</h2>
        <p className="text-sm text-muted">No messages yet with this contact.</p>
      </section>
    );
  }

  const shown = expanded ? messages : messages.slice(-1);

  return (
    <section className="rounded-xl border border-border bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-wider text-navy">
          Conversation <span className="text-muted font-normal normal-case">({messages.length})</span>
        </h2>
        <Link
          href={`/admin/inbox/${conversationId}`}
          className="text-xs uppercase tracking-wider text-burgundy hover:underline"
        >
          Reply in inbox →
        </Link>
      </div>

      <div className={["space-y-3", expanded ? "max-h-[50vh] overflow-y-auto pr-1" : ""].join(" ")}>
        {shown.map((m) => {
          const out = m.direction === "outbound";
          return (
            <div key={m.id} className={out ? "flex justify-end" : "flex justify-start"}>
              <div
                className={[
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                  out ? "bg-burgundy text-bone" : "bg-bone/70 text-ink",
                ].join(" ")}
              >
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                {m.media_urls?.map((u) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block underline text-[11px] mt-1 opacity-80"
                  >
                    📷 photo
                  </a>
                ))}
                <p className={`mt-1 text-[10px] ${out ? "text-bone/60" : "text-muted"}`}>
                  {m.channel === "email" ? "✉️ " : ""}
                  {format(new Date(m.created_at), "MMM d, h:mma")}
                  {m.ai_generated ? " · AI" : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {messages.length > 1 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs uppercase tracking-wider text-navy hover:text-burgundy"
        >
          {expanded ? "Collapse" : `Show full conversation (${messages.length})`}
        </button>
      )}
    </section>
  );
}
