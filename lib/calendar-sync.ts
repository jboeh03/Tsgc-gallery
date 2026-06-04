/**
 * One-shot backfill: turn every past TSGC Schedule calendar event into a
 * "completed" job in the CRM. Event titles are messy (e.g. "Jessica kaczor
 * (bull $535 - paying $150 deposit...)"), so Claude extracts the clean customer
 * name + grill from each. Idempotent on jobs.gcal_event_id — re-running skips
 * already-imported events (so no duplicate contacts/jobs). Tagged
 * source="calendar" so it's easy to identify/undo.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { listCalendarEvents } from "@/lib/calendar";
import type { ContactRow, JobRow } from "@/lib/db/types";

type Parsed = { id: string; name: string; grill: string };

async function parseEvents(events: { id: string; title: string }[]): Promise<Map<string, Parsed>> {
  const out = new Map<string, Parsed>();
  if (!process.env.ANTHROPIC_API_KEY || events.length === 0) return out;
  const client = new Anthropic();
  const r = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    system: [{
      type: "text",
      text: `You clean up grill-cleaning calendar event titles. For each event, extract the CUSTOMER'S NAME (a person's name, Title Case) and the grill make/model if present. Strip prices, deposits, and notes. If the title has no clear person name (e.g. just a city or "Gary help"), use the title text as the name, cleaned up.`,
      cache_control: { type: "ephemeral" },
    }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  grill: { type: "string" },
                },
                required: ["id", "name", "grill"],
              },
            },
          },
          required: ["events"],
        },
      },
    },
    messages: [{ role: "user", content: JSON.stringify(events) }],
  });
  const t = r.content.find((b) => b.type === "text");
  if (!t || t.type !== "text") return out;
  try {
    const parsed = JSON.parse(t.text) as { events?: Parsed[] };
    for (const e of parsed.events ?? []) out.set(e.id, e);
  } catch {
    /* fall through with whatever we got */
  }
  return out;
}

export type BackfillResult = { created: number; skipped: number; total: number; matched: number };

export async function backfillCompletedFromCalendar(): Promise<BackfillResult> {
  if (!isSupabaseConfigured()) return { created: 0, skipped: 0, total: 0, matched: 0 };
  const sb = getSupabase();
  const now = Date.now();
  const events = await listCalendarEvents(
    new Date(now - 180 * 86_400_000).toISOString(),
    new Date(now).toISOString()
  );
  if (events.length === 0) return { created: 0, skipped: 0, total: 0, matched: 0 };

  // Which events are already imported?
  const { data: existing } = await sb.from("jobs").select("gcal_event_id").not("gcal_event_id", "is", null);
  const seen = new Set((existing ?? []).map((j) => (j as { gcal_event_id: string }).gcal_event_id));

  const todo = events.filter((e) => e.id && !seen.has(e.id));
  const parsedById = await parseEvents(todo.map((e) => ({ id: e.id, title: e.title })));

  let created = 0, matched = 0;
  for (const e of todo) {
    const p = parsedById.get(e.id);
    const name = (p?.name || e.title || "").trim() || "Calendar customer";
    const date = (e.start || "").slice(0, 10) || null;
    try {
      // Match an existing contact by name, else create one.
      let contactId: string | null = null;
      const { data: hit } = await sb.from("contacts").select("id").ilike("name", name).limit(1).maybeSingle();
      if (hit) {
        contactId = (hit as { id: string }).id;
        matched++;
      } else {
        const insert: Partial<ContactRow> = {
          name,
          service_address: e.location || null,
          grill_model: p?.grill || null,
          source: "calendar",
        };
        const { data: c } = await sb.from("contacts").insert(insert).select("id").single();
        contactId = (c as { id: string } | null)?.id ?? null;
      }

      const jobInsert: Partial<JobRow> = {
        contact_id: contactId,
        status: "completed",
        service: p?.grill || null,
        source: "calendar",
        notes: e.title || null,
        date_completed: date,
        job_address: e.location || null,
        grill_model: p?.grill || null,
        gcal_event_id: e.id,
      };
      await sb.from("jobs").insert(jobInsert);
      created++;
    } catch {
      /* skip a bad row, keep going */
    }
  }

  return { created, skipped: events.length - todo.length, total: events.length, matched };
}
