/**
 * Returning-customer detection.
 *
 * Scans existing leads + jobs across multiple sources for any phone
 * or email match against the incoming lead. Used by qualifyLead() to
 * award the "returning customer" points.
 *
 * Sources checked, in order:
 *   1. The current CRM sheet's 🌐 Website Leads tab (readLeads)
 *   2. The current CRM sheet's 📋 CRM + Jobs tab (readJobs)
 *   3. The legacy Squarespace lead intake sheet (LEGACY_LEAD_SHEET_ID)
 *      — kept around so customers from the pre-2024 site still count
 *      as returning. Set up as a separate spreadsheet, so it gets its
 *      own fetch with the existing GOOGLE_SHEETS_API_KEY.
 *
 * Why this isn't called from Apps Script: there's a parallel
 * lookupCustomerType_() in integrations/apps-script-endpoint.js for the
 * website-form path. It uses SpreadsheetApp.openById() (no API key
 * needed) and ALSO scans the legacy sheet. Keep both in sync — there's
 * no compile-time link.
 */

import { unstable_cache } from "next/cache";
import { readJobs, readLeads } from "@/lib/admin/sheets";
import type { CustomerType } from "./types";

const LEGACY_SHEET_ID =
  process.env.LEGACY_LEAD_SHEET_ID ||
  "1rv50ne0bFi84I9EEsZEjpo5JOwyNimyGK0EEIM_MxOI";
// Default tab is whichever non-hidden tab Squarespace wrote to (usually
// "Form Responses 1" or the form's name). Lets the user override
// without redeploying if their setup is different.
const LEGACY_SHEET_TAB = process.env.LEGACY_LEAD_SHEET_TAB || "";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

function normalizePhone(p: string | null | undefined): string {
  if (!p) return "";
  return String(p).replace(/[^\d]/g, "").replace(/^1(\d{10})$/, "$1");
}

function normalizeEmail(e: string | null | undefined): string {
  return (e || "").trim().toLowerCase();
}

/**
 * Discover the first non-hidden tab in a spreadsheet. Used as a fallback
 * when LEGACY_LEAD_SHEET_TAB isn't set — Squarespace's response tab name
 * varies per form so we don't want to hard-code it.
 */
async function discoverFirstTab(sheetId: string): Promise<string | null> {
  if (!API_KEY) return null;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}` +
    `?fields=sheets(properties(title,hidden))&key=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    sheets?: { properties?: { title?: string; hidden?: boolean } }[];
  };
  const first = data.sheets?.find((s) => !s.properties?.hidden);
  return first?.properties?.title ?? null;
}

async function fetchLegacyRows(): Promise<string[][]> {
  if (!API_KEY) return [];
  const tab = LEGACY_SHEET_TAB || (await discoverFirstTab(LEGACY_SHEET_ID));
  if (!tab) return [];
  const range = `${tab}!A:Z`;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(LEGACY_SHEET_ID)}` +
    `/values/${encodeURIComponent(range)}?key=${encodeURIComponent(API_KEY)}` +
    `&majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Legacy sheet ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { values?: string[][] };
  return data.values ?? [];
}

/**
 * Build a lookup index from the legacy sheet — { phones: Set, emails: Set }.
 * Cached for 5 minutes; the legacy sheet is historical so it changes rarely
 * and we don't want a fetch per incoming lead.
 *
 * Column detection is header-name based (case-insensitive) with aliases
 * for the common Squarespace form field names.
 */
const readLegacyIndexCached = unstable_cache(
  async (): Promise<{ phones: Set<string>; emails: Set<string> }> => {
    const phones = new Set<string>();
    const emails = new Set<string>();
    let rows: string[][];
    try {
      rows = await fetchLegacyRows();
    } catch (err) {
      console.error(
        "[leads] legacy sheet read failed",
        err instanceof Error ? err.message : err
      );
      return { phones, emails };
    }
    if (rows.length < 2) return { phones, emails };

    const headers = rows[0].map((h) => String(h || "").toLowerCase().trim());
    const phoneIdx: number[] = [];
    const emailIdx: number[] = [];
    headers.forEach((h, i) => {
      if (h.includes("phone") || h.includes("mobile") || h.includes("cell")) phoneIdx.push(i);
      if (h.includes("email") || h.includes("e-mail")) emailIdx.push(i);
    });

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      for (const pi of phoneIdx) {
        const p = normalizePhone(row[pi]);
        if (p) phones.add(p);
      }
      for (const ei of emailIdx) {
        const e = normalizeEmail(row[ei]);
        if (e) emails.add(e);
      }
    }
    return { phones, emails };
  },
  ["legacy-lead-index"],
  { revalidate: 5 * 60, tags: ["legacy-lead-index"] }
);

export async function lookupCustomerType(args: {
  phone: string | null;
  email: string | null;
}): Promise<CustomerType> {
  const phone = normalizePhone(args.phone);
  const email = normalizeEmail(args.email);
  if (!phone && !email) return "unknown";

  // If the Sheets API key isn't set, fail open as "unknown" — the
  // customer type is one of four scoring dimensions, not a hard blocker.
  if (!API_KEY) return "unknown";

  try {
    const [leads, jobs, legacy] = await Promise.all([
      readLeads(),
      readJobs(),
      readLegacyIndexCached(),
    ]);
    const matches = (text: string) => {
      if (!text) return false;
      const p = normalizePhone(text);
      const e = normalizeEmail(text);
      return (phone && p === phone) || (email && e === email);
    };
    for (const l of leads) {
      if (matches(l.phone) || matches(l.email)) return "returning";
    }
    for (const j of jobs) {
      if (matches(j.phone) || matches(j.email)) return "returning";
    }
    if (phone && legacy.phones.has(phone)) return "returning";
    if (email && legacy.emails.has(email)) return "returning";
    return "new";
  } catch (err) {
    console.error(
      "[leads] customer lookup failed",
      err instanceof Error ? err.message : err
    );
    return "unknown";
  }
}
