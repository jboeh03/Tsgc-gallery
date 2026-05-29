/**
 * Google Sheets read layer for the /admin dashboard.
 *
 * The Apps Script in integrations/apps-script-endpoint.js writes to the
 * "🌐 Website Leads" tab on every form submission. The "📋 CRM + Jobs"
 * tab is Jeff's master record (job status, completed dates, hours).
 *
 * We read with an API key (server-side only). The sheet must be set
 * to "Anyone with the link can view" — the URL is never exposed to
 * the browser, only the values fetched via this module are.
 *
 * Env vars (set on Vercel):
 *   GOOGLE_SHEETS_API_KEY   (required)
 *   GOOGLE_SHEET_ID         (required — defaults to the CRM sheet)
 */

import { unstable_cache } from "next/cache";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "18DaRXOuAI8VjYd1qrpy-rr9SoOTi57VpfPOx05aolCo";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

const WEBSITE_LEADS_TAB = "🌐 Website Leads";
const CRM_TAB = "📋 CRM + Jobs";
const CLICKS_TAB = "🔗 Affiliate Clicks";

export type Lead = {
  rowNumber: number;
  timestamp: string;
  status: string;
  name: string;
  phone: string;
  email: string;
  zip: string;
  services: string;
  grillModel: string;
  source: string;
  referredBy: string;
  bestTime: string;
  promoCode: string;
  notes: string;
  leadId: string;
  // Lead qualifying — populated when the Apps Script handler wrote the
  // row with score columns. Older rows have empty strings here.
  score: string;
  tier: string;
  proximity: string;
  valueTier: string;
  customerType: string;
  completeness: string;
  intent: string;
  flags: string;
};

export type Job = {
  rowNumber: number;
  leadId: string;
  date: string;
  name: string;
  phone: string;
  email: string;
  zip: string;
  service: string;
  grillModel: string;
  source: string;
  referredBy: string;
  notes: string;
  status: string;
};

export type AffiliateClick = {
  rowNumber: number;
  timestamp: string;
  productId: string;
  productName: string;
  affiliate: string;
  destinationUrl: string;
  referer: string;
  userAgent: string;
};

export type SheetHealth = {
  configured: boolean;
  ok: boolean;
  error?: string;
  sheetId?: string;
};

async function fetchRange(range: string): Promise<string[][]> {
  if (!API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY not set");
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}` +
    `/values/${encodeURIComponent(range)}?key=${encodeURIComponent(API_KEY)}` +
    `&majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sheets API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { values?: string[][] };
  return data.values ?? [];
}

function buildHeaderIndex(headers: string[]): Map<string, number> {
  const idx = new Map<string, number>();
  headers.forEach((h, i) => idx.set(String(h || "").toLowerCase().trim(), i));
  return idx;
}

function pick(row: string[], idx: Map<string, number>, ...aliases: string[]): string {
  for (const a of aliases) {
    const i = idx.get(a.toLowerCase());
    if (i != null && row[i] != null) return String(row[i]).trim();
  }
  return "";
}

const readLeadsCached = unstable_cache(
  async (): Promise<Lead[]> => {
    // Pull A:V so we get the new score columns when present (rows
    // written before the qualifying release leave these blank).
    const rows = await fetchRange(`${WEBSITE_LEADS_TAB}!A:V`);
    if (rows.length < 2) return [];
    const idx = buildHeaderIndex(rows[0]);
    return rows.slice(1).map((row, i) => ({
      rowNumber: i + 2,
      timestamp: pick(row, idx, "timestamp"),
      status: pick(row, idx, "status"),
      name: pick(row, idx, "name"),
      phone: pick(row, idx, "phone"),
      email: pick(row, idx, "email"),
      zip: pick(row, idx, "zip"),
      services: pick(row, idx, "services", "service"),
      grillModel: pick(row, idx, "grill make/model", "grill model", "grill"),
      source: pick(row, idx, "source"),
      referredBy: pick(row, idx, "referred by", "referred"),
      bestTime: pick(row, idx, "best time"),
      promoCode: pick(row, idx, "promo code", "promo"),
      notes: pick(row, idx, "notes"),
      leadId: pick(row, idx, "lead id", "lead_id"),
      score: pick(row, idx, "score"),
      tier: pick(row, idx, "tier"),
      proximity: pick(row, idx, "proximity"),
      valueTier: pick(row, idx, "value tier", "value"),
      customerType: pick(row, idx, "customer type", "customer"),
      completeness: pick(row, idx, "completeness"),
      intent: pick(row, idx, "intent"),
      flags: pick(row, idx, "flags"),
    }));
  },
  ["admin-leads"],
  { revalidate: 60, tags: ["admin-leads"] }
);

const readJobsCached = unstable_cache(
  async (): Promise<Job[]> => {
    const rows = await fetchRange(`${CRM_TAB}!A:Z`);
    if (rows.length < 2) return [];
    const idx = buildHeaderIndex(rows[0]);
    return rows.slice(1).map((row, i) => ({
      rowNumber: i + 2,
      leadId: pick(row, idx, "lead id", "lead_id"),
      date: pick(row, idx, "date", "service date", "scheduled"),
      name: pick(row, idx, "name", "customer"),
      phone: pick(row, idx, "phone"),
      email: pick(row, idx, "email"),
      zip: pick(row, idx, "zip"),
      service: pick(row, idx, "service", "services"),
      grillModel: pick(row, idx, "grill model", "grill"),
      source: pick(row, idx, "source"),
      referredBy: pick(row, idx, "referred by", "referred"),
      notes: pick(row, idx, "notes"),
      status: pick(row, idx, "status"),
    }));
  },
  ["admin-jobs"],
  { revalidate: 60, tags: ["admin-jobs"] }
);

const readClicksCached = unstable_cache(
  async (): Promise<AffiliateClick[]> => {
    let rows: string[][];
    try {
      rows = await fetchRange(`${CLICKS_TAB}!A:G`);
    } catch {
      return [];
    }
    if (rows.length < 2) return [];
    const idx = buildHeaderIndex(rows[0]);
    return rows.slice(1).map((row, i) => ({
      rowNumber: i + 2,
      timestamp: pick(row, idx, "timestamp"),
      productId: pick(row, idx, "product id", "product_id"),
      productName: pick(row, idx, "product name", "name"),
      affiliate: pick(row, idx, "affiliate"),
      destinationUrl: pick(row, idx, "destination", "url"),
      referer: pick(row, idx, "referer", "referrer"),
      userAgent: pick(row, idx, "user agent", "ua"),
    }));
  },
  ["admin-clicks"],
  { revalidate: 60, tags: ["admin-clicks"] }
);

export async function readLeads() {
  return readLeadsCached();
}
export async function readJobs() {
  return readJobsCached();
}
export async function readAffiliateClicks() {
  return readClicksCached();
}

export async function checkSheetHealth(): Promise<SheetHealth> {
  if (!API_KEY) {
    return { configured: false, ok: false, error: "GOOGLE_SHEETS_API_KEY not set" };
  }
  try {
    await fetchRange(`${WEBSITE_LEADS_TAB}!A1:A1`);
    return { configured: true, ok: true, sheetId: SHEET_ID };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      sheetId: SHEET_ID,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export { SHEET_ID, WEBSITE_LEADS_TAB, CRM_TAB, CLICKS_TAB };
