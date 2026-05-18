import { NextRequest, NextResponse } from "next/server";
import { analyzeGrillPhoto } from "@/lib/preview/claude";
import { generateCleanedGrill } from "@/lib/preview/gemini";
import { captureLead } from "@/lib/preview/lead";
import { checkRateLimit } from "@/lib/preview/rateLimit";
import type { PreviewRequestBody, PreviewResponse } from "@/lib/preview/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function getIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

const CLAUDE_TIMEOUT_MS = 30_000;
const GEMINI_TIMEOUT_MS = 40_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timeout after ${ms / 1000}s`)),
        ms
      )
    ),
  ]);
}

export async function POST(req: NextRequest) {
  let body: PreviewRequestBody;
  try {
    body = (await req.json()) as PreviewRequestBody;
  } catch {
    return badRequest("Invalid JSON");
  }

  if (!body.imageBase64 || !body.imageMimeType) {
    return badRequest("Missing image");
  }
  if (!ALLOWED_MIME.has(body.imageMimeType)) {
    return badRequest("Unsupported image type — use JPG, PNG, or WebP");
  }
  if (body.imageBase64.length * 0.75 > MAX_BYTES) {
    return badRequest("Image too large — please use under 5 MB");
  }
  if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
    return badRequest("Valid email required");
  }
  if (!body.consent) {
    return badRequest("Consent required");
  }

  const ip = getIp(req);
  const limit = checkRateLimit({ ip, email: body.email });
  if (!limit.ok) {
    return NextResponse.json(
      {
        error:
          limit.reason === "email"
            ? "You've already used the preview tool today. Want a real quote? Visit /quote."
            : "Daily preview limit reached for this device. Try again tomorrow or visit /quote.",
      },
      { status: 429 }
    );
  }

  const imageBytes = Math.round(body.imageBase64.length * 0.75);
  console.log(
    `[preview] start ip=${ip} email=${body.email} imageBytes=${imageBytes}`
  );

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[preview] ANTHROPIC_API_KEY not set in this environment");
    return NextResponse.json(
      { error: "Server is missing the Anthropic API key." },
      { status: 500 }
    );
  }

  const claudeStart = Date.now();
  let assessment;
  try {
    assessment = await withTimeout(
      analyzeGrillPhoto({
        imageBase64: body.imageBase64,
        imageMimeType: body.imageMimeType,
      }),
      CLAUDE_TIMEOUT_MS,
      "Claude"
    );
    console.log(`[preview] claude ok in ${Date.now() - claudeStart}ms`);
  } catch (err) {
    console.error(
      `[preview] claude failed after ${Date.now() - claudeStart}ms`,
      err instanceof Error ? `${err.name}: ${err.message}` : err
    );
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Claude analysis failed: ${err.message}`
            : "Couldn't analyze the photo. Please try again.",
      },
      { status: 500 }
    );
  }

  const geminiStart = Date.now();
  const [image, leadId] = await Promise.all([
    withTimeout(
      generateCleanedGrill({
        imageBase64: body.imageBase64,
        imageMimeType: body.imageMimeType,
      }),
      GEMINI_TIMEOUT_MS,
      "Gemini"
    )
      .then((result) => {
        console.log(
          `[preview] gemini ${result ? "ok" : "skipped/null"} in ${
            Date.now() - geminiStart
          }ms`
        );
        return result;
      })
      .catch((err) => {
        console.error(
          `[preview] gemini failed after ${Date.now() - geminiStart}ms`,
          err instanceof Error ? `${err.name}: ${err.message}` : err
        );
        return null;
      }),
    captureLead({
      email: body.email,
      firstName: body.firstName,
      zip: body.zip,
      assessment,
      ip,
    }),
  ]);

  console.log(`[preview] done leadId=${leadId} hasImage=${!!image}`);

  const response: PreviewResponse = {
    assessment,
    generatedImage: image
      ? {
          dataUrl: `data:${image.mimeType};base64,${image.base64}`,
          provider: "gemini",
        }
      : null,
    leadId,
  };

  return NextResponse.json(response);
}
