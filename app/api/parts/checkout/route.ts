/**
 * Parts storefront checkout — creates a Stripe Checkout Session for a cart of
 * premium OEM parts. Mirrors app/api/weber/checkout/route.ts: the order is
 * written to a parts_orders row, only its id rides in the session metadata, and
 * the webhook reads it back to fulfill. Prices are RE-DERIVED server-side from
 * lib/parts/catalog.ts by part id — a tampered client can't underpay.
 */

import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { normalizeE164 } from "@/lib/db/ingest";
import { publicFormAllowed, clientIp } from "@/lib/ratelimit";
import { getPartById, SHIPPING_FEE, SALES_TAX_RATE } from "@/lib/parts/catalog";
import type { PartsFulfillment, PartsOrderLineItem } from "@/lib/db/types";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_QTY = 10;

function baseUrl(req: NextRequest): string {
  try {
    return new URL(req.url).origin;
  } catch {
    return SITE.canonicalUrl;
  }
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
  }

  const b = (await req.json().catch(() => ({}))) as {
    items?: { partId?: string; qty?: number }[];
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    fulfillment?: PartsFulfillment;
    shipAddress?: string;
    serviceAddress?: string;
    preferredDate?: string;
    preferredTime?: string;
  };

  const phone = normalizeE164(b.phone);
  const email = (b.email ?? "").trim();
  const fulfillment: PartsFulfillment = b.fulfillment === "install" ? "install" : "ship";
  const shipAddress = (b.shipAddress ?? "").trim();
  const serviceAddress = (b.serviceAddress ?? "").trim();
  const preferredDate = (b.preferredDate ?? "").trim();

  if (!Array.isArray(b.items) || b.items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }
  if (!phone) return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required for your receipt." }, { status: 400 });
  }
  if (fulfillment === "ship" && !shipAddress) {
    return NextResponse.json({ error: "A shipping address is required." }, { status: 400 });
  }
  if (fulfillment === "install" && (!serviceAddress || !preferredDate)) {
    return NextResponse.json(
      { error: "A service address and preferred date are required for install." },
      { status: 400 }
    );
  }

  // Re-price from the catalog by id; ignore anything the client made up.
  const lineItems: PartsOrderLineItem[] = [];
  for (const it of b.items) {
    const part = it.partId ? getPartById(it.partId) : undefined;
    if (!part) continue;
    const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(it.qty) || 1)));
    lineItems.push({
      partId: part.id,
      partNumber: part.partNumber,
      name: part.name,
      brand: part.brand,
      qty,
      unitPrice: part.retailPrice,
      lineTotal: part.retailPrice * qty,
    });
  }
  if (lineItems.length === 0) {
    return NextResponse.json({ error: "None of those parts are available." }, { status: 400 });
  }

  if (!(await publicFormAllowed("parts-checkout", clientIp(req), phone))) {
    return NextResponse.json({ error: "Too many tries — give it a minute." }, { status: 429 });
  }

  const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0);
  const shippingFee = fulfillment === "ship" ? SHIPPING_FEE : 0;
  const amount = subtotal + shippingFee;

  try {
    const sb = getSupabase();
    const { data: pending, error } = await sb
      .from("parts_orders")
      .insert({
        status: "pending",
        first_name: b.firstName ?? null,
        last_name: b.lastName ?? null,
        phone_e164: phone,
        email,
        fulfillment,
        ship_address: fulfillment === "ship" ? shipAddress : null,
        service_address: fulfillment === "install" ? serviceAddress : null,
        preferred_date: fulfillment === "install" ? preferredDate : null,
        preferred_time: fulfillment === "install" ? b.preferredTime ?? null : null,
        line_items: lineItems,
        subtotal,
        shipping_fee: shippingFee,
        amount,
      })
      .select("id")
      .single();
    if (error || !pending) throw new Error(error?.message ?? "could not start order");
    const pendingId = (pending as { id: string }).id;

    const stripeLines = lineItems.map((l) => ({
      quantity: l.qty,
      price_data: {
        currency: "usd",
        unit_amount: l.unitPrice * 100,
        product_data: { name: `${l.brand} ${l.name} (#${l.partNumber})` },
      },
    }));
    if (shippingFee > 0) {
      stripeLines.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: shippingFee * 100,
          product_data: { name: "Shipping" },
        },
      });
    }
    // Flat 7.8% sales tax, applied to the merchandise + shipping subtotal.
    const taxCents = Math.round((subtotal + shippingFee) * 100 * SALES_TAX_RATE);
    if (taxCents > 0) {
      stripeLines.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: taxCents,
          product_data: { name: `Sales tax (${(SALES_TAX_RATE * 100).toFixed(1)}%)` },
        },
      });
    }

    const origin = baseUrl(req);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: pendingId,
      line_items: stripeLines,
      metadata: { tsgc_pending_id: pendingId, tsgc_order_kind: "parts" },
      payment_intent_data: { metadata: { tsgc_pending_id: pendingId, tsgc_order_kind: "parts" } },
      success_url: `${origin}/parts/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/parts?canceled=1`,
    });

    await sb.from("parts_orders").update({ stripe_session_id: session.id }).eq("id", pendingId);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed — please try again." },
      { status: 502 }
    );
  }
}
