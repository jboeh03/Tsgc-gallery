"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CAMPAIGN, isCampaignActive } from "@/lib/campaign";
import { GIVEAWAY, isGiveawayActive, isGiveawayUpcoming } from "@/lib/giveaway";

export default function PromoBanner({ active }: { active: boolean }) {
  const pathname = usePathname() ?? "";
  const [dismissed, setDismissed] = useState(false);

  const giveawayActive = isGiveawayActive();
  const giveawayUpcoming = isGiveawayUpcoming();
  const campaignActive = isCampaignActive();

  const mode = giveawayActive
    ? "giveaway-active"
    : giveawayUpcoming
    ? "giveaway-upcoming"
    : campaignActive
    ? "campaign"
    : "none";

  const dismissKey =
    mode === "campaign"
      ? `tsgc-promo-dismissed-${CAMPAIGN.id}`
      : mode !== "none"
      ? `tsgc-promo-dismissed-${GIVEAWAY.id}`
      : null;

  const hiddenPaths =
    mode === "campaign"
      ? [CAMPAIGN.landingPath, "/quote", "/preview"]
      : [GIVEAWAY.landingPath, "/quote", "/preview"];

  useEffect(() => {
    if (!active || !dismissKey) return;
    try {
      if (sessionStorage.getItem(dismissKey) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, [active, dismissKey]);

  if (!active || mode === "none") return null;
  if (hiddenPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  if (dismissed) return null;

  const dismiss = () => {
    try {
      if (dismissKey) sessionStorage.setItem(dismissKey, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const closeBtn = (ringColor: string, hoverBg: string) => (
    <button
      type="button"
      onClick={dismiss}
      aria-label="Dismiss banner"
      className={`shrink-0 p-1.5 rounded focus:outline-none focus-visible:ring-2 ${ringColor} ${hoverBg}`}
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
  );

  // ── Giveaway banner (active or upcoming) ──────────────────────────────
  if (mode === "giveaway-active" || mode === "giveaway-upcoming") {
    const openLabel = GIVEAWAY.openDateDisplay.startsWith("[")
      ? "soon"
      : GIVEAWAY.openDateDisplay;
    const closeLabel = GIVEAWAY.closeDateDisplay.startsWith("[")
      ? "the closing date"
      : GIVEAWAY.closeDateDisplay;

    return (
      <div className="bg-navy text-bone">
        <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center justify-between gap-3">
          <Link
            href={GIVEAWAY.landingPath}
            className="flex-1 min-w-0 flex items-center gap-2 hover:opacity-90"
          >
            <span className="hidden sm:inline text-xs uppercase tracking-widest font-semibold text-amber-200">
              Giveaway
            </span>
            <span className="hidden sm:inline text-amber-200/60">·</span>
            <span className="text-sm font-medium truncate">
              {mode === "giveaway-active"
                ? `Win a restored Weber Spirit II — enter free, closes ${closeLabel}`
                : `Win a restored Weber Spirit II — giveaway opens ${openLabel}`}
            </span>
            <span className="hidden md:inline text-sm font-semibold underline underline-offset-4 ml-1">
              {mode === "giveaway-active" ? "Enter now →" : "Learn more →"}
            </span>
          </Link>
          {closeBtn("focus-visible:ring-amber-200", "hover:bg-navy-700")}
        </div>
      </div>
    );
  }

  // ── Discount campaign banner (fallback — campaign expires May 25 2026) ─
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
            See deals →
          </span>
        </Link>
        {closeBtn("focus-visible:ring-amber-200", "hover:bg-burgundy-700")}
      </div>
    </div>
  );
}
