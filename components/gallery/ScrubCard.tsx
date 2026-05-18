"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Job } from "@/lib/types";
import { jobSlug } from "@/lib/types";

type Props = {
  job: Job;
  /**
   * When false ("heat off"), the card renders a static before/after split
   * with no canvas interaction — works reliably on every device.
   */
  scrubEnabled?: boolean;
};

const REVEAL_THRESHOLD = 0.6;

export default function ScrubCard({ job, scrubEnabled = true }: Props) {
  const hero = job.pairs[0];
  const extraCount = job.pairs.length - 1;
  const slug = jobSlug(job);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const beforeImgRef = useRef<HTMLImageElement | null>(null);
  const initialized = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const scrubbing = useRef(false);
  const longPressTimer = useRef<number | null>(null);
  const lastTapTime = useRef(0);

  const [armed, setArmed] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [sliderMode, setSliderMode] = useState(0); // 0..100 for reduced motion fallback
  const labelId = useId();

  // "Heat off" mode → render the static split layout, skip all canvas wiring.
  const interactive = scrubEnabled && !reducedMotion;

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const initCanvas = useCallback(() => {
    if (initialized.current || !interactive) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const cw = rect.width;
      const ch = rect.height;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw, dh, dx, dy;
      if (ir > cr) {
        dh = ch;
        dw = ch * ir;
        dx = (cw - dw) / 2;
        dy = 0;
      } else {
        dw = cw;
        dh = cw / ir;
        dx = 0;
        dy = (ch - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      beforeImgRef.current = img;
      initialized.current = true;
    };
    img.src = hero.before;
  }, [hero.before, interactive]);

  // Initialize canvas when card scrolls into view.
  useEffect(() => {
    if (!interactive) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initCanvas();
            io.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, [initCanvas, interactive]);

  // Recompute canvas dimensions on resize.
  useEffect(() => {
    if (!interactive) return;
    const handler = () => {
      if (!initialized.current) return;
      initialized.current = false;
      setRevealed(false);
      setFadingOut(false);
      setArmed(true);
      initCanvas();
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [initCanvas, interactive]);

  const eraseAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const radius = isCoarse ? 70 : 50;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    if (lastPoint.current) {
      ctx.lineWidth = radius * 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    lastPoint.current = { x, y };
  };

  const sampleReveal = (): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    const cols = 40;
    const rows = 24;
    const sw = Math.floor(canvas.width / cols);
    const sh = Math.floor(canvas.height / rows);
    if (sw < 1 || sh < 1) return 0;
    let cleared = 0;
    let total = 0;
    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * sw + Math.floor(sw / 2);
          const y = r * sh + Math.floor(sh / 2);
          const idx = (y * canvas.width + x) * 4 + 3;
          total++;
          if (data[idx] < 16) cleared++;
        }
      }
    } catch {
      return 0;
    }
    return total === 0 ? 0 : cleared / total;
  };

  const checkComplete = () => {
    if (revealed || fadingOut) return;
    const pct = sampleReveal();
    if (pct >= REVEAL_THRESHOLD) {
      setFadingOut(true);
      window.setTimeout(() => {
        setRevealed(true);
        setFadingOut(false);
      }, 500);
    }
  };

  const localPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (revealed || !interactive) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    scrubbing.current = true;
    setArmed(false);
    const p = localPoint(e.clientX, e.clientY);
    if (p) {
      lastPoint.current = null;
      eraseAt(p.x, p.y);
    }
    if (e.pointerType === "touch") {
      longPressTimer.current = window.setTimeout(() => {
        instantReveal();
      }, 400);
    }
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      instantReveal();
    }
    lastTapTime.current = now;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!scrubbing.current || revealed || !interactive) return;
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    const p = localPoint(e.clientX, e.clientY);
    if (!p) return;
    eraseAt(p.x, p.y);
  };

  const onPointerUp = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!scrubbing.current) return;
    scrubbing.current = false;
    lastPoint.current = null;
    checkComplete();
  };

  const instantReveal = () => {
    if (revealed) return;
    setFadingOut(true);
    window.setTimeout(() => {
      setRevealed(true);
      setFadingOut(false);
    }, 350);
  };

  const reset = () => {
    initialized.current = false;
    lastPoint.current = null;
    setRevealed(false);
    setFadingOut(false);
    setArmed(true);
    setSliderMode(0);
    if (!interactive) return;
    requestAnimationFrame(() => initCanvas());
  };

  const formattedDate = new Date(job.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" }
  );

  // ────────────────────────────────────────────────────────────
  // STATIC / "HEAT OFF" RENDER — no canvas, no scrub. A 50/50 split with
  // labeled halves. Used when scrubEnabled=false OR reduced motion.
  // ────────────────────────────────────────────────────────────
  if (!interactive) {
    return (
      <figure
        ref={wrapRef}
        className="group relative rounded-xl overflow-hidden bg-navy shadow-md"
        style={{ aspectRatio: "4 / 3" }}
        aria-labelledby={labelId}
      >
        <Link
          href={`/gallery/${slug}`}
          className="absolute inset-0 z-30"
          aria-label={`View full job: ${job.grillModel} in ${job.neighborhood}`}
        />
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="relative overflow-hidden">
            <img
              src={hero.before}
              alt={hero.beforeAlt}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute top-2 left-2 z-10 inline-block rounded bg-black/65 text-bone text-[10px] font-bold uppercase tracking-widest px-2 py-1">
              Before
            </span>
          </div>
          <div className="relative overflow-hidden border-l-2 border-bone/40">
            <img
              src={hero.after}
              alt={hero.afterAlt}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute top-2 right-2 z-10 inline-block rounded bg-burgundy text-bone text-[10px] font-bold uppercase tracking-widest px-2 py-1">
              After
            </span>
          </div>
        </div>

        {extraCount > 0 ? (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-bone/95 text-navy px-3 py-1 text-[11px] font-bold uppercase tracking-widest shadow">
            +{extraCount} more
          </span>
        ) : null}

        <figcaption
          id={labelId}
          className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-navy/95 via-navy/80 to-transparent text-bone p-4 pt-12 pointer-events-none"
        >
          <p className="text-xs uppercase tracking-widest text-burgundy-400 font-semibold">
            {job.neighborhood} · {formattedDate}
          </p>
          <p className="mt-1 font-semibold leading-tight">{job.grillModel}</p>
          <p className="text-xs text-bone/80 mt-0.5">
            Service time: {job.serviceHours} hrs
          </p>
        </figcaption>
      </figure>
    );
  }

  // ────────────────────────────────────────────────────────────
  // INTERACTIVE SCRUB RENDER — preserves the original UX. The figcaption
  // is a Link so clicking the metadata navigates to the detail page;
  // the image area stays dedicated to the scrub interaction.
  // ────────────────────────────────────────────────────────────
  return (
    <figure
      ref={wrapRef}
      className="group relative rounded-xl overflow-hidden bg-navy shadow-md"
      style={{ aspectRatio: "4 / 3" }}
      aria-labelledby={labelId}
    >
      <img
        src={hero.after}
        alt={hero.afterAlt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Before and after of ${job.grillModel}. Scrub the image to reveal the cleaned grill.`}
        className={`scrub-canvas scrub-fadeout absolute inset-0 w-full h-full ${
          revealed ? "pointer-events-none opacity-0" : ""
        }`}
        style={{ opacity: fadingOut ? 0 : 1 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {armed && !revealed ? (
        <div
          aria-hidden
          className="scrub-pulse absolute top-3 left-3 z-10 flex items-center gap-2 bg-burgundy text-bone px-3 py-1.5 rounded-full text-xs uppercase tracking-widest font-semibold shadow"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12a9 9 0 11-9-9" />
          </svg>
          Scrub to clean
        </div>
      ) : null}

      {extraCount > 0 ? (
        <span className="absolute top-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-bone/95 text-navy px-3 py-1 text-[11px] font-bold uppercase tracking-widest shadow">
          +{extraCount} more
        </span>
      ) : null}

      {revealed ? (
        <button
          type="button"
          onClick={reset}
          className="absolute top-3 right-3 z-20 rounded-full bg-bone text-navy px-3 py-1.5 text-xs font-semibold shadow hover:bg-white"
        >
          ↻ Reset
        </button>
      ) : null}

      {!revealed ? (
        <button
          type="button"
          onClick={instantReveal}
          className="absolute bottom-24 right-3 z-20 rounded-md bg-bone/95 text-navy px-3 py-1.5 text-xs font-semibold shadow hover:bg-white"
        >
          Reveal
        </button>
      ) : null}

      <Link
        href={`/gallery/${slug}`}
        className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-navy/95 via-navy/80 to-transparent text-bone p-4 pt-12 block hover:from-navy"
        aria-label={`View full job: ${job.grillModel} in ${job.neighborhood}`}
      >
        <figcaption id={labelId}>
          <p className="text-xs uppercase tracking-widest text-burgundy-400 font-semibold">
            {job.neighborhood} · {formattedDate}
          </p>
          <p className="mt-1 font-semibold leading-tight">{job.grillModel}</p>
          <p className="text-xs text-bone/80 mt-0.5 flex items-center justify-between">
            <span>Service time: {job.serviceHours} hrs</span>
            <span className="underline underline-offset-2">
              See job →
            </span>
          </p>
        </figcaption>
      </Link>
    </figure>
  );
}
