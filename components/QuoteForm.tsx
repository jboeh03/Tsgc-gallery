"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SITE } from "@/lib/site";
import { tierByCode } from "@/lib/campaign";

const SERVICES = [
  "Gas BBQ Grill Cleaning",
  "Smoker Cleaning",
  "BBQ Grill Inspection and/or Repair",
  "New Grill Installation or Design",
] as const;

const MEMBERSHIP = "🚨 Annual Membership *Limited Time Offer";

const SOURCES = [
  "Google",
  "Instagram",
  "Facebook",
  "All Decked Out",
  "Everything Cincy",
  "Saw your crew around town",
  "A Friend Referral",
  "Repeat Customer",
];

const BEST_TIMES = [
  "Morning (8am–12pm)",
  "Afternoon (12pm–5pm)",
  "Evening (5pm–8pm)",
  "Anytime",
];

type Status = "idle" | "submitting" | "success" | "error";

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");
  const searchParams = useSearchParams();
  const promoFromUrl = (searchParams?.get("promo") ?? "").toUpperCase();
  const tier = tierByCode(promoFromUrl);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = Object.fromEntries(formData);
    data.services = formData.getAll("services");
    data.timestamp = new Date().toISOString();
    data.source = data.source || "Website Form";

    // Tag the source as the form for CRM filtering. Match temp-repo behavior:
    // override "source" select with a fixed string so leads roll up consistently.
    data.source = "website-quote-form";

    // Dual-write into Supabase (best-effort, non-blocking). The Apps Script
    // POST below remains the source of truth for the Sheet + alerts.
    fetch("/api/leads/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {});

    try {
      // Apps Script requires no-cors + text/plain to avoid preflight rejection.
      await fetch(SITE.quoteEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(data),
      });
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {status === "success" ? (
        <div className="rounded-md border border-green-300 bg-green-50 text-green-900 px-4 py-3 text-sm">
          ✓ <strong>Quote request sent!</strong> We&apos;ll follow up within 24
          hours. Prefer faster? Call or text us at{" "}
          <a href={SITE.phoneHref} className="font-semibold underline">
            {SITE.phone}
          </a>
          .
        </div>
      ) : null}
      {status === "error" ? (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm">
          Something went wrong. Please try again or call us directly at{" "}
          <a href={SITE.phoneHref} className="font-semibold underline">
            {SITE.phone}
          </a>
          .
        </div>
      ) : null}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone Number *" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="(513) 555-0100"
            className={inputCls}
          />
        </Field>
        <Field label="Email Address" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="john@example.com"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ZIP Code *" htmlFor="zip">
          <input
            id="zip"
            name="zip"
            type="text"
            required
            maxLength={10}
            placeholder="45233"
            className={inputCls}
          />
        </Field>
        <Field label="Best Time to Reach You" htmlFor="bestTime">
          <select id="bestTime" name="bestTime" className={inputCls}>
            <option value="">Select a time...</option>
            {BEST_TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Preferred way to reach you" htmlFor="preferredContact">
        <select id="preferredContact" name="preferredContact" defaultValue="Either" className={inputCls}>
          <option value="Either">Either text or email</option>
          <option value="Text">Text message</option>
          <option value="Email">Email</option>
        </select>
      </Field>

      <fieldset>
        <legend className={labelCls}>
          What service(s) are you interested in? *{" "}
          <span className="font-normal text-xs text-muted">
            Select all that apply
          </span>
        </legend>
        <div className="mt-2 flex flex-col gap-2.5">
          {SERVICES.map((s) => (
            <label key={s} className={checkboxCls}>
              <input
                type="checkbox"
                name="services"
                value={s}
                className="h-[18px] w-[18px] accent-burgundy mt-px"
              />
              <span>{s}</span>
            </label>
          ))}
          <label className={`${checkboxCls} text-burgundy font-medium`}>
            <input
              type="checkbox"
              name="services"
              value={MEMBERSHIP}
              className="h-[18px] w-[18px] accent-burgundy mt-px"
            />
            <span>🚨 Annual Membership — Limited Time Offer</span>
          </label>
        </div>
      </fieldset>

      <Field
        label="Grill Make & Model"
        sub="If inquiring about cleaning or repair"
        htmlFor="grillModel"
      >
        <input
          id="grillModel"
          name="grillModel"
          type="text"
          placeholder='e.g. Weber Genesis II, DCS 36", Napoleon Prestige 500'
          className={inputCls}
        />
        <p className="mt-1.5 text-xs text-muted">
          Have a photo? Text it to us at{" "}
          <a href={SITE.smsHref} className="text-navy font-medium">
            {SITE.phone}
          </a>{" "}
          after submitting.
        </p>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="How did you hear about us?" htmlFor="hearAbout">
          <select id="hearAbout" name="hearAbout" className={inputCls}>
            <option value="">Select an option...</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Referred by"
          sub="They'll get a thank you!"
          htmlFor="referredBy"
        >
          <input
            id="referredBy"
            name="referredBy"
            type="text"
            placeholder="Name of person who referred you"
            className={inputCls}
          />
        </Field>
      </div>

      {tier ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-navy">
          <strong className="block font-display tracking-wide uppercase text-burgundy text-xs">
            {tier.label} · {tier.percent}% off applied
          </strong>
          <span className="mt-1 block leading-relaxed">
            {tier.id === "neighbor"
              ? "Please list your neighbor's name & address (or your second grill's details) in the notes below so we can coordinate."
              : tier.blurb}
          </span>
        </div>
      ) : null}

      <Field label="Promo Code" sub="Optional" htmlFor="promoCode">
        <input
          id="promoCode"
          name="promoCode"
          type="text"
          defaultValue={tier ? tier.code : ""}
          placeholder="e.g. MEMORIAL10"
          className={`${inputCls} uppercase`}
          style={{ textTransform: "uppercase" }}
        />
      </Field>

      <Field
        label="Anything else we should know?"
        sub="Optional"
        htmlFor="notes"
      >
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Grill condition, access notes, address, or anything else..."
          className={inputCls}
        />
      </Field>

      <button
        type="submit"
        disabled={status === "submitting" || status === "success"}
        className="w-full rounded-md bg-burgundy text-bone py-4 font-semibold uppercase tracking-widest hover:bg-burgundy-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "submitting"
          ? "Sending..."
          : status === "success"
          ? "Quote Sent! ✓"
          : "Get a Free Quote →"}
      </button>
      <p className="text-center text-xs text-muted">
        We respond within 24 hours. Prefer to call?{" "}
        <a href={SITE.phoneHref} className="text-navy font-medium">
          {SITE.phone}
        </a>
      </p>
    </form>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy";
const labelCls =
  "block font-display text-sm tracking-wide text-navy uppercase";
const checkboxCls =
  "flex items-start gap-2.5 text-sm text-ink cursor-pointer";

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
