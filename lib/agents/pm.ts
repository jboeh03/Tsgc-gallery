/**
 * PM / lead-developer agent. Weekly, it reads real business + system signals,
 * then proposes the highest-leverage next improvements (features, fixes, growth,
 * ops) into the `backlog` table for Jeff + the dev (me) to build from. It is an
 * ANALYST: it proposes, it never edits code or ships anything.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "@/lib/db/supabase";

type BacklogItem = {
  title: string;
  detail: string;
  category: "feature" | "bug" | "improvement" | "growth";
  priority: "high" | "medium" | "low";
};

const PRODUCT = `Tri-State Grill Cleaning runs its whole business from a Next.js + Supabase admin "HQ": an AI SMS inbox (Twilio + Claude), CRM pipeline (lead→quoted→booked→scheduled→completed→invoiced→paid→review), one-click Suggestions, Stripe invoicing + pay links, a customer booking page, marketing content generators, and a team of human-in-the-loop background agents (follow-up, reviews, hygiene, marketing, digest). It's a SOLO operator (Jeff). Everything an agent produces is a draft Jeff approves — nothing auto-sends.`;

async function proposeBacklog(signals: Record<string, number>, openTitles: string[]): Promise<BacklogItem[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  const client = new Anthropic();
  const system = `You are the product manager + lead engineer for this product:\n${PRODUCT}\n\nGiven the current signals and what's already on the backlog, propose up to 6 of the HIGHEST-leverage next moves for a solo operator — a mix of features, growth ideas, ops fixes, and risks/bugs worth addressing. Each must be specific and actionable (one sentence of detail). Prioritize ruthlessly by impact-for-effort. NEVER repeat anything already on the backlog. You only propose — you do not build.`;

  const r = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1600,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  detail: { type: "string" },
                  category: { type: "string", enum: ["feature", "bug", "improvement", "growth"] },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                },
                required: ["title", "detail", "category", "priority"],
              },
            },
          },
          required: ["items"],
        },
      },
    },
    messages: [{
      role: "user",
      content: `Current signals:\n${JSON.stringify(signals, null, 2)}\n\nAlready on the backlog (do NOT repeat these):\n${openTitles.join("\n") || "(none)"}\n\nPropose the backlog items.`,
    }],
  });
  const t = r.content.find((b) => b.type === "text");
  if (!t || t.type !== "text") return [];
  const parsed = JSON.parse(t.text) as { items?: BacklogItem[] };
  return Array.isArray(parsed.items) ? parsed.items.slice(0, 6) : [];
}

export async function runPmAnalysis(): Promise<{ produced: number; detail: Record<string, unknown> }> {
  const sb = getSupabase();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const c = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

  const [contacts, leads7d, quotedOpen, unpaid, completed, errors7d, missingAddr, unread] = await Promise.all([
    c(sb.from("contacts").select("id", { count: "exact", head: true })),
    c(sb.from("jobs").select("id", { count: "exact", head: true }).gte("created_at", weekAgo)),
    c(sb.from("jobs").select("id", { count: "exact", head: true }).eq("status", "quoted")),
    c(sb.from("jobs").select("id", { count: "exact", head: true }).eq("status", "invoiced")),
    c(sb.from("jobs").select("id", { count: "exact", head: true }).in("status", ["completed", "paid"])),
    c(sb.from("events").select("id", { count: "exact", head: true }).eq("kind", "error").gte("created_at", weekAgo)),
    c(sb.from("contacts").select("id", { count: "exact", head: true }).is("service_address", null)),
    c(sb.from("conversations").select("id", { count: "exact", head: true }).eq("unread", true)),
  ]);

  const signals = {
    contacts_total: contacts, new_leads_7d: leads7d, quoted_open: quotedOpen,
    unpaid_invoices: unpaid, completed_jobs: completed, errors_7d: errors7d,
    contacts_missing_address: missingAddr, unread_threads: unread,
  };

  const { data: open } = await sb.from("backlog").select("title").eq("status", "open");
  const openTitles = (open ?? []).map((b) => (b as { title: string }).title);
  const openLower = openTitles.map((t) => t.toLowerCase());

  const items = await proposeBacklog(signals, openTitles);
  let produced = 0;
  for (const it of items) {
    if (openLower.includes(it.title.toLowerCase())) continue;
    await sb.from("backlog").insert({
      title: it.title, detail: it.detail, category: it.category,
      priority: it.priority, status: "open", source: "pm_agent",
    });
    produced++;
  }
  return { produced, detail: signals };
}
