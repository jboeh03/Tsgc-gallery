/**
 * Lead qualifying — scores a new lead 0-100 with a per-dimension
 * breakdown. Pure-ish: the only async dependency is the returning-
 * customer lookup, which reads the CRM sheet.
 *
 * Used by every lead entry point:
 *   - /api/preview      (lib/preview/lead.ts → captureLead)
 *   - /api/imessage/ingest (confirmed bookings)
 *   - The Apps Script lead handler has a parallel qualifyLead_()
 *     for direct website-form posts (see integrations/apps-script-endpoint.js)
 *
 * If you tweak weights here, mirror the change in Apps Script.
 *
 * Total max = 30 + 30 + 15 + 25 + 10 = 110 — final score capped at 100
 * so referral/veteran/multi-grill bonuses can lift a borderline lead
 * without inflating the existing scale.
 */

import { classifyZip } from "./serviceArea";
import { classifyValue } from "./valueEstimator";
import { lookupCustomerType } from "./customerLookup";
import type {
  CustomerType,
  LeadFlag,
  LeadInput,
  LeadTier,
  ProximityTier,
  QualifiedLead,
  ScoreBreakdown,
  ValueTier,
} from "./types";

// ── Weights ───────────────────────────────────────────────────
const PROXIMITY_MAX = 30;
const VALUE_MAX = 30;
const CUSTOMER_MAX = 15;
const COMPLETENESS_MAX = 25;
const INTENT_MAX = 10;

const PROXIMITY_POINTS: Record<ProximityTier, number> = {
  core: PROXIMITY_MAX,
  extended: 22,
  fringe: 12,
  out_of_area: 0,
  unknown: 15,
};

const VALUE_POINTS: Record<ValueTier, number> = {
  premium: VALUE_MAX,
  standard_plus: 24,
  standard: 16,
  small: 10,
  unknown: 15,
};

const CUSTOMER_POINTS: Record<CustomerType, number> = {
  returning: CUSTOMER_MAX,
  new: 10,
  unknown: 8,
};

// Completeness fields and their individual weights (sum to COMPLETENESS_MAX).
const COMPLETENESS_FIELDS: Array<{ key: keyof LeadInput; label: string; weight: number }> = [
  { key: "name", label: "Name", weight: 3 },
  { key: "phone", label: "Phone", weight: 6 },
  { key: "email", label: "Email", weight: 3 },
  { key: "zip", label: "ZIP", weight: 3 },
  { key: "address", label: "Address", weight: 3 },
  { key: "grillDescription", label: "Grill", weight: 4 },
  { key: "services", label: "Services", weight: 2 },
  { key: "notes", label: "Notes", weight: 1 },
];

// Per-signal intent bonuses (each capped, total intent capped at INTENT_MAX).
const INTENT_REFERRAL_POINTS = 5;
const INTENT_VETERAN_POINTS = 5;
const INTENT_MULTI_GRILL_POINTS = 3;
const INTENT_DEADLINE_POINTS = 3;

// ── Tier cutoffs ──────────────────────────────────────────────
const TIER_CUTOFFS: Array<{ min: number; tier: LeadTier }> = [
  { min: 75, tier: "hot" },
  { min: 55, tier: "warm" },
  { min: 35, tier: "cool" },
  { min: 0, tier: "cold" },
];

export function classifyTier(score: number): LeadTier {
  for (const c of TIER_CUTOFFS) if (score >= c.min) return c.tier;
  return "cold";
}

export function tierBadgeColor(tier: LeadTier): { bg: string; text: string; label: string } {
  switch (tier) {
    case "hot": return { bg: "bg-burgundy/15", text: "text-burgundy", label: "HOT" };
    case "warm": return { bg: "bg-amber-100", text: "text-amber-800", label: "WARM" };
    case "cool": return { bg: "bg-blue-100", text: "text-blue-700", label: "COOL" };
    case "cold": return { bg: "bg-muted/20", text: "text-muted", label: "COLD" };
  }
}

// ── Signal detectors ──────────────────────────────────────────

// Notes phrases that essentially never appear in a real grill inquiry.
// Hits any of these → strong spam signal.
const SPAM_NOTES_PATTERNS = [
  /wikipedia/i,
  /\bseo\b/i,
  /respond with stop to opt-?out/i,
  /respond back to this email/i,
  /marketing services/i,
  /page creation/i,
  /world'?s most/i,
  /search engine ranking/i,
  /digital marketing/i,
];

// Tell-tale signs a field was filled with garbage (digits only, single
// char, etc.) — taken together with other signals, indicates spam.
function isGarbageField(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (v.length === 0) return false;
  if (v.length < 3 && !/^\d+$/.test(v)) return true; // very short non-numeric
  if (/^\d{1,3}$/.test(v) && v.length < 4) return true; // 1-3 digit number
  return false;
}

function looksLikeSpam(input: LeadInput, proximityTier: ProximityTier): boolean {
  const notesHit = SPAM_NOTES_PATTERNS.some((p) =>
    input.notes ? p.test(input.notes) : false
  );
  if (notesHit) return true;

  // Multiple garbage fields + out-of-area = almost certainly spam.
  const garbageCount = [
    input.grillDescription,
    input.notes && input.notes.length < 5 ? input.notes : null,
  ].filter((v) => isGarbageField(v ?? null)).length;
  if (garbageCount >= 1 && proximityTier === "out_of_area") return true;

  return false;
}

// Match a street address pattern in free text — used to credit
// completeness when the customer pasted their address into notes
// instead of an address field (the current website form doesn't
// have one).
const ADDRESS_RE =
  /\b\d{1,6}\s+[A-Za-z][\w'.-]*(?:\s+[A-Za-z][\w'.-]*){0,5}\s+(?:rd|road|st|street|ave|avenue|dr|drive|ln|lane|way|cir|circle|ct|court|pl|place|blvd|boulevard|hwy|highway|pkwy|parkway|ter|terrace|trail|trl|loop|crossing|square|sq|run|ridge|trace|commons?|mews|walk|row|park|grove|knoll|heights|hts|landing|estates?|manor)\b/i;

export function extractAddressFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(ADDRESS_RE);
  return m ? m[0] : null;
}

const VETERAN_RE = /\bvet\b|\bveteran\b|\bmilitary\b|\barmy\b|\bnavy\b|\bmarine\b|\bair[\s-]?force\b/i;
// Match "June 5", "June 5th", "by 6/5", "by next Friday", "deadline", etc.
// The (?:st|nd|rd|th)? suffix handles ordinals like "5th" — without it the
// `\b` after `\d` fails because "5" → "t" stays inside the word boundary.
const DEADLINE_RE =
  /\bby\s+(?:next\s+)?(?:mon|tues|wednes|thurs|fri|satur|sun)/i;
const DEADLINE_DATE_RE =
  /\b(?:by|before)\s+\w+\s+\d{1,2}(?:st|nd|rd|th)?\b|\b(?:jan|feb|mar|apr|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep|oct|nov|dec)\w*\s+\d{1,2}(?:st|nd|rd|th)?\b|\b(?:this|next)\s+(?:week|weekend|month)\b|\bdeadline\b|\bby\s+\d{1,2}\/\d{1,2}\b/i;
const REFERRAL_RE =
  /\breferred\s+by\b|\brecommended\s+by\b|\btold\s+me\s+about\b|\bsent\s+me\b|\bsaw\s+(?:your|the)\s+(?:flyer|sign|ad|truck)\b/i;

// Brand / type keywords used by the multi-grill detector. If two
// DIFFERENT brand-or-type tokens appear in the description, it's
// almost certainly a multi-grill setup. Built this way rather than
// looking for "and"/"+"/"," because product names like "Blaze LTE+"
// or descriptions like "4-burner, stainless" produced false positives.
// Brand / type tokens for the multi-grill detector. "Sedona" is
// deliberately omitted because Sedona IS the Lynx mid-tier line —
// "Sedona Lynx" would otherwise read as 2 brands when it's 1 grill.
// Same logic: don't list sub-brands that always appear with a parent.
const GRILL_BRAND_TOKENS = [
  "weber", "blackstone", "blaze", "lynx", "dcs", "hestan",
  "alfresco", "coyote", "viking", "napoleon", "wolf", "kalamazoo",
  "lion", "memphis", "twin eagles", "fire magic", "saber", "bull",
  "traeger", "pit boss", "pitboss", "rec tec", "rectec", "recteq",
  "yoder", "kamado joe", "big green egg", "primo",
  "smoker", "griddle", "kettle",
];

function isMultiGrill(grill: string | null | undefined): boolean {
  if (!grill) return false;
  const g = grill.toLowerCase();
  // Also accept explicit conjunctions between brand-like phrases.
  const explicitConjunction =
    /\bweber\b[\s.,]+(?:and|plus|&)[\s.,]*(?:\w+)/i.test(g) ||
    /\b(?:\w+)\s+(?:and|plus|&)\s+(?:weber|blackstone|traeger|napoleon|viking|lynx|blaze)\b/i.test(g);
  if (explicitConjunction) return true;
  // Count DISTINCT brand/type tokens. 2+ → multi-grill.
  const hits = new Set<string>();
  for (const tok of GRILL_BRAND_TOKENS) {
    if (g.indexOf(tok) >= 0) hits.add(tok);
    if (hits.size >= 2) return true;
  }
  return false;
}

function detectSignals(
  input: LeadInput,
  effectiveAddressFilled: boolean
): { intentPoints: number; signals: LeadFlag[]; allFlags: LeadFlag[] } {
  const signals: LeadFlag[] = [];
  let intentPoints = 0;

  // Referral — any referredBy-like signal in notes, or a non-empty
  // "Referred By" column (we don't get that as a separate field today
  // but it would land in notes when serialized).
  // For now treat any non-spam "by:" or "referred by" mention as a
  // referral. Most leads also won't surface this — Apps Script captures
  // it directly and counts it before calling qualifyLead.
  // (See qualifyLead_() in apps-script-endpoint.js for the website
  // form path, which passes the explicit referredBy.)

  const allFlags: LeadFlag[] = [];

  if (input.notes && REFERRAL_RE.test(input.notes)) {
    signals.push("referral");
    intentPoints += INTENT_REFERRAL_POINTS;
  }
  if (input.notes && VETERAN_RE.test(input.notes)) {
    signals.push("veteran");
    intentPoints += INTENT_VETERAN_POINTS;
  }
  if (isMultiGrill(input.grillDescription)) {
    signals.push("multi_grill");
    intentPoints += INTENT_MULTI_GRILL_POINTS;
  }
  if (input.notes && (DEADLINE_RE.test(input.notes) || DEADLINE_DATE_RE.test(input.notes))) {
    signals.push("has_deadline");
    intentPoints += INTENT_DEADLINE_POINTS;
  }

  // Address-in-notes is more of a completeness fix than an intent
  // signal — we surface it as a flag so the dashboard shows it, but
  // the points it earns flow through `completeness`, not `intent`.
  allFlags.push(...signals);
  if (effectiveAddressFilled && !input.address) {
    allFlags.push("address_in_notes");
  }

  return {
    intentPoints: Math.min(INTENT_MAX, intentPoints),
    signals,
    allFlags,
  };
}

function scoreCompleteness(
  input: LeadInput,
  addressIsEffectivelyFilled: boolean
): ScoreBreakdown["completeness"] {
  const filled: string[] = [];
  const missing: string[] = [];
  let points = 0;
  for (const f of COMPLETENESS_FIELDS) {
    let has: boolean;
    if (f.key === "address") {
      has = addressIsEffectivelyFilled;
    } else {
      const v = input[f.key];
      has = typeof v === "string" ? v.trim().length > 0 : v != null;
    }
    if (has) {
      filled.push(f.label);
      points += f.weight;
    } else {
      missing.push(f.label);
    }
  }
  return { points, filled, missing };
}

/**
 * Compute the score synchronously given a pre-resolved customer type.
 * Used internally by qualifyLead() and exported for the dashboard's
 * batch-rescore path (which fans out one customer lookup per row).
 */
export function qualifyLeadSync(
  input: LeadInput,
  customerType: CustomerType
): QualifiedLead {
  const proximityTier = classifyZip(input.zip);
  const value = classifyValue({
    description: input.grillDescription,
    agreedPriceUsd: input.agreedPriceUsd,
    estimatedPriceLow: input.estimatedPriceLow,
    estimatedPriceHigh: input.estimatedPriceHigh,
  });

  const spam = looksLikeSpam(input, proximityTier);

  const addressInNotes =
    !input.address && !!extractAddressFromText(input.notes);
  const addressEffectivelyFilled = !!input.address || addressInNotes;

  const completeness = scoreCompleteness(input, addressEffectivelyFilled);
  const { intentPoints, signals: intentSignals, allFlags } = detectSignals(
    input,
    addressEffectivelyFilled
  );

  const breakdown: ScoreBreakdown = {
    proximity: {
      tier: proximityTier,
      points: PROXIMITY_POINTS[proximityTier],
    },
    value: {
      tier: value.tier,
      points: VALUE_POINTS[value.tier],
      estimatedJobUsdLow: value.estimatedJobUsdLow,
      estimatedJobUsdHigh: value.estimatedJobUsdHigh,
    },
    customer: {
      type: customerType,
      points: CUSTOMER_POINTS[customerType],
    },
    completeness,
    intent: {
      points: intentPoints,
      signals: intentSignals,
    },
  };

  const rawScore =
    breakdown.proximity.points +
    breakdown.value.points +
    breakdown.customer.points +
    breakdown.completeness.points +
    breakdown.intent.points;

  // Spam overrides everything: 0 score, "cold" tier, flag surfaced.
  // Don't zero out the breakdown — the dashboard should still show
  // WHY we tanked it (out of area + garbage fields + spam phrases).
  if (spam) {
    return {
      score: 0,
      tier: "cold",
      flags: [...allFlags, "likely_spam"],
      breakdown,
    };
  }

  const score = Math.min(100, rawScore);
  return { score, tier: classifyTier(score), flags: allFlags, breakdown };
}

/**
 * Full async pipeline — does the returning-customer sheet lookup.
 * Also recognizes a non-empty referredBy: callers can pass it via
 * input.notes or as a separate flag the Apps Script side adds.
 */
export async function qualifyLead(input: LeadInput): Promise<QualifiedLead> {
  const customerType = await lookupCustomerType({
    phone: input.phone,
    email: input.email,
  });
  return qualifyLeadSync(input, customerType);
}

/**
 * Compact one-line summary for log lines and email subjects, e.g.
 * "82 HOT · core · standard+ · returning · 8/8 fields · +veteran".
 */
export function describeQualification(q: QualifiedLead): string {
  const parts = [
    `${q.score} ${q.tier.toUpperCase()}`,
    q.breakdown.proximity.tier,
    q.breakdown.value.tier.replace("_", "+"),
    q.breakdown.customer.type,
    `${q.breakdown.completeness.filled.length}/${
      q.breakdown.completeness.filled.length + q.breakdown.completeness.missing.length
    } fields`,
  ];
  if (q.flags.length > 0) parts.push("flags: " + q.flags.join(","));
  return parts.join(" · ");
}
