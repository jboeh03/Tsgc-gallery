"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/** Minimal shape of the Web Speech API we use (no DOM lib types ship for it). */
type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

type VoiceAction =
  | { action: "navigate" | "search"; to: string; say: string }
  | { action: "speak" | "none"; say: string }
  | { action: "confirm_update"; jobId: string; status: string; say: string };

function getRecognition(): RecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    webkitSpeechRecognition?: new () => RecognitionLike;
    SpeechRecognition?: new () => RecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.02;
  window.speechSynthesis.speak(u);
}

export default function VoiceHQ() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Extract<VoiceAction, { action: "confirm_update" }> | null>(null);
  const [typed, setTyped] = useState("");
  const recRef = useRef<RecognitionLike | null>(null);
  const hasSpeech = typeof window !== "undefined" && Boolean(getRecognition());

  const run = useCallback(
    async (text: string) => {
      const cmd = text.trim();
      if (!cmd) return;
      setBusy(true);
      setReply(null);
      setPending(null);
      try {
        const res = await fetch("/api/admin/voice", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ transcript: cmd }),
        });
        const action = (await res.json()) as VoiceAction;
        setReply(action.say);
        speak(action.say);
        if (action.action === "navigate" || action.action === "search") {
          router.push(action.to);
          setTimeout(() => setOpen(false), 900);
        } else if (action.action === "confirm_update") {
          setPending(action);
        }
      } catch {
        const msg = "Sorry — I couldn't reach the server.";
        setReply(msg);
        speak(msg);
      } finally {
        setBusy(false);
      }
    },
    [router]
  );

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    setTranscript("");
    setReply(null);
    let finalText = "";
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      finalText = text;
      setTranscript(text);
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) run(finalText);
    };
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }, [run]);

  // Clean up speech + recognition when the sheet closes.
  useEffect(() => {
    if (!open) {
      recRef.current?.stop();
      setListening(false);
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    }
  }, [open]);

  async function confirmUpdate() {
    if (!pending) return;
    setBusy(true);
    try {
      await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId: pending.jobId, job: { status: pending.status } }),
      });
      const msg = "Done.";
      setReply(msg);
      speak(msg);
      setPending(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating mic button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Voice command"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-6 z-30 h-14 w-14 rounded-full bg-burgundy text-bone shadow-lg shadow-burgundy/30 flex items-center justify-center active:scale-95 transition"
      >
        <MicIcon className="h-6 w-6" />
      </button>

      {/* Voice sheet */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close voice"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm animate-[fadeIn_120ms_ease-out]"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_180ms_cubic-bezier(0.16,1,0.3,1)] max-w-2xl mx-auto">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

            <div className="flex items-start gap-4">
              {hasSpeech ? (
                <button
                  type="button"
                  onClick={listening ? stopListening : startListening}
                  className={[
                    "h-16 w-16 shrink-0 rounded-full flex items-center justify-center text-bone transition",
                    listening ? "bg-burgundy animate-[voicePulse_1.4s_ease-in-out_infinite]" : "bg-navy active:scale-95",
                  ].join(" ")}
                  aria-label={listening ? "Stop listening" : "Start listening"}
                >
                  <MicIcon className="h-7 w-7" />
                </button>
              ) : null}

              <div className="min-w-0 flex-1">
                <p className="font-display text-base text-navy">
                  {listening ? "Listening…" : busy ? "Working…" : "Voice HQ"}
                </p>
                <p className="text-sm text-ink/60 mt-0.5 min-h-[1.25rem]">
                  {transcript || reply || (hasSpeech ? "Tap the mic, then speak a command." : "Type a command (use your keyboard's 🎤 to dictate).")}
                </p>
              </div>
            </div>

            {/* Confirm an edit before it's applied (human-in-the-loop). */}
            {pending && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-burgundy/30 bg-burgundy/5 p-3">
                <p className="text-sm text-ink flex-1">{pending.say}</p>
                <button
                  type="button"
                  onClick={confirmUpdate}
                  disabled={busy}
                  className="rounded-md bg-burgundy px-4 py-2 text-xs uppercase tracking-wider text-bone disabled:opacity-40"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className="text-xs uppercase tracking-wider text-muted"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Typed / dictated fallback — always available */}
            <form
              className="mt-4 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (typed.trim()) {
                  run(typed);
                  setTyped("");
                }
              }}
            >
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder='e.g. "open inbox", "search Dave", "read my messages"'
                className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-navy px-4 py-2 text-sm uppercase tracking-wider text-bone disabled:opacity-40"
              >
                Go
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.speechSynthesis?.cancel()}
                className="text-xs uppercase tracking-wider text-muted hover:text-ink"
              >
                Stop reading
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs uppercase tracking-wider text-burgundy"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
    </svg>
  );
}
