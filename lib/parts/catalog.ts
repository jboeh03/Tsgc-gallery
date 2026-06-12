/**
 * Premium OEM grill-parts catalog for the /parts storefront.
 *
 * SERVER-ONLY. The raw dealer price sheet (BBQ Depot) is confidential — the
 * dealer figures live in a module-private literal (RAW) and are converted to
 * retail at definition time via retailFromDealer(). Nothing here exports a
 * dealer price, and the Part type has no dealerPrice field, so the wholesale
 * numbers can never reach the browser (RSC payload, props, or checkout JSON).
 * The `server-only` import makes an accidental client import a build error.
 *
 * Retail = round(dealer * 1.5). Adding a part: append to RAW. Pricing changes
 * are business decisions — edit the dealer figure, not the retail output.
 */

import "server-only";

export const MARKUP = 1.5;
/** Flat shipping fee (USD) for ship-to-me orders. Install orders ship free. */
export const SHIPPING_FEE = 24;

export type PartBrand =
  | "Alfresco"
  | "AOG"
  | "Artisan"
  | "DCS"
  | "Delta Heat"
  | "Lynx"
  | "Sedona"
  | "Twin Eagles"
  | "Viking"
  | "Wolf"
  | "Universal";

export type PartCategory =
  | "burners"
  | "grates"
  | "electrodes"
  | "heat-shields"
  | "flash-tubes"
  | "microswitches";

export type Part = {
  id: string;
  brand: PartBrand;
  /** Our catalog part number. */
  partNumber: string;
  /** Original OEM part number (for fitment confirmation). */
  oemPartNumber: string;
  name: string;
  category: PartCategory;
  /** Models / series this part fits. */
  modelsFit: string[];
  dimensions?: string;
  /** Retail price in whole USD — already round(dealer * MARKUP). No dealer field. */
  retailPrice: number;
  featured?: boolean;
};

/** Category display labels (page groups by brand; category rides as a tag). */
export const PART_CATEGORY_LABELS: Record<PartCategory, string> = {
  burners: "Burner",
  grates: "Cooking Grate",
  electrodes: "Electrode / Igniter",
  "heat-shields": "Heat Shield / Tray",
  "flash-tubes": "Flash Tube",
  microswitches: "Microswitch",
};

/** Brand order + one-line positioning shown on each brand section. */
export const PART_BRANDS: { id: PartBrand; label: string; blurb: string }[] = [
  { id: "Alfresco", label: "Alfresco", blurb: "Burners and sear grates for ALXE / AGBQ series built-ins." },
  { id: "AOG", label: "American Outdoor Grills", blurb: "Ignition parts for AOG built-in and portable grills." },
  { id: "Artisan", label: "Artisan", blurb: "Burners, grates, and electrodes for ART / AAE series." },
  { id: "DCS", label: "DCS", blurb: "Rod trays, ceramic rods, and electrodes for DCS gas grills." },
  { id: "Delta Heat", label: "Delta Heat", blurb: "Briquette tray assemblies for DHBQ series." },
  { id: "Lynx", label: "Lynx", blurb: "Cooking grates and electrodes across the full Lynx lineup." },
  { id: "Sedona", label: "Sedona by Lynx", blurb: "Standard and ProSear burners for Sedona grills." },
  { id: "Twin Eagles", label: "Twin Eagles", blurb: "Stainless hex grates, flash tubes, and electrodes." },
  { id: "Viking", label: "Viking", blurb: "OEM burners for Viking built-in grills." },
  { id: "Wolf", label: "Wolf", blurb: "Electrodes and flash tubes for Wolf OG grills." },
  { id: "Universal", label: "Universal", blurb: "Shared parts that fit several premium brands." },
];

const retailFromDealer = (dealer: number): number => Math.round(dealer * MARKUP);

/**
 * Module-private raw sheet. CONFIDENTIAL dealer prices live here and ONLY here.
 * Never export this array or any value derived directly from `dealer`.
 */
type RawPart = Omit<Part, "retailPrice"> & { dealer: number };

const RAW: RawPart[] = [
  // ── Alfresco ──────────────────────────────────────────────
  { id: "alfresco-burner-albq1", brand: "Alfresco", partNumber: "ALBQ1", oemPartNumber: "—", name: "Main Burner", category: "burners", modelsFit: ["AGBQ", "AL2", "ALXE series"], dimensions: "≈18¼ × 7½ in", dealer: 190, featured: true },
  { id: "alfresco-sear-grate-al0676", brand: "Alfresco", partNumber: "AL0676", oemPartNumber: "510-0676", name: "Sear Grate", category: "grates", modelsFit: ["ALX2-36"], dimensions: "18⅞ × 10½ in", dealer: 109 },
  { id: "alfresco-sear-grate-al0913", brand: "Alfresco", partNumber: "AL0913", oemPartNumber: "510-0913", name: "Sear Grate", category: "grates", modelsFit: ["ALX2-30", "ALXE-30"], dimensions: "12⅝ × 18⅞ in", dealer: 129 },
  { id: "alfresco-electrode-al0189", brand: "Alfresco", partNumber: "AL-0189", oemPartNumber: "210-0189", name: "Electrode", category: "electrodes", modelsFit: ["Alfresco gas grills"], dealer: 16.99 },

  // ── American Outdoor Grills ──────────────────────────────
  { id: "aog-electrode-b04", brand: "AOG", partNumber: "AOG-B04", oemPartNumber: "24-B-04", name: "Electrode", category: "electrodes", modelsFit: ["AOG built-in & portable"], dealer: 40 },

  // ── Artisan ──────────────────────────────────────────────
  { id: "artisan-burner-at1355", brand: "Artisan", partNumber: "AT1355", oemPartNumber: "290-0355", name: "Main Burner", category: "burners", modelsFit: ["ART2-32/36", "AAE26/32/36", "ARTP36/42"], dimensions: "17 × 6¼ in", dealer: 105 },
  { id: "artisan-burner-at1446", brand: "Artisan", partNumber: "AT1446", oemPartNumber: "290-0446", name: "Main Burner", category: "burners", modelsFit: ["AAEP-32", "ARTP-32"], dimensions: "17 × 5½ in", dealer: 99 },
  { id: "artisan-grate-at0323", brand: "Artisan", partNumber: "AT0323", oemPartNumber: "290-0323", name: "Cooking Grate (Narrow)", category: "grates", modelsFit: ["AAE-32/36", "ART-26/32/36", "ARTP-32"], dimensions: "18⅛ × 9 13⁄16 in", dealer: 75 },
  { id: "artisan-grate-at0324", brand: "Artisan", partNumber: "AT0324", oemPartNumber: "290-0324", name: "Cooking Grate", category: "grates", modelsFit: ["AAE-36", "AAEP-36", "ART-36", "ARTP-36"], dimensions: "18⅛ × 13 13⁄16 in", dealer: 109 },
  { id: "artisan-electrode-at0491", brand: "Artisan", partNumber: "AT0491", oemPartNumber: "210-0491", name: "Electrode", category: "electrodes", modelsFit: ["Artisan gas grills"], dealer: 16.99 },

  // ── DCS ──────────────────────────────────────────────────
  { id: "dcs-rod-tray-ds4421", brand: "DCS", partNumber: "DS4421", oemPartNumber: "214421P", name: 'Rod Tray (30")', category: "heat-shields", modelsFit: ["BGB30", "BGC30", "BH1-30R"], dimensions: "18⅝ × 11¼ in", dealer: 109, featured: true },
  { id: "dcs-ceramic-rods-ds5398", brand: "DCS", partNumber: "DS-5398", oemPartNumber: "245398", name: "Ceramic Rods (set of 10)", category: "heat-shields", modelsFit: ["DCS gas grills"], dimensions: '9.5 in · Made in USA', dealer: 80 },
  { id: "dcs-electrode-ds1718", brand: "DCS", partNumber: "DS-1718", oemPartNumber: "211718", name: "Collector Box Electrode", category: "electrodes", modelsFit: ["IG33", "04850"], dimensions: "≈29 in", dealer: 21.9 },

  // ── Delta Heat ───────────────────────────────────────────
  { id: "delta-heat-briquette-tray-dh1832", brand: "Delta Heat", partNumber: "DH1832", oemPartNumber: "23218-32", name: "Briquette Tray Assembly", category: "heat-shields", modelsFit: ["DHBQ32"], dealer: 160 },

  // ── Lynx ─────────────────────────────────────────────────
  { id: "lynx-grate-lx4704", brand: "Lynx", partNumber: "LX4704", oemPartNumber: "34704", name: "Cooking Grate", category: "grates", modelsFit: ["30 / 42 / 54 — all series"], dimensions: "21 × 13.5 in", dealer: 180, featured: true },
  { id: "lynx-grate-center-lx4705", brand: "Lynx", partNumber: "LX4705", oemPartNumber: "34705", name: "Cooking Grate (Center)", category: "grates", modelsFit: ["42 / 54 — all series"], dimensions: "12 × 21 in", dealer: 170 },
  { id: "lynx-grate-lx4706", brand: "Lynx", partNumber: "LX4706", oemPartNumber: "34706", name: "Cooking Grate", category: "grates", modelsFit: ['36" grills'], dealer: 220 },
  { id: "lynx-electrode-lx3556", brand: "Lynx", partNumber: "LX3556", oemPartNumber: "33556", name: "Middle / Right Electrode", category: "electrodes", modelsFit: ["Q, U series — all models"], dimensions: '4 in · 5⁄32" shoulder', dealer: 59 },
  { id: "lynx-electrode-lx3051", brand: "Lynx", partNumber: "LX-3051", oemPartNumber: "33051", name: "Left Electrode", category: "electrodes", modelsFit: ["M series", "Q, U left"], dimensions: "4¼ in", dealer: 69 },
  { id: "lynx-electrode-lx1807", brand: "Lynx", partNumber: "LX-1807", oemPartNumber: "31807", name: 'Electrode (34" wire)', category: "electrodes", modelsFit: ["Lynx gas grills"], dimensions: "34 in wire", dealer: 20 },

  // ── Sedona by Lynx ───────────────────────────────────────
  { id: "sedona-burner-sd1750", brand: "Sedona", partNumber: "SD-1750", oemPartNumber: "33750", name: "Main Burner", category: "burners", modelsFit: ["All models"], dealer: 99 },
  { id: "sedona-prosear-burner-sd3943", brand: "Sedona", partNumber: "SD-3943", oemPartNumber: "33943", name: "ProSear Burner", category: "burners", modelsFit: ["All ProSear models"], dimensions: "17 × 5½ in", dealer: 300 },

  // ── Twin Eagles ──────────────────────────────────────────
  { id: "twin-eagles-hex-grate-te3801", brand: "Twin Eagles", partNumber: "TE3801", oemPartNumber: "13801", name: '13" Stainless Hex Grate', category: "grates", modelsFit: ["TEBQ30/42", "OG30/42"], dimensions: "19 × 12¾ in", dealer: 230, featured: true },
  { id: "twin-eagles-hex-grate-te3802", brand: "Twin Eagles", partNumber: "TE3802", oemPartNumber: "13802", name: '12" Stainless Hex Grate', category: "grates", modelsFit: ["TEBQ42/54", "OG"], dimensions: "12 × 21 in", dealer: 220 },
  { id: "twin-eagles-hex-grate-te3875", brand: "Twin Eagles", partNumber: "TE-3875", oemPartNumber: "13875", name: '10" Stainless Hex Grate', category: "grates", modelsFit: ["TEBQ36", "OG36"], dimensions: "≈19½ × 10½ in", dealer: 209 },
  { id: "twin-eagles-electrode-te16321", brand: "Twin Eagles", partNumber: "TE-16321", oemPartNumber: "16321", name: "Hot Surface Electrode", category: "electrodes", modelsFit: ["Twin Eagles gas grills"], dealer: 55 },
  { id: "twin-eagles-flash-tube-wf4532", brand: "Twin Eagles", partNumber: "WF-4532 / TE-1750", oemPartNumber: "814532 / 21750", name: "Main Burner Flash Tube", category: "flash-tubes", modelsFit: ["Twin Eagles / Wolf OG"], dealer: 40 },
  { id: "twin-eagles-sear-flash-tube-wf5434", brand: "Twin Eagles", partNumber: "WF-5434 / TE-1765", oemPartNumber: "814534 / 21765", name: "Sear Flash Tube", category: "flash-tubes", modelsFit: ["Twin Eagles / Wolf OG"], dealer: 54 },

  // ── Wolf ─────────────────────────────────────────────────
  { id: "wolf-electrode-wf4542", brand: "Wolf", partNumber: "WF-4542", oemPartNumber: "814542", name: "Hot Surface Electrode", category: "electrodes", modelsFit: ["All OG grills"], dealer: 55 },

  // ── Viking ───────────────────────────────────────────────
  { id: "viking-burner-vk9479", brand: "Viking", partNumber: "VK-9479", oemPartNumber: "029479-000", name: "Main Burner", category: "burners", modelsFit: ["All models"], dealer: 320 },

  // ── Universal ────────────────────────────────────────────
  { id: "universal-microswitch-32845", brand: "Universal", partNumber: "32845", oemPartNumber: "15121 / 814664", name: "Ignition Microswitch", category: "microswitches", modelsFit: ["Twin Eagles", "Delta Heat", "Lynx", "Wolf"], dealer: 8 },
];

/** Public catalog — retail-priced, dealer-free. */
export const PARTS: Part[] = RAW.map(({ dealer, ...rest }) => ({
  ...rest,
  retailPrice: retailFromDealer(dealer),
}));

export function getPartById(id: string): Part | undefined {
  return PARTS.find((p) => p.id === id);
}

/** Group parts by brand, preserving PART_BRANDS order; drops empty brands. */
export function partsByBrand(): { id: PartBrand; label: string; blurb: string; items: Part[] }[] {
  return PART_BRANDS.map((b) => ({
    ...b,
    items: PARTS.filter((p) => p.brand === b.id).sort(
      (a, z) => Number(z.featured ?? false) - Number(a.featured ?? false)
    ),
  })).filter((b) => b.items.length > 0);
}
