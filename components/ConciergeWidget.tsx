"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Floating site-wide concierge chat. Talks to /api/concierge, which runs the
 * Claude tool-loop (FAQ + estimate_quote + capture_lead). Stateless server —
 * we send the running transcript each turn. State lives here and persists across
 * in-group navigations because the widget is mounted in the (site) layout.
 */
type Msg = { role: "user" | "assistant"; content: string };

/** Turn full URLs and site /parts links in assistant replies into clickable anchors. */
function linkify(text: string): React.ReactNode[] {
  const re = /(https?:\/\/[^\s)]+|\/parts(?:\?[^\s)]*)?)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const href = m[0];
    const external = href.startsWith("http");
    out.push(
      <a
        key={m.index}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="font-medium text-burgundy underline"
      >
        {href}
      </a>,
    );
    last = m.index + href.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const GREETING =
  "Hi! 👋 I'm the Tri-State Grill Cleaning concierge. I can answer questions, ballpark a price for your grill, and get you on the schedule. What can I help with?";

export default function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const d = (await res.json()) as { reply?: string; error?: string };
      setMessages((m) => [
        ...m,
        { role: "assistant", content: d.reply || d.error || "Sorry — try again in a moment." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Connection hiccup — mind trying again?" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with us"}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-burgundy text-bone shadow-xl ring-1 ring-black/10 transition hover:bg-burgundy-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        {open ? (
          <span aria-hidden="true" className="text-2xl leading-none">&times;</span>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Tri-State Grill Cleaning concierge chat"
          className="fixed bottom-24 right-5 z-[55] flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl bg-bone shadow-2xl ring-1 ring-navy/10"
        >
          <div className="bg-navy-900 px-4 py-3 text-bone">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
              <div className="font-display text-sm uppercase tracking-wider">Grill Concierge</div>
            </div>
            <div className="mt-0.5 text-[11px] text-bone/60">Tri-State Grill Cleaning · usually replies instantly</div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-burgundy text-bone"
                      : "bg-white text-ink ring-1 ring-border"
                  }`}
                >
                  {m.role === "assistant" ? linkify(m.content) : m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-3.5 py-2.5 text-sm text-muted ring-1 ring-border">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-border bg-white px-3 py-2.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pricing, repairs, booking…"
              className="flex-1 rounded-full border border-border bg-bone px-3.5 py-2 text-sm focus:border-navy focus:outline-none"
              aria-label="Your message"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-navy text-bone transition hover:bg-navy-700 disabled:opacity-40"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
