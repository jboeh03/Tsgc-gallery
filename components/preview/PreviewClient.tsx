"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useCallback, type ChangeEvent, type FormEvent } from "react";
import { SITE } from "@/lib/site";
import type { PreviewResponse } from "@/lib/preview/types";

type Status = "idle" | "compressing" | "submitting" | "success" | "error";

const MAX_LONG_EDGE = 1600;
const JPEG_QUALITY = 0.85;

async function compressImage(
  file: File
): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  const maxEdge = Math.max(width, height);
  if (maxEdge > MAX_LONG_EDGE) {
    const ratio = MAX_LONG_EDGE / maxEdge;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { base64: btoa(binary), mimeType: "image/jpeg" };
}

export default function PreviewClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileSelected = useCallback((selected: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please pick an image file.");
      return;
    }
    setFile(selected);
    setError(null);
    const url = URL.createObjectURL(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    onFileSelected(e.dataTransfer.files?.[0] ?? null);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    onFileSelected(e.target.files?.[0] ?? null);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Pick a grill photo first.");
      return;
    }
    setError(null);
    setStatus("compressing");

    let imageBase64: string;
    let imageMimeType: "image/jpeg";
    try {
      const compressed = await compressImage(file);
      imageBase64 = compressed.base64;
      imageMimeType = compressed.mimeType;
    } catch {
      setStatus("error");
      setError("Couldn't read that photo. Try a different one.");
      return;
    }

    setStatus("submitting");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          imageMimeType,
          email: String(formData.get("email") ?? ""),
          firstName: String(formData.get("firstName") ?? ""),
          zip: String(formData.get("zip") ?? ""),
          consent: formData.get("consent") === "on",
        }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error ?? "Something went wrong");
      }
      const data = (await res.json()) as PreviewResponse;
      setResult(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success" && result) {
    return (
      <ResultView
        result={result}
        beforeUrl={previewUrl}
        onReset={() => {
          setFile(null);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
          setResult(null);
          setStatus("idle");
        }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="block cursor-pointer rounded-xl border-2 border-dashed border-border bg-bone hover:border-burgundy/60 transition p-6 text-center"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Your grill"
            className="mx-auto max-h-72 rounded-md"
          />
        ) : (
          <div className="py-8">
            <div className="text-4xl">📸</div>
            <p className="mt-3 font-display text-lg text-navy">
              Tap to upload a photo of your grill
            </p>
            <p className="mt-1 text-xs text-muted">
              Hood open works best. JPG, PNG, or WebP, up to 5 MB.
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          className="hidden"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block font-display text-sm uppercase tracking-wide text-navy"
          >
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="Jeff"
            className="mt-2 w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="zip"
            className="block font-display text-sm uppercase tracking-wide text-navy"
          >
            ZIP{" "}
            <span className="font-normal normal-case tracking-normal text-xs text-muted">
              optional
            </span>
          </label>
          <input
            id="zip"
            name="zip"
            type="text"
            maxLength={10}
            placeholder="45233"
            className="mt-2 w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block font-display text-sm uppercase tracking-wide text-navy"
        >
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          className="mt-2 w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm"
        />
        <p className="mt-1.5 text-xs text-muted">
          We&apos;ll email the preview link and follow up with a real quote
          within 24 hours.
        </p>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink/85 cursor-pointer">
        <input
          type="checkbox"
          name="consent"
          required
          className="h-4 w-4 mt-0.5 accent-burgundy"
        />
        <span>
          I understand this is an AI preview and the real result may differ.
          See our <Link href="/gallery" className="text-burgundy underline">real before/after gallery</Link>.
        </span>
      </label>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "compressing" || status === "submitting"}
        className="w-full rounded-md bg-burgundy text-bone py-4 font-semibold uppercase tracking-widest hover:bg-burgundy-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "compressing"
          ? "Preparing photo..."
          : status === "submitting"
          ? "Analyzing... (10–20 seconds)"
          : "See the Preview"}
      </button>
      <p className="text-center text-xs text-muted">
        Generated previews are AI estimates and not a guarantee of result.
        Free service. 3 previews per device per day.
      </p>
    </form>
  );
}

function ResultView({
  result,
  beforeUrl,
  onReset,
}: {
  result: PreviewResponse;
  beforeUrl: string | null;
  onReset: () => void;
}) {
  const { assessment, generatedImage } = result;

  return (
    <div className="space-y-8">
      <div className="rounded-md bg-bone border border-burgundy/30 px-4 py-3 text-xs text-ink/80">
        ⚠️ <strong>AI preview.</strong> The image and assessment below are
        generated estimates. Real results vary by grill condition and model —
        see our{" "}
        <Link href="/gallery" className="text-burgundy underline">
          real customer gallery
        </Link>
        .
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <figure className="relative overflow-hidden rounded-xl border border-border bg-white">
          <span className="absolute top-3 left-3 z-10 rounded-md bg-burgundy text-bone text-xs font-semibold uppercase tracking-widest px-3 py-1.5 shadow">
            Your Grill
          </span>
          {beforeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={beforeUrl} alt="Your grill" className="block w-full h-auto" />
          ) : null}
        </figure>
        <figure className="relative overflow-hidden rounded-xl border border-border bg-white">
          <span className="absolute top-3 left-3 z-10 rounded-md bg-navy text-bone text-xs font-semibold uppercase tracking-widest px-3 py-1.5 shadow">
            AI Preview
          </span>
          {generatedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={generatedImage.dataUrl}
              alt="AI-generated preview of what your grill could look like cleaned"
              className="block w-full h-auto"
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[260px] p-8 text-center">
              <div>
                <p className="font-display text-lg text-navy">
                  Visual preview unavailable
                </p>
                <p className="mt-2 text-sm text-ink/70">
                  We&apos;re still tuning the image generator. Your written
                  assessment is below.
                </p>
              </div>
            </div>
          )}
        </figure>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 md:p-8">
        <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
          AI Inspector Report
        </p>
        <h2 className="mt-3 font-display text-2xl md:text-3xl text-navy">
          {assessment.brandDetected
            ? `${assessment.brandDetected} ${assessment.grillTypeDetected}`
            : titleCaseGrillType(assessment.grillTypeDetected)}
          {assessment.burnerCount
            ? ` · ${assessment.burnerCount}-burner`
            : ""}
        </h2>
        <p className="mt-4 text-ink/85 leading-relaxed">
          {assessment.recommendation}
        </p>

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="rounded-md bg-bone p-3">
            <dt className="text-xs uppercase tracking-widest text-muted">
              Condition
            </dt>
            <dd className="mt-1 font-display text-base text-navy capitalize">
              {assessment.conditionSeverity}
            </dd>
          </div>
          <div className="rounded-md bg-bone p-3">
            <dt className="text-xs uppercase tracking-widest text-muted">
              Service
            </dt>
            <dd className="mt-1 font-display text-base text-navy">
              {assessment.estimatedServiceHours} hr
            </dd>
          </div>
          <div className="rounded-md bg-bone p-3">
            <dt className="text-xs uppercase tracking-widest text-muted">
              Est. Price
            </dt>
            <dd className="mt-1 font-display text-base text-navy">
              ${assessment.estimatedPriceLow}–${assessment.estimatedPriceHigh}
            </dd>
          </div>
          <div className="rounded-md bg-bone p-3">
            <dt className="text-xs uppercase tracking-widest text-muted">
              Confidence
            </dt>
            <dd className="mt-1 font-display text-base text-navy capitalize">
              {assessment.confidence}
            </dd>
          </div>
        </dl>

        {assessment.conditionIssues.length > 0 ? (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-burgundy font-semibold">
              What we&apos;d address
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink/85">
              {assessment.conditionIssues.map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-burgundy">·</span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="bg-burgundy text-bone rounded-xl p-8 text-center">
        <h3 className="font-display text-2xl">
          Want the real version?
        </h3>
        <p className="mt-3 text-bone/90">
          We&apos;ll come to you and make this exact assessment in person — for free.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/quote"
            className="rounded-md bg-bone text-burgundy px-7 py-3.5 font-semibold uppercase tracking-widest text-sm hover:bg-white shadow"
          >
            Get a Free Quote
          </Link>
          <a
            href={SITE.phoneHref}
            className="rounded-md border border-bone/40 px-7 py-3.5 font-semibold uppercase tracking-widest text-sm hover:bg-bone/10"
          >
            ☎ {SITE.phone}
          </a>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-muted hover:text-navy underline"
        >
          Try another photo
        </button>
      </div>
    </div>
  );
}

function titleCaseGrillType(t: string): string {
  if (t === "unknown") return "Unknown grill";
  return t
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}
