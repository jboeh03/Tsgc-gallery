import type { Metadata } from "next";
import Link from "next/link";
import { getScheduleWeekFromDb } from "@/lib/schedule-db";
import { getArea } from "@/lib/areas";
import { getJobs } from "@/lib/jobs";
import { jobSlug } from "@/lib/types";
import ThisWeekMap, { type MapStop } from "@/components/ThisWeekMap";

// Re-render at most once a minute so newly-booked appointments appear on the
// public map without a redeploy (the page reads live Supabase appointments).
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Where We'll Be This Week | Tri-State Grill Cleaning",
  description:
    "See which Cincinnati, Northern Kentucky, and Dayton neighborhoods Tri-State Grill Cleaning is serving this week — and tap finished stops for before-and-after photos.",
};

function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d)
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();
}

export default async function ThisWeekPage() {
  const week = await getScheduleWeekFromDb();
  const jobs = await getJobs();

  const stops: MapStop[] = (week?.stops ?? []).flatMap((stop) => {
    const area = getArea(stop.areaId);
    if (!area) return [];
    const job = stop.jobId ? jobs.find((j) => j.id === stop.jobId) : undefined;
    const hero = job?.pairs[0];
    return [
      {
        id: stop.id,
        label: area.label,
        lat: area.lat,
        lng: area.lng,
        dayLabel: dayLabel(stop.date),
        status: job && hero ? ("completed" as const) : ("scheduled" as const),
        job:
          job && hero
            ? {
                slug: jobSlug(job),
                model: job.grillModel,
                hours: job.serviceHours,
                before: hero.before,
                after: hero.after,
                beforeAlt: hero.beforeAlt,
                afterAlt: hero.afterAlt,
              }
            : undefined,
      },
    ];
  });

  return (
    <section className="bg-bone">
      <header className="bg-navy text-bone">
        <div className="mx-auto max-w-5xl px-5 py-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-bone/55">
            Tri-State Grill Cleaning
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
            Where we&apos;ll be this week
          </h1>
          {week && (
            <p className="mt-3 text-lg text-bone/80">
              The week of{" "}
              <span className="font-semibold text-bone">{week.label}</span> —
              across Greater Cincinnati, Northern Kentucky &amp; Dayton.
            </p>
          )}
          <p className="mt-4 max-w-2xl text-sm text-bone/60">
            Grill pins mark where we&apos;re booked. Once a job&apos;s done, its
            pin turns into a tap-to-see before &amp; after. Pins sit on the
            neighborhood — never a customer&apos;s address.
          </p>
        </div>
      </header>

      {stops.length === 0 ? (
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="font-display text-2xl text-navy">
            Next week&apos;s route is posting soon
          </h2>
          <p className="mt-3 text-ink/75">
            We&apos;re lining up stops now. Want on the list?{" "}
            <Link href="/quote" className="font-semibold text-burgundy underline">
              Grab a free quote
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="border-y border-border">
            <ThisWeekMap stops={stops} />
          </div>

          {/* Server-rendered list — accessible + good for local SEO, and a
              graceful fallback if the map can't load. */}
          <div className="mx-auto max-w-5xl px-5 py-12">
            <h2 className="font-display text-2xl text-navy">This week&apos;s stops</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stops.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-border bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-bone">
                      {s.dayLabel}
                    </span>
                    <span
                      className={
                        s.status === "completed"
                          ? "text-xs font-semibold text-burgundy"
                          : "text-xs font-medium text-muted"
                      }
                    >
                      {s.status === "completed" ? "✓ Done" : "Booked"}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-lg text-navy">{s.label}</p>
                  {s.status === "completed" && s.job ? (
                    <>
                      <p className="mt-1 text-sm text-ink/70">{s.job.model}</p>
                      <Link
                        href={`/gallery/${s.job.slug}`}
                        className="mt-3 inline-block text-sm font-semibold text-burgundy hover:underline"
                      >
                        See the before &amp; after →
                      </Link>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted">On the route</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
