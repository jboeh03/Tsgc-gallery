"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Part-number / model search for the storefront. Submitting navigates to
 * /parts?q=<term> so the result is a shareable, direct link the concierge (or
 * anyone) can hand out. The page filters server-side from the same query.
 */
export default function PartsSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/parts?q=${encodeURIComponent(q)}` : "/parts");
  }

  function clear() {
    setValue("");
    router.push("/parts");
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2" role="search">
      <div className="relative flex-1">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by part number, OEM number, brand, or model…"
          aria-label="Search parts"
          className="w-full rounded-md border border-border bg-white py-2.5 pl-9 pr-3 text-sm focus:border-burgundy focus:outline-none"
        />
      </div>
      {initial ? (
        <button type="button" onClick={clear} className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-ink/70 hover:border-burgundy/40">
          Clear
        </button>
      ) : (
        <button type="submit" className="rounded-md bg-burgundy px-4 py-2.5 text-sm font-semibold text-bone hover:bg-burgundy-700">
          Search
        </button>
      )}
    </form>
  );
}
