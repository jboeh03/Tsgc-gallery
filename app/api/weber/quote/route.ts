/**
 * Weber sprint quote — photo in, condition assessment + price out. Mirrors the
 * /api/preview validation pattern. The PRICE is deterministic (priceQuote from
 * the campaign config); the photo only drives the assessment shown to the
 * customer + later stored on the HQ record. No persistence here.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeGrillPhoto } from "@/lib/preview/claude";
import { priceQuote, priceRange, isWeberSprintActive } from "@/lib/campaign-weber";
import { publicFormAllowed, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const CLAUDE_TIMEOUT_MS = 30_000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms / 1000}s`)), ms)),
  ]);
}

export async function POST(req: NextRequest) {
  if (!isWeberSprintActive()) {
    return NextResponse.json({ error: "The Weber sprint has ended." }, { status: 410 });
  }

  let body: { imageBase64?: string; imageMimeType?: string; burners?: number; neighbor?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mime = body.imageMimeType ?? "";
  if (!body.imageBase64 || !ALLOWED_MIME.has(mime)) {
    return NextResponse.json({ error: "Add a photo of your grill (JPG, PNG, or WebP)." }, { status: 400 });
  }
  if (body.imageBase64.length * 0.75 > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large — please use under 5 MB." }, { status: 400 });
  }
  const burners = Number(body.burners) || 4;

  if (!(await publicFormAllowed("weber-quote", clientIp(req)))) {
    return NextResponse.json({ error: "Too many tries — give it a minute." }, { status: 429 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Quoting is temporarily unavailable." }, { status: 503 });
  }

  try {
    const assessment = await withTimeout(
      analyzeGrillPhoto({ imageBase64: body.imageBase64, imageMimeType: mime as "image/jpeg" | "image/png" | "image/webp" }),
      CLAUDE_TIMEOUT_MS,
      "Claude"
    );
    const q = priceQuote({ burners, neighbor: Boolean(body.neighbor) });
    const r = priceRange({ burners, neighbor: Boolean(body.neighbor) });
    return NextResponse.json({
      assessment,
      basePrice: q.basePrice,
      discountedPrice: q.discountedPrice,
      rangeLow: r.low,
      rangeHigh: r.high,
      discountPercent: q.discountPercent,
      tierLabel: q.tier.label,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? `Couldn't read the photo: ${err.message}` : "Couldn't read the photo." },
      { status: 500 }
    );
  }
}
