import type { Metadata } from "next";
import Link from "next/link";
import { GIVEAWAY } from "@/lib/giveaway";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Official Rules — Weber Spirit II Giveaway | ${SITE.name}`,
  description:
    "Official rules for the Tri-State Grill Cleaning Weber Spirit II Giveaway. No purchase necessary. Open to Cincinnati, NKY, and Dayton residents, 18+.",
  robots: { index: false, follow: false },
};

const openLong = GIVEAWAY.openDateLong.startsWith("[")
  ? "[OPEN DATE LONG — TBD, e.g. Friday, June 26, 2026 at 12:00 AM EDT]"
  : GIVEAWAY.openDateLong;

const closeLong = GIVEAWAY.closeDateLong.startsWith("[")
  ? "[CLOSE DATE LONG — TBD, e.g. Saturday, July 4, 2026 at 11:59 PM EDT]"
  : GIVEAWAY.closeDateLong;

const announce = GIVEAWAY.announceDateDisplay.startsWith("[")
  ? "[ANNOUNCE DATE — TBD, e.g. Tuesday, July 7, 2026]"
  : GIVEAWAY.announceDateDisplay;

export default function GiveawayRulesPage() {
  return (
    <div className="bg-bone">
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 md:py-16">
          <p className="uppercase tracking-widest text-bone/55 text-xs font-semibold">
            Weber Spirit II Giveaway
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl">
            Official Rules
          </h1>
          <p className="mt-4 text-bone/70 text-sm max-w-xl leading-relaxed">
            Please read these rules carefully before entering. By entering the giveaway
            you agree to be bound by these Official Rules.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-12 md:py-16">

          {/* Attorney review notice */}
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 mb-10 text-sm text-ink/80 leading-relaxed">
            <strong className="text-navy">Note for sponsor:</strong> These rules represent
            a good-faith sweepstakes structure. Jeff Boeh should have an attorney review
            before the campaign goes live, particularly regarding state-specific
            sweepstakes registration requirements (certain states require registration for
            prizes above threshold values).
          </div>

          {/* No Purchase Necessary — must appear prominently */}
          <div className="rounded-lg border-2 border-navy bg-bone px-6 py-5 mb-10 text-center">
            <p className="font-display text-lg md:text-xl text-navy uppercase tracking-wide">
              No Purchase Necessary to Enter or Win.
            </p>
            <p className="mt-2 text-sm text-ink/80">
              A purchase will not increase your chances of winning.
            </p>
          </div>

          <div className="prose prose-sm max-w-none space-y-8 text-ink leading-relaxed">

            <RuleSection number="1" title="Sponsor">
              <p>
                {GIVEAWAY.sponsor.name} (&quot;Sponsor&quot;), operated by{" "}
                {GIVEAWAY.sponsor.ownerName}, {GIVEAWAY.sponsor.address}.
                Website: <a href={GIVEAWAY.sponsor.website} className="text-navy underline">{GIVEAWAY.sponsor.website}</a>.
                Email: <a href={`mailto:${GIVEAWAY.sponsor.contact}`} className="text-navy underline">{GIVEAWAY.sponsor.contact}</a>.
                Phone: {GIVEAWAY.sponsor.phone}.
              </p>
            </RuleSection>

            <RuleSection number="2" title="No Purchase Necessary">
              <p>
                No purchase or payment of any kind is necessary to enter or win this
                giveaway (&quot;Giveaway&quot;). A purchase will not increase your
                chances of winning. Booking a cleaning service with Sponsor may earn
                bonus entries (see Section 6), but the free on-site entry method
                described in Section 5 is always available and constitutes the
                &quot;no purchase necessary&quot; alternative method of entry.
              </p>
            </RuleSection>

            <RuleSection number="3" title="Eligibility">
              <p>
                Open to legal residents of the greater Cincinnati, Ohio; Northern
                Kentucky; and Dayton, Ohio service area as defined by the Sponsor&apos;s
                eligible ZIP codes (see{" "}
                <Link href="/giveaway" className="text-navy underline">
                  giveaway entry page
                </Link>{" "}
                for the eligible ZIP code list), who are {GIVEAWAY.minAge} years of age
                or older at the time of entry.
              </p>
              <p className="mt-3">
                Void outside the eligible service area and where prohibited or restricted
                by law. Employees of Sponsor, their immediate family members (spouse,
                parent, child, sibling, and their spouses), and household members are
                not eligible.
              </p>
              <p className="mt-3">
                Entrants must provide a valid U.S. mailing address within the eligible
                service area for prize delivery if selected as a winner.
              </p>
            </RuleSection>

            <RuleSection number="4" title="Entry Period">
              <p>
                The Giveaway begins at {openLong} and ends at {closeLong}{" "}
                (&quot;Entry Period&quot;). Entries submitted before the start or after
                the end of the Entry Period are void. Sponsor&apos;s computer is the
                official clock for this Giveaway.
              </p>
            </RuleSection>

            <RuleSection number="5" title="How to Enter — Free Method">
              <p>
                To enter without any purchase, visit{" "}
                <Link href={GIVEAWAY.landingPath} className="text-navy underline">
                  {SITE.canonicalUrl}{GIVEAWAY.landingPath}
                </Link>{" "}
                during the Entry Period and complete the entry form by providing:
              </p>
              <ul className="mt-3 ml-5 list-disc space-y-1">
                <li>First and last name</li>
                <li>Valid email address</li>
                <li>Valid phone number</li>
                <li>ZIP code within the eligible service area</li>
                <li>Confirmation that you are {GIVEAWAY.minAge}+ and a service-area resident</li>
              </ul>
              <p className="mt-3">
                Submitting the completed form awards{" "}
                <strong>{GIVEAWAY.entryWeights.base} base entry</strong>. Limit one
                base entry per person per email address. Duplicate email submissions
                will be flagged and only the first valid entry will be counted.
              </p>
            </RuleSection>

            <RuleSection number="6" title="Bonus Entry Methods">
              <p>
                Entrants may earn additional entries (up to a maximum of{" "}
                {GIVEAWAY.maxEntriesPerPerson} total entries per person) through the
                following bonus actions. All bonus entries are self-attested on the
                entry form. Sponsor reserves the right to verify any claimed bonus
                entry and to disqualify entries where verification fails.
              </p>
              <div className="mt-4 space-y-4">
                <BonusRow
                  entries={`+${GIVEAWAY.entryWeights.booking}`}
                  action="Book a grill cleaning"
                  detail={`Schedule a professional grill cleaning with Sponsor during or prior to the Entry Period. Check the "Book a cleaning" box on the entry form and provide a booking reference (name, phone number, or appointment date used to book). Sponsor will cross-reference the booking records before the draw. No purchase necessary — this is a bonus only; the free entry method in Section 5 always stands.`}
                />
                <BonusRow
                  entries={`+${GIVEAWAY.entryWeights.share}`}
                  action="Share the giveaway on social media"
                  detail={`Share the official Giveaway post (from Sponsor's Facebook or Instagram page) to your personal Facebook or Instagram profile during the Entry Period. Check the corresponding box on the entry form. Tagging another user is encouraged but is not required to earn this bonus entry or to enter the Giveaway. Requiring tags as a condition of entry would violate Facebook's and Instagram's promotion policies, and Sponsor does not make tagging a condition of any kind.`}
                />
                <BonusRow
                  entries={`+${GIVEAWAY.entryWeights.follow}`}
                  action="Follow Sponsor on social media"
                  detail={`Follow Tri-State Grill Cleaning on Facebook (${SITE.social.facebook}) or Instagram (${SITE.social.instagram}). Check the corresponding box on the entry form.`}
                />
              </div>
              <p className="mt-4">
                <strong>Entry cap:</strong> Maximum {GIVEAWAY.maxEntriesPerPerson} entries
                per person regardless of actions completed. Entries exceeding the cap are
                automatically reduced to {GIVEAWAY.maxEntriesPerPerson}.
              </p>
            </RuleSection>

            <RuleSection number="7" title="Prizes">
              <p>Three (3) winners will be selected:</p>
              <div className="mt-4 space-y-4">
                <PrizeRow
                  place="Grand Prize (1 winner)"
                  title={GIVEAWAY.prize.grand.title}
                  description={GIVEAWAY.prize.grand.description}
                />
                <PrizeRow
                  place="Second Prize (1 winner)"
                  title={GIVEAWAY.prize.second.title}
                  description={GIVEAWAY.prize.second.description}
                />
                <PrizeRow
                  place="Third Prize (1 winner)"
                  title={GIVEAWAY.prize.third.title}
                  description={GIVEAWAY.prize.third.description}
                />
              </div>
              <p className="mt-4">
                Prizes are non-transferable and have no cash value. No substitution
                of prizes except at Sponsor&apos;s sole discretion. All taxes on prizes
                are the sole responsibility of the winner. Sponsor will provide a 1099
                form to any winner whose prize value exceeds $600.
              </p>
              <p className="mt-3">
                Grand Prize grill will be delivered to winner within the eligible service
                area or available for local pickup — winner and Sponsor will coordinate
                delivery logistics. Service prizes are redeemable within one (1) year of
                winner notification and within the eligible service area.
              </p>
            </RuleSection>

            <RuleSection number="8" title="Winner Selection">
              <p>
                Winners will be selected by random draw from all valid entries received
                during the Entry Period. The draw will be performed using the{" "}
                <code className="bg-bone px-1.5 rounded text-xs">runGiveawayDraw()</code>{" "}
                function in Sponsor&apos;s Google Apps Script environment, which:
              </p>
              <ul className="mt-3 ml-5 list-disc space-y-1">
                <li>
                  Reads all valid entries from the &quot;Giveaway Entries&quot; tracking
                  sheet (duplicates are flagged and excluded prior to the draw)
                </li>
                <li>
                  Builds a weighted entry pool in which each entrant appears once per
                  earned entry (maximum {GIVEAWAY.maxEntriesPerPerson} times)
                </li>
                <li>
                  Randomly selects three (3) unique winners from the weighted pool
                </li>
                <li>
                  Logs the total pool size, each winner&apos;s name, email, and Entry ID
                  for documentation and odds calculation
                </li>
              </ul>
              <p className="mt-3">
                Bonus booking entries claimed on the form are subject to verification
                against Sponsor&apos;s booking records prior to the draw. Unverified
                booking bonuses will be removed and the entry adjusted (base entries
                and other verified bonuses remain valid).
              </p>
              <p className="mt-3">
                The random draw is conducted by Sponsor. Sponsor&apos;s decisions are
                final and binding on all matters relating to the Giveaway.
              </p>
            </RuleSection>

            <RuleSection number="9" title="Winner Notification">
              <p>
                Potential winners will be notified by email and/or phone within
                three (3) business days of the draw (on or around {announce}).
                Winners must respond to the notification within five (5) business
                days of the date of the notification. Failure to respond within that
                period may result in forfeiture of the prize, and an alternate winner
                may be selected.
              </p>
              <p className="mt-3">
                Sponsor reserves the right to verify eligibility of each potential
                winner before awarding any prize. Sponsor may require a signed
                affidavit of eligibility and/or a liability and publicity release as
                a condition of receiving a prize.
              </p>
            </RuleSection>

            <RuleSection number="10" title="Odds of Winning">
              <p>
                Odds of winning depend on the total number of valid entries received
                and the number of entries credited to each entrant. Because entries
                are weighted, a participant who books a cleaning and shares and follows
                (5 entries) has a proportionally higher chance of selection than a
                participant who only completes the free entry (1 entry).
              </p>
              <p className="mt-3">
                After the Entry Period closes, Sponsor will log the total weighted
                pool size in the draw record. This number represents the denominator
                for odds calculation: each entry in the pool has a 1/[pool size] chance
                of being drawn.
              </p>
            </RuleSection>

            <RuleSection number="11" title="General Conditions">
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  Sponsor reserves the right to cancel, suspend, or modify the
                  Giveaway if fraud, technical failures, or any other factor
                  impairs the integrity or proper functioning of the Giveaway, as
                  determined by Sponsor in its sole discretion.
                </li>
                <li>
                  Any attempt by any person to undermine the legitimate operation of
                  the Giveaway may be a violation of criminal and civil law.
                  Should such an attempt be made, Sponsor reserves the right to seek
                  damages and other remedies to the fullest extent permitted by law.
                </li>
                <li>
                  Sponsor&apos;s failure to enforce any term of these Official Rules
                  shall not constitute a waiver of that provision.
                </li>
                <li>
                  Employees of Facebook, Instagram, and their parent companies are
                  not eligible. This Giveaway is in no way sponsored, endorsed,
                  administered by, or associated with Facebook or Instagram.
                  Entrants release Facebook and Instagram from any and all liability
                  arising from their participation in this Giveaway.
                </li>
                <li>
                  Void where prohibited, taxed, or restricted by law.
                </li>
              </ul>
            </RuleSection>

            <RuleSection number="12" title="Limitation of Liability">
              <p>
                By entering, entrants agree to release and hold harmless Sponsor and
                its officers, directors, employees, and agents from and against any
                claim or cause of action arising out of participation in the Giveaway
                or receipt or use of any prize, including, but not limited to: (a) any
                technical errors that may prevent an entrant from submitting an entry;
                (b) any unauthorized human intervention in any part of the entry
                process; (c) printing errors in these materials; or (d) any injury or
                damage to persons or property which may be caused, directly or
                indirectly, in whole or in part, from entrant&apos;s participation in
                the Giveaway or receipt of any prize.
              </p>
            </RuleSection>

            <RuleSection number="13" title="Governing Law">
              <p>
                These Official Rules and the Giveaway are governed by the laws of the
                State of Ohio without regard to conflict-of-law principles. Any legal
                proceedings arising out of this Giveaway or relating to the Official
                Rules shall be brought exclusively in the state or federal courts
                located in Hamilton County, Ohio.
              </p>
            </RuleSection>

            <RuleSection number="14" title="Privacy">
              <p>
                Information collected through entry forms is used solely to administer
                the Giveaway, notify and verify winners, and — if the entrant opts in —
                to contact them about future Tri-State Grill Cleaning services and
                promotions. Sponsor will not sell or share entrant information with
                third parties for marketing purposes. Sponsor&apos;s standard privacy
                practices apply.
              </p>
            </RuleSection>

            <RuleSection number="15" title="Winners List">
              <p>
                To request a list of winners (available after {announce}), email
                Sponsor at{" "}
                <a href={`mailto:${GIVEAWAY.sponsor.contact}`} className="text-navy underline">
                  {GIVEAWAY.sponsor.contact}
                </a>{" "}
                with &quot;Giveaway Winners List Request&quot; in the subject line.
              </p>
            </RuleSection>

          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-muted">
              &copy; {new Date().getFullYear()} {GIVEAWAY.sponsor.name}. All rights reserved.
            </p>
            <Link href={GIVEAWAY.landingPath} className="mt-3 inline-block text-sm text-navy underline underline-offset-4">
              ← Back to Giveaway
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function RuleSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={`rule-${number}`} className="scroll-mt-24">
      <h2 className="font-display text-lg md:text-xl text-navy uppercase tracking-wide border-b border-border pb-2 mb-4">
        {number}. {title}
      </h2>
      <div className="text-sm text-ink leading-relaxed">{children}</div>
    </div>
  );
}

function BonusRow({
  entries,
  action,
  detail,
}: {
  entries: string;
  action: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bone p-4">
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold bg-amber-400 text-navy rounded-full px-2.5 py-1 shrink-0 mt-0.5">
          {entries}
        </span>
        <div>
          <p className="font-semibold text-navy text-sm">{action}</p>
          <p className="mt-1 text-xs text-ink/75 leading-relaxed">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function PrizeRow({
  place,
  title,
  description,
}: {
  place: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bone p-4">
      <p className="text-xs uppercase tracking-widest text-burgundy font-semibold">{place}</p>
      <p className="mt-1 font-display text-base text-navy">{title}</p>
      <p className="mt-1 text-xs text-ink/75 leading-relaxed">{description}</p>
    </div>
  );
}
