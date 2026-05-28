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
 */

import { classifyZip } from "./serviceArea";
import { classifyValue } from "./valueEstimator";
import { lookupCustomerType } from "./customerLookup";
import type {
  CustomerType,
  LeadInput,
  LeadTier,
  ProximityTier,
  QualifiedLead,
  ScoreBreakdown,
  ValueTier,
} from "./types";

// ── Weights (must sum to 100) ─────────────────────────────────
const PROXIMITY_MAX = 30;
const VALUE_MAX = 30;
const CUSTOMER_MAX = 15;
const COMPLETENESS_MAX = 25;

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

function scoreCompleteness(input: LeadInput): ScoreBreakdown["completeness"] {
  const filled: string[] = [];
  const missing: string[] = [];
  let points = 0;
  for (const f of COMPLETENESS_FIELDS) {
    const v = input[f.key];
    const has = typeof v === "string" ? v.trim().length > 0 : v != null;
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
  const completeness = scoreCompleteness(input);

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
  };

  const score = Math.min(
    100,
    breakdown.proximity.points +
      breakdown.value.points +
      breakdown.customer.points +
      breakdown.completeness.points
  );

  return { score, tier: classifyTier(score), breakdown };
}

/** Full async pipeline — does the returning-customer sheet lookup. */
export async function qualifyLead(input: LeadInput): Promise<QualifiedLead> {
  const customerType = await lookupCustomerType({
    phone: input.phone,
    email: input.email,
  });
  return qualifyLeadSync(input, customerType);
}

/**
 * Compact one-line summary for log lines and email subjects, e.g.
 * "82 HOT · core · standard+ · returning · 8/8 fields".
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
  return parts.join(" · ");
}
