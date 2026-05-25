import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GIVEAWAY, isGiveawayActive, isGiveawayUpcoming } from "@/lib/giveaway";
import { SITE } from "@/lib/site";
import EntryForm from "@/components/giveaway/EntryForm";

export const metadata: Metadata = {
  title: `Win a Restored Weber Spirit II | ${SITE.name}`,
  description:
    "Enter to win a fully cleaned and restored Weber Spirit II grill from Tri-State Grill Cleaning. No purchase necessary. Open to Cincinnati, NKY, and Dayton residents.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Win a Restored Weber Spirit II — Tri-State Grill Cleaning Giveaway",
    description:
      "No purchase necessary. Enter free. Bonus entries for booking a cleaning. Open to Cincinnati, NKY, and Dayton residents.",
    type: "website",
  },
};

export default function GiveawayPage() {
  const active = isGiveawayActive();
  const upcoming = isGiveawayUpcoming();

  const openLabel = GIVEAWAY.openDateDisplay.startsWith("[")
    ? "soon"
    : GIVEAWAY.openDateDisplay;
  const closeLabel = GIVEAWAY.closeDateDisplay.startsWith("[")
    ? "the closing date"
    : GIVEAWAY.closeDateDisplay;
  const closeLong = GIVEAWAY.closeDateLong.startsWith("[")
    ? "[CLOSE DATE LONG — TBD]"
    : GIVEAWAY.closeDateLong;

  return (
    <div className="bg-bone">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy to-navy-700 text-bone">
        <div className="mx-auto max-w-4xl px-5 py-20 md:py-24 text-center">
          {upcoming ? (
            <div className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-widest text-navy mb-5">
              Opening {openLabel}
            </div>
          ) : active ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-burgundy/60 ring-1 ring-amber-200/40 px-4 py-2 text-sm mb-5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
              <span className="text-amber-100 text-xs uppercase tracking-widest font-semibold">
                Giveaway open — closes {closeLabel}
              </span>
            </div>
          ) : (
            <div className="inline-block rounded-full bg-navy-700/70 ring-1 ring-amber-200/30 px-3 py-1 text-xs text-amber-100 mb-5">
              This giveaway has ended
            </div>
          )}

          <div className="text-xs md:text-sm uppercase tracking-[0.35em] text-amber-200 font-semibold">
            {SITE.name} · Veteran-Founded
          </div>
          <div className="mt-4 mx-auto w-12 h-[3px] rounded-full bg-amber-300/80" />
          <h1 className="mt-6 font-display text-4xl md:text-6xl leading-tight tracking-tight">
            Win a Restored<br />Weber Spirit II
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-base md:text-lg text-bone/80 leading-relaxed">
            A fully cleaned and restored Weber Spirit II — personally serviced by Jeff.
            Enter free. No purchase necessary.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {active ? (
              <a
                href="#enter"
                className="rounded-md bg-burgundy text-bone px-8 py-4 font-semibold uppercase tracking-widest hover:bg-burgundy-400 transition"
              >
                Enter Now — Free →
              </a>
            ) : upcoming ? (
              <span className="rounded-md bg-navy-700/60 ring-1 ring-amber-200/30 text-amber-100 px-8 py-4 font-semibold uppercase tracking-widest text-sm">
                Entry Opens {openLabel}
              </span>
            ) : null}
            <Link
              href="/giveaway/rules"
              className="text-sm text-bone/60 underline underline-offset-4 hover:text-bone/90"
            >
              Official Rules
            </Link>
          </div>
          <p className="mt-6 text-xs text-bone/50">
            No purchase necessary to enter or win.
            Open to {GIVEAWAY.serviceAreaLabel} residents, {GIVEAWAY.minAge}+.
          </p>
        </div>
      </section>

      {/* ── Prize section ────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-burgundy font-semibold">
              Prizes
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              Three winners. All from the service area.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Grand Prize */}
            <div className="md:col-span-2 rounded-xl border-2 border-amber-400 bg-white shadow-md overflow-hidden">
              <div className="absolute -top-0 left-0 w-full">
              </div>
              {/*
                IMAGE PLACEHOLDER — Grand Prize Weber Spirit II
                To activate: drop /public/giveaway/weber-spirit-ii-after.jpg at that path,
                then replace this <div> with:

                  import Image from "next/image";
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={GIVEAWAY.prize.grand.imageAfter}
                      alt="Restored Weber Spirit II grill"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
              */}
              <div className="relative aspect-[16/9] w-full bg-navy flex items-center justify-center">
                <div className="text-center text-bone/30 px-8">
                  <p className="font-display text-2xl tracking-wide">Weber Spirit II</p>
                  <p className="mt-2 text-sm">Photo coming soon — after restoration</p>
                  <p className="mt-1 text-xs opacity-60">
                    Drop /public/giveaway/weber-spirit-ii-after.jpg to replace this placeholder
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-widest text-navy">
                    Grand Prize
                  </div>
                </div>
                <h3 className="font-display text-2xl md:text-3xl text-navy">
                  {GIVEAWAY.prize.grand.title}
                </h3>
                <p className="mt-1 text-sm text-burgundy font-semibold uppercase tracking-wide">
                  {GIVEAWAY.prize.grand.subtitle}
                </p>
                <p className="mt-3 text-sm text-ink/80 leading-relaxed">
                  {GIVEAWAY.prize.grand.description}
                </p>
              </div>
            </div>

            {/* Runner-up prizes */}
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="rounded-full bg-bone border border-border inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest text-navy mb-4">
                  2nd Place
                </div>
                <h3 className="font-display text-xl text-navy">
                  {GIVEAWAY.prize.second.title}
                </h3>
                <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                  {GIVEAWAY.prize.second.description}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="rounded-full bg-bone border border-border inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest text-navy mb-4">
                  3rd Place
                </div>
                <h3 className="font-display text-xl text-navy">
                  {GIVEAWAY.prize.third.title}
                </h3>
                <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                  {GIVEAWAY.prize.third.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How to enter ─────────────────────────────────────────────────── */}
      <section className="bg-bone border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-14 md:py-16">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-burgundy font-semibold">
              How It Works
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              Up to {GIVEAWAY.maxEntriesPerPerson} entries per person
            </h2>
            <p className="mt-3 text-sm text-muted max-w-xl mx-auto">
              The base entry is always free. Bonus entries increase your odds — no purchase required for any of them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <EntryStep
              badge={`${GIVEAWAY.entryWeights.base} entry`}
              badgeStyle="bg-navy text-bone"
              title="Fill out the form"
              body="Enter your name, email, phone, and ZIP. That's it — you're in. No purchase, no trick."
            />
            <EntryStep
              badge={`+${GIVEAWAY.entryWeights.booking} entries`}
              badgeStyle="bg-amber-400 text-navy"
              title="Book a cleaning"
              body="Schedule a grill cleaning before the deadline. Enter your booking reference in the form. Largest bonus weight."
            />
            <EntryStep
              badge={`+${GIVEAWAY.entryWeights.share} entry`}
              badgeStyle="bg-bone border border-amber-400 text-navy"
              title="Share the giveaway"
              body="Post the giveaway on Facebook or Instagram. Tag a veteran who deserves a fresh grill — encouraged, never required."
            />
            <EntryStep
              badge={`+${GIVEAWAY.entryWeights.follow} entry`}
              badgeStyle="bg-bone border border-amber-400 text-navy"
              title="Follow us"
              body="Follow Tri-State Grill Cleaning on Facebook or Instagram."
            />
          </div>

          <p className="mt-8 text-center text-xs text-muted">
            Maximum {GIVEAWAY.maxEntriesPerPerson} entries per person. Tagging veterans on social is encouraged
            but is <strong>not</strong> a condition of entry — see the{" "}
            <Link href="/giveaway/rules" className="text-navy underline">
              Official Rules
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Entry form ───────────────────────────────────────────────────── */}
      <section id="enter" className="bg-white border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="rounded-xl border border-border bg-white shadow-sm p-6 md:p-8">
            <h2 className="font-display text-2xl text-navy mb-6">
              {active ? "Enter the Giveaway" : upcoming ? "Entry Opens Soon" : "Giveaway Closed"}
            </h2>
            <Suspense fallback={null}>
              <EntryForm active={active} upcoming={upcoming} />
            </Suspense>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl bg-bone border border-border p-6">
              <p className="text-xs uppercase tracking-widest text-burgundy font-semibold">
                Quick Facts
              </p>
              <ul className="mt-4 space-y-3 text-sm text-ink/80 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-navy font-bold shrink-0">→</span>
                  <span>
                    <strong className="text-navy">Free to enter.</strong> No purchase necessary to enter or win.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-navy font-bold shrink-0">→</span>
                  <span>
                    <strong className="text-navy">Entry window:</strong>{" "}
                    {openLabel} through {closeLabel}.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-navy font-bold shrink-0">→</span>
                  <span>
                    <strong className="text-navy">Who can enter:</strong>{" "}
                    {GIVEAWAY.serviceAreaLabel} residents, {GIVEAWAY.minAge}+.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-navy font-bold shrink-0">→</span>
                  <span>
                    <strong className="text-navy">Winner selection:</strong>{" "}
                    Random draw from all valid entries. Announced{" "}
                    {GIVEAWAY.announceDateDisplay.startsWith("[")
                      ? "within a few days of close"
                      : GIVEAWAY.announceDateDisplay}
                    .
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-navy font-bold shrink-0">→</span>
                  <span>
                    <strong className="text-navy">Booking bonus:</strong>{" "}
                    Book a cleaning for the biggest entry boost — still not required to win.
                  </span>
                </li>
              </ul>
              <Link
                href="/giveaway/rules"
                className="mt-5 inline-block text-xs text-navy underline underline-offset-4"
              >
                Read the full Official Rules →
              </Link>
            </div>

            <div className="rounded-xl bg-bone border border-border p-6">
              <p className="text-xs uppercase tracking-widest text-burgundy font-semibold">
                Tag a Veteran
              </p>
              <p className="mt-3 text-sm text-ink/80 leading-relaxed">
                Know a veteran who&apos;d love a clean grill for the Fourth of July?
                Share this giveaway and tag them — not required to enter, but a good
                reason to reach out to someone who deserves it.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href={SITE.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center rounded-md border border-border px-3 py-3 font-display text-xs uppercase tracking-widest text-navy hover:bg-white transition"
                >
                  Facebook
                </a>
                <a
                  href={SITE.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center rounded-md border border-border px-3 py-3 font-display text-xs uppercase tracking-widest text-navy hover:bg-white transition"
                >
                  Instagram
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Jeff's sign-off ──────────────────────────────────────────────── */}
      <section className="bg-bone">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <div className="rounded-lg bg-white border border-border p-8 md:p-10 shadow-sm">
            <div className="text-xs uppercase tracking-widest text-burgundy font-semibold">
              A note from the founder
            </div>
            <p className="mt-4 text-base md:text-lg text-ink leading-relaxed">
              I started Tri-State after my time in service because I wanted to keep
              building something with my hands and serving this community. This grill has
              been cleaned and restored the same way I approach every job — the right way,
              no shortcuts.
            </p>
            <p className="mt-4 text-base md:text-lg text-ink leading-relaxed">
              If it ends up in a veteran&apos;s backyard, that&apos;s the whole point.
              But the giveaway is open to everyone in our service area — because good
              neighbors take care of each other.
            </p>
            <p className="mt-4 text-base md:text-lg text-ink leading-relaxed">
              Enter free. Good luck.
            </p>
            <p className="mt-6 font-display text-lg text-navy">— Jeff</p>
            <p className="text-sm text-muted">
              {SITE.name} · Veteran-Founded · Cincinnati · NKY · Dayton
            </p>
          </div>
        </div>
      </section>

      {/* ── Rules + urgency strip ─────────────────────────────────────────── */}
      {active ? (
        <section className="bg-navy text-bone">
          <div className="mx-auto max-w-6xl px-5 py-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
            <span className="text-xs sm:text-sm tracking-widest uppercase text-amber-200/90">
              Entry closes {closeLong}
            </span>
            <a
              href="#enter"
              className="text-xs sm:text-sm tracking-widest uppercase font-semibold underline underline-offset-4 hover:text-amber-200"
            >
              Enter free →
            </a>
            <Link
              href="/giveaway/rules"
              className="text-xs text-bone/50 underline underline-offset-4 hover:text-bone/80"
            >
              Official Rules
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function EntryStep({
  badge,
  badgeStyle,
  title,
  body,
}: {
  badge: string;
  badgeStyle: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-border p-6 shadow-sm">
      <div
        className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${badgeStyle}`}
      >
        {badge}
      </div>
      <h3 className="mt-4 font-display text-base text-navy uppercase tracking-wide">
        {title}
      </h3>
      <p className="mt-2 text-sm text-ink/75 leading-relaxed">{body}</p>
    </div>
  );
}
