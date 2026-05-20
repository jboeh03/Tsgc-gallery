import type { ReactNode } from "react";

export default function KpiCard({
  label,
  value,
  delta,
  hint,
  trend,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  hint?: string;
  trend?: "up" | "down" | "flat";
}) {
  const trendColor =
    trend === "up"
      ? "text-emerald-700"
      : trend === "down"
        ? "text-burgundy"
        : "text-muted";
  return (
    <div className="rounded-xl border border-border bg-white p-5 flex flex-col">
      <div className="text-xs uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl text-navy">{value}</div>
      {(delta || hint) && (
        <div className={`mt-2 text-xs ${delta ? trendColor : "text-muted"}`}>
          {delta && <span className="font-semibold">{delta}</span>}
          {delta && hint && <span className="text-muted"> · </span>}
          {hint && <span className="text-muted">{hint}</span>}
        </div>
      )}
    </div>
  );
}
