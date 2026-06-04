"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { CalendarEvent } from "@/lib/calendar";

function fmtWhen(e: CalendarEvent): string {
  if (!e.start) return "—";
  const d = new Date(e.allDay ? `${e.start}T12:00:00` : e.start);
  return e.allDay ? format(d, "EEE, MMM d") : format(d, "EEE, MMM d · h:mma");
}

/**
 * Completed-jobs table from the TSGC Schedule calendar. Shows the most recent
 * `initialCount` (≈ the past week) and reveals the full history on demand.
 * Events are passed in most-recent-first.
 */
export default function CalendarJobList({
  events,
  initialCount,
}: {
  events: CalendarEvent[];
  initialCount: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) {
    return (
      <div className="p-5">
        <p className="text-sm text-muted">No past jobs on the calendar yet.</p>
      </div>
    );
  }

  const shown = expanded ? events : events.slice(0, initialCount);

  return (
    <>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted bg-bone/40">
          <tr>
            <th className="px-4 py-3 font-semibold whitespace-nowrap">When</th>
            <th className="px-4 py-3 font-semibold">Job</th>
            <th className="px-4 py-3 font-semibold">Address</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {shown.map((e) => (
            <tr key={e.id} className="hover:bg-bone/40 align-top">
              <td className="px-4 py-3 whitespace-nowrap text-ink/65">{fmtWhen(e)}</td>
              <td className="px-4 py-3 font-medium text-navy">{e.title || "—"}</td>
              <td className="px-4 py-3 text-ink/65 max-w-xs">{e.location || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {events.length > initialCount && (
        <div className="px-4 py-3 border-t border-border">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-burgundy hover:underline"
          >
            {expanded ? "Show less" : `See all ${events.length} jobs →`}
          </button>
        </div>
      )}
    </>
  );
}
