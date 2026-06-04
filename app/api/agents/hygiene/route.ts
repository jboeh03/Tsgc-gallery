/**
 * CRM hygiene & scheduling agent (daily). Runs the suggestion engine on a
 * cadence and reports the counts (which feed the morning digest). The
 * suggestions themselves are surfaced + one-click-applied on /admin/suggestions.
 */

import { authorizeCron, runAgent } from "@/lib/agents/runner";
import { getSuggestions } from "@/lib/admin/suggestions";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request) {
  if (!authorizeCron(req)) return new Response("unauthorized", { status: 401 });
  return runAgent("hygiene", async () => {
    const s = await getSuggestions();
    const byKind = s.reduce<Record<string, number>>((acc, x) => {
      acc[x.kind] = (acc[x.kind] || 0) + 1;
      return acc;
    }, {});
    return { produced: s.length, detail: byKind };
  });
}
