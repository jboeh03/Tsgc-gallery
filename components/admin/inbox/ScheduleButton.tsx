"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AREAS } from "@/lib/areas";

/**
 * One-click "add to schedule" from a conversation. Opens a tiny inline form
 * (date + start time + optional confirmation text) and posts to
 * /api/appointments, which creates the appointment, advances the linked job to
 * 'scheduled', and optionally texts the customer a confirmation.
 */
export default function ScheduleButton({
  conversationId,
  contactId,
  jobId,
}: {
  conversationId: string;
  contactId: string;
  jobId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [areaId, setAreaId] = useState("");
  const [confirm, setConfirm] = useState(true);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!date || state === "saving") return;
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId,
          contactId,
          jobId,
          scheduledDate: date,
          scheduledStart: start || null,
          areaId: areaId || null,
          sendConfirmation: confirm,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Failed (${res.status})`);
      setOpen(false);
      setState("idle");
      router.refresh();
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Failed to schedule");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-navy px-3 py-2 text-xs uppercase tracking-wider text-navy hover:bg-navy hover:text-bone transition"
      >
        + Add to schedule
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-[11px] uppercase tracking-wider text-muted">
        Date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-[11px] uppercase tracking-wider text-muted">
        Start time
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-[11px] uppercase tracking-wider text-muted">
        Neighborhood (shows on the public map)
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm bg-white"
        >
          <option value="">— none / private —</option>
          {Object.entries(AREAS).map(([key, area]) => (
            <option key={key} value={key}>
              {area.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-ink/75">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
        Text the customer a confirmation
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!date || state === "saving"}
          className="rounded-md bg-burgundy px-3 py-1.5 text-xs uppercase tracking-wider text-bone hover:bg-burgundy/90 disabled:opacity-40"
        >
          {state === "saving" ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs uppercase tracking-wider text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
