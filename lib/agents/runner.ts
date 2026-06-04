/**
 * Shared spine for the background agent team. Every agent is a scheduled
 * endpoint that produces DRAFTS / SUGGESTIONS only — never auto-sends — and is
 * wrapped by runAgent() so each run is observable (an `agent_run` event) and
 * can never throw. Vercel Cron invokes them via GET with a bearer secret.
 */

import { isSupabaseConfigured } from "@/lib/db/supabase";
import { logEvent } from "@/lib/db/writes";
import { logError } from "@/lib/observability";

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Gate on that. */
export function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export type AgentResult = { produced: number; detail?: Record<string, unknown> };

export async function runAgent(name: string, fn: () => Promise<AgentResult>): Promise<Response> {
  if (!isSupabaseConfigured()) {
    return Response.json({ ok: false, error: "db not configured" }, { status: 503 });
  }
  const started = Date.now();
  try {
    const result = await fn();
    await logEvent("agent_run", {}, {
      agent: name,
      produced: result.produced,
      ms: Date.now() - started,
      ...(result.detail || {}),
    });
    return Response.json({ ok: true, agent: name, produced: result.produced, ...(result.detail || {}) });
  } catch (err) {
    await logError(`agent:${name}`, err);
    return Response.json(
      { ok: false, agent: name, error: err instanceof Error ? err.message : "failed" },
      { status: 500 }
    );
  }
}
