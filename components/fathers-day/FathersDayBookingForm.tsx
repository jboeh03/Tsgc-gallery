"use client";

/**
 * Father's Day booking form. One component, two flows chosen by `deal`:
 *
 *  - single  (DADS25): photo + estimate range, then EITHER "send my quote
 *    request" (lead only) OR "book + pay $299 now" (pick a Mon–Thu slot ≥72h
 *    out and pay via Stripe).
 *  - bundle  (DADSBOGO): photo + estimate + both grills' addresses if they're
 *    separate, submitted as a quote request — no payment, we confirm pricing.
 *
 * Lead submissions mirror the standard QuoteForm dual-write (Supabase ingest +
 * Apps Script). Pay-now mirrors the Weber checkout (POST → Stripe redirect).
 */

import { useState } from "react";
import AddressAutocomplete from "@/components/weber/AddressAutocomplete";
import { compressImage } from "@/lib/image-compress";
import { trackQuoteConversion } from "@/lib/ads";
import { SITE } from "@/lib/site";

type Photo = { base64: string; mime: string; preview: string };
type Estimate = { regLow: number; regHigh: number; fdLow: number; fdHigh: number; percent: number; deposit: number; assessment: Record<string, unknown> };
type AvailableSlot = { id: string; label: string; start: string; available: boolean };
type AvailableDay = { date: string; slots: AvailableSlot[]; anyOpen: boolean };

const inputCls = "mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none";
const labelCls = "text-[11px] uppercase tracking-wider text-muted";

function fmtDate(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function FathersDayBookingForm({
  deal,
  dealCode,
  deposit,
  availability,
  canceled,
}: {
  deal: "single" | "bundle";
  dealCode: string;
  deposit: number;
  availability: AvailableDay[];
  canceled?: boolean;
}) {
  const isBundle = deal === "bundle";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [grillModel, setGrillModel] = useState("");

  // bundle-only
  const [sameAddress, setSameAddress] = useState(true);
  const [address2, setAddress2] = useState("");
  const [grill2, setGrillModel2] = useState("");

  // single-only: book + pay vs quote request
  const [mode, setMode] = useState<"book" | "quote">("book");
  const [date, setDate] = useState("");
  const [slotId, setSlotId] = useState("");

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const bookable = availability.filter((d) => d.anyOpen);
  const slotsForDate = availability.find((d) => d.date === date)?.slots ?? [];
  const payNow = !isBundle && mode === "book";

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      setError("That photo is over 30 MB — please pick a smaller one.");
      return;
    }
    setError(null);
    let p: Photo;
    try {
      p = await compressImage(file);
    } catch {
      setError("Couldn't read that photo. Try a JPG or PNG.");
      return;
    }
    setPhoto(p);
    // Best-effort estimate; never blocks submission.
    setEstimating(true);
    setEstimate(null);
    try {
      const res = await fetch("/api/fathers-day/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64: p.base64, imageMimeType: p.mime }),
      });
      if (res.ok) setEstimate((await res.json()) as Estimate);
    } catch {
      /* estimate is optional */
    } finally {
      setEstimating(false);
    }
  }

  function validateCommon(): string | null {
    if (!firstName.trim() || !lastName.trim()) return "Add your name.";
    if (!phone.trim()) return "A phone number is required.";
    if (!email.trim()) return "An email is required.";
    if (!address.trim()) return "Service address is required.";
    if (!photo) return "Add a photo of your grill — it's required for this deal.";
    if (isBundle && !sameAddress && !address2.trim()) return "Add the second grill's address.";
    return null;
  }

  function buildLeadPayload() {
    const bundleNote = isBundle
      ? [
          "Father's Day BUNDLE (buy one, 2nd grill 50% off).",
          `Grill 1 @ ${address}.`,
          sameAddress
            ? "Both grills at the same address."
            : `Grill 2 @ ${address2}.${grill2 ? ` 2nd grill: ${grill2}.` : ""}`,
        ].join(" ")
      : "Father's Day 25% off.";
    const estNote = estimate ? ` Est. full price $${estimate.regLow}–$${estimate.regHigh}.` : "";
    return {
      firstName,
      lastName,
      phone,
      email,
      serviceAddress: address,
      zip: address.match(/\b(\d{5})\b/)?.[1] || "",
      grillModel: grillModel.trim(),
      services: ["Gas BBQ Grill Cleaning"],
      promoCode: dealCode,
      source: "fathers-day",
      notes: bundleNote + estNote,
      timestamp: new Date().toISOString(),
    };
  }

  async function submitQuoteRequest() {
    const v = validateCommon();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError(null);
    const data = buildLeadPayload();
    // Supabase ingest (with photo); Apps Script (everything but the photo).
    fetch("/api/leads/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, imageBase64: photo?.base64, imageMimeType: photo?.mime }),
      keepalive: true,
    }).catch(() => {});
    try {
      await fetch(SITE.quoteEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(data),
      });
      trackQuoteConversion();
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again or call us.");
    } finally {
      setBusy(false);
    }
  }

  async function bookAndPay() {
    const v = validateCommon();
    if (v) {
      setError(v);
      return;
    }
    if (!date) {
      setError("Pick a day for your cleaning.");
      return;
    }
    if (!slotId) {
      setError("Pick a time window.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/fathers-day/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          serviceAddress: address,
          preferredDate: date,
          slotId,
          grillModel: grillModel.trim(),
          assessment: estimate?.assessment,
        }),
      });
      const d = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !d.url) {
        setError(d.error || "Checkout failed — please try again.");
        setBusy(false);
        return;
      }
      trackQuoteConversion();
      window.location.href = d.url;
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center space-y-3">
        <div className="text-4xl" aria-hidden>🔥</div>
        <h3 className="font-display text-2xl text-navy">Request received</h3>
        <p className="text-sm text-ink/70">
          We&apos;ll review your {isBundle ? "two grills" : "grill"} and text you back as soon as we can to confirm
          your {isBundle ? "bundle pricing and " : ""}schedule. Prefer faster? Call or text{" "}
          <a href={SITE.phoneHref} className="font-semibold text-navy underline">{SITE.phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 space-y-4">
      {canceled && (
        <p className="rounded-md border border-border bg-bone/60 px-3 py-2 text-sm text-ink/75">
          Checkout canceled — your details are still here whenever you&apos;re ready.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <label className="block"><span className={labelCls}>First name *</span><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} /></label>
        <label className="block"><span className={labelCls}>Last name *</span><input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} /></label>
        <label className="block"><span className={labelCls}>Phone *</span><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} inputMode="tel" /></label>
        <label className="block"><span className={labelCls}>Email *</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} inputMode="email" /></label>
      </div>

      <label className="block">
        <span className={labelCls}>{isBundle ? "Grill 1 address *" : "Service address *"}</span>
        <AddressAutocomplete value={address} onChange={setAddress} required placeholder="Start typing your address…" className={inputCls} />
      </label>

      {isBundle && (
        <div className="rounded-lg bg-bone/60 p-3 space-y-3">
          <label className="flex items-start gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} className="mt-0.5" />
            <span>Both grills are at the <strong>same address</strong>.</span>
          </label>
          {!sameAddress && (
            <>
              <label className="block">
                <span className={labelCls}>Grill 2 address * <span className="normal-case">(e.g. Dad&apos;s place)</span></span>
                <AddressAutocomplete value={address2} onChange={setAddress2} placeholder="Second grill's address…" className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>2nd grill make / model <span className="normal-case">(optional)</span></span>
                <input value={grill2} onChange={(e) => setGrillModel2(e.target.value)} className={inputCls} placeholder="e.g. Weber Spirit II" />
              </label>
            </>
          )}
        </div>
      )}

      <label className="block">
        <span className={labelCls}>{isBundle ? "Grill 1" : "Grill"} make / model <span className="normal-case">(optional)</span></span>
        <input value={grillModel} onChange={(e) => setGrillModel(e.target.value)} className={inputCls} placeholder="e.g. Weber Genesis II E-335" />
      </label>

      <label className="block">
        <span className={labelCls}>Photo of your grill *</span>
        <input type="file" accept="image/*" onChange={onPhoto} className={`${inputCls} file:mr-3 file:rounded file:border-0 file:bg-navy file:px-3 file:py-1 file:text-bone`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo && <img src={photo.preview} alt="Your grill" className="mt-2 h-28 rounded-md object-cover" />}
      </label>

      {/* Estimate */}
      {estimating && <p className="text-sm text-muted">Reading your grill…</p>}
      {estimate && (
        <div className="rounded-xl bg-bone/60 p-4 text-sm text-ink/80">
          <p className="text-[11px] uppercase tracking-wider text-muted">Estimated range · we&apos;ll confirm</p>
          <p className="mt-1">
            <span className="text-muted line-through">reg. ${estimate.regLow}–${estimate.regHigh}</span>{" "}
            <span className="font-display text-2xl text-navy">${estimate.fdLow}–${estimate.fdHigh}</span>{" "}
            <span className="rounded-full bg-burgundy/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-burgundy">{estimate.percent}% off</span>
          </p>
        </div>
      )}

      {/* SINGLE — mode + scheduling */}
      {!isBundle && (
        <>
          <fieldset>
            <legend className={labelCls}>How would you like to proceed?</legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { id: "book", title: `Book + pay $${deposit} now`, sub: "Lock a Mon–Thu slot" },
                { id: "quote", title: "Just send my quote request", sub: "We follow up, no charge" },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${mode === m.id ? "border-burgundy bg-burgundy/5 text-navy" : "border-border bg-white text-ink/70"}`}
                >
                  <input type="radio" name="fd-mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id as "book" | "quote")} className="sr-only" />
                  <span className="block font-semibold">{m.title}</span>
                  <span className="block text-xs text-muted">{m.sub}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {payNow && (
            <div className="space-y-3">
              <label className="block">
                <span className={labelCls}>Pick a day * <span className="normal-case">(Mon–Thu, 72h+ out)</span></span>
                <select
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSlotId("");
                  }}
                  className={inputCls}
                >
                  <option value="">Choose a day…</option>
                  {bookable.map((d) => (
                    <option key={d.date} value={d.date}>{fmtDate(d.date)}</option>
                  ))}
                </select>
                {bookable.length === 0 && (
                  <span className="mt-1 block text-xs text-burgundy">
                    No open days right now — text us at {SITE.phone} and we&apos;ll fit you in.
                  </span>
                )}
              </label>

              {date && (
                <fieldset>
                  <legend className={labelCls}>Pick a window *</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {slotsForDate.map((s) => (
                      <label
                        key={s.id}
                        className={`rounded-md border px-3 py-2 text-center text-sm ${
                          !s.available
                            ? "cursor-not-allowed border-border bg-bone/40 text-muted line-through"
                            : slotId === s.id
                            ? "cursor-pointer border-burgundy bg-burgundy/5 text-navy"
                            : "cursor-pointer border-border bg-white text-ink/70"
                        }`}
                      >
                        <input type="radio" name="fd-slot" value={s.id} disabled={!s.available} checked={slotId === s.id} onChange={() => setSlotId(s.id)} className="sr-only" />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <p className="rounded-md bg-bone/60 px-3 py-2 text-xs text-ink/70">
                <strong className="text-navy">${deposit} due now</strong> to book &amp; confirm. For most grills that&apos;s your full price.
                For a larger / premium grill, ${deposit} is a minimum that&apos;s applied as a <strong>credit toward the full price</strong> —
                we confirm any balance as soon as we can. Need it sooner than the first open day? Just{" "}
                <a href={SITE.smsHref} className="font-semibold text-navy underline">text</a> or{" "}
                <a href={SITE.emailHref} className="font-semibold text-navy underline">email</a> us.
              </p>
            </div>
          )}
        </>
      )}

      {isBundle && (
        <p className="rounded-md bg-bone/60 px-3 py-2 text-xs text-ink/70">
          Send your request and we&apos;ll confirm your bundle price (2nd grill 50% off) and schedule both grills in one visit.
          Both must be booked &amp; paid before Father&apos;s Day.
        </p>
      )}

      {error && <p className="text-sm text-burgundy">{error}</p>}

      {payNow ? (
        <button type="button" onClick={bookAndPay} disabled={busy} className="w-full rounded-md bg-burgundy px-5 py-3 text-sm font-semibold uppercase tracking-wider text-bone hover:bg-burgundy-700 disabled:opacity-40">
          {busy ? "Starting checkout…" : `Book + pay $${deposit} →`}
        </button>
      ) : (
        <button type="button" onClick={submitQuoteRequest} disabled={busy} className="w-full rounded-md bg-navy px-5 py-3 text-sm font-semibold uppercase tracking-wider text-bone hover:bg-navy-700 disabled:opacity-40">
          {busy ? "Sending…" : isBundle ? "Request my bundle quote →" : "Send my quote request →"}
        </button>
      )}
    </div>
  );
}
