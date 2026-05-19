import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_RANGE = "Customers!A:I";

const FIELD_MAP: Record<string, string[]> = {
  id:          ["id", "customer id", "customer_id", "cust id"],
  name:        ["name", "customer", "customer name", "full name"],
  phone:       ["phone", "phone number", "mobile", "cell"],
  email:       ["email", "email address"],
  address:     ["address", "service address", "street"],
  grillBrand:  ["grill brand", "brand"],
  grillModel:  ["grill model", "model"],
  grillSerial: ["grill serial", "serial", "serial #"],
  notes:       ["notes", "comments"],
};

type Customer = {
  _row: number;
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  grillBrand: string;
  grillModel: string;
  grillSerial: string;
  notes: string;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const wantsHealth = url.searchParams.has("health");
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const range = process.env.GOOGLE_SHEET_RANGE || DEFAULT_RANGE;

  if (wantsHealth) {
    return NextResponse.json(
      { ok: true, configured: Boolean(apiKey && sheetId), range },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!apiKey || !sheetId) {
    return NextResponse.json(
      {
        error: "CRM not configured — set GOOGLE_SHEETS_API_KEY and GOOGLE_SHEET_ID in Vercel",
        configured: false,
      },
      { status: 500 }
    );
  }

  const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    sheetId
  )}/values/${encodeURIComponent(range)}?key=${encodeURIComponent(apiKey)}&majorDimension=ROWS`;

  let upstream: Response;
  try {
    upstream = await fetch(sheetsUrl);
  } catch (err) {
    return NextResponse.json({ error: "Upstream fetch failed", details: String(err) }, { status: 502 });
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `Google Sheets API ${upstream.status}`, details: text.slice(0, 500) },
      { status: 502 }
    );
  }

  const data = (await upstream.json()) as { values?: string[][] };
  const rows = data.values || [];
  if (rows.length < 2) {
    return NextResponse.json(
      { ok: true, total: 0, results: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const headers = rows[0].map((h) => String(h || "").toLowerCase().trim());
  const fieldIdx: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(FIELD_MAP)) {
    fieldIdx[field] = -1;
    for (const alias of aliases) {
      const i = headers.indexOf(alias);
      if (i >= 0) {
        fieldIdx[field] = i;
        break;
      }
    }
  }

  const customers: Customer[] = rows
    .slice(1)
    .map((row, i) => {
      const c: Record<string, unknown> = { _row: i + 2 };
      for (const [field, idx] of Object.entries(fieldIdx)) {
        c[field] = idx >= 0 && row[idx] != null ? String(row[idx]).trim() : "";
      }
      return c as Customer;
    })
    .filter((c) => c.name || c.id);

  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const id = (url.searchParams.get("id") || "").trim();

  let results: Customer[];
  if (id) {
    results = customers.filter((c) => c.id.toLowerCase() === id.toLowerCase());
  } else if (q) {
    results = customers
      .filter((c) => {
        const hay = `${c.id} ${c.name} ${c.phone} ${c.email} ${c.address}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 12);
  } else {
    results = customers.slice(0, 12);
  }

  return NextResponse.json(
    { ok: true, total: customers.length, results },
    { headers: { "Cache-Control": "no-store" } }
  );
}
