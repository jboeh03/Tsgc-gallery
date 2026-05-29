/**
 * Static ZIP → proximity tier map for the TSGC service area.
 *
 * Editing rules of thumb (drive time from the Cincinnati 45233 base):
 *   core         ~ ≤30 min   — Hamilton Co. and adjacent close-in NKY
 *   extended     ~ 30-50 min — outer Hamilton, near-in Warren/Butler/Clermont/Kenton/Boone
 *   fringe       ~ 50-75 min — outer Warren/Butler/Clermont, inner Dayton, mid NKY
 *   out_of_area  ~ >75 min   — Dayton outer, far-out NKY/Ohio
 *
 * If you start serving a new town, move its ZIP into the appropriate
 * Set below — no other code change needed. Unknown ZIPs return tier
 * "unknown" and earn neutral points (better than out_of_area, worse than
 * core) so we don't penalize valid leads just because the ZIP isn't yet
 * classified.
 */

import type { ProximityTier } from "./types";

// ── Cincinnati metro (OH) ──────────────────────────────────────
// Hamilton County (45202-45252) — the bulk of "core".
const CINCY_CORE = new Set<string>([
  "45202", "45203", "45204", "45205", "45206", "45207", "45208", "45209",
  "45211", "45212", "45213", "45214", "45215", "45216", "45217", "45218",
  "45219", "45220", "45223", "45224", "45225", "45226", "45227", "45229",
  "45230", "45231", "45232", "45233", "45236", "45237", "45238", "45239",
  "45240", "45241", "45242", "45243", "45244", "45246", "45247", "45248",
  "45249", "45251", "45252",
]);

// Clermont, Warren, Butler — outer Cincy metro.
const CINCY_EXTENDED = new Set<string>([
  // Clermont (eastern suburbs — Anderson, Milford, Loveland, Batavia)
  "45102", "45103", "45106", "45122", "45140", "45150", "45152", "45174",
  "45245", "45255",
  // Butler (Hamilton, Mason, West Chester, Fairfield)
  "45011", "45013", "45014", "45015", "45042", "45044", "45050", "45069",
  // Warren (Mason, Loveland, Lebanon)
  "45034", "45036", "45039", "45040", "45065", "45066", "45067", "45068",
]);

// Outer fringes of Butler/Warren/Clermont counties.
const CINCY_FRINGE = new Set<string>([
  "45001", "45002", "45030", "45033", "45041", "45051", "45052", "45053",
  "45054", "45055", "45056", "45070", "45071",
  "45111", "45142", "45146", "45153", "45154", "45156", "45157", "45160",
  "45162", "45168", "45176",
]);

// ── Northern Kentucky ──────────────────────────────────────────
// Kenton/Campbell/Boone core (Covington, Newport, Bellevue, Florence,
// Fort Thomas, Edgewood, Erlanger, Independence)
const NKY_CORE = new Set<string>([
  // Kenton
  "41011", "41014", "41015", "41016", "41017", "41018", "41019",
  // Campbell
  "41071", "41072", "41073", "41074", "41075", "41076", "41085",
  // Boone (close-in)
  "41005", "41042", "41048", "41051", "41091", "41094",
]);

// Outer NKY — still serviceable but adds travel.
const NKY_EXTENDED = new Set<string>([
  // Boone outer (Burlington, Hebron, Petersburg, Walton, Verona)
  "41001", "41003", "41004", "41008", "41030", "41040", "41063", "41080",
  "41086", "41092", "41095", "41097",
  // Campbell/Pendleton outer
  "41006", "41007", "41010", "41059", "41099",
  // Grant/Bracken
  "41035", "41043", "41044", "41045", "41046", "41054", "41064", "41065",
]);

// ── Dayton metro (OH) ──────────────────────────────────────────
// Dayton metro is intentionally part of the service area but is ~1 hr
// from the Cincinnati base — so even "core" Dayton ZIPs land as fringe
// from the scoring perspective. If Jeff opens a second base in Dayton,
// promote these to core/extended at that point.
const DAYTON_FRINGE = new Set<string>([
  // Montgomery County (Dayton, Kettering, Centerville, Beavercreek)
  "45402", "45403", "45404", "45405", "45406", "45409", "45410", "45414",
  "45415", "45417", "45418", "45419", "45420", "45424", "45426", "45429",
  "45430", "45431", "45432", "45434", "45439", "45440", "45449", "45458",
  "45459",
  // Greene/Miami inner
  "45305", "45307", "45324", "45342", "45343", "45344", "45370", "45385",
  // Warren — Springboro/Centerville fringe overlapping Dayton
  "45449",
]);

// Outer Dayton metro — past the practical service distance.
const DAYTON_OUT = new Set<string>([
  "45301", "45308", "45309", "45314", "45315", "45316", "45319", "45322",
  "45323", "45325", "45327", "45331", "45333", "45351", "45354", "45356",
  "45358", "45359", "45360", "45361", "45362", "45369", "45371", "45373",
  "45377", "45381", "45382", "45383", "45387", "45389",
]);

// Final lookup: longest-prefix-style precedence (core beats extended, etc.).
export function classifyZip(zipRaw: string | null | undefined): ProximityTier {
  if (!zipRaw) return "unknown";
  const zip = String(zipRaw).trim().slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return "unknown";

  if (CINCY_CORE.has(zip) || NKY_CORE.has(zip)) return "core";
  if (CINCY_EXTENDED.has(zip) || NKY_EXTENDED.has(zip)) return "extended";
  if (CINCY_FRINGE.has(zip) || DAYTON_FRINGE.has(zip)) return "fringe";
  if (DAYTON_OUT.has(zip)) return "out_of_area";

  // Heuristic fallback — only catches ZIPs in the immediate Cincinnati
  // / NKY / Dayton range. Previously the fallback was so loose that
  // Columbus suburbs (43xxx, ~110 mi away) scored as 'fringe' — that
  // gave them points they didn't deserve. Now anything outside the
  // tri-state ZIP prefixes lands in out_of_area.
  if (/^45[0-2]/.test(zip)) return "extended"; // Greater Cincinnati + inner Dayton
  if (/^41[0-1]/.test(zip)) return "extended"; // NKY
  // Adjacent Indiana (47xxx) only along the Cincinnati border counts as fringe.
  // Lawrenceburg = 47025, Aurora = 47001, Rising Sun = 47040, Brookville = 47012.
  if (/^4700/.test(zip) || /^4702/.test(zip) || /^4704/.test(zip) || /^4701/.test(zip)) {
    return "fringe";
  }
  return "out_of_area";
}

export function proximityLabel(tier: ProximityTier): string {
  switch (tier) {
    case "core": return "Core (≤30 min)";
    case "extended": return "Extended (30-50 min)";
    case "fringe": return "Fringe (50-75 min)";
    case "out_of_area": return "Out of area";
    case "unknown": return "Unknown ZIP";
  }
}
