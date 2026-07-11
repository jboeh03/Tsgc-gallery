"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SITE } from "@/lib/site";
import { tierByCode } from "@/lib/campaign";
import AddressAutocomplete from "@/components/weber/AddressAutocomplete";
import SmsConsent from "@/components/SmsConsent";
import { compressImage } from "@/lib/image-compress";
import { trackQuoteConversion } from "@/lib/ads";

const MEMBERSHIP = "🚨 Annual Membership *Limited Time Offer";

const SERVICE_TYPES = ["Cleaning", "Inspection & Repair", "Both", "Membership"] as const;
type ServiceType = (typeof SERVICE_TYPES)[number];

const BRANDS = [
  "Weber", "Char-Broil", "Napoleon", "Traeger", "Pit Boss", "Blackstone",
  "Broil King", "Nexgrill", "KitchenAid", "Lynx", "DCS", "Coyote", "Bull", "Saber",
  "Other / not listed",
];
const SIZES = [
  "Not sure", "2-burner", "3-burner", "4-burner", "5-burner", "6+ burner",
  "Built-in / island", "Flat-top / griddle", "Smoker", "Kamado / charcoal", "Other",
];

const SOURCES = [
  "Google", "Instagram", "Facebook", "All Decked Out", "Everything Cincy",
  "Saw your crew around town", "A Friend Referral", "Repeat Customer",
];
const BEST_TIMES = ["Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–8pm)", "Anytime"];

type Status = "idle" | "submitting" | "success" | "error";

function mapServices(t: ServiceType | ""): string[] {
  switch (t) {
    case "Cleaning": return ["Gas BBQ Grill Cleaning"];
    case "Inspection & Repair": return ["BBQ Grill Inspection and/or Repair"];
    case "Both": return ["Gas BBQ Grill Cleaning", "BBQ Grill Inspection and/or Repair"];
    case "Membership": return [MEMBERSHIP];
    default: return [];
  }
}

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const promoFromUrl = (searchParams?.get("promo") ?? "").toUpperCase();
  const tier = tierByCode(promoFromUrl);

  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [repairDesc, setRepairDesc] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [exactModel, setExactModel] = useState("");
  const [photo, setPhoto] = useState<{ base64: string; mime: string; preview: string } | null>(null);
  const [smsConsent, setSmsConsent] = useState(false);

  const needsRepairDesc = serviceType === "Inspection & Repair" || serviceType === "Both";

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { setErr("That photo is over 30 MB — please pick a smaller one."); return; }
    try {
      // Compress in the browser so big iPhone photos upload without friction.
      setPhoto(await compressImage(file));
      setErr(null);
    } catch {
      setErr("Couldn't read that photo. Try a JPG or PNG.");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!address.trim()) { setErr("Service address is required."); return; }
    if (!serviceType) { setErr("Pick a service."); return; }
    if (!smsConsent) { setErr("Please check the box agreeing to receive texts so we can reach you about your service."); return; }
    setStatus("submitting"); setErr(null);

    const base: Record<string, unknown> = Object.fromEntries(new FormData(form));
    const grillModel = [brand, size && size !== "Not sure" ? size : "", exactModel.trim()].filter(Boolean).join(" · ");
    const notes = [base.notes, needsRepairDesc && repairDesc.trim() ? `Repair/inspection: ${repairDesc.trim()}` : ""]
      .filter(Boolean).join("\n");

    const data: Record<string, unknown> = {
      ...base,
      services: mapServices(serviceType),
      serviceAddress: address,
      zip: address.match(/\b(\d{5})\b/)?.[1] || base.zip || "",
      grillModel,
      notes,
      smsConsent: true,
      source: "website-quote-form",
      timestamp: new Date().toISOString(),
    };

    // Supabase ingest gets the photo; Apps Script gets everything but the photo.
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
      setStatus("success");
      trackQuoteConversion();
      form.reset();
      setAddress(""); setServiceType(""); setRepairDesc(""); setBrand(""); setSize(""); setExactModel(""); setPhoto(null); setSmsConsent(false);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {status === "success" && (
        <div className="rounded-md border border-green-300 bg-green-50 text-green-900 px-4 py-3 text-sm">
          ✓ <strong>Quote request sent!</strong> We&apos;ll follow up within 24 hours. Prefer faster? Call or text us at{" "}
          <a href={SITE.phoneHref} className="font-semibold underline">{SITE.phone}</a>.
        </div>
      )}
      {status === "error" && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm">
          Something went wrong. Please try again or call us directly at{" "}
          <a href={SITE.phoneHref} className="font-semibold underline">{SITE.phone}</a>.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name *" htmlFor="firstName">
          <input id="firstName" name="firstName" type="text" required placeholder="John" className={inputCls} />
        </Field>
        <Field label="Last Name *" htmlFor="lastName">
          <input id="lastName" name="lastName" type="text" required placeholder="Smith" className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone Number *" htmlFor="phone">
          <input id="phone" name="phone" type="tel" required placeholder="(513) 555-0100" className={inputCls} />
        </Field>
        <Field label="Email Address" htmlFor="email">
          <input id="email" name="email" type="email" placeholder="john@example.com" className={inputCls} />
        </Field>
      </div>

      <Field label="Service Address *" htmlFor="serviceAddress">
        <AddressAutocomplete value={address} onChange={setAddress} required placeholder="Start typing your address…" className={inputCls} />
      </Field>

      {/* Service selector */}
      <fieldset>
        <legend className={labelCls}>What can we help with? *</legend>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SERVICE_TYPES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setServiceType(t)}
              className={[
                "rounded-md border px-3 py-2.5 text-sm font-medium transition text-center",
                serviceType === t ? "border-burgundy bg-burgundy text-bone" : "border-border bg-white text-ink hover:border-burgundy/50",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>
        {needsRepairDesc && (
          <div className="mt-3">
            <label htmlFor="repairDesc" className="text-xs uppercase tracking-wider text-muted">Briefly, what&apos;s going on? *</label>
            <textarea
              id="repairDesc"
              value={repairDesc}
              onChange={(e) => setRepairDesc(e.target.value)}
              rows={3}
              required
              placeholder="e.g. igniter won't spark, burner uneven, grates rusted, regulator issue…"
              className={`mt-1 ${inputCls}`}
            />
          </div>
        )}
      </fieldset>

      {/* Grill */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Grill brand" htmlFor="brand">
          <select id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputCls}>
            <option value="">Select brand…</option>
            {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Model / size" sub="Pick 'Not sure' if unknown" htmlFor="size">
          <select id="size" value={size} onChange={(e) => setSize(e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Exact model" sub="Optional — if you know it" htmlFor="exactModel">
        <input id="exactModel" value={exactModel} onChange={(e) => setExactModel(e.target.value)} type="text" placeholder='e.g. Genesis II E-335, Prestige 500' className={inputCls} />
      </Field>

      {/* Optional photo */}
      <Field label="Photo of your grill" sub="Optional — helps us quote faster" htmlFor="photo">
        <input id="photo" type="file" accept="image/*" onChange={onPhoto} className={`${inputCls} file:mr-3 file:rounded file:border-0 file:bg-navy file:px-3 file:py-1 file:text-bone`} />
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.preview} alt="Your grill" className="mt-2 h-28 rounded-md object-cover" />
        )}
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Best Time to Reach You" htmlFor="bestTime">
          <select id="bestTime" name="bestTime" className={inputCls}>
            <option value="">Select a time...</option>
            {BEST_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Preferred way to reach you" htmlFor="preferredContact">
          <select id="preferredContact" name="preferredContact" defaultValue="Either" className={inputCls}>
            <option value="Either">Either text or email</option>
            <option value="Text">Text message</option>
            <option value="Email">Email</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="How did you hear about us?" htmlFor="hearAbout">
          <select id="hearAbout" name="hearAbout" className={inputCls}>
            <option value="">Select an option...</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Referred by" sub="They'll get a thank you!" htmlFor="referredBy">
          <input id="referredBy" name="referredBy" type="text" placeholder="Name of person who referred you" className={inputCls} />
        </Field>
      </div>

      {tier && (
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
      )}

      <Field label="Promo Code" sub="Optional" htmlFor="promoCode">
        <input id="promoCode" name="promoCode" type="text" defaultValue={tier ? tier.code : promoFromUrl} placeholder="e.g. MEMORIAL10" className={`${inputCls} uppercase`} style={{ textTransform: "uppercase" }} />
      </Field>

      <Field label="Anything else we should know?" sub="Optional" htmlFor="notes">
        <textarea id="notes" name="notes" rows={3} placeholder="Grill condition, gate code, access notes, or anything else..." className={inputCls} />
      </Field>

      <SmsConsent checked={smsConsent} onChange={setSmsConsent} />

      {err && <p className="text-sm text-burgundy">{err}</p>}

      <button
        type="submit"
        disabled={status === "submitting" || status === "success"}
        className="w-full rounded-md bg-burgundy text-bone py-4 font-semibold uppercase tracking-widest hover:bg-burgundy-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Sending..." : status === "success" ? "Quote Sent! ✓" : "Get a Free Quote →"}
      </button>
      <p className="text-center text-xs text-muted">
        We respond within 24 hours. Prefer to call?{" "}
        <a href={SITE.phoneHref} className="text-navy font-medium">{SITE.phone}</a>
      </p>
    </form>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy";
const labelCls = "block font-display text-sm tracking-wide text-navy uppercase";

function Field({ label, sub, htmlFor, children }: { label: string; sub?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
        {sub ? <span className="ml-1 font-normal normal-case tracking-normal text-xs text-muted">{sub}</span> : null}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
