"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, NavIcon, isActive } from "@/components/admin/nav";

const PRIMARY = NAV.filter((n) => n.primary);
const MORE = NAV.filter((n) => !n.primary);

export default function MobileNav() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  // Close the drawer on navigation.
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const moreActive = MORE.some((n) => isActive(pathname, n.href));

  return (
    <>
      {/* Slide-up "More" drawer */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm animate-[fadeIn_120ms_ease-out]"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-navy text-bone p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_180ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-bone/25" />
            <div className="grid grid-cols-3 gap-2">
              {MORE.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-medium transition",
                      active ? "bg-burgundy text-bone" : "bg-bone/[0.06] text-bone/80 active:bg-bone/15",
                    ].join(" ")}
                  >
                    <NavIcon name={item.icon} className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <Link
              href="/"
              className="mt-3 block rounded-xl bg-bone/[0.06] px-4 py-3 text-center text-xs uppercase tracking-wider text-bone/70 active:bg-bone/15"
            >
              ← Back to site
            </Link>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-bone/10 bg-navy/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-5">
          {PRIMARY.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition",
                    active ? "text-bone" : "text-bone/55 active:text-bone",
                  ].join(" ")}
                >
                  <span className={["rounded-full px-3 py-1 transition", active ? "bg-burgundy" : ""].join(" ")}>
                    <NavIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setDrawer((v) => !v)}
              className={[
                "flex w-full flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition",
                moreActive || drawer ? "text-bone" : "text-bone/55 active:text-bone",
              ].join(" ")}
            >
              <span className={["rounded-full px-3 py-1 transition", moreActive || drawer ? "bg-burgundy" : ""].join(" ")}>
                <svg fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
