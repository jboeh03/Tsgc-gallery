"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StudioOutput, StudioPhoto } from "@/lib/studio/photos";

type EffectKind = "restyle" | "animate";

const RESTYLE_PRESETS: Array<{ label: string; prompt: string }> = [
  {
    label: "Cinematic magazine ad",
    prompt:
      "Re-render this grill photo as a cinematic, magazine-ad-quality shot: warm golden-hour lighting, shallow depth of field, subtle film grain, a clean and well-styled patio backdrop. Keep the same grill model and proportions; do not change brand badges.",
  },
  {
    label: "Twilight + soft fire glow",
    prompt:
      "Re-render this grill at twilight with warm soft glow from inside the cookbox, ambient string lights in the background, cool blue ambient sky. Photoreal, same grill model and angle, same proportions.",
  },
  {
    label: "Studio-clean catalog look",
    prompt:
      "Re-render this grill in a clean studio catalog style: soft even lighting, plain neutral background, crisp focus. Same grill model and orientation; preserve all branding and proportions.",
  },
];

const ANIMATE_PRESETS: Array<{ label: string; prompt: string }> = [
  {
    label: "Subtle parallax + steam rise",
    prompt:
      "Subtle 3D parallax: a slow camera dolly that gives a sense of depth, with thin wisps of steam rising from the grates. No people. No dramatic motion — the grill itself stays still.",
  },
  {
    label: "Lid lift reveal",
    prompt:
      "The grill lid slowly lifts open to reveal clean grates and a soft heat shimmer. Cinematic, smooth, no people in frame.",
  },
  {
    label: "Cinematic camera orbit",
    prompt:
      "Slow cinematic camera orbit halfway around the grill, photoreal, soft ambient light. The grill is stationary. No people.",
  },
];

export default function StudioEditor({ photo }: { photo: StudioPhoto }) {
  const [outputs, setOutputs] = useState<StudioOutput[]>(photo.outputs);
  const [kind, setKind] = useState<EffectKind>("restyle");
  const [prompt, setPrompt] = useState(RESTYLE_PRESETS[0].prompt);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const switchKind = (k: EffectKind) => {
    setKind(k);
    setPrompt(
      (k === "restyle" ? RESTYLE_PRESETS : ANIMATE_PRESETS)[0].prompt
    );
  };

  const runRestyle = useCallback(async () => {
    setBusy(true);
    setError(null);
    setStatusText("Rendering… (usually 10–25s)");
    try {
      const res = await fetch("/api/studio/restyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id, prompt }),
      });
      const json = (await res.json()) as {
        filename?: string;
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.filename || !json.url) {
        throw new Error(json.error ?? `Restyle failed (${res.status})`);
      }
      setOutputs((prev) => [
        {
          filename: json.filename!,
          url: json.url!,
          kind: "image",
          createdAt: Date.now(),
        },
        ...prev,
      ]);
      setStatusText("Done.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restyle failed");
      setStatusText(null);
    } finally {
      setBusy(false);
    }
  }, [photo.id, prompt]);

  const runAnimate = useCallback(async () => {
    setBusy(true);
    setError(null);
    setStatusText("Starting Veo… (full render usually 60–120s)");
    try {
      const kickoff = await fetch("/api/studio/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id, prompt }),
      });
      const startJson = (await kickoff.json()) as {
        operationName?: string;
        error?: string;
      };
      if (!kickoff.ok || !startJson.operationName) {
        throw new Error(
          startJson.error ?? `Veo kickoff failed (${kickoff.status})`
        );
      }
      const op = startJson.operationName;
      setStatusText("Rendering video…");

      await new Promise<void>((resolve, reject) => {
        let elapsed = 0;
        pollRef.current = setInterval(async () => {
          elapsed += 5;
          try {
            const r = await fetch(
              `/api/studio/animate?op=${encodeURIComponent(
                op
              )}&photoId=${encodeURIComponent(photo.id)}`
            );
            const j = (await r.json()) as {
              done?: boolean;
              filename?: string;
              url?: string;
              error?: string;
            };
            if (!r.ok && j.error) {
              clearInterval(pollRef.current!);
              pollRef.current = null;
              reject(new Error(j.error));
              return;
            }
            if (j.done && j.filename && j.url) {
              clearInterval(pollRef.current!);
              pollRef.current = null;
              setOutputs((prev) => [
                {
                  filename: j.filename!,
                  url: j.url!,
                  kind: "video",
                  createdAt: Date.now(),
                },
                ...prev,
              ]);
              setStatusText("Done.");
              resolve();
              return;
            }
            setStatusText(`Rendering video… ${elapsed}s elapsed`);
            if (elapsed > 300) {
              clearInterval(pollRef.current!);
              pollRef.current = null;
              reject(new Error("Timed out after 5 minutes"));
            }
          } catch (err) {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            reject(err);
          }
        }, 5000);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Animate failed");
      setStatusText(null);
    } finally {
      setBusy(false);
    }
  }, [photo.id, prompt]);

  const run = kind === "restyle" ? runRestyle : runAnimate;
  const presets = kind === "restyle" ? RESTYLE_PRESETS : ANIMATE_PRESETS;

  return (
    <div className="mt-6 grid md:grid-cols-2 gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted mb-2">
          Source
        </p>
        <div className="rounded-md overflow-hidden bg-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.displayUrl}
            alt={photo.filename}
            className="w-full h-auto"
          />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted mb-2">
          Effect
        </p>
        <div className="inline-flex rounded-md border border-border bg-white overflow-hidden text-sm">
          {(["restyle", "animate"] as EffectKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => switchKind(k)}
              disabled={busy}
              className={`px-3 py-1.5 ${
                kind === k
                  ? "bg-navy text-bone"
                  : "text-ink/75 hover:bg-bone"
              }`}
            >
              {k === "restyle" ? "Restyle (image)" : "Animate (video)"}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs uppercase tracking-widest text-muted mb-2">
          Preset
        </p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPrompt(p.prompt)}
              disabled={busy}
              className={`text-xs rounded-full border px-3 py-1 ${
                prompt === p.prompt
                  ? "bg-burgundy text-bone border-burgundy"
                  : "bg-white text-ink/75 border-border hover:bg-bone"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs uppercase tracking-widest text-muted mb-2">
          Prompt
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
          rows={5}
          className="w-full rounded-md border border-border bg-white p-2 text-sm font-sans"
        />

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={busy || !prompt.trim()}
            className="rounded-md bg-navy text-bone px-4 py-2 text-sm font-display disabled:opacity-50"
          >
            {busy
              ? "Working…"
              : kind === "restyle"
              ? "Restyle"
              : "Generate video"}
          </button>
          {statusText ? (
            <span className="text-xs text-muted">{statusText}</span>
          ) : null}
        </div>
        {error ? (
          <p className="mt-2 text-xs text-burgundy">{error}</p>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <h2 className="font-display text-navy text-xl">
          Outputs ({outputs.length})
        </h2>
        {outputs.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Nothing rendered yet. Pick an effect and run.
          </p>
        ) : (
          <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outputs.map((o) => (
              <li key={o.filename}>
                <OutputCard photoId={photo.id} output={o} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OutputCard({
  photoId,
  output,
}: {
  photoId: string;
  output: StudioOutput;
}) {
  const [merging, setMerging] = useState(false);
  const [merged, setMerged] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const merge = async () => {
    setMerging(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId,
          outputFilename: output.filename,
        }),
      });
      const json = (await res.json()) as {
        publicPath?: string;
        error?: string;
      };
      if (!res.ok || !json.publicPath) {
        throw new Error(json.error ?? `Merge failed (${res.status})`);
      }
      setMerged(json.publicPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-white overflow-hidden">
      <div className="aspect-video bg-border">
        {output.kind === "video" ? (
          <video
            src={output.url}
            controls
            playsInline
            className="w-full h-full object-cover bg-black"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={output.url}
            alt={output.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <div className="p-3 text-xs space-y-2">
        <p className="text-ink/80 truncate" title={output.filename}>
          {output.filename}
        </p>
        <div className="flex items-center gap-2">
          <a
            href={output.url}
            download={output.filename}
            className="rounded border border-border px-2 py-1 hover:bg-bone"
          >
            Download
          </a>
          <button
            type="button"
            onClick={merge}
            disabled={merging || !!merged}
            className="rounded bg-burgundy text-bone px-2 py-1 disabled:opacity-50"
          >
            {merging ? "Merging…" : merged ? "Merged" : "Merge to /gallery"}
          </button>
        </div>
        {merged ? (
          <p className="text-muted break-all">
            Copied to <code>{merged}</code>. Reference from{" "}
            <code>data/jobs.json</code> to show it publicly.
          </p>
        ) : null}
        {error ? <p className="text-burgundy">{error}</p> : null}
      </div>
    </div>
  );
}
