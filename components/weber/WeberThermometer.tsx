"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Oversized Weber-style temperature gauge for "Webers cleaned this sprint".
 * Scroll-triggered (IntersectionObserver): smoke rises, the needle sweeps from
 * 0 to the current count, the progress arc fills, and the number counts up.
 */

const CX = 120;
const CY = 120;
const R = 90;
const SWEEP = 270; // degrees, gap at the bottom
const START = -135; // value 0 (lower-left)

function pt(r: number, angleDeg: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
}

function arcPath(r: number, a0: number, a1: number): string {
  const [x0, y0] = pt(r, a0);
  const [x1, y1] = pt(r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export default function WeberThermometer({
  count,
  target,
  teaseText,
}: {
  count: number;
  target: number;
  teaseText: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [shown, setShown] = useState(0);

  const frac = Math.max(0, Math.min(1, target > 0 ? count / target : 0));
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setEntered(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Count the number up once the gauge is in view.
  useEffect(() => {
    if (!entered) return;
    if (reduce || count <= 0) { setShown(count); return; }
    const steps = Math.min(count, 30);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(Math.round((count * i) / steps));
      if (i >= steps) clearInterval(id);
    }, 1600 / steps);
    return () => clearInterval(id);
  }, [entered, count, reduce]);

  const active = entered || reduce;
  const needleAngle = START + SWEEP * (active ? frac : 0);
  const labels = [0, target / 3, (2 * target) / 3, target].map((v, i) => ({
    v: Math.round(v),
    a: START + (SWEEP * i) / 3,
  }));

  return (
    <div ref={ref} className="relative flex flex-col items-center">
      {/* Smoke */}
      <div className="pointer-events-none absolute inset-x-0 -top-6 flex justify-center gap-6" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`block h-24 w-10 rounded-full bg-ink/15 blur-xl ${active ? "animate-[weber-smoke_3.2s_ease-out_infinite]" : "opacity-0"}`}
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        ))}
      </div>

      <svg viewBox="0 0 240 240" className="relative w-56 h-56 md:w-64 md:h-64">
        {/* Dial face */}
        <circle cx={CX} cy={CY} r={R + 14} fill="#fff" stroke="#1A3055" strokeWidth="4" />
        <circle cx={CX} cy={CY} r={R + 8} fill="none" stroke="#E5E0D8" strokeWidth="1" />

        {/* Track + progress arc */}
        <path d={arcPath(R, START, START + SWEEP)} fill="none" stroke="#E5E0D8" strokeWidth="10" strokeLinecap="round" />
        <path
          d={arcPath(R, START, START + SWEEP)}
          fill="none"
          stroke="#8B1F2F"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={active ? 100 - frac * 100 : 100}
          style={{ transition: reduce ? undefined : "stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)" }}
        />

        {/* Tick labels */}
        {labels.map((l, i) => {
          const [lx, ly] = pt(R - 24, l.a);
          return (
            <text key={i} x={lx} y={ly + 4} textAnchor="middle" className="fill-muted" style={{ fontSize: 11, fontWeight: 600 }}>
              {l.v}
            </text>
          );
        })}

        {/* Needle */}
        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: reduce ? undefined : "transform 1.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <line x1={CX} y1={CY} x2={CX} y2={CY - (R - 18)} stroke="#1A3055" strokeWidth="4" strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r="9" fill="#1A3055" />

        {/* Center readout */}
        <text x={CX} y={CY + 52} textAnchor="middle" className="fill-burgundy" style={{ fontSize: 40, fontWeight: 800 }}>
          {shown}
        </text>
        <text x={CX} y={CY + 70} textAnchor="middle" className="fill-muted" style={{ fontSize: 10, letterSpacing: 1.5 }}>
          WEBERS CLEANED
        </text>
      </svg>

      <p className="mt-1 text-sm text-ink/65">{count} of {target} this sprint</p>
      <p className="mt-1 text-sm italic text-burgundy">{teaseText}</p>
    </div>
  );
}
