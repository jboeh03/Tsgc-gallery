"use client";

import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DailyPoint = { date: string; count: number };

export default function LeadsByDay({ data }: { data: DailyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B1F2F" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#8B1F2F" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E5E0D8" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => format(parseISO(d), "MMM d")}
            tick={{ fontSize: 11, fill: "#6E6E68" }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#6E6E68" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "#1A3055",
              border: "none",
              borderRadius: 6,
              color: "#F7F3EE",
              fontSize: 12,
            }}
            labelFormatter={(d) => (typeof d === "string" ? format(parseISO(d), "MMM d, yyyy") : "")}
            formatter={(v) => [String(v ?? 0), "Leads"]}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#8B1F2F"
            strokeWidth={2}
            fill="url(#leadsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
