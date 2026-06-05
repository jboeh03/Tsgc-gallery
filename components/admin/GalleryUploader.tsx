"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GalleryJobRow } from "@/lib/db/types";

/**
 * Upload a before/after pair + metadata straight to Supabase (the gallery
 * bucket + gallery_jobs table) so a new gallery entry goes live on the public
 * site without touching GitHub. Lists existing DB-uploaded jobs with delete.
 */

const GRILL_TYPES = ["gas", "charcoal", "pellet", "kamado", "griddle"] as const;

type Part = { base64: string; mime: string; preview: string };
type FilePart = Part | null;

/**
 * Downscale + re-encode to JPEG in the browser before upload. Phone photos are
 * 3–12 MB (and often HEIC); two of them base64'd in one JSON body blow past the
 * serverless request-body cap. Drawing through a canvas caps the longest edge,
 * normalizes HEIC→JPEG, and drops the payload to a few hundred KB.
 */
function downscaleToJpeg(file: File, maxDim = 1600, quality = 0.82): Promise<Part> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (Math.max(width, height) > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas unsupported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.split(",")[1] ?? "";
      if (!base64) { reject(new Error("Could not encode image")); return; }
      resolve({ base64, mime: "image/jpeg", preview: dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not load image")); };
    img.src = url;
  });
}

/** Fallback: read the raw file as a data URL (used only if canvas decode fails). */
function readRaw(file: File): Promise<Part> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // data:<mime>;base64,<data>
      const base64 = result.split(",")[1] ?? "";
      resolve({ base64, mime: file.type || "image/jpeg", preview: result });
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

async function processFile(file: File): Promise<Part> {
  try {
    return await downscaleToJpeg(file);
  } catch {
    // Desktop browsers can't decode HEIC into a canvas — fall back to raw bytes.
    return await readRaw(file);
  }
}

export default function GalleryUploader({ existing }: { existing: GalleryJobRow[] }) {
  const router = useRouter();
  const [before, setBefore] = useState<FilePart>(null);
  const [after, setAfter] = useState<FilePart>(null);
  const [neighborhood, setNeighborhood] = useState("");
  const [grillModel, setGrillModel] = useState("");
  const [grillType, setGrillType] = useState<string>("gas");
  const [date, setDate] = useState("");
  const [serviceHours, setServiceHours] = useState("");
  const [notes, setNotes] = useState("");
  const [featured, setFeatured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function pick(which: "before" | "after", file: File | undefined) {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { setMsg("That photo is over 30 MB — pick a smaller one."); return; }
    try {
      const part = await processFile(file);
      (which === "before" ? setBefore : setAfter)(part);
      setMsg(null);
    } catch {
      setMsg("Could not read that file. Try a JPG or PNG.");
    }
  }

  function reset() {
    setBefore(null); setAfter(null); setNeighborhood(""); setGrillModel("");
    setGrillType("gas"); setDate(""); setServiceHours(""); setNotes(""); setFeatured(false);
  }

  async function submit() {
    if (!before || !after) { setMsg("A before and after photo are both required."); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          beforeBase64: before.base64, beforeMime: before.mime,
          afterBase64: after.base64, afterMime: after.mime,
          neighborhood, grillModel, grillType, date,
          serviceHours, notes, featured,
        }),
      });
      const d = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !d?.ok) {
        if (res.status === 413) throw new Error("Photos too large — try smaller images.");
        throw new Error(d?.error || `Upload failed (${res.status})`);
      }
      setMsg("Published ✓ — live on the gallery within ~30s.");
      reset();
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this before/after from the gallery?")) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !d.ok) throw new Error(d.error || "Delete failed");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  const field = "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink";
  const label = "block text-xs uppercase tracking-wider text-muted mb-1";

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Upload form */}
      <div className="rounded-lg border border-border bg-white p-5 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["before", "after"] as const).map((which) => {
            const part = which === "before" ? before : after;
            return (
              <div key={which}>
                <span className={label}>{which} photo *</span>
                <label className="flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-bone/40 hover:border-burgundy">
                  {part ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={part.preview} alt={`${which} preview`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted">Tap to choose {which}</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pick(which, e.target.files?.[0])}
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className={label}>Grill model</span>
            <input className={field} value={grillModel} onChange={(e) => setGrillModel(e.target.value)} placeholder="Weber Genesis II E-335" />
          </div>
          <div>
            <span className={label}>Neighborhood</span>
            <input className={field} value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Hyde Park" />
          </div>
          <div>
            <span className={label}>Grill type</span>
            <select className={field} value={grillType} onChange={(e) => setGrillType(e.target.value)}>
              {GRILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <span className={label}>Date</span>
            <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <span className={label}>Service hours</span>
            <input type="number" min="0" step="0.5" className={field} value={serviceHours} onChange={(e) => setServiceHours(e.target.value)} placeholder="3" />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-ink">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4" />
            Feature on gallery hero
          </label>
        </div>

        <div>
          <span className={label}>Notes (optional)</span>
          <textarea className={field} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="12-year-old grill, full teardown + deep clean." />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-md bg-burgundy px-5 py-2 text-xs font-semibold uppercase tracking-wider text-bone hover:bg-burgundy-700 disabled:opacity-40"
          >
            {busy ? "Publishing…" : "Publish to gallery"}
          </button>
          {msg && <span className="text-xs text-ink/70">{msg}</span>}
        </div>
      </div>

      {/* Existing uploads */}
      <div>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-muted">
          Uploaded via admin · {existing.length}
        </h2>
        {existing.length === 0 ? (
          <p className="text-sm text-muted">Nothing uploaded yet. The bundled gallery entries live in the repo.</p>
        ) : (
          <ul className="space-y-3">
            {existing.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-lg border border-border bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.before_url} alt="" className="h-14 w-14 flex-none rounded object-cover" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.after_url} alt="" className="h-14 w-14 flex-none rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {g.grill_model || "Grill"}{g.featured ? " · ★" : ""}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {[g.neighborhood, g.date].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(g.id)}
                  disabled={deleting === g.id}
                  className="flex-none rounded-md border border-border px-3 py-1.5 text-xs text-ink hover:border-burgundy hover:text-burgundy disabled:opacity-40"
                >
                  {deleting === g.id ? "Removing…" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
