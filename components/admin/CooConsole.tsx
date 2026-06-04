"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CooMessageRow, CooTaskRow } from "@/lib/db/types";

type ChatMsg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's the address of my next job?",
  "Any outstanding invoices?",
  "Any new leads I need to jump on right now?",
  "Kick off a Father's Day special — landing page, promo code, social.",
];

function getRecognition(): {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void;
} | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { webkitSpeechRecognition?: new () => never; SpeechRecognition?: new () => never };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? (new Ctor() as never) : null;
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.02;
  window.speechSynthesis.speak(u);
}

export default function CooConsole({
  initialHistory,
  initialTasks,
}: {
  initialHistory: CooMessageRow[];
  initialTasks: CooTaskRow[];
}) {
  const router = useRouter();
  const [chat, setChat] = useState<ChatMsg[]>(
    initialHistory.map((m) => ({ role: m.role, content: m.content }))
  );
  const [tasks, setTasks] = useState<CooTaskRow[]>(initialTasks);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSpeech = typeof window !== "undefined" && Boolean(getRecognition());

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setChat((c) => [...c, { role: "user", content: message }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/coo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as { reply?: string; tasks?: CooTaskRow[]; error?: string };
      const reply = data.reply || data.error || "No response.";
      setChat((c) => [...c, { role: "assistant", content: reply }]);
      if (data.tasks?.length) setTasks((t) => [...data.tasks!, ...t]);
      if (readAloud) speak(reply);
    } catch {
      setChat((c) => [...c, { role: "assistant", content: "Couldn't reach the COO — try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function startVoice() {
    const rec = getRecognition();
    if (!rec) return;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      finalText = text;
      setInput(text);
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) send(finalText);
    };
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

  async function taskAction(taskId: string, action: "approve" | "dismiss" | "done" | "start") {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === taskId
          ? { ...t, status: action === "approve" ? "approved" : action === "dismiss" ? "dismissed" : action === "done" ? "done" : "in_progress" }
          : t
      )
    );
    await fetch("/api/admin/coo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ taskId, action }),
    });
    router.refresh();
  }

  const active = tasks.filter((t) => ["proposed", "approved", "in_progress"].includes(t.status));

  return (
    <section className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h2 className="font-display text-base text-navy">Ask your COO</h2>
          <p className="text-xs text-muted">Type or speak a question or a job. He answers, or plans &amp; assigns it.</p>
        </div>
        <button
          type="button"
          onClick={() => setReadAloud((v) => !v)}
          className={`text-[11px] uppercase tracking-wider rounded-full px-3 py-1 ${readAloud ? "bg-navy text-bone" : "bg-bone text-ink/60"}`}
        >
          🔊 Read replies {readAloud ? "on" : "off"}
        </button>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="max-h-[42vh] overflow-y-auto px-5 py-4 space-y-3">
        {chat.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-ink/60">Try:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="block w-full text-left text-sm rounded-lg border border-border bg-bone/40 px-3 py-2 hover:border-navy"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={[
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                m.role === "user" ? "bg-navy text-bone" : "bg-bone/70 text-ink",
              ].join(" ")}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && <p className="text-sm text-muted">COO is thinking…</p>}
      </div>

      {/* Proposed / active tasks */}
      {active.length > 0 && (
        <div className="border-t border-border bg-bone/30 px-5 py-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted">Assigned tasks · your approval</p>
          {active.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy">{t.title}</p>
                  {t.detail && <p className="text-xs text-ink/65 mt-0.5">{t.detail}</p>}
                  <p className="text-[11px] text-muted mt-1">
                    → {t.assignee || "unassigned"} · {t.priority} ·{" "}
                    <span className={t.status === "proposed" ? "text-burgundy" : "text-emerald-700"}>{t.status}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {t.status === "proposed" ? (
                    <>
                      <button onClick={() => taskAction(t.id, "approve")} className="rounded-md bg-burgundy px-3 py-1 text-[11px] uppercase tracking-wider text-bone">Approve</button>
                      <button onClick={() => taskAction(t.id, "dismiss")} className="text-[11px] uppercase tracking-wider text-muted">Dismiss</button>
                    </>
                  ) : (
                    <button onClick={() => taskAction(t.id, "done")} className="rounded-md bg-navy px-3 py-1 text-[11px] uppercase tracking-wider text-bone">Done</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        className="flex items-center gap-2 border-t border-border px-5 py-3"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        {hasSpeech && (
          <button
            type="button"
            onClick={startVoice}
            aria-label="Speak to your COO"
            className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-bone ${listening ? "bg-burgundy animate-[voicePulse_1.4s_ease-in-out_infinite]" : "bg-navy"}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
            </svg>
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening…" : "Ask or assign…"}
          className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
        />
        <button type="submit" disabled={busy} className="rounded-md bg-navy px-4 py-2 text-sm uppercase tracking-wider text-bone disabled:opacity-40">
          Send
        </button>
      </form>
    </section>
  );
}
