/**
 * Returning-customer detection.
 *
 * Reads existing leads + jobs from the CRM sheet (via the already-wired
 * GOOGLE_SHEETS_API_KEY) and matches the incoming lead's phone/email
 * against past entries. Used by qualifyLead() to award the "returning
 * customer" points.
 *
 * Why we don't call this from Apps Script: Apps Script has its own
 * matching function (see qualifyLead_() in apps-script-endpoint.js)
 * which reads the same sheet directly via SpreadsheetApp — no API key
 * needed there. The two implementations both score returning vs. new
 * the same way; if matching rules diverge, sync both sides.
 */

import { readJobs, readLeads } from "@/lib/admin/sheets";
import type { CustomerType } from "./types";

function normalizePhone(p: string | null | undefined): string {
  if (!p) return "";
  return String(p).replace(/[^\d]/g, "").replace(/^1(\d{10})$/, "$1");
}

function normalizeEmail(e: string | null | undefined): string {
  return (e || "").trim().toLowerCase();
}

export async function lookupCustomerType(args: {
  phone: string | null;
  email: string | null;
}): Promise<CustomerType> {
  const phone = normalizePhone(args.phone);
  const email = normalizeEmail(args.email);
  if (!phone && !email) return "unknown";

  // If the Sheets API key isn't set, fail open as "new" — the customer
  // type is one of four scoring dimensions, not a hard blocker.
  if (!process.env.GOOGLE_SHEETS_API_KEY) return "unknown";

  try {
    const [leads, jobs] = await Promise.all([readLeads(), readJobs()]);
    const seen = (text: string) => {
      if (!text) return false;
      const p = normalizePhone(text);
      const e = normalizeEmail(text);
      return (phone && p === phone) || (email && e === email);
    };
    for (const l of leads) {
      if (seen(l.phone) || seen(l.email)) return "returning";
    }
    for (const j of jobs) {
      if (seen(j.phone) || seen(j.email)) return "returning";
    }
    return "new";
  } catch (err) {
    console.error(
      "[leads] customer lookup failed",
      err instanceof Error ? err.message : err
    );
    return "unknown";
  }
}
