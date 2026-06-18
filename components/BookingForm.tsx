"use client";

import { useState, type FormEvent } from "react";
import { SITE } from "@/lib/site";
import { AREAS } from "@/lib/areas";
import SmsConsent from "@/components/SmsConsent";

const TIME_WINDOWS = ["Morning (8a–12p)", "Afternoon (12p–5p)", "Evening (5p–8p)", "Flexible"];

type Status = "idle" | "submitting" | "success" | "error";

const inputCls =
  "w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy";

export default function BookingForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [smsConsent, setSmsConsent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!smsConsent) {
      setError("Please check the box agreeing to receive texts so we can confirm your appointment.");
      return;
    }
    setStatus("submitting");
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      serviceAddress: fd.get("serviceAddress"),
      areaId: fd.get("areaId"),
      preferredDate: fd.get("preferredDate"),
      preferredTime: fd.get("preferredTime"),
      grillModel: fd.get("grillModel"),
      notes: fd.get("notes"),
      smsConsent: true,
    };
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j.error || `Failed (${res.status})`);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 text-green-900 px-5 py-6 text-center">
        <p className="font-display text-xl">Request received ✓</p>
        <p className="mt-2 text-sm">
          We&apos;ll text you shortly to lock in the time. Need us faster? Call or text{" "}
          <a href={SITE.smsHref} className="font-semibold underline">{SITE.phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {status === "error" && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm">
          {error} — or just text us at{" "}
          <a href={SITE.smsHref} className="font-semibold underline">{SITE.phone}</a>.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input name="firstName" required placeholder="First name *" className={inputCls} />
        <input name="lastName" placeholder="Last name" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input name="phone" type="tel" required placeholder="Mobile phone *" className={inputCls} />
        <input name="email" type="email" placeholder="Email" className={inputCls} />
      </div>
      <input name="serviceAddress" placeholder="Service address (where the grill is)" className={inputCls} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select name="areaId" defaultValue="" className={inputCls}>
          <option value="">Neighborhood…</option>
          {Object.entries(AREAS).map(([key, a]) => (
            <option key={key} value={key}>{a.label}</option>
          ))}
        </select>
        <input name="grillModel" placeholder="Grill make / model" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-[11px] uppercase tracking-widest text-muted font-semibold mb-1">Preferred date *</span>
          <input name="preferredDate" type="date" required className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-[11px] uppercase tracking-widest text-muted font-semibold mb-1">Time window</span>
          <select name="preferredTime" defaultValue="" className={inputCls}>
            <option value="">Any time</option>
            {TIME_WINDOWS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <textarea name="notes" rows={3} placeholder="Anything else? (gate code, grill condition, etc.)" className={inputCls} />

      <SmsConsent checked={smsConsent} onChange={setSmsConsent} />

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-md bg-burgundy text-bone py-3.5 font-semibold uppercase tracking-widest hover:bg-burgundy/90 disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Request this time →"}
      </button>
    </form>
  );
}
