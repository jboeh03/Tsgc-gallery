"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type BreakdownItem = { label: string; value: number };

const COLORS = ["#8B1F2F", "#1A3055", "#3D6390", "#A82B3D", "#6E1825", "#2C4A6E"];

export default function DonutBreakdown({
  data,
  totalLabel,
}: {
  data: BreakdownItem[];
  totalLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="h-56 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={1.5}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#1A3055",
              border: "none",
              borderRadius: 6,
              color: "#F7F3EE",
              fontSize: 12,
            }}
            formatter={(v, n) => {
              const num = typeof v === "number" ? v : Number(v) || 0;
              return [`${num} (${total > 0 ? Math.round((num / total) * 100) : 0}%)`, String(n)];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="font-display text-2xl text-navy">{total}</div>
        {totalLabel && <div className="text-[10px] uppercase tracking-widest text-muted">{totalLabel}</div>}
      </div>
    </div>
  );
}
