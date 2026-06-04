"use client";

import { useState } from "react";

type Tool = "social" | "blog" | "radar";

const TABS: { id: Tool; label: string; placeholder: string; hint: string }[] = [
  {
    id: "social",
    label: "Social post",
    placeholder: "Finished job details — e.g. Mt. Lookout, Weber Genesis II, 4-burner, heavy carbon on grates + greasy cookbox, 3 hrs, looks brand new.",
    hint: "Generates Facebook, Instagram & Nextdoor versions in your voice.",
  },
  {
    id: "blog",
    label: "Blog post",
    placeholder: "Topic — e.g. How often should you deep-clean a gas grill in Cincinnati's climate?",
    hint: "Drafts an SEO-friendly, locally-flavored post (~700 words).",
  },
  {
    id: "radar",
    label: "Radar reply",
    placeholder: "Paste the public post you found (e.g. someone on Nextdoor asking for a grill cleaner).",
    hint: "Drafts a reply you post yourself, neighbor-to-neighbor. Never auto-sent.",
  },
];

export default function MarketingTools() {
  const [tool, setTool] = useState<Tool>("social");
  const [input, setInput] = useState("");
  const [source, setSource] = useState("Nextdoor");
  const [output, setOutput] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const active = TABS.find((t) => t.id === tool)!;

  async function generate() {
    if (!input.trim() || state === "loading") return;
    setState("loading");
    setError(null);
    setOutput("");
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tool, input, source }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Failed (${res.status})`);
      setOutput(j.text || "");
      setState("idle");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg border border-border bg-white p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTool(t.id); setOutput(""); setError(null); }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tool === t.id ? "bg-navy text-bone" : "text-ink/70 hover:bg-bone"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white p-5 space-y-3">
        <p className="text-sm text-ink/60">{active.hint}</p>
        {tool === "radar" && (
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-md border border-border px-2 py-1.5 text-sm bg-white"
          >
            {["Nextdoor", "Facebook", "Reddit", "Other"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={tool === "blog" ? 2 : 4}
          placeholder={active.placeholder}
          className="w-full resize-y rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
        />
        <button
          type="button"
          onClick={generate}
          disabled={!input.trim() || state === "loading"}
          className="rounded-md bg-burgundy px-4 py-2 text-xs uppercase tracking-wider text-bone hover:bg-burgundy/90 disabled:opacity-40"
        >
          {state === "loading" ? "Generating…" : "Generate"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {output && (
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-wider text-muted">Draft — review &amp; edit before using</h3>
            <button type="button" onClick={copy} className="text-xs uppercase tracking-wider text-burgundy hover:underline">
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm text-ink leading-relaxed">{output}</pre>
        </div>
      )}
    </div>
  );
}
