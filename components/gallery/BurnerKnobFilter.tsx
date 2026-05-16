"use client";

import { useRef } from "react";

export type FilterValue = "all" | "gas" | "charcoal" | "pellet" | "built-in";

const KNOBS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "gas", label: "Gas" },
  { value: "charcoal", label: "Charcoal" },
  { value: "pellet", label: "Pellet" },
  { value: "built-in", label: "Built-in" },
];

type Props = {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
};

export default function BurnerKnobFilter({ value, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusAt = (i: number) => {
    const next = (i + KNOBS.length) % KNOBS.length;
    refs.current[next]?.focus();
    onChange(KNOBS[next].value);
  };

  return (
    <section
      aria-labelledby="filter-heading"
      className="mx-auto max-w-6xl px-5 pt-6 pb-10"
    >
      <h3
        id="filter-heading"
        className="text-center font-display text-2xl md:text-3xl text-navy"
      >
        Filter by grill type
      </h3>

      <div
        role="radiogroup"
        aria-labelledby="filter-heading"
        className="mt-8 flex flex-wrap justify-center gap-6 sm:gap-10"
      >
        {KNOBS.map((k, i) => {
          const active = value === k.value;
          return (
            <div key={k.value} className="flex flex-col items-center">
              <button
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => onChange(k.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    e.preventDefault();
                    focusAt(i + 1);
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    e.preventDefault();
                    focusAt(i - 1);
                  } else if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(k.value);
                  }
                }}
                className={`knob relative h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-knob flex items-center justify-center ${
                  active ? "ring-4 ring-burgundy/70" : "ring-2 ring-black/40"
                }`}
                data-active={active}
                aria-label={`Filter by ${k.label}`}
                style={{
                  background:
                    "radial-gradient(circle at 30% 25%, #4a5160 0%, #1c2230 55%, #0a0d15 100%)",
                }}
              >
                <span
                  className="knob-dial absolute inset-2 rounded-full flex items-start justify-center pt-2"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06), rgba(0,0,0,0.45))",
                  }}
                  aria-hidden
                >
                  <span className="knob-notch h-3 w-1.5 rounded-full" />
                </span>
              </button>
              <span
                className={`mt-3 text-xs uppercase tracking-widest ${
                  active ? "text-burgundy font-semibold" : "text-ink/70"
                }`}
              >
                {k.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
