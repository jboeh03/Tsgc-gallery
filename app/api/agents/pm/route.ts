/**
 * PM / lead-dev agent endpoint (weekly). Files a prioritized improvement
 * backlog from real signals. Proposes only — never ships code.
 */

import { authorizeCron, runAgent } from "@/lib/agents/runner";
import { runPmAnalysis } from "@/lib/agents/pm";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request) {
  if (!authorizeCron(req)) return new Response("unauthorized", { status: 401 });
  return runAgent("pm", async () => runPmAnalysis());
}
