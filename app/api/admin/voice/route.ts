/**
 * Voice command resolver for the HQ. Takes a raw spoken transcript and returns
 * a single ACTION the client executes: navigate, search, speak (read-aloud), or
 * confirm_update (edits are never auto-applied — they come back for one tap,
 * consistent with the rest of the human-in-the-loop HQ).
 *
 * Intent is matched by fast rules first (no API key needed); anything left over
 * falls to Claude when ANTHROPIC_API_KEY is set.
 */

import Anthropic from "@anthropic-ai/sdk";
import { auth, isAdmin } from "@/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import type { PipelineStatus } from "@/lib/db/types";

export const runtime = "nodejs";

type Action =
  | { action: "navigate"; to: string; say: string }
  | { action: "search"; query: string; to: string; say: string }
  | { action: "speak"; say: string }
  | { action: "confirm_update"; jobId: string; status: PipelineStatus; say: string }
  | { action: "none"; say: string };

const SECTIONS: { keywords: string[]; href: string; label: string }[] = [
  { keywords: ["overview", "dashboard", "home"], href: "/admin", label: "Overview" },
  { keywords: ["inbox", "messages", "texts", "conversations"], href: "/admin/inbox", label: "Inbox" },
  { keywords: ["crm", "leads", "lead", "customers", "contacts"], href: "/admin/leads", label: "CRM" },
  { keywords: ["jobs", "job"], href: "/admin/jobs", label: "Jobs" },
  { keywords: ["suggestions"], href: "/admin/suggestions", label: "Suggestions" },
  { keywords: ["marketing"], href: "/admin/marketing", label: "Marketing" },
  { keywords: ["campaigns", "campaign"], href: "/admin/campaigns", label: "Campaigns" },
  { keywords: ["traffic"], href: "/admin/traffic", label: "Traffic" },
  { keywords: ["affiliate", "products"], href: "/admin/products", label: "Affiliate" },
  { keywords: ["agents", "agent"], href: "/admin/agents", label: "Agents" },
  { keywords: ["backlog", "ideas"], href: "/admin/backlog", label: "Backlog" },
  { keywords: ["settings", "health"], href: "/admin/settings", label: "Settings" },
];

const STATUSES: PipelineStatus[] = [
  "new", "quoted", "booked", "scheduled", "completed", "invoiced", "paid", "review", "lost",
];

function findSection(text: string): { href: string; label: string } | null {
  for (const s of SECTIONS) {
    if (s.keywords.some((k) => new RegExp(`\\b${k}\\b`).test(text))) return { href: s.href, label: s.label };
  }
  return null;
}

/** Build a spoken digest of unread conversations. */
async function readUnread(): Promise<string> {
  if (!isSupabaseConfigured()) return "Your database isn't connected, so I can't read your messages.";
  const sb = getSupabase();
  const { data: convs } = await sb
    .from("conversations")
    .select("id, contact:contacts(name, phone_e164)")
    .eq("unread", true)
    .order("last_message_at", { ascending: false })
    .limit(8);
  const rows = (convs ?? []) as unknown as { id: string; contact: { name: string | null; phone_e164: string | null } | null }[];
  if (rows.length === 0) return "You're all caught up — no unread messages.";

  const ids = rows.map((r) => r.id);
  const { data: msgs } = await sb
    .from("messages")
    .select("conversation_id, body, direction, created_at")
    .in("conversation_id", ids)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false });
  const lastByConv = new Map<string, string>();
  for (const m of (msgs ?? []) as { conversation_id: string; body: string | null }[]) {
    if (!lastByConv.has(m.conversation_id) && m.body) lastByConv.set(m.conversation_id, m.body);
  }

  const parts = rows.map((r, i) => {
    const who = r.contact?.name || r.contact?.phone_e164 || "Unknown";
    const body = lastByConv.get(r.id) || "no text";
    return `${i + 1}. ${who} says: ${body}`;
  });
  const n = rows.length;
  return `You have ${n} unread ${n === 1 ? "message" : "messages"}. ${parts.join(". ")}`;
}

/** Resolve "mark <name> as <status>" to the contact's most recent job. */
async function resolveStatusUpdate(name: string, status: PipelineStatus): Promise<Action> {
  if (!isSupabaseConfigured()) return { action: "none", say: "Your database isn't connected." };
  const sb = getSupabase();
  const { data: contacts } = await sb
    .from("contacts")
    .select("id, name")
    .ilike("name", `%${name}%`)
    .limit(2);
  const list = (contacts ?? []) as { id: string; name: string | null }[];
  if (list.length === 0) return { action: "none", say: `I couldn't find anyone named ${name}.` };
  if (list.length > 1) return { action: "none", say: `I found more than one match for ${name}. Open the CRM and pick the right one.` };

  const { data: job } = await sb
    .from("jobs")
    .select("id")
    .eq("contact_id", list[0].id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const jobId = (job as { id: string } | null)?.id;
  if (!jobId) return { action: "none", say: `${list[0].name ?? name} has no job record to update.` };

  return {
    action: "confirm_update",
    jobId,
    status,
    say: `Mark ${list[0].name ?? name} as ${status}? Tap confirm.`,
  };
}

async function classifyWithRules(t: string): Promise<Action | null> {
  // Read / catch-up
  if (/\b(read|listen|catch me up|what'?s new|any (new )?messages|unread)\b/.test(t)) {
    return { action: "speak", say: await readUnread() };
  }
  // Mark <name> as <status>
  const mark = t.match(/\bmark\s+(.+?)\s+(?:as\s+)?(new|quoted|booked|scheduled|completed|invoiced|paid|review|lost|done)\b/);
  if (mark) {
    const name = mark[1].trim();
    let status = mark[2] as string;
    if (status === "done") status = "completed";
    return resolveStatusUpdate(name, status as PipelineStatus);
  }
  // Search / find
  const search = t.match(/\b(?:search|find|look up|filter|show me)\s+(?:for\s+)?(.+)/);
  if (search && !findSection(search[1])) {
    const query = search[1].replace(/[.?!]+$/, "").trim();
    return { action: "search", query, to: `/admin/leads?q=${encodeURIComponent(query)}`, say: `Searching the CRM for ${query}.` };
  }
  // Navigate
  if (/\b(go to|open|show|navigate|take me to|jump to)\b/.test(t)) {
    const sec = findSection(t);
    if (sec) return { action: "navigate", to: sec.href, say: `Opening ${sec.label}.` };
  }
  // Bare section name ("inbox", "crm")
  const bare = findSection(t);
  if (bare && t.trim().split(/\s+/).length <= 2) {
    return { action: "navigate", to: bare.href, say: `Opening ${bare.label}.` };
  }
  return null;
}

async function classifyWithClaude(t: string): Promise<Action> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { action: "none", say: "I didn't catch a command I recognize. Try 'open inbox', 'search Dave', or 'read my messages'." };
  }
  const client = new Anthropic();
  const r = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system: [{
      type: "text",
      text: `You route voice commands for a grill-cleaning business admin app. Map the command to ONE action. Sections: ${SECTIONS.map((s) => s.label).join(", ")}. Statuses: ${STATUSES.join(", ")}. Return navigate (with a section href like /admin/inbox), search (a CRM query), read (read unread messages aloud), or none. Hrefs must be one of: ${SECTIONS.map((s) => s.href).join(", ")}.`,
      cache_control: { type: "ephemeral" },
    }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            kind: { type: "string", enum: ["navigate", "search", "read", "none"] },
            href: { type: "string" },
            query: { type: "string" },
          },
          required: ["kind"],
        },
      },
    },
    messages: [{ role: "user", content: t }],
  });
  const block = r.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return { action: "none", say: "I didn't catch that." };
  let parsed: { kind: string; href?: string; query?: string };
  try {
    parsed = JSON.parse(block.text);
  } catch {
    return { action: "none", say: "I didn't catch that." };
  }
  if (parsed.kind === "read") return { action: "speak", say: await readUnread() };
  if (parsed.kind === "navigate" && parsed.href) {
    const sec = SECTIONS.find((s) => s.href === parsed.href);
    return { action: "navigate", to: parsed.href, say: `Opening ${sec?.label ?? "that"}.` };
  }
  if (parsed.kind === "search" && parsed.query) {
    return { action: "search", query: parsed.query, to: `/admin/leads?q=${encodeURIComponent(parsed.query)}`, say: `Searching for ${parsed.query}.` };
  }
  return { action: "none", say: "I didn't catch a command I recognize. Try 'open inbox' or 'read my messages'." };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { transcript } = (await req.json().catch(() => ({}))) as { transcript?: string };
  const t = (transcript ?? "").toLowerCase().trim();
  if (!t) return Response.json({ action: "none", say: "I didn't hear anything." } satisfies Action);

  try {
    const ruled = await classifyWithRules(t);
    const action = ruled ?? (await classifyWithClaude(t));
    return Response.json(action);
  } catch (e) {
    return Response.json(
      { action: "none", say: "Something went wrong handling that command." } satisfies Action,
      { status: 200 }
    );
  }
}
