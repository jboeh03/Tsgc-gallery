"use client";

import { useState } from "react";
import type { Assessment } from "@/lib/preview/types";
import type { WeberModel } from "@/lib/campaign-weber";

type Quote = {
  assessment: Assessment;
  basePrice: number;
  discountedPrice: number;
  discountPercent: number;
  tierLabel: string;
};

const MODELS: WeberModel[] = ["Spirit", "Genesis", "Summit", "Other"];

const input = "mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none";
const label = "text-[11px] uppercase tracking-wider text-muted";

export default function WeberBookingForm() {
  const [step, setStep] = useState<"collect" | "quote">("collect");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [model, setModel] = useState<WeberModel>("Genesis");
  const [burners, setBurners] = useState(4);
  const [serviceAddress, setServiceAddress] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [neighbor, setNeighbor] = useState(false);

  const [photo, setPhoto] = useState<{ base64: string; mime: string; preview: string } | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const base64 = dataUrl.split(",")[1] ?? "";
      setPhoto({ base64, mime: file.type, preview: dataUrl });
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  async function getQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) { setError("Add a photo of your Weber so we can quote it."); return; }
    if (!serviceAddress.trim()) { setError("Service address is required."); return; }
    if (!email.trim() || !phone.trim() || !preferredDate) { setError("Phone, email, and a preferred date are required."); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/weber/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64: photo.base64, imageMimeType: photo.mime, burners, neighbor }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Couldn't get a quote.");
      setQuote(d as Quote);
      setStep("quote");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't get a quote.");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!quote) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/weber/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName, lastName, phone, email, serviceAddress,
          preferredDate, preferredTime, model, burners, neighbor,
          assessment: quote.assessment,
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.url) throw new Error(d.error || "Checkout failed.");
      window.location.href = d.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setBusy(false);
    }
  }

  if (step === "quote" && quote) {
    const a = quote.assessment;
    return (
      <div className="rounded-2xl border border-border bg-white p-6 space-y-5">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-burgundy">Your Weber · {quote.tierLabel}</p>
          <h3 className="font-display text-2xl text-navy mt-1">Here&apos;s your quote</h3>
        </div>

        <div className="rounded-xl bg-bone/60 p-4 text-sm text-ink/80 space-y-2">
          <p><span className="font-semibold text-navy capitalize">{a.conditionSeverity}</span> buildup detected{a.burnerCount ? ` · ${a.burnerCount} burners` : ""}.</p>
          {a.conditionIssues?.length > 0 && (
            <ul className="list-disc list-inside text-ink/70">
              {a.conditionIssues.slice(0, 4).map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          )}
          {a.recommendation && <p className="text-ink/70">{a.recommendation}</p>}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted line-through">${quote.basePrice}</p>
            <p className="font-display text-5xl text-navy leading-none">${quote.discountedPrice}</p>
          </div>
          <span className="rounded-full bg-burgundy/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-burgundy">
            {quote.discountPercent}% off{neighbor ? " · neighbor rate" : ""}
          </span>
        </div>

        {error && <p className="text-sm text-burgundy">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="button" onClick={pay} disabled={busy} className="flex-1 rounded-md bg-burgundy px-5 py-3 text-sm font-semibold uppercase tracking-wider text-bone hover:bg-burgundy-700 disabled:opacity-40">
            {busy ? "Opening checkout…" : `Pay $${quote.discountedPrice} & lock my slot →`}
          </button>
          <button type="button" onClick={() => { setStep("collect"); setError(null); }} className="text-xs uppercase tracking-wider text-muted hover:text-ink">
            Back
          </button>
        </div>
        <p className="text-[11px] text-muted">Secure payment via Stripe. Pay in full to confirm your spot — we&apos;ll text to confirm the window.</p>
      </div>
    );
  }

  return (
    <form onSubmit={getQuote} className="rounded-2xl border border-border bg-white p-6 space-y-4">
      <h3 className="font-display text-2xl text-navy">Book your Weber clean</h3>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className={label}>Weber model</span>
          <select value={model} onChange={(e) => setModel(e.target.value as WeberModel)} className={input}>
            {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={label}>Burners</span>
          <select value={burners} onChange={(e) => setBurners(Number(e.target.value))} className={input}>
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={label}>Service address *</span>
        <input value={serviceAddress} onChange={(e) => setServiceAddress(e.target.value)} required placeholder="123 Main St, Cincinnati, OH" className={input} />
      </label>

      <label className="block">
        <span className={label}>Photo of your grill *</span>
        <input type="file" accept="image/*" onChange={onPhoto} required className={`${input} file:mr-3 file:rounded file:border-0 file:bg-navy file:px-3 file:py-1 file:text-bone`} />
        {photo && <img src={photo.preview} alt="Your grill" className="mt-2 h-28 rounded-md object-cover" />}
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block"><span className={label}>First name</span><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={input} /></label>
        <label className="block"><span className={label}>Last name</span><input value={lastName} onChange={(e) => setLastName(e.target.value)} className={input} /></label>
        <label className="block"><span className={label}>Phone *</span><input value={phone} onChange={(e) => setPhone(e.target.value)} required className={input} /></label>
        <label className="block"><span className={label}>Email *</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={input} /></label>
        <label className="block"><span className={label}>Preferred date *</span><input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} required className={input} /></label>
        <label className="block">
          <span className={label}>Preferred time</span>
          <select value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className={input}>
            <option value="">Flexible</option>
            <option>Morning</option><option>Afternoon</option><option>Evening</option>
          </select>
        </label>
      </div>

      <label className="flex items-start gap-2 rounded-lg bg-bone/60 p-3 text-sm text-ink/80">
        <input type="checkbox" checked={neighbor} onChange={(e) => setNeighbor(e.target.checked)} className="mt-0.5" />
        <span>I&apos;m booking with a neighbor or friend nearby — <strong className="text-burgundy">30% off</strong> instead of 15%.</span>
      </label>

      {error && <p className="text-sm text-burgundy">{error}</p>}

      <button type="submit" disabled={busy} className="w-full rounded-md bg-navy px-5 py-3 text-sm font-semibold uppercase tracking-wider text-bone hover:bg-navy-700 disabled:opacity-40">
        {busy ? "Inspecting your grill…" : "Get my price →"}
      </button>
    </form>
  );
}
