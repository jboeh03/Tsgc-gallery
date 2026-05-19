import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      ok: true,
      where: "api/field/hello",
      method: req.method,
      node: process.version,
      hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
