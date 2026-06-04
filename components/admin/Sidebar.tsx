"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview", icon: "overview" as const },
  { href: "/admin/inbox", label: "Inbox", icon: "inbox" as const },
  { href: "/admin/suggestions", label: "Suggestions", icon: "suggestions" as const },
  { href: "/admin/leads", label: "Leads", icon: "leads" as const },
  { href: "/admin/jobs", label: "Jobs", icon: "jobs" as const },
  { href: "/admin/campaigns", label: "Campaigns", icon: "campaigns" as const },
  { href: "/admin/traffic", label: "Traffic", icon: "traffic" as const },
  { href: "/admin/products", label: "Affiliate", icon: "affiliate" as const },
  { href: "/admin/settings", label: "Settings", icon: "settings" as const },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 bg-navy text-bone min-h-screen flex flex-col">
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
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
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

function NavIcon({ name, className }: { name: string; className?: string }) {
  const stroke = "currentColor";
  const props = {
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true,
  };
  switch (name) {
    case "overview":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "suggestions":
      return (
        <svg {...props}>
          <path d="M9 18h6m-5 3h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
        </svg>
      );
    case "leads":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="m19 8 2 2 4-4" />
        </svg>
      );
    case "jobs":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      );
    case "campaigns":
      return (
        <svg {...props}>
          <path d="M3 11v3a1 1 0 0 0 1 1h3l4 4V7L7 11H4a1 1 0 0 0-1 1z" />
          <path d="M16 8a4 4 0 0 1 0 8" />
        </svg>
      );
    case "traffic":
      return (
        <svg {...props}>
          <path d="m3 17 6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );
    case "affiliate":
      return (
        <svg {...props}>
          <path d="M9 17h6m-3-3v3" />
          <rect x="3" y="6" width="18" height="11" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    default:
      return null;
  }
}
