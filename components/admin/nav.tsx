/**
 * Shared admin navigation model + icon set, used by both the desktop Sidebar
 * and the mobile bottom-nav/drawer so they never drift out of sync.
 *
 * `primary: true` items are the ones promoted to the mobile bottom tab bar
 * (the rest live behind "More").
 */

export type NavKey =
  | "overview" | "inbox" | "suggestions" | "leads" | "jobs" | "marketing"
  | "campaigns" | "traffic" | "affiliate" | "agents" | "backlog" | "settings"
  | "gallery";

export type NavItem = {
  href: string;
  label: string;
  icon: NavKey;
  primary?: boolean;
};

export const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "overview", primary: true },
  { href: "/admin/inbox", label: "Inbox", icon: "inbox", primary: true },
  { href: "/admin/leads", label: "CRM", icon: "leads", primary: true },
  { href: "/admin/jobs", label: "Jobs", icon: "jobs", primary: true },
  { href: "/admin/suggestions", label: "Suggestions", icon: "suggestions" },
  { href: "/admin/marketing", label: "Marketing", icon: "marketing" },
  { href: "/admin/gallery", label: "Gallery", icon: "gallery" },
  { href: "/admin/campaigns", label: "Campaigns", icon: "campaigns" },
  { href: "/admin/traffic", label: "Traffic", icon: "traffic" },
  { href: "/admin/products", label: "Affiliate", icon: "affiliate" },
  { href: "/admin/agents", label: "Agents", icon: "agents" },
  { href: "/admin/backlog", label: "Backlog", icon: "backlog" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const props = {
    fill: "none",
    stroke: "currentColor",
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
    case "marketing":
      return (
        <svg {...props}>
          <path d="m3 11 14-7v16L3 13v5H1v-7z" />
          <path d="M17 8a3 3 0 0 1 0 6" />
        </svg>
      );
    case "agents":
      return (
        <svg {...props}>
          <rect x="4" y="8" width="16" height="12" rx="2" />
          <path d="M12 2v4M9 13h.01M15 13h.01M8 20v2M16 20v2" />
        </svg>
      );
    case "backlog":
      return (
        <svg {...props}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
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
    case "gallery":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5L5 21" />
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
