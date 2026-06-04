"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV, NavIcon, isActive } from "@/components/admin/nav";

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-60 shrink-0 bg-navy text-bone min-h-screen flex-col">
      <div className="px-5 py-6 border-b border-bone/10">
        <Link href="/admin" className="flex items-center gap-3">
          <Image src="/logos/logo-white.png" alt="TSGC" width={36} height={36} className="h-9 w-9" />
          <div>
            <div className="font-display text-base leading-tight">Tri-State</div>
            <div className="text-[10px] uppercase tracking-widest text-bone/55">Admin</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                    active
                      ? "bg-burgundy text-bone"
                      : "text-bone/75 hover:bg-bone/[0.06] hover:text-bone",
                  ].join(" ")}
                >
                  <NavIcon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="px-5 py-4 border-t border-bone/10 text-[11px] text-bone/45">
        <Link href="/" className="hover:text-bone/80">
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
