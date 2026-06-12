/**
 * Father's Day 2026 campaign configuration.
 *
 * Self-contained config mirroring lib/campaign.ts's shape — it drives only the
 * /fathers-day landing page. It intentionally does NOT touch the site-wide promo
 * banner or the shared quote-form logic; CTAs deep-link to /quote?promo=CODE and
 * the quote form's free-text promo field carries the code through.
 *
 * Father's Day 2026 is Sunday, June 21. Offers end midnight EDT at the close of
 * the day (endISO = 2026-06-22T03:59:59Z). When the campaign ends the landing
 * page flips to an "ended" state — no manual deploy needed.
 *
 * TWO offers:
 *   1. DADS25  — 25% off any single cleaning (treat Dad, or gift it to him).
 *   2. DADSBOGO — Buy one, get the 2nd grill 50% off. Full price on the first,
 *      half off the second. From $299 for two smaller grills ($199 + ~$99.50),
 *      scaling up by model/size. Both must be booked AND paid before Father's Day.
 */
export const FATHERS_DAY = {
  id: "fathers-day-2026",
  name: "Father's Day 2026",
  // EDT — Cincinnati is Eastern. Midnight at the end of Father's Day (Sun Jun 21).
  endISO: "2026-06-22T03:59:59Z",
  shortDeadline: "Sun, June 21",
  longDeadline: "midnight on Father's Day · June 21, 2026",
  landingPath: "/fathers-day",
  tiers: [
    {
      id: "single",
      code: "DADS25",
      kind: "percent",
      percent: 25,
      label: "For Dad — or from you",
      headline: "25% off any cleaning",
      blurb:
        "Any single grill, any model. Treat Dad to a deep clean — or gift it to him. The easy way to hand back a grill that looks, and cooks, like the day he bought it.",
      featured: false,
    },
    {
      id: "bogo",
      code: "DADSBOGO",
      kind: "bogo",
      percent: 50, // the SECOND grill is 50% off
      priceFrom: 299, // from $199 + ~$99.50 for two smaller grills
      label: "The Bundle",
      headline: "Buy one, get the 2nd grill 50% off",
      blurb:
        "Two grills, one visit. Pay full price on the first and the second is half off — your grill and Dad's, or two at one address. From $299 for two smaller grills, scaling up by size. Both must be booked & paid before Father's Day.",
      featured: true,
    },
  ],
} as const;

export type FathersDayTier = (typeof FATHERS_DAY.tiers)[number];

export function isFathersDayActive(now: Date = new Date()): boolean {
  return now.getTime() <= new Date(FATHERS_DAY.endISO).getTime();
}

export function tierByCode(
  code: string | null | undefined,
): FathersDayTier | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return FATHERS_DAY.tiers.find((t) => t.code === upper);
}

// ───────────────────────── Booking flow (DADS25 "book + pay") ──────────────
//
// The standard 25%-off deal lets a customer book, schedule, and pay a flat
// $299 now. $299 is the full (discounted) price for most grills; for a larger
// / premium grill it's a minimum deposit applied as a credit toward the full
// price, which we confirm within 24–48h. Scheduling rules: two slots a day,
// Monday–Thursday only, nothing within 72h of booking. All times Eastern.

/** Flat charge to book + schedule + confirm a standard-deal cleaning. */
export const FD_BOOKING_DEPOSIT = 299;

/** Minimum notice before a bookable day (hours). */
export const FD_LEAD_HOURS = 72;

/** The two daily windows. `start` (HH:mm, ET) drives the calendar event. */
export const FD_SLOTS = [
  { id: "am", label: "10am – 1pm", start: "10:00" },
  { id: "pm", label: "2pm – 5pm", start: "14:00" },
] as const;

export type FdSlot = (typeof FD_SLOTS)[number];
export type FdSlotId = FdSlot["id"];

export function fdSlotById(id: string | null | undefined): FdSlot | undefined {
  return FD_SLOTS.find((s) => s.id === id);
}

export function fdSlotByStart(start: string | null | undefined): FdSlot | undefined {
  return FD_SLOTS.find((s) => s.start === start);
}

const ET_TZ = "America/New_York";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** yyyy-mm-dd for a Date, evaluated in Eastern time. */
function etYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ET_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** 0=Sun … 6=Sat for a Date, evaluated in Eastern time. */
function etWeekday(d: Date): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: ET_TZ, weekday: "short" }).format(d);
  return WEEKDAYS.indexOf(wd);
}

/**
 * Candidate booking dates (yyyy-mm-dd, ET): Monday–Thursday only, at least
 * FD_LEAD_HOURS out, looking `daysAhead` days forward. Capacity (slot already
 * taken) is layered on separately in lib/fathers-day/availability.ts.
 */
export function fathersDayCandidateDates(now: Date = new Date(), daysAhead = 21): string[] {
  const earliest = etYmd(new Date(now.getTime() + FD_LEAD_HOURS * 3_600_000));
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(now.getTime() + i * 86_400_000);
    const ymd = etYmd(d);
    if (seen.has(ymd)) continue;
    seen.add(ymd);
    const wd = etWeekday(d);
    if (wd >= 1 && wd <= 4 && ymd >= earliest) out.push(ymd);
  }
  return out;
}
