/**
 * Gemini 2.5 Flash Image — image-to-image generation.
 * Free tier on Google AI Studio (no credit card required).
 *
 * If GEMINI_API_KEY is not set, generation is skipped and the feature
 * gracefully degrades to assessment-only mode.
 */

const GEMINI_MODEL = "gemini-2.5-flash-image-preview";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const PROMPT = `Transform this dirty grill photo into a realistic "after professional deep cleaning" version of the SAME grill in the SAME location with the SAME lighting.

KEEP IDENTICAL:
- The exact grill model, shape, and dimensions
- The location, background, and surroundings (patio, walls, deck, plants)
- The camera angle and lighting
- Time of day and weather

CHANGE:
- Remove carbon buildup from the grates so they are clean and uniformly dark
- Remove grease and soot from the hood interior — restore stainless steel to a clean appearance
- Clean the flavorizer bars, heat shields, and drip pan to factory condition
- Remove discoloration and stains from exterior stainless surfaces
- Maintain realistic patina; do NOT make it look brand-new or showroom-fresh

The output should look like the same homeowner's grill 4 hours after a professional service — clean and well-maintained, not staged.`;

export interface GeminiResult {
  mimeType: string;
  base64: string;
}

export async function generateCleanedGrill(args: {
  imageBase64: string;
  imageMimeType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<GeminiResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: args.imageMimeType,
              data: args.imageBase64,
            },
          },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
    },
  };

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[gemini] generation failed", res.status, errText.slice(0, 500));
    return null;
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inline_data?: { mime_type: string; data: string };
          inlineData?: { mimeType: string; data: string };
        }>;
      };
    }>;
  };

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const inline = p.inline_data ?? p.inlineData;
    if (!inline) continue;
    const mimeType =
      "mime_type" in inline ? inline.mime_type : (inline as { mimeType: string }).mimeType;
    if (mimeType?.startsWith("image/")) {
      return { mimeType, base64: inline.data };
    }
  }
  return null;
}
