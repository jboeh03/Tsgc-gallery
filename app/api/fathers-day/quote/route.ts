/**
 * Father's Day estimate — photo in, condition assessment + a 25%-off price
 * range out. Mirrors /api/weber/quote, but the range is the AI's estimate with
 * the DADS25 discount applied (the deal is brand-agnostic, so we use Claude's
 * own price estimate rather than a fixed tier table). No persistence here.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeGrillPhoto } from "@/lib/preview/claude";
import { isFathersDayActive, FATHERS_DAY, FD_BOOKING_DEPOSIT } from "@/lib/campaign-fathers-day";
import { publicFormAllowed, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const CLAUDE_TIMEOUT_MS = 30_000;
const FD_PERCENT = FATHERS_DAY.tiers.find((t) => t.id === "single")?.percent ?? 25;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms / 1000}s`)), ms)),
  ]);
}

export async function POST(req: NextRequest) {
  if (!isFathersDayActive()) {
    return NextResponse.json({ error: "The Father's Day offer has ended." }, { status: 410 });
  }

  let body: { imageBase64?: string; imageMimeType?: string };
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

  if (!(await publicFormAllowed("fathers-day-quote", clientIp(req)))) {
    return NextResponse.json({ error: "Too many tries — give it a minute." }, { status: 429 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Estimates are temporarily unavailable." }, { status: 503 });
  }

  try {
    const assessment = await withTimeout(
      analyzeGrillPhoto({ imageBase64: body.imageBase64, imageMimeType: mime as "image/jpeg" | "image/png" | "image/webp" }),
      CLAUDE_TIMEOUT_MS,
      "Claude"
    );
    const factor = (100 - FD_PERCENT) / 100;
    const fdLow = Math.round(assessment.estimatedPriceLow * factor);
    const fdHigh = Math.round(assessment.estimatedPriceHigh * factor);
    return NextResponse.json({
      assessment,
      regLow: assessment.estimatedPriceLow,
      regHigh: assessment.estimatedPriceHigh,
      fdLow,
      fdHigh,
      percent: FD_PERCENT,
      deposit: FD_BOOKING_DEPOSIT,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? `Couldn't read the photo: ${err.message}` : "Couldn't read the photo." },
      { status: 500 }
    );
  }
}
