"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RANGE_PRESETS } from "@/lib/admin/range";

export default function RangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = params.get("range") ?? "30d";

  function set(v: string) {
    const next = new URLSearchParams(params.toString());
    next.set("range", v);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <select
      value={current}
      onChange={(e) => set(e.target.value)}
      disabled={pending}
      className="text-sm border border-border rounded-md px-3 py-1.5 bg-white text-navy"
    >
      {RANGE_PRESETS.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
