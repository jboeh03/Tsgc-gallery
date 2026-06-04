/**
 * Quote-required field detector. Before Jeff can quote a job over text he needs:
 *   1. the full service address,
 *   2. the grill make/model,
 *   3. the grill size — burner count OR a photo of the grill.
 *
 * This computes which of those are still blank for a contact so the AI draft
 * can ask for exactly the missing ones (and the inbox can show a checklist).
 */

import type { ContactRow } from "@/lib/db/types";

export type MissingField = "service_address" | "grill_model" | "grill_size";

export const FIELD_LABELS: Record<MissingField, string> = {
  service_address: "Full service address",
  grill_model: "Grill make / model",
  grill_size: "Grill size (burner count or a photo)",
};

export function computeMissingFields(
  contact: Pick<ContactRow, "service_address" | "grill_brand" | "grill_model" | "grill_burner_count">,
  opts: { hasPhoto: boolean }
): MissingField[] {
  const missing: MissingField[] = [];

  if (!contact.service_address?.trim()) missing.push("service_address");

  const hasModel = Boolean(contact.grill_model?.trim() || contact.grill_brand?.trim());
  if (!hasModel) missing.push("grill_model");

  const hasSize = Boolean(contact.grill_burner_count) || opts.hasPhoto;
  if (!hasSize) missing.push("grill_size");

  return missing;
}

export function readyToQuote(
  contact: Parameters<typeof computeMissingFields>[0],
  opts: { hasPhoto: boolean }
): boolean {
  return computeMissingFields(contact, opts).length === 0;
}
