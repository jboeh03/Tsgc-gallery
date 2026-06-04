/**
 * Stripe client — fail-soft like the rest of the app. STRIPE_SECRET_KEY is a
 * live restricted key (scoped to customers/invoices/payment_links/products).
 * No money ever moves without an explicit admin action that finalizes & sends
 * an invoice; everything else (drafts, lookups) is non-charging.
 */

import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY;

export type StripeHealth = { configured: boolean; ok: boolean; error?: string; business?: string };

export function isStripeConfigured(): boolean {
  return Boolean(KEY);
}

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!KEY) throw new Error("Stripe not configured (STRIPE_SECRET_KEY)");
  if (!_stripe) _stripe = new Stripe(KEY);
  return _stripe;
}

export async function checkStripeHealth(): Promise<StripeHealth> {
  if (!isStripeConfigured()) return { configured: false, ok: false, error: "STRIPE_SECRET_KEY not set" };
  try {
    await getStripe().customers.list({ limit: 1 });
    return { configured: true, ok: true };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
