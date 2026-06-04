"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobRow, ContactRow, PipelineStatus } from "@/lib/db/types";

const STATUSES: PipelineStatus[] = [
  "new", "quoted", "booked", "scheduled", "completed", "invoiced", "paid", "review", "lost",
];

export default function CrmEditor({
  job,
  contact,
}: {
  job: JobRow;
  contact: ContactRow | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Job fields
  const [status, setStatus] = useState<PipelineStatus>(job.status);
  const [service, setService] = useState(job.service ?? "");
  const [quote, setQuote] = useState(job.quote_amount?.toString() ?? "");
  const [jobNotes, setJobNotes] = useState(job.notes ?? "");

  // Contact fields
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone_e164 ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [zip, setZip] = useState(contact?.zip ?? "");
  const [address, setAddress] = useState(contact?.service_address ?? "");
  const [grillModel, setGrillModel] = useState(contact?.grill_model ?? "");
  const [contactNotes, setContactNotes] = useState(contact?.notes ?? "");

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const jobPatch: Partial<JobRow> = {};
    if (status !== job.status) jobPatch.status = status;
    if (service !== (job.service ?? "")) jobPatch.service = service || null;
    const quoteNum = quote.trim() === "" ? null : Number(quote);
    if (quoteNum !== job.quote_amount && !(quote.trim() !== "" && Number.isNaN(quoteNum)))
      jobPatch.quote_amount = quoteNum;
    if (jobNotes !== (job.notes ?? "")) jobPatch.notes = jobNotes || null;

    const contactPatch: Partial<ContactRow> = {};
    if (contact) {
      if (name !== (contact.name ?? "")) contactPatch.name = name || null;
      if (phone !== (contact.phone_e164 ?? "")) contactPatch.phone_e164 = phone || null;
      if (email !== (contact.email ?? "")) contactPatch.email = email || null;
      if (zip !== (contact.zip ?? "")) contactPatch.zip = zip || null;
      if (address !== (contact.service_address ?? "")) contactPatch.service_address = address || null;
      if (grillModel !== (contact.grill_model ?? "")) contactPatch.grill_model = grillModel || null;
      if (contactNotes !== (contact.notes ?? "")) contactPatch.notes = contactNotes || null;
    }

    try {
      const res = await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          contactId: contact?.id ?? null,
          job: jobPatch,
          contact: contactPatch,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Pipeline status */}
      <section className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-display text-sm uppercase tracking-wider text-navy">Pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={[
                "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition",
                status === s
                  ? "bg-burgundy text-bone"
                  : "bg-bone text-ink/70 hover:bg-border",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-display text-sm uppercase tracking-wider text-navy">Contact</h2>
        {contact ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" value={name} onChange={setName} />
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1513…" />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="ZIP" value={zip} onChange={setZip} />
            <div className="sm:col-span-2">
              <Field label="Service address" value={address} onChange={setAddress} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Grill model" value={grillModel} onChange={setGrillModel} />
            </div>
            <div className="sm:col-span-2">
              <TextArea label="Contact notes" value={contactNotes} onChange={setContactNotes} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No contact linked to this job.</p>
        )}
      </section>

      {/* Job */}
      <section className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-display text-sm uppercase tracking-wider text-navy">Job</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Service" value={service} onChange={setService} />
          <Field label="Quote amount ($)" value={quote} onChange={setQuote} type="number" />
          <div className="sm:col-span-2">
            <TextArea label="Job notes" value={jobNotes} onChange={setJobNotes} />
          </div>
        </div>
      </section>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wider">
        <a href="/admin/inbox" className="text-navy hover:text-burgundy">→ Inbox</a>
        <a href="/admin/jobs" className="text-navy hover:text-burgundy">→ Jobs</a>
        <a href="/book" target="_blank" rel="noopener noreferrer" className="text-navy hover:text-burgundy">→ Booking page</a>
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-4 sticky bottom-0 bg-bone/80 backdrop-blur py-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-navy px-5 py-2 text-sm uppercase tracking-wider text-bone hover:bg-navy-700 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm text-emerald-700">Saved ✓</span>}
        {error && <span className="text-sm text-burgundy">{error}</span>}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
      />
    </label>
  );
}

function TextArea({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted">{label}</span>
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none resize-y"
      />
    </label>
  );
}
