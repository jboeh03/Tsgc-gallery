/**
 * Affiliate-click logger — writes to Supabase (the system of record). Was
 * previously a fire-and-forget POST to Apps Script + a Sheet tab; now it's a
 * direct insert into the affiliate_clicks table, read back by /admin/products.
 *
 * Still best-effort: a logging failure must never break the outbound redirect.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";

type ClickEventInput = {
  productId: string;
  productName: string;
  affiliate: string;
  destinationUrl: string;
  referer?: string;
  userAgent?: string;
};

export async function logAffiliateClick(input: ClickEventInput): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await getSupabase().from("affiliate_clicks").insert({
      product_id: input.productId,
      product_name: input.productName,
      affiliate: input.affiliate,
      destination_url: input.destinationUrl,
      referer: input.referer ?? null,
      user_agent: input.userAgent ?? null,
    });
  } catch {
    /* best-effort — never block the redirect */
  }
}
