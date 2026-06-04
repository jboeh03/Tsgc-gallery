/**
 * Weber Spirit II Giveaway — campaign config, entry math, and service-area validation.
 *
 * Entry Period:
 *   Opens:    Friday, June 26, 2026 at 12:00 AM EDT
 *   Closes:   Saturday, July 4, 2026 at 11:59 PM EDT
 *   Announce: Tuesday, July 7, 2026
 *
 * Image swap: drop real photos at the paths in prize.grand.imageBefore /
 * imageAfter under /public/giveaway/ — no code changes needed.
 */

export const GIVEAWAY = {
  id: "weber-spirit-ii-july-2026",
  name: "Win a Restored Weber Spirit II",

  opensISO: "2026-06-26T04:00:00Z",   // 12:00 AM EDT June 26
  closesISO: "2026-07-05T03:59:59Z",  // 11:59 PM EDT July 4

  openDateDisplay: "Friday, June 26",
  openDateLong: "Friday, June 26, 2026",
  closeDateDisplay: "Saturday, July 4",
  closeDateLong: "Saturday, July 4, 2026 at 11:59 PM EDT",
  announceDateDisplay: "Tuesday, July 7, 2026",

  landingPath: "/giveaway",

  prize: {
    grand: {
      title: "Restored Weber Spirit II",
      subtitle: "Fully cleaned and restored — personally by Jeff",
      description:
        "A Weber Spirit II gas grill that Jeff is personally cleaning and restoring to like-new condition. Retail replacement value approx. $350–$500.",
      // Drop the real photos at these paths to replace placeholders — no code change needed.
      imageBefore: "/giveaway/weber-spirit-ii-before.jpg",
      imageAfter: "/giveaway/weber-spirit-ii-after.jpg",
    },
    second: {
      title: "One Free Professional Grill Cleaning",
      description:
        "One full professional cleaning from Tri-State Grill Cleaning — any model, any size — within our service area. Approximate value: $150–$250.",
    },
    third: {
      title: "One Free Annual Cleaning Membership",
      description:
        "Our annual cleaning membership: scheduled seasonal cleanings at a flat rate, so your grill is always ready. Approximate value: $200+.",
    },
  },

  entryWeights: {
    base: 1,    // Free on-site form entry — no purchase necessary
    booking: 3, // Book a cleaning — largest weight
    share: 1,   // Share on social (self-attested in form)
    follow: 1,  // Follow on social (self-attested in form)
  } as const,
  maxEntriesPerPerson: 5,

  serviceAreaLabel: "Cincinnati, Northern Kentucky, or Dayton",
  minAge: 18,

  sponsor: {
    name: "Tri-State Grill Cleaning",
    ownerName: "Jeff Boeh",
    contact: "jeff@cincygrillcleaning.com",
    phone: "(513) 790-4040",
    address: "Cincinnati, OH 45233",
    website: "https://tristategrillcleaning.com",
  },
} as const;

/**
 * Master visibility switch. While false, the giveaway is hidden from the
 * public site: the promo banner won't surface it and the /giveaway pages
 * 404. Flip to true to go live — the date windows below then gate the
 * active/upcoming states as normal.
 */
export const GIVEAWAY_PUBLIC = false;

export function isGiveawayActive(now: Date = new Date()): boolean {
  if (!GIVEAWAY_PUBLIC) return false;
  return (
    now.getTime() >= new Date(GIVEAWAY.opensISO).getTime() &&
    now.getTime() <= new Date(GIVEAWAY.closesISO).getTime()
  );
}

export function isGiveawayUpcoming(now: Date = new Date()): boolean {
  if (!GIVEAWAY_PUBLIC) return false;
  return now.getTime() < new Date(GIVEAWAY.opensISO).getTime();
}

export function isGiveawayClosed(now: Date = new Date()): boolean {
  return now.getTime() > new Date(GIVEAWAY.closesISO).getTime();
}

export function calcEntries({
  hasBooking,
  hasShare,
  hasFollow,
}: {
  hasBooking: boolean;
  hasShare: boolean;
  hasFollow: boolean;
}): number {
  const { base, booking, share, follow } = GIVEAWAY.entryWeights;
  const raw =
    base +
    (hasBooking ? booking : 0) +
    (hasShare ? share : 0) +
    (hasFollow ? follow : 0);
  return Math.min(raw, GIVEAWAY.maxEntriesPerPerson);
}

// ── Service-area ZIP validation ────────────────────────────────────────────
// Covers the core Cincinnati / NKY / Dayton service area.
// Add or remove ZIPs here as the service boundary changes.
export const SERVICE_AREA_ZIPS = new Set<string>([
  // Greater Cincinnati — Hamilton County
  "45202", "45203", "45204", "45205", "45206", "45207", "45208", "45209",
  "45210", "45211", "45212", "45213", "45214", "45215", "45216", "45217",
  "45218", "45219", "45220", "45223", "45224", "45225", "45226", "45227",
  "45228", "45229", "45230", "45231", "45232", "45233", "45236", "45237",
  "45238", "45239", "45240", "45241", "45242", "45243", "45244", "45245",
  "45246", "45247", "45248", "45249", "45251", "45252", "45255",
  // Greater Cincinnati — Warren County
  "45002", "45011", "45012", "45013", "45014", "45015", "45036", "45039",
  "45040", "45044", "45050", "45052", "45065", "45067", "45068", "45069",
  "45071", "45140", "45150", "45152", "45162",
  // Greater Cincinnati — Clermont County
  "45102", "45103", "45111", "45118", "45122", "45157", "45160", "45174", "45176",
  // Greater Cincinnati — Butler County
  "45030", "45033", "45034", "45041", "45042", "45051", "45053", "45054",
  "45056", "45064",
  // Northern Kentucky — Kenton County (Covington, Florence, Erlanger, Ft. Mitchell, etc.)
  "41001", "41011", "41014", "41015", "41016", "41017", "41018", "41019",
  "41051", "41091", "41092", "41094", "41095", "41097",
  // Northern Kentucky — Campbell County (Newport, Ft. Thomas, etc.)
  "41002", "41005", "41007", "41010", "41071", "41072", "41073", "41074",
  "41075", "41076", "41085",
  // Northern Kentucky — Boone County (Florence, Crestview Hills, Villa Hills, etc.)
  "41022", "41035", "41042", "41048", "41059", "41080", "41083",
  // Dayton — Montgomery County
  "45401", "45402", "45403", "45404", "45405", "45406", "45407", "45409",
  "45410", "45414", "45415", "45416", "45417", "45418", "45419", "45420",
  "45424", "45426", "45427", "45428", "45429", "45430", "45431", "45432",
  "45433", "45434", "45440", "45449", "45458", "45459",
  // Dayton — Greene County (Beavercreek, Centerville, Kettering, etc.)
  "45305", "45324", "45335", "45341", "45344", "45345", "45384", "45385", "45387",
  // Dayton — Warren County (Lebanon, Mason — partial overlap with Cincy Warren Co.)
  "45309", "45315", "45322", "45325", "45327", "45342", "45343", "45349",
  "45371", "45372", "45373", "45377", "45380",
]);

export function isInServiceArea(zip: string): boolean {
  const normalized = zip.trim().replace(/\D/g, "").slice(0, 5);
  return normalized.length === 5 && SERVICE_AREA_ZIPS.has(normalized);
}
