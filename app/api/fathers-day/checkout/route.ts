/**
 * Father's Day "book + pay $299 now" checkout (the standard DADS25 deal).
 * Mirrors /api/weber/checkout: writes a pending_bookings row, puts only its id
 * in the Stripe session metadata, and the webhook reads it back to fulfill. The
 * $299 is re-asserted server-side and the slot is re-validated (Mon–Thu, ≥72h,
 * still open) so a stale client can't book a taken or too-soon window.
 */

import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { normalizeE164 } from "@/lib/db/ingest";
import { publicFormAllowed, clientIp } from "@/lib/ratelimit";
import { isFathersDayActive, FD_BOOKING_DEPOSIT, fdSlotById } from "@/lib/campaign-fathers-day";
import { isFathersDaySlotOpen } from "@/lib/fathers-day/availability";
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
  if (!isFathersDayActive()) {
    return NextResponse.json({ error: "The Father's Day offer has ended." }, { status: 410 });
  }
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 503 });
  }

  const b = (await req.json().catch(() => ({}))) as {
    firstName?: string; lastName?: string; phone?: string; email?: string;
    serviceAddress?: string; preferredDate?: string; slotId?: string;
    grillModel?: string; assessment?: Record<string, unknown>;
  };

  const phone = normalizeE164(b.phone);
  const email = (b.email ?? "").trim();
  const serviceAddress = (b.serviceAddress ?? "").trim();
  const preferredDate = (b.preferredDate ?? "").trim();
  const slot = fdSlotById(b.slotId);

  if (!phone) return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "A valid email is required for your receipt." }, { status: 400 });
  if (!serviceAddress) return NextResponse.json({ error: "Service address is required." }, { status: 400 });
  if (!slot) return NextResponse.json({ error: "Pick a time window." }, { status: 400 });
  if (!preferredDate) return NextResponse.json({ error: "Pick a day." }, { status: 400 });

  if (!(await publicFormAllowed("fathers-day-checkout", clientIp(req), phone))) {
    return NextResponse.json({ error: "Too many tries — give it a minute." }, { status: 429 });
  }

  if (!(await isFathersDaySlotOpen(preferredDate, slot.start))) {
    return NextResponse.json(
      { error: "That window just filled or is too soon — please pick another." },
      { status: 409 }
    );
  }

  const amount = FD_BOOKING_DEPOSIT;

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
        preferred_time: slot.start,
        grill_model: b.grillModel ?? null,
        neighbor: false,
        discount_percent: 25,
        amount,
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
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount * 100,
            product_data: { name: "Father's Day grill clean — booking deposit" },
          },
        },
      ],
      metadata: { tsgc_pending_id: pendingId, tsgc_campaign: "fathers-day" },
      payment_intent_data: { metadata: { tsgc_pending_id: pendingId, tsgc_campaign: "fathers-day" } },
      success_url: `${origin}/fathers-day/booked?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/fathers-day/book?deal=single&canceled=1`,
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
