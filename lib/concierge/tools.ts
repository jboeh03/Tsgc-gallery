/**
 * Concierge tool definitions + handlers. Two real actions for v1:
 *   estimate_quote → grounded price range from a grill description (reuses the
 *                    lead value-estimator so chat numbers match the CRM).
 *   capture_lead   → writes the chat into the CRM via the same ingestLead()
 *                    path the public forms use (source = "concierge-chat").
 */
import type Anthropic from "@anthropic-ai/sdk";
import { classifyValueFromDescription } from "@/lib/leads/valueEstimator";
import { ingestLead } from "@/lib/db/ingest";

export const CONCIERGE_TOOLS: Anthropic.Tool[] = [
  {
    name: "estimate_quote",
    description:
      "Get a ballpark cleaning price range for a grill from a text description. Call this whenever the customer asks what it costs or describes their grill. Returns low/high USD. Always present it as an estimate, not a final price.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        description: {
          type: "string",
          description:
            "Free text describing the grill: brand, type (gas/charcoal/pellet/built-in/griddle/smoker), burner count, and how dirty it is.",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "capture_lead",
    description:
      "Save the customer as a lead so we can follow up and confirm a booking. Call ONLY after you have their name AND a phone or email. Include grill, preferred time, and the estimate if known.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string", description: "Customer's name" },
        phone: { type: "string", description: "Phone number" },
        email: { type: "string", description: "Email address" },
        zip: { type: "string", description: "ZIP code or city, if given" },
        grill: { type: "string", description: "Grill brand/type/size, if known" },
        preferredTime: {
          type: "string",
          description: "When they'd like service, if mentioned",
        },
        estimateLow: { type: "number", description: "Low end of the estimate, if quoted" },
        estimateHigh: { type: "number", description: "High end of the estimate, if quoted" },
        notes: { type: "string", description: "Anything else useful for the crew" },
      },
      required: ["name"],
    },
  },
];

const s = (v: unknown): string | undefined => {
  const t = typeof v === "string" ? v.trim() : v != null ? String(v) : "";
  return t ? t : undefined;
};

export async function runConciergeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  try {
    if (name === "estimate_quote") {
      const v = classifyValueFromDescription(s(input.description) ?? "");
      if (v.estimatedJobUsdLow == null || v.estimatedJobUsdHigh == null) {
        return JSON.stringify({
          ok: true,
          note: "Couldn't pin a tier from that — ask for the grill brand, size/burner count, and how dirty it is, or offer the general $199–$799 range.",
        });
      }
      return JSON.stringify({
        ok: true,
        low: v.estimatedJobUsdLow,
        high: v.estimatedJobUsdHigh,
        tier: v.tier,
      });
    }

    if (name === "capture_lead") {
      const name_ = s(input.name);
      const phone = s(input.phone);
      const email = s(input.email);
      if (!name_) return JSON.stringify({ ok: false, error: "Need a name first." });
      if (!phone && !email)
        return JSON.stringify({ ok: false, error: "Need a phone number or email before saving." });

      const [firstName, ...rest] = name_.split(/\s+/);
      const est =
        input.estimateLow && input.estimateHigh
          ? `AI estimate: $${input.estimateLow}–$${input.estimateHigh}`
          : null;
      const notes = [
        "Lead captured via website concierge chat.",
        s(input.grill) ? `Grill: ${s(input.grill)}` : null,
        est,
        s(input.notes),
      ]
        .filter(Boolean)
        .join("\n");

      const res = await ingestLead({
        firstName: firstName || name_,
        lastName: rest.join(" ") || undefined,
        phone,
        email,
        zip: s(input.zip),
        grillModel: s(input.grill),
        bestTime: s(input.preferredTime),
        source: "concierge-chat",
        notes,
      });
      if (!res) return JSON.stringify({ ok: false, error: "Couldn't save right now — tell them to call/text us." });
      return JSON.stringify({ ok: true });
    }

    return `Unknown tool: ${name}`;
  } catch (e) {
    return JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "tool error" });
  }
}
