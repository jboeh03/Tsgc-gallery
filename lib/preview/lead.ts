import { SITE } from "@/lib/site";
import { ingestLead } from "@/lib/db/ingest";
import type { Assessment } from "./types";

/**
 * POST a preview-tool lead to the existing Apps Script CRM endpoint.
 * Uses the same field shape as the contact form so leads land in the
 * same sheet, tagged with source: "preview-tool".
 */
export async function captureLead(args: {
  email: string;
  firstName?: string;
  zip?: string;
  assessment: Assessment;
  ip: string;
}): Promise<string> {
  const leadId = `prev_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const payload = {
    firstName: args.firstName ?? "Preview",
    lastName: "Tool Lead",
    phone: "",
    email: args.email,
    zip: args.zip ?? "",
    services: [`Preview tool: ${args.assessment.recommendedService}`],
    grillModel: [
      args.assessment.brandDetected,
      args.assessment.grillTypeDetected,
      args.assessment.burnerCount ? `${args.assessment.burnerCount}-burner` : null,
    ]
      .filter(Boolean)
      .join(" "),
    hearAbout: "Preview tool",
    referredBy: "",
    promoCode: "",
    notes: [
      "[AI PREVIEW TOOL LEAD]",
      `Severity: ${args.assessment.conditionSeverity}`,
      `Confidence: ${args.assessment.confidence}`,
      `Est: ${args.assessment.estimatedServiceHours}hr, $${args.assessment.estimatedPriceLow}–$${args.assessment.estimatedPriceHigh}`,
      `Issues: ${args.assessment.conditionIssues.join("; ")}`,
      `Recommendation: ${args.assessment.recommendation}`,
      `Preview ID: ${leadId}`,
      `IP: ${args.ip}`,
    ].join("\n"),
    source: "preview-tool",
    timestamp: new Date().toISOString(),
    leadId,
  };

  try {
    await fetch(SITE.quoteEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[lead] capture failed", err);
  }

  // Dual-write into Supabase (best-effort; the Sheet write above is unaffected).
  await ingestLead({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: args.email,
    zip: args.zip,
    services: payload.services,
    grillModel: payload.grillModel,
    source: "preview-tool",
    notes: payload.notes,
    legacyLeadId: leadId,
  });

  return leadId;
}
