/**
 * Admin-gated marketing content generation. One route, three tools.
 */

import { auth, isAdmin } from "@/auth";
import { generateSocialPost, generateBlogPost, draftRadarReply } from "@/lib/marketing/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { tool, input, source } = (await req.json().catch(() => ({}))) as {
    tool?: string; input?: string; source?: string;
  };
  if (!tool || !input?.trim()) {
    return Response.json({ error: "tool and input required" }, { status: 400 });
  }

  try {
    let text = "";
    if (tool === "social") text = await generateSocialPost(input);
    else if (tool === "blog") text = await generateBlogPost(input);
    else if (tool === "radar") text = await draftRadarReply(input, source || "Nextdoor");
    else return Response.json({ error: "unknown tool" }, { status: 400 });
    return Response.json({ ok: true, text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "generation failed";
    const status = msg.includes("ANTHROPIC_API_KEY") ? 503 : 500;
    return Response.json({ error: msg }, { status });
  }
}
