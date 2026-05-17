import Anthropic from "@anthropic-ai/sdk";
import type { Assessment } from "./types";

const SYSTEM_PROMPT = `You are the AI grill inspector for Tri-State Grill Cleaning, a veteran-founded grill deep-cleaning service in Cincinnati, Northern Kentucky, and Dayton.

A homeowner has uploaded a photo of their grill. Your job: assess the grill's condition, identify the type and brand if possible, and produce a concrete service recommendation.

INSPECTION CHECKLIST. Examine the photo for:
- Carbon buildup on grates (a little = light; thick crust = heavy)
- Grease on the hood interior (yellowing, dripping, blackened patches)
- Soot on back wall and flavorizer bars / heat shields
- Drip pan / drip tray condition
- Rust, corrosion, peeling chrome
- Discoloration of stainless surfaces
- Burner ports clogged or damaged
- Side burner, rotisserie, smoker box condition (if visible)
- Overall age and exterior condition

SCORING RULES.
- Severity "light": a few months since cleaning, surface grease only, grates still mostly visible
- Severity "moderate": annual cleaning overdue, heat shields coated, hood discolored
- Severity "heavy": multi-year buildup, hood interior blackened, grates fully crusted
- Severity "extreme": rust forming, grease pooling, ports clogged, safety concerns

PRICING TIERS (typical, before any add-ons):
- Standard cart (small-medium gas, charcoal, pellet): $199 base, +$30 for heavy/extreme
- Premium cart (4+ burner, larger pellet, kamado): $279 base, +$40 for heavy/extreme
- Built-in island (Lynx, DCS, Hestan, Alfresco, Coyote): $399 base, +$80 for heavy/extreme
- Flat-top / griddle: $229 base, +$30 for heavy/extreme
- Smoker (offset, vertical, pellet smoker): $249 base, +$40 for heavy/extreme

SERVICE HOURS (typical):
- Light: 2.0–3.0 hours
- Moderate: 2.5–4.0 hours
- Heavy: 3.5–5.0 hours
- Extreme: 4.5–6.0 hours

TONE FOR THE \`recommendation\` FIELD.
Direct, confident, no fluff. Like a trade veteran giving an honest assessment. 2–3 sentences. Mention 2–3 specific issues you see in the photo. End with a soft CTA (e.g. "Want us to take a look in person? Free quote in 24 hours.").

CALIBRATE TO REALITY.
We're a real business. Don't promise miracles, don't catastrophize. If the grill looks fine, say so and recommend annual maintenance. If it looks rough, be honest. If you can't tell the grill type or brand from the photo, set those fields to "unknown" / null — don't guess.

If the image is not a grill (a cat, a car, a screenshot), return:
- grillTypeDetected: "unknown"
- conditionSeverity: "light"
- conditionIssues: ["We couldn't identify a grill in this photo."]
- recommendation: "Looks like this isn't a grill photo. Try uploading a clear shot of your grill with the hood open."`;

export async function analyzeGrillPhoto(args: {
  imageBase64: string;
  imageMimeType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<Assessment> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            grillTypeDetected: {
              type: "string",
              enum: [
                "gas",
                "charcoal",
                "pellet",
                "built-in",
                "flat-top",
                "smoker",
                "unknown",
              ],
            },
            brandDetected: { type: ["string", "null"] },
            burnerCount: { type: ["integer", "null"] },
            conditionIssues: { type: "array", items: { type: "string" } },
            conditionSeverity: {
              type: "string",
              enum: ["light", "moderate", "heavy", "extreme"],
            },
            estimatedServiceHours: { type: "number" },
            estimatedPriceLow: { type: "integer" },
            estimatedPriceHigh: { type: "integer" },
            recommendedService: { type: "string" },
            recommendation: { type: "string" },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: [
            "grillTypeDetected",
            "brandDetected",
            "burnerCount",
            "conditionIssues",
            "conditionSeverity",
            "estimatedServiceHours",
            "estimatedPriceLow",
            "estimatedPriceHigh",
            "recommendedService",
            "recommendation",
            "confidence",
          ],
        },
      },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: args.imageMimeType,
              data: args.imageBase64,
            },
          },
          {
            type: "text",
            text: "Inspect this grill photo and return the assessment.",
          },
        ],
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("Claude returned no text block");
  }
  return JSON.parse(text.text) as Assessment;
}
