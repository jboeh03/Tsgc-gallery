/**
 * The COO agent — Jeff's chief of staff for the HQ. He takes a written or
 * spoken request, decides whether it's a QUESTION (answer it by querying the
 * business data) or WORK (distill → plan → assign to the right subagents as
 * approvable tasks), and replies in one tight message.
 *
 * Design tenets (the "operating charter" lives in CHARTER below):
 * - Answers are grounded in real data via tools — never guessed.
 * - Work is proposed, never auto-executed: tasks land as `proposed` for Jeff's
 *   one-tap approval, honoring the whole HQ's human-in-the-loop rule.
 * - Persistent memory: every exchange is stored in coo_messages and the recent
 *   history is reloaded each turn, so the COO has continuity across sessions.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { listCalendarEvents } from "@/lib/calendar";
import type { CooMessageRow, CooTaskRow } from "@/lib/db/types";

const MODEL = process.env.COO_MODEL || "claude-haiku-4-5";

/** The subagent team the COO assigns work to. */
export const SUBAGENTS: { name: string; role: string }[] = [
  { name: "Erin", role: "Customer comms & follow-up — inbox replies, lead follow-ups, reminders, review requests" },
  { name: "Marcus", role: "Marketing & campaigns — landing pages, promos/discount codes, social posts, blog, imagery briefs" },
  { name: "Dana", role: "Scheduling & dispatch — appointments, routing, the this-week map" },
  { name: "Sam", role: "Billing & collections — invoices, outstanding balances, payment nudges" },
  { name: "Riley", role: "Ops & CRM hygiene — data cleanup, lead triage, SOPs" },
  { name: "Quinn", role: "Growth & research — pricing, competitor scans, lead sourcing, new markets" },
];

const CHARTER = `You are the COO of Tri-State Grill Cleaning — a veteran-founded, solo-operator (Jeff) grill-cleaning business in Cincinnati / Northern Kentucky / Dayton. You run the back office so Jeff can run the truck. You also act as his personal assistant.

YOUR JOB
Take Jeff's request (typed or spoken) and do ONE of two things:
1) ANSWER — if it's a question about the business ("address of the next job?", "did Mark's invoice go out?", "any outstanding invoices?", "new leads I should jump on?"), get the facts with your tools and answer in 1-3 crisp sentences. Never guess; if a tool returns nothing, say so plainly.
2) ASSIGN — if it's work ("kick off a Father's Day promo", "follow up with everyone we quoted last week"), distill it into the smallest set of concrete tasks, assign each to the right subagent, then give Jeff a 1-paragraph plan ending with what you queued for his approval.

YOUR TEAM (assign by name):
${SUBAGENTS.map((s) => `- ${s.name}: ${s.role}`).join("\n")}

HOW WORK ACTUALLY GETS EXECUTED
You PLAN and ASSIGN; the build happens in Claude Code (the dev agent) after Jeff approves, where the subagents have real skills/tools. So every build task must be an execution-ready brief that names the right tool. Available capability catalog:
- Skills: "frontend-design" (distinctive, production-grade UI/landing pages — Marcus's default for any page/visual).
- MCPs (connected): Supabase (data), Vercel (deploy/logs), Twilio (SMS), Gmail + Google Calendar/Drive (Erin), Ahrefs (SEO/keywords — Quinn), Supermetrics (ad analytics — Marcus/Quinn), Zapier (8k app actions), Adobe (creative).
- MCPs Jeff may connect on request: Higgsfield (AI motion video) — name it for video tasks even if not yet connected, and flag "needs Higgsfield connected."
- Coding style: keep it radically simple (Karpathy-minimal) — smallest change that ships.
When you assign, write the brief like: "Marcus — build the Father's Day landing page (skill: frontend-design); promo code DADS25; reuse the Memorial Day campaign pattern. Done = page + promo wired, typecheck/build clean."

OPERATING PRINCIPLES
- Bias to the facts. Pull data before answering anything about jobs, money, or leads.
- Nothing ships on its own. assign_task creates a PROPOSED task — Jeff approves with one tap. Customer texts, invoices, and public posts always wait for him.
- Be specific. A task says exactly what to make, which tool/skill to use, and what "done" looks like — never "do marketing."
- Be brief. Jeff is on his phone between jobs. No preamble, no filler, no restating the question.
- One voice. Warm, direct, local, first person PLURAL (we/us — never I/me). No corporate fluff, no emoji spray.
- Money is sacred. Never state a balance or "invoice sent" without checking. Flag anything overdue.
- When you assign a multi-step effort, sequence it (plan → approve → build) and note dependencies.

Today is ${new Date().toISOString().slice(0, 10)}.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_next_job",
    description: "The next upcoming scheduled appointment: date, time, customer, and service address.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_outstanding_invoices",
    description: "All jobs currently invoiced but not yet paid, with customer and amount.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "check_customer",
    description: "Look up a customer by name and report their most recent job's status, invoice, and payment.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", description: "Customer name or part of it" } },
      required: ["name"],
      additionalProperties: false,
    },
  },
  {
    name: "get_recent_leads",
    description: "New leads created in the last N hours (default 48) that may need a fast response.",
    input_schema: {
      type: "object",
      properties: { hours: { type: "number", description: "Look-back window in hours" } },
      additionalProperties: false,
    },
  },
  {
    name: "assign_task",
    description: "Queue a PROPOSED task for a subagent (awaits Jeff's approval). Call once per discrete task.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        detail: { type: "string", description: "What to make and what done looks like" },
        assignee: { type: "string", enum: SUBAGENTS.map((s) => s.name) },
        priority: { type: "string", enum: ["high", "medium", "low"] },
      },
      required: ["title", "detail", "assignee"],
      additionalProperties: false,
    },
  },
];

type ToolResult = string;

async function getNextJob(): Promise<ToolResult> {
  // Two-way: prefer the live TSGC Schedule Google Calendar.
  const events = await listCalendarEvents();
  if (events.length > 0) {
    const soonest = [...events].sort((a, b) => a.start.localeCompare(b.start))[0];
    return JSON.stringify({
      source: "TSGC Schedule calendar",
      title: soonest.title,
      start: soonest.start,
      address: soonest.location || "no address on the event",
      details: soonest.description || null,
    });
  }

  // Fallback: Supabase appointments (when the calendar bridge isn't deployed yet).
  const sb = getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await sb
    .from("appointments")
    .select("scheduled_date, scheduled_start, service_address, status, contact:contacts(name, phone_e164)")
    .gte("scheduled_date", today)
    .in("status", ["proposed", "confirmed"])
    .order("scheduled_date", { ascending: true })
    .order("scheduled_start", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return "No upcoming appointments on the schedule.";
  const a = data as unknown as { scheduled_date: string; scheduled_start: string | null; service_address: string | null; status: string; contact: { name: string | null; phone_e164: string | null } | null };
  return JSON.stringify({
    date: a.scheduled_date,
    time: a.scheduled_start ?? "time TBD",
    customer: a.contact?.name ?? "Unknown",
    phone: a.contact?.phone_e164 ?? null,
    address: a.service_address ?? "address not on file",
    status: a.status,
  });
}

async function getOutstandingInvoices(): Promise<ToolResult> {
  const sb = getSupabase();
  const { data } = await sb
    .from("jobs")
    .select("invoice_num, invoice_amount, quote_amount, date_completed, contact:contacts(name)")
    .eq("status", "invoiced")
    .order("date_completed", { ascending: true });
  const rows = (data ?? []) as unknown as { invoice_num: string | null; invoice_amount: number | null; quote_amount: number | null; date_completed: string | null; contact: { name: string | null } | null }[];
  if (rows.length === 0) return "No outstanding invoices — everything billed is paid.";
  const list = rows.map((r) => ({
    customer: r.contact?.name ?? "Unknown",
    amount: r.invoice_amount ?? r.quote_amount ?? null,
    invoice: r.invoice_num ?? null,
    completed: r.date_completed ?? null,
  }));
  const total = list.reduce((s, r) => s + (r.amount ?? 0), 0);
  return JSON.stringify({ count: list.length, total, invoices: list });
}

async function checkCustomer(name: string): Promise<ToolResult> {
  const sb = getSupabase();
  const { data: contacts } = await sb
    .from("contacts")
    .select("id, name")
    .ilike("name", `%${name}%`)
    .limit(3);
  const list = (contacts ?? []) as { id: string; name: string | null }[];
  if (list.length === 0) return `No customer found matching "${name}".`;
  if (list.length > 1) return JSON.stringify({ ambiguous: list.map((c) => c.name) });
  const { data: job } = await sb
    .from("jobs")
    .select("status, service, quote_amount, invoice_num, invoice_amount, date_completed, date_paid, created_at")
    .eq("contact_id", list[0].id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!job) return `${list[0].name ?? name} has no job on record.`;
  const j = job as { status: string; service: string | null; quote_amount: number | null; invoice_num: string | null; invoice_amount: number | null; date_completed: string | null; date_paid: string | null };
  return JSON.stringify({
    customer: list[0].name,
    status: j.status,
    service: j.service,
    invoice_sent: Boolean(j.invoice_num) || ["invoiced", "paid"].includes(j.status),
    invoice_num: j.invoice_num,
    amount: j.invoice_amount ?? j.quote_amount,
    paid: Boolean(j.date_paid) || j.status === "paid",
    date_paid: j.date_paid,
    completed: j.date_completed,
  });
}

async function getRecentLeads(hours: number): Promise<ToolResult> {
  const sb = getSupabase();
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  const { data } = await sb
    .from("jobs")
    .select("created_at, service, source, status, contact:contacts(name, phone_e164, zip)")
    .eq("status", "new")
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as { created_at: string; service: string | null; source: string | null; contact: { name: string | null; phone_e164: string | null; zip: string | null } | null }[];
  if (rows.length === 0) return `No new leads in the last ${hours} hours.`;
  return JSON.stringify({
    count: rows.length,
    leads: rows.map((r) => ({
      customer: r.contact?.name ?? "Unknown",
      phone: r.contact?.phone_e164 ?? null,
      zip: r.contact?.zip ?? null,
      service: r.service,
      source: r.source,
      when: r.created_at,
    })),
  });
}

async function assignTask(
  input: { title: string; detail: string; assignee: string; priority?: string },
  sourceMessageId: string | null,
  created: CooTaskRow[]
): Promise<ToolResult> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("coo_tasks")
    .insert({
      title: input.title,
      detail: input.detail,
      assignee: input.assignee,
      priority: input.priority ?? "medium",
      status: "proposed",
      source_message_id: sourceMessageId,
    })
    .select("*")
    .single();
  if (error) return `Could not queue task: ${error.message}`;
  created.push(data as CooTaskRow);
  return `Queued for ${input.assignee} (awaiting your approval): ${input.title}`;
}

async function runTool(
  name: string,
  input: Record<string, unknown>,
  sourceMessageId: string | null,
  created: CooTaskRow[]
): Promise<ToolResult> {
  try {
    switch (name) {
      case "get_next_job": return await getNextJob();
      case "get_outstanding_invoices": return await getOutstandingInvoices();
      case "check_customer": return await checkCustomer(String(input.name ?? ""));
      case "get_recent_leads": return await getRecentLeads(Number(input.hours ?? 48));
      case "assign_task":
        return await assignTask(
          input as { title: string; detail: string; assignee: string; priority?: string },
          sourceMessageId,
          created
        );
      default: return `Unknown tool: ${name}`;
    }
  } catch (e) {
    return `Tool ${name} failed: ${e instanceof Error ? e.message : "error"}`;
  }
}

export type CooResult = { reply: string; tasks: CooTaskRow[] };

async function loadMemory(): Promise<Anthropic.MessageParam[]> {
  const sb = getSupabase();
  const { data } = await sb
    .from("coo_messages")
    .select("role, content")
    .order("created_at", { ascending: false })
    .limit(16);
  const rows = ((data ?? []) as Pick<CooMessageRow, "role" | "content">[]).reverse();
  return rows.map((r) => ({ role: r.role, content: r.content }));
}

export async function runCoo(message: string): Promise<CooResult> {
  if (!isSupabaseConfigured()) return { reply: "The database isn't connected, so I can't run the back office yet.", tasks: [] };
  if (!process.env.ANTHROPIC_API_KEY) return { reply: "The COO needs ANTHROPIC_API_KEY set to think. Add it in Vercel and I'm live.", tasks: [] };

  const sb = getSupabase();
  // Persist the request first so assigned tasks can link back to it.
  const { data: userMsg } = await sb
    .from("coo_messages")
    .insert({ role: "user", content: message })
    .select("id")
    .single();
  const sourceMessageId = (userMsg as { id: string } | null)?.id ?? null;

  const client = new Anthropic();
  const history = await loadMemory();
  const messages: Anthropic.MessageParam[] = [...history, { role: "user", content: message }];
  const created: CooTaskRow[] = [];

  let reply = "";
  for (let i = 0; i < 6; i++) {
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [{ type: "text", text: CHARTER, cache_control: { type: "ephemeral" } }],
      tools: TOOLS,
      messages,
    });

    if (r.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: r.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of r.content) {
        if (block.type === "tool_use") {
          const out = await runTool(block.name, block.input as Record<string, unknown>, sourceMessageId, created);
          results.push({ type: "tool_result", tool_use_id: block.id, content: out });
        }
      }
      messages.push({ role: "user", content: results });
      continue;
    }

    reply = r.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
    break;
  }

  if (!reply) reply = "I worked through a few steps but couldn't land a clean answer — try narrowing the request.";

  await sb.from("coo_messages").insert({
    role: "assistant",
    content: reply,
    meta: { tasks: created.map((t) => t.id) },
  });

  return { reply, tasks: created };
}
