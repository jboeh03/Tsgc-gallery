/**
 * Weber sprint checkout — creates a Stripe Checkout Session for the (discounted)
 * tier price. The booking payload is written to a pending_bookings row; only its
 * id rides in the session metadata, and the webhook reads it back to fulfill.
 * Price is re-derived server-side (priceQuote) so a tampered client can't underpay.
 */

import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { normalizeE164 } from "@/lib/db/ingest";
import { priceQuote, isWeberSprintActive, type WeberModel } from "@/lib/campaign-weber";
import { publicFormAllowed, clientIp } from "@/lib/ratelimit";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function baseUrl(req: NextRequest): string {
  try {
    return new URL(req.url).origin;
  } catch {
    return SITE.canonicalUrl;
  }
}

export async function POST(req: NextRequest) {
  if (!isWeberSprintActive()) return NextResponse.json({ error: "The Weber sprint has ended." }, { status: 410 });
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 503 });
  }

  const b = (await req.json().catch(() => ({}))) as {
    firstName?: string; lastName?: string; phone?: string; email?: string;
    serviceAddress?: string; preferredDate?: string; preferredTime?: string;
    model?: WeberModel; burners?: number; neighbor?: boolean;
    assessment?: Record<string, unknown>;
  };

  const phone = normalizeE164(b.phone);
  const email = (b.email ?? "").trim();
  const serviceAddress = (b.serviceAddress ?? "").trim();
  const preferredDate = (b.preferredDate ?? "").trim();
  if (!phone) return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "A valid email is required for your receipt." }, { status: 400 });
  if (!serviceAddress) return NextResponse.json({ error: "Service address is required." }, { status: 400 });
  if (!preferredDate) return NextResponse.json({ error: "Pick a preferred date." }, { status: 400 });

  if (!(await publicFormAllowed("weber-checkout", clientIp(req), phone))) {
    return NextResponse.json({ error: "Too many tries — give it a minute." }, { status: 429 });
  }

  const burners = Number(b.burners) || 4;
  const neighbor = Boolean(b.neighbor);
  const q = priceQuote({ burners, neighbor });
  const model = (b.model ?? "Other") as WeberModel;

  try {
    const sb = getSupabase();
    const { data: pending, error } = await sb
      .from("pending_bookings")
      .insert({
        status: "pending",
        first_name: b.firstName ?? null,
        last_name: b.lastName ?? null,
        phone_e164: phone,
        email,
        service_address: serviceAddress,
        preferred_date: preferredDate,
        preferred_time: b.preferredTime ?? null,
        grill_model: `Weber ${model}`,
        burner_count: burners,
        neighbor,
        base_price: q.basePrice,
        discount_percent: q.discountPercent,
        amount: q.discountedPrice,
        assessment: b.assessment ?? null,
      })
      .select("id")
      .single();
    if (error || !pending) throw new Error(error?.message ?? "could not start booking");
    const pendingId = (pending as { id: string }).id;

    const origin = baseUrl(req);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: pendingId,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: q.discountedPrice * 100,
          product_data: { name: `Weber ${model} deep clean — ${q.tier.label}` },
        },
      }],
      metadata: { tsgc_pending_id: pendingId, tsgc_campaign: "weber-sprint" },
      payment_intent_data: { metadata: { tsgc_pending_id: pendingId } },
      success_url: `${origin}/weber/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/weber?canceled=1`,
    });

    await sb.from("pending_bookings").update({ stripe_session_id: session.id }).eq("id", pendingId);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed — please try again." },
      { status: 502 }
    );
  }
}
