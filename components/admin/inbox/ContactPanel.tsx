import type { ContactRow, JobRow } from "@/lib/db/types";
import { type MissingField, FIELD_LABELS } from "@/lib/comms/missingFields";
import ScheduleButton from "./ScheduleButton";

const REQUIRED: MissingField[] = ["service_address", "grill_model", "grill_size"];

export default function ContactPanel({
  contact,
  job,
  missing,
  conversationId,
}: {
  contact: ContactRow;
  job: JobRow | null;
  missing: MissingField[];
  conversationId: string;
}) {
  const ready = missing.length === 0;
  return (
    <aside className="space-y-5">
      <section className="rounded-xl border border-border bg-white p-4">
        <h3 className="font-display text-base text-navy">{contact.name || "Unknown contact"}</h3>
        <dl className="mt-2 space-y-1 text-sm">
          <Row label="Phone" value={contact.phone_e164} href={contact.phone_e164 ? `tel:${contact.phone_e164}` : undefined} />
          <Row label="Email" value={contact.email} />
          <Row label="Address" value={contact.service_address} />
          <Row label="Grill" value={[contact.grill_brand, contact.grill_model].filter(Boolean).join(" ") || null} />
          <Row label="Burners" value={contact.grill_burner_count ? String(contact.grill_burner_count) : null} />
          <Row label="Source" value={contact.source} />
        </dl>
        {contact.sms_opt_out && (
          <p className="mt-2 text-[11px] uppercase tracking-wider text-red-600">Opted out of SMS</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-white p-4">
        <h4 className="text-xs uppercase tracking-wider text-muted">Quote readiness</h4>
        <ul className="mt-2 space-y-1.5 text-sm">
          {REQUIRED.map((f) => {
            const have = !missing.includes(f);
            return (
              <li key={f} className="flex items-start gap-2">
                <span className={have ? "text-emerald-600" : "text-muted"}>{have ? "✓" : "○"}</span>
                <span className={have ? "text-ink" : "text-ink/55"}>{FIELD_LABELS[f]}</span>
              </li>
            );
          })}
        </ul>
        <p className={`mt-3 text-xs ${ready ? "text-emerald-700" : "text-muted"}`}>
          {ready ? "Ready to quote — you have everything." : "Still gathering info before a quote."}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-white p-4">
        <h4 className="text-xs uppercase tracking-wider text-muted mb-2">Schedule</h4>
        <ScheduleButton
          conversationId={conversationId}
          contactId={contact.id}
          jobId={job?.id ?? null}
        />
      </section>
    </aside>
  );
}

function Row({ label, value, href }: { label: string; value?: string | null; href?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink text-right truncate max-w-[60%]">
        {value ? (href ? <a className="hover:text-burgundy" href={href}>{value}</a> : value) : "—"}
      </dd>
    </div>
  );
}
