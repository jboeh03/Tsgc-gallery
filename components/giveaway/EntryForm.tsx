"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { GIVEAWAY, isInServiceArea, calcEntries } from "@/lib/giveaway";
import { SITE } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error";

const inputCls =
  "w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy";
const inputErrCls =
  "w-full rounded-md border border-red-400 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400";
const labelCls = "block font-display text-sm tracking-wide text-navy uppercase";
const checkboxCls = "flex items-start gap-2.5 text-sm text-ink cursor-pointer";

function Field({
  label,
  sub,
  htmlFor,
  children,
}: {
  label: string;
  sub?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
        {sub ? (
          <span className="ml-1 font-normal normal-case tracking-normal text-xs text-muted">
            {sub}
          </span>
        ) : null}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function EntryForm({
  active,
  upcoming,
}: {
  active: boolean;
  upcoming: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [zip, setZip] = useState("");
  const [zipError, setZipError] = useState("");
  const [zipOk, setZipOk] = useState(false);
  const [hasBooking, setHasBooking] = useState(false);
  const [hasShare, setHasShare] = useState(false);
  const [hasFollow, setHasFollow] = useState(false);

  const entries = calcEntries({ hasBooking, hasShare, hasFollow });
  const max = GIVEAWAY.maxEntriesPerPerson;
  const openLabel = GIVEAWAY.openDateDisplay.startsWith("[")
    ? "soon"
    : GIVEAWAY.openDateDisplay;
  const closeLabel = GIVEAWAY.closeDateDisplay.startsWith("[")
    ? "the closing date"
    : GIVEAWAY.closeDateDisplay;

  function handleZipChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 5);
    setZip(val);
    if (val.length === 5) {
      const ok = isInServiceArea(val);
      setZipOk(ok);
      setZipError(ok ? "" : `This ZIP is outside our ${GIVEAWAY.serviceAreaLabel} service area.`);
    } else {
      setZipOk(false);
      setZipError("");
    }
  }

  function validateZip(): boolean {
    if (zip.length < 5) {
      setZipError("Please enter a valid 5-digit ZIP code.");
      return false;
    }
    if (!isInServiceArea(zip)) {
      setZipError(`This ZIP is outside our ${GIVEAWAY.serviceAreaLabel} service area.`);
      return false;
    }
    return true;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateZip()) return;

    setStatus("submitting");
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = Object.fromEntries(fd);

    data.kind = "giveaway_entry";
    data.giveawayId = GIVEAWAY.id;
    data.timestamp = new Date().toISOString();
    data.baseEntries = GIVEAWAY.entryWeights.base;
    data.bonusBooking = hasBooking ? GIVEAWAY.entryWeights.booking : 0;
    data.bonusShare = hasShare ? GIVEAWAY.entryWeights.share : 0;
    data.bonusFollow = hasFollow ? GIVEAWAY.entryWeights.follow : 0;
    data.totalEntries = entries;
    data.source = "giveaway-entry-form";

    try {
      const res = await fetch("/api/giveaway/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("entry failed");
      setStatus("success");
      (e.target as HTMLFormElement).reset();
      setHasBooking(false);
      setHasShare(false);
      setHasFollow(false);
      setZip("");
      setZipOk(false);
    } catch {
      setStatus("error");
    }
  }

  // ── Closed state ───────────────────────────────────────────────────────
  if (!active && !upcoming) {
    return (
      <div className="rounded-xl border border-border bg-bone px-6 py-8 text-center">
        <p className="font-display text-xl text-navy">This giveaway has ended.</p>
        <p className="mt-3 text-sm text-ink/75 leading-relaxed">
          The entry window is closed. Winner announcement coming{" "}
          {GIVEAWAY.announceDateDisplay.startsWith("[")
            ? "soon"
            : GIVEAWAY.announceDateDisplay}
          . Follow us on{" "}
          <a
            href={SITE.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy font-medium underline"
          >
            Facebook
          </a>{" "}
          or{" "}
          <a
            href={SITE.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy font-medium underline"
          >
            Instagram
          </a>{" "}
          for the winner reveal.
        </p>
      </div>
    );
  }

  // ── Upcoming state — form shown but locked ─────────────────────────────
  if (upcoming) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-8 text-center">
        <div className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-widest text-navy">
          Opening {openLabel}
        </div>
        <p className="mt-4 font-display text-xl text-navy">
          Entry opens {openLabel}
        </p>
        <p className="mt-3 text-sm text-ink/75 leading-relaxed">
          No purchase necessary. The form will open here when the giveaway
          begins. Follow us on{" "}
          <a
            href={SITE.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy font-medium underline"
          >
            Facebook
          </a>{" "}
          to be notified the moment it does.
        </p>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 px-6 py-8 text-center">
        <div className="font-display text-2xl text-navy">You&apos;re entered!</div>
        <p className="mt-3 text-sm text-ink/75 leading-relaxed">
          We&apos;ve recorded your{" "}
          <strong>{entries} {entries === 1 ? "entry" : "entries"}</strong>.
          The winner will be announced on{" "}
          {GIVEAWAY.announceDateDisplay.startsWith("[")
            ? "the announced date"
            : GIVEAWAY.announceDateDisplay}{" "}
          — we&apos;ll reach out by phone and email if you win.
        </p>
        <p className="mt-4 text-xs text-muted">
          Questions? Text Jeff at{" "}
          <a href={SITE.smsHref} className="underline font-medium text-navy">
            {SITE.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  // ── Active entry form ──────────────────────────────────────────────────
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {/* No purchase necessary — must be visible */}
      <div className="rounded-md bg-bone border border-border px-4 py-3 text-sm text-ink/80 leading-relaxed">
        <strong className="text-navy">No purchase necessary to enter or win.</strong>{" "}
        Booking a cleaning earns bonus entries but is never required. See{" "}
        <a href="/giveaway/rules" className="text-navy underline">
          Official Rules
        </a>{" "}
        for complete details.
      </div>

      {status === "error" ? (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm">
          Something went wrong. Please try again or text Jeff at{" "}
          <a href={SITE.smsHref} className="font-semibold underline">
            {SITE.phone}
          </a>
          .
        </div>
      ) : null}

      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name *" htmlFor="firstName">
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            placeholder="John"
            className={inputCls}
          />
        </Field>
        <Field label="Last Name *" htmlFor="lastName">
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            placeholder="Smith"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email Address *" htmlFor="email" sub="For winner notification">
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="john@example.com"
            className={inputCls}
          />
        </Field>
        <Field label="Phone Number *" htmlFor="phone" sub="For winner verification">
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="(513) 555-0100"
            className={inputCls}
          />
        </Field>
      </div>

      {/* ZIP — validated against service area */}
      <Field label="ZIP Code *" htmlFor="zip" sub="Must be in service area">
        <input
          id="zip"
          name="zip"
          type="text"
          inputMode="numeric"
          maxLength={5}
          required
          placeholder="45233"
          value={zip}
          onChange={handleZipChange}
          onBlur={() => zip.length > 0 && validateZip()}
          className={zipError ? inputErrCls : inputCls}
        />
        {zipError ? (
          <p className="mt-1.5 text-xs text-red-600" role="alert">
            {zipError}
          </p>
        ) : zipOk ? (
          <p className="mt-1.5 text-xs text-green-700">
            ✓ In our service area
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-muted">
            Open to residents of {GIVEAWAY.serviceAreaLabel}.
          </p>
        )}
      </Field>

      {/* Age + eligibility attestation */}
      <div>
        <label htmlFor="ageAttest" className={checkboxCls}>
          <input
            id="ageAttest"
            type="checkbox"
            name="ageAttest"
            required
            className="h-[18px] w-[18px] accent-burgundy mt-px shrink-0"
          />
          <span>
            I confirm I am {GIVEAWAY.minAge}+ years old and a resident of the{" "}
            {GIVEAWAY.serviceAreaLabel} service area. *
          </span>
        </label>
      </div>

      {/* Bonus entries panel */}
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest font-semibold text-burgundy">
            Bonus Entries
          </p>
          <div
            className={`text-xs font-bold rounded-full px-2.5 py-1 transition ${
              entries >= max
                ? "bg-amber-400 text-navy"
                : "bg-white border border-amber-300 text-ink"
            }`}
          >
            {entries} / {max} entries
          </div>
        </div>

        {/* Booking bonus */}
        <div
          className={`rounded-lg border bg-white p-4 transition ${
            hasBooking ? "border-amber-400" : "border-border"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <input
              id="hasBooking"
              type="checkbox"
              name="hasBooking"
              checked={hasBooking}
              onChange={(e) => setHasBooking(e.target.checked)}
              className="h-[18px] w-[18px] accent-burgundy mt-px shrink-0"
            />
            <label htmlFor="hasBooking" className="flex-1 cursor-pointer">
              <span className="font-semibold text-navy text-sm">
                Book a cleaning
              </span>
              <span className="ml-2 text-xs bg-amber-400 text-navy rounded-full px-2 py-0.5 font-bold">
                +{GIVEAWAY.entryWeights.booking} entries
              </span>
            </label>
          </div>
          <p className="mt-2 ml-[26px] text-xs text-muted leading-relaxed">
            No purchase necessary to enter. If you&apos;ve already booked or are planning to book a
            cleaning, check this box and enter a reference below. Bonus entries are verified
            against our booking records before the draw.
          </p>
          {hasBooking ? (
            <div className="mt-3 ml-[26px]">
              <label htmlFor="bookingRef" className={labelCls}>
                Booking reference{" "}
                <span className="font-normal normal-case tracking-normal text-xs text-muted">
                  name, phone, or date booked
                </span>
              </label>
              <input
                id="bookingRef"
                name="bookingRef"
                type="text"
                placeholder="e.g. John Smith, (513) 555-0100, or June 28"
                className={`mt-2 ${inputCls}`}
              />
            </div>
          ) : null}
        </div>

        {/* Share bonus */}
        <div
          className={`rounded-lg border bg-white p-4 transition ${
            hasShare ? "border-amber-400" : "border-border"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <input
              id="hasShare"
              type="checkbox"
              name="hasShare"
              checked={hasShare}
              onChange={(e) => setHasShare(e.target.checked)}
              className="h-[18px] w-[18px] accent-burgundy mt-px shrink-0"
            />
            <label htmlFor="hasShare" className="flex-1 cursor-pointer">
              <span className="font-medium text-navy text-sm">
                Share this giveaway on Facebook or Instagram
              </span>
              <span className="ml-2 text-xs border border-amber-400 text-navy rounded-full px-2 py-0.5 font-bold bg-white">
                +{GIVEAWAY.entryWeights.share} entry
              </span>
            </label>
          </div>
          <p className="mt-2 ml-[26px] text-xs text-muted leading-relaxed">
            Share the giveaway post on your profile. Tagging a veteran who deserves a
            fresh grill is encouraged — but tagging is never required to enter or win.
          </p>
        </div>

        {/* Follow bonus */}
        <div
          className={`rounded-lg border bg-white p-4 transition ${
            hasFollow ? "border-amber-400" : "border-border"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <input
              id="hasFollow"
              type="checkbox"
              name="hasFollow"
              checked={hasFollow}
              onChange={(e) => setHasFollow(e.target.checked)}
              className="h-[18px] w-[18px] accent-burgundy mt-px shrink-0"
            />
            <label htmlFor="hasFollow" className="flex-1 cursor-pointer">
              <span className="font-medium text-navy text-sm">
                Follow us on Facebook or Instagram
              </span>
              <span className="ml-2 text-xs border border-amber-400 text-navy rounded-full px-2 py-0.5 font-bold bg-white">
                +{GIVEAWAY.entryWeights.follow} entry
              </span>
            </label>
          </div>
          <p className="mt-2 ml-[26px] text-xs text-muted">
            <a
              href={SITE.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy underline"
            >
              Facebook
            </a>{" "}
            or{" "}
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy underline"
            >
              Instagram
            </a>
            .
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-md bg-burgundy text-bone py-4 font-semibold uppercase tracking-widest hover:bg-burgundy-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {status === "submitting"
          ? "Submitting..."
          : `Enter Now — ${entries} ${entries === 1 ? "Entry" : "Entries"} →`}
      </button>

      <p className="text-center text-xs text-muted leading-relaxed">
        By entering you agree to the{" "}
        <a href="/giveaway/rules" className="text-navy underline">
          Official Rules
        </a>
        . No purchase necessary. Open to residents of {GIVEAWAY.serviceAreaLabel},{" "}
        {GIVEAWAY.minAge}+. Entry closes {closeLabel}.
      </p>
    </form>
  );
}
