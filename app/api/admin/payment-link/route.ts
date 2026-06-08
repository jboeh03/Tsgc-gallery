/**
 * Admin-only Stripe Payment Link generator. Visit while signed into /admin and
 * it creates a one-time product + price + payment link server-side (using the
 * deployed STRIPE_SECRET_KEY — never exposed) and redirects you straight to the
 * hosted Stripe checkout.
 *
 *   /api/admin/payment-link                       → $1 test charge
 *   /api/admin/payment-link?amount=19900&name=... → e.g. a $199 gift card
 *
 * amount is in cents (default 100 = $1), clamped to $1–$1000 as a guardrail.
 */

import { auth, isAdmin } from "@/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isStripeConfigured()) return Response.json({ error: "Stripe not configured" }, { status: 503 });

  const url = new URL(req.url);
  const raw = parseInt(url.searchParams.get("amount") || "100", 10);
  const amount = Math.min(Math.max(Number.isFinite(raw) ? raw : 100, 100), 100000);
  const name = (url.searchParams.get("name") || "TSG Test Payment").slice(0, 80);

  try {
    const stripe = getStripe();
    const product = await stripe.products.create({ name });
    const price = await stripe.prices.create({ product: product.id, currency: "usd", unit_amount: amount });
    const link = await stripe.paymentLinks.create({ line_items: [{ price: price.id, quantity: 1 }] });
    return Response.redirect(link.url, 303);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "failed to create link" }, { status: 500 });
  }
}
