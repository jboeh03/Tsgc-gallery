import Link from "next/link";

/**
 * Sub-tab strip for the Leads section. Two tabs:
 *   /admin/leads          — the rolled-up table of all leads
 *   /admin/leads/inspect  — qualifier dry-run: per-lead breakdown with
 *                           the exact SMS body + email subject that
 *                           would be sent. No side effects.
 *
 * Server component; the `current` prop tells it which tab to highlight.
 */
export default function LeadsTabs({ current }: { current: "all" | "inspect" }) {
  const tabs = [
    { id: "all", href: "/admin/leads", label: "All leads" },
    { id: "inspect", href: "/admin/leads/inspect", label: "Qualifier breakdown" },
  ] as const;
  return (
    <div className="border-b border-border bg-white">
      <div className="px-6 -mb-px flex items-center gap-1">
        {tabs.map((t) => {
          const active = t.id === current;
          return (
            <Link
              key={t.id}
              href={t.href}
              className={[
                "px-4 py-2.5 text-sm border-b-2 -mb-px transition",
                active
                  ? "border-burgundy text-burgundy font-semibold"
                  : "border-transparent text-ink/60 hover:text-ink",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
