"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Job } from "@/lib/types";

type Props = {
  job: Job;
};

const REVEAL_THRESHOLD = 0.6;

export default function ScrubCard({ job }: Props) {
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

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const initCanvas = useCallback(() => {
    if (initialized.current || reducedMotion) return;
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
      // Cover-fit the before image onto the canvas.
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
    img.src = job.beforeImage;
  }, [job.beforeImage, reducedMotion]);

  // Initialize canvas when card scrolls into view.
  useEffect(() => {
    if (reducedMotion) return;
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
  }, [initCanvas, reducedMotion]);

  // Recompute canvas dimensions on resize (reset to before state to avoid stretch).
  useEffect(() => {
    if (reducedMotion) return;
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
  }, [initCanvas, reducedMotion]);

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
      // Draw a thick line between the last point and current to make scrubs feel solid.
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
    // Sample on a coarse grid for performance.
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
      // Auto-finish the wipe.
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
    if (revealed || reducedMotion) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    scrubbing.current = true;
    setArmed(false);
    const p = localPoint(e.clientX, e.clientY);
    if (p) {
      lastPoint.current = null;
      eraseAt(p.x, p.y);
    }
    // Long-press fallback for accessibility (touch only).
    if (e.pointerType === "touch") {
      longPressTimer.current = window.setTimeout(() => {
        instantReveal();
      }, 400);
    }
    // Double-tap fallback.
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      instantReveal();
    }
    lastTapTime.current = now;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!scrubbing.current || revealed || reducedMotion) return;
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
    if (reducedMotion) return;
    // Repaint before image.
    requestAnimationFrame(() => initCanvas());
  };

  const formattedDate = new Date(job.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" }
  );

  return (
    <figure
      ref={wrapRef}
      className="group relative rounded-xl overflow-hidden bg-navy shadow-md"
      style={{ aspectRatio: "4 / 3" }}
      aria-labelledby={labelId}
    >
      {/* AFTER image — bottom layer */}
      <img
        src={job.afterImage}
        alt={job.afterAlt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* BEFORE image — shown directly when reduced motion (no scrub mechanic).
         Becomes a horizontally-revealed slider via clipPath. */}
      {reducedMotion ? (
        <img
          src={job.beforeImage}
          alt={job.beforeAlt}
          loading="lazy"
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath: `inset(0 ${sliderMode}% 0 0)` }}
        />
      ) : (
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
      )}

      {/* "Scrub to clean" pulsing badge */}
      {!reducedMotion && armed && !revealed ? (
        <div
          aria-hidden
          className="scrub-pulse absolute top-3 left-3 z-10 flex items-center gap-2 bg-burgundy text-bone px-3 py-1.5 rounded-full text-xs uppercase tracking-widest font-semibold shadow"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12a9 9 0 11-9-9" />
          </svg>
          Scrub to clean
        </div>
      ) : null}

      {/* Reset button (after reveal) */}
      {revealed ? (
        <button
          type="button"
          onClick={reset}
          className="absolute top-3 right-3 z-20 rounded-full bg-bone text-navy px-3 py-1.5 text-xs font-semibold shadow hover:bg-white"
        >
          ↻ Reset
        </button>
      ) : null}

      {/* Accessible reveal button (keyboard / SR users) */}
      {!revealed ? (
        <button
          type="button"
          onClick={instantReveal}
          className="absolute bottom-24 right-3 z-20 rounded-md bg-bone/95 text-navy px-3 py-1.5 text-xs font-semibold shadow hover:bg-white"
        >
          Reveal
        </button>
      ) : null}

      {/* Reduced-motion slider control */}
      {reducedMotion && !revealed ? (
        <div className="absolute bottom-24 left-3 right-3 z-20 bg-bone/95 rounded-md px-3 py-2 shadow">
          <label className="text-xs text-navy block mb-1">
            Before / after
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderMode}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSliderMode(v);
              if (v >= 95) instantReveal();
            }}
            className="w-full"
            aria-label="Slide to reveal cleaned grill"
          />
        </div>
      ) : null}

      {/* Caption / metadata overlay (always visible) */}
      <figcaption
        id={labelId}
        className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-navy/95 via-navy/80 to-transparent text-bone p-4 pt-12"
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
