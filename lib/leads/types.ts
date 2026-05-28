/**
 * Shared types for the lead qualifying system.
 *
 * Every new lead — whether it lands via the website quote form, the AI
 * preview tool, or the iMessage relay — gets scored 0-100 with a
 * breakdown so Jeff can prioritize callbacks instead of triaging on
 * vibes. The score is computed at intake and written to the sheet so
 * email alerts and the admin dashboard see the same number.
 *
 * Scoring weights (must sum to 100):
 *   - Proximity:       30 pts (ZIP tier vs service area)
 *   - Value tier:      30 pts (estimated job dollars from grill description)
 *   - Customer type:   15 pts (returning vs new, based on phone/email lookup)
 *   - Completeness:    25 pts (how much info Jeff has to act on)
 *
 * If any individual dimension changes weights, update qualifyLead_() in
 * integrations/apps-script-endpoint.js to match — the Apps Script copy
 * scores website-form leads inline at intake.
 */

export type ProximityTier =
  /** Within the home metro — Hamilton Co. and immediate NKY. ~30 min drive. */
  | "core"
  /** Inner suburbs / outer Cincinnati metro / inner Dayton. ~45-60 min. */
  | "extended"
  /** Outer reaches of the tri-state. >1 hr but still serviced. */
  | "fringe"
  /** Outside the service area — discourage. */
  | "out_of_area"
  /** ZIP not provided or not in the table. */
  | "unknown";

export type ValueTier =
  /** Built-in island, 36"+ grills, commercial-style. $500+ jobs. */
  | "premium"
  /** 4+ burner gas, premium pellet, kamado. $349-499. */
  | "standard_plus"
  /** 3-burner gas, mid-size pellet, kamado. $249-349. */
  | "standard"
  /** 2-burner, portable, kettle charcoal, small griddle. $199-249. */
  | "small"
  /** Couldn't infer anything about the grill. */
  | "unknown";

export type CustomerType =
  | "returning"
  | "new"
  /** Lookup hasn't been attempted (e.g. score computed before sheet read). */
  | "unknown";

export type LeadTier = "hot" | "warm" | "cool" | "cold";

export type ScoreBreakdown = {
  proximity: { tier: ProximityTier; points: number };
  value: { tier: ValueTier; points: number; estimatedJobUsdLow: number | null; estimatedJobUsdHigh: number | null };
  customer: { type: CustomerType; points: number };
  completeness: { points: number; filled: string[]; missing: string[] };
};

export type QualifiedLead = {
  score: number;
  tier: LeadTier;
  breakdown: ScoreBreakdown;
};

/** Input shape — superset of fields across all entry points. Any can be null. */
export type LeadInput = {
  name: string | null;
  phone: string | null;
  email: string | null;
  zip: string | null;
  address: string | null;
  /** Free-text grill description (e.g. "4-burner Weber Genesis II"). */
  grillDescription: string | null;
  /** Pre-computed estimated price range, e.g. from the AI preview tool. */
  estimatedPriceLow: number | null;
  estimatedPriceHigh: number | null;
  /** Already-agreed price (iMessage confirmed bookings). */
  agreedPriceUsd: number | null;
  /** Services requested (free-text list). */
  services: string | null;
  /** Any extra notes / context worth scoring as completeness. */
  notes: string | null;
};
