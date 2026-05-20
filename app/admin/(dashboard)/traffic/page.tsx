import Link from "next/link";
import { auth } from "@/auth";
import Header from "@/components/admin/Header";

export default async function TrafficPage() {
  const session = await auth();
  const vercelTeam = process.env.VERCEL_TEAM_SLUG || "";
  const vercelProject = process.env.VERCEL_PROJECT_SLUG || "tsgc-gallery";
  const analyticsUrl = vercelTeam
    ? `https://vercel.com/${vercelTeam}/${vercelProject}/analytics`
    : `https://vercel.com/dashboard`;

  return (
    <>
      <Header email={session?.user?.email} title="Traffic" showRange={false} />
      <div className="p-6 space-y-6">
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-xs uppercase tracking-wider text-burgundy font-semibold">
            Vercel Web Analytics
          </p>
          <h2 className="mt-2 font-display text-xl text-navy">Page views & top pages</h2>
          <p className="mt-2 text-sm text-ink/75 max-w-2xl">
            The site is wired up to Vercel Web Analytics — every page view is
            tracked privacy-first (no cookies, no PII). The dashboard for the
            full data lives in Vercel; the free tier shows the last 24 hours,
            paid tiers unlock 30+ days. Use the Affiliate tab below to see
            click-through on your /products page.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={analyticsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-navy hover:bg-navy-700 text-bone px-4 py-2 text-sm font-semibold"
            >
              Open Vercel Analytics ↗
            </a>
            <Link
              href="/admin/products"
              className="inline-flex items-center rounded-md border border-navy text-navy hover:bg-navy hover:text-bone px-4 py-2 text-sm font-semibold transition"
            >
              See affiliate clicks
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChannelCard
            title="Quote form submissions"
            body="The site's primary conversion path. Every submission lands in the Website Leads tab and shows up under /admin/leads."
            href="/admin/leads"
            cta="View leads"
          />
          <ChannelCard
            title="Campaign codes"
            body="Memorial Day, Mother's Day, Jason10, FB10 — see which promos brought in real bookings vs. just clicks."
            href="/admin/campaigns"
            cta="See campaigns"
          />
        </div>

        <div className="rounded-xl border border-dashed border-border bg-white/60 p-6">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">
            Coming soon
          </p>
          <h2 className="mt-2 font-display text-lg text-navy">
            Top pages & referrers in-dashboard
          </h2>
          <p className="mt-2 text-sm text-ink/65 max-w-2xl">
            Vercel&apos;s Analytics API requires a Pro plan to read
            programmatically. When you&apos;re ready to upgrade we can pull
            page views, top entry pages, geographic breakdown, and devices
            directly into this page — no need to bounce out to vercel.com.
          </p>
        </div>
      </div>
    </>
  );
}

function ChannelCard({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h3 className="font-display text-base text-navy">{title}</h3>
      <p className="mt-2 text-sm text-ink/70">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-burgundy hover:underline"
      >
        {cta} →
      </Link>
    </div>
  );
}
