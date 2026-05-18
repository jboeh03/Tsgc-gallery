"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CAMPAIGN } from "@/lib/campaign";

const DISMISS_KEY = `tsgc-promo-dismissed-${CAMPAIGN.id}`;
const HIDDEN_PATHS = [CAMPAIGN.landingPath, "/quote", "/preview"];

export default function PromoBanner({ active }: { active: boolean }) {
  const pathname = usePathname() ?? "";
  // Default to visible so SSR matches initial render. Re-hide on the client
  // only if sessionStorage says the user already dismissed it this session.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!active) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, [active]);

  if (!active) return null;
  if (HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  if (dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="bg-burgundy text-bone">
      <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center justify-between gap-3">
        <Link
          href={CAMPAIGN.landingPath}
          className="flex-1 min-w-0 flex items-center gap-2 hover:opacity-90"
        >
          <span className="hidden sm:inline text-xs uppercase tracking-widest font-semibold text-amber-200">
            Memorial Day
          </span>
          <span className="hidden sm:inline text-amber-200/60">·</span>
          <span className="text-sm font-medium truncate">
            Save up to 30% — book a cleaning before May 25
          </span>
          <span className="hidden md:inline text-sm font-semibold underline underline-offset-4 ml-1">
            See deals &rarr;
          </span>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss promo banner"
          className="shrink-0 p-1.5 rounded hover:bg-burgundy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12" />
            <path d="M6 18l12-12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
