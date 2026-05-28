#!/usr/bin/env node
/**
 * Dry-run script — pulls the last N rows from the 🌐 Website Leads tab
 * and runs each through the lead qualifier WITHOUT writing anything,
 * sending any SMS, or hitting Apps Script. Pure read + show.
 *
 * Usage:
 *   GOOGLE_SHEETS_API_KEY=... \
 *   GOOGLE_SHEET_ID=18DaRXOuAI8VjYd1qrpy-rr9SoOTi57VpfPOx05aolCo \
 *   npx tsx scripts/dry-run-qualify.ts [count=2]
 */

import { qualifyLead, describeQualification } from "../lib/leads/qualify";
import type { LeadInput } from "../lib/leads/types";

const SHEET_ID =
  process.env.GOOGLE_SHEET_ID || "18DaRXOuAI8VjYd1qrpy-rr9SoOTi57VpfPOx05aolCo";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const TAB = "🌐 Website Leads";

if (!API_KEY) {
  console.error("Missing GOOGLE_SHEETS_API_KEY");
  process.exit(1);
}

async function fetchRange(range: string): Promise<string[][]> {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}` +
    `/values/${encodeURIComponent(range)}?key=${encodeURIComponent(API_KEY!)}` +
    `&majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { values?: string[][] };
  return data.values ?? [];
}

function headerIndex(headers: string[]): Map<string, number> {
  const m = new Map<string, number>();
  headers.forEach((h, i) => m.set(String(h || "").toLowerCase().trim(), i));
  return m;
}

function pick(row: string[], idx: Map<string, number>, ...aliases: string[]): string {
  for (const a of aliases) {
    const i = idx.get(a.toLowerCase());
    if (i != null && row[i] != null) return String(row[i]).trim();
  }
  return "";
}

function smsBodyFor(name: string, phone: string, service: string, qualTag: string): string {
  return [`${qualTag} ${name || "(no name)"}`, phone, service.split(",")[0].trim()]
    .filter(Boolean)
    .join(" · ");
}

async function main() {
  const count = parseInt(process.argv[2] || "2", 10);
  const rows = await fetchRange(`${TAB}!A:T`);
  if (rows.length < 2) {
    console.log("No leads in sheet.");
    return;
  }
  const idx = headerIndex(rows[0]);
  const dataRows = rows.slice(1);
  const last = dataRows.slice(-count).reverse();

  console.log(`\n── Dry-run qualifying the last ${last.length} lead(s) ──\n`);

  for (let i = 0; i < last.length; i++) {
    const r = last[i];
    const name = pick(r, idx, "name");
    const phone = pick(r, idx, "phone");
    const email = pick(r, idx, "email");
    const zip = pick(r, idx, "zip");
    const services = pick(r, idx, "services", "service");
    const grillModel = pick(r, idx, "grill make/model", "grill model", "grill");
    const notes = pick(r, idx, "notes");
    const timestamp = pick(r, idx, "timestamp");
    const existingScore = pick(r, idx, "score");

    const input: LeadInput = {
      name: name || null,
      phone: phone || null,
      email: email || null,
      zip: zip || null,
      address: null,
      grillDescription: grillModel || null,
      estimatedPriceLow: null,
      estimatedPriceHigh: null,
      agreedPriceUsd: null,
      services: services || null,
      notes: notes || null,
    };

    const q = await qualifyLead(input);
    const qualTag = `[${q.tier.toUpperCase()} ${q.score}]`;

    console.log(`Lead #${i + 1} — row from ${timestamp || "(no timestamp)"}`);
    console.log(`  Name:    ${name || "—"}`);
    console.log(`  Phone:   ${phone || "—"}`);
    console.log(`  Email:   ${email || "—"}`);
    console.log(`  ZIP:     ${zip || "—"}`);
    console.log(`  Grill:   ${grillModel || "—"}`);
    console.log(`  Service: ${services || "—"}`);
    console.log("");
    console.log(`  📊 ${describeQualification(q)}`);
    console.log(`     Proximity:    ${q.breakdown.proximity.tier} → ${q.breakdown.proximity.points}/30`);
    console.log(`     Value:        ${q.breakdown.value.tier} → ${q.breakdown.value.points}/30 ($${q.breakdown.value.estimatedJobUsdLow}-${q.breakdown.value.estimatedJobUsdHigh})`);
    console.log(`     Customer:     ${q.breakdown.customer.type} → ${q.breakdown.customer.points}/15`);
    console.log(`     Completeness: ${q.breakdown.completeness.points}/25 (${q.breakdown.completeness.filled.join(", ")})`);
    console.log(`     Missing:      ${q.breakdown.completeness.missing.join(", ") || "(none)"}`);
    console.log("");
    if (existingScore) {
      console.log(`  Sheet has score=${existingScore} already on this row.`);
    }
    console.log("");
    console.log(`  📱 SMS body that would be sent to 5135784019@vtext.com:`);
    console.log(`     ${smsBodyFor(name, phone, services, qualTag)}`);
    console.log(`  ✉  Email subject that would be sent to ${process.env.NOTIFY_EMAIL || "jeff@cincygrillcleaning.com"}:`);
    console.log(`     ${qualTag} New Website Lead: ${name} — ${(services.split(",")[0] || "").trim()}`);
    console.log("");
    console.log("  " + "─".repeat(60));
    console.log("");
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
