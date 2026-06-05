/**
 * Marketing content generators for the /admin hub — all in Jeff's voice.
 * Mirrors the Claude pattern in lib/preview/claude.ts (Anthropic SDK,
 * claude-haiku-4-5, cached system prompt). Each returns ready-to-use text the
 * admin reviews, edits, and copies.
 */

import Anthropic from "@anthropic-ai/sdk";
import { SITE } from "@/lib/site";

const BRAND = `Tri-State Grill Cleaning — veteran-founded, at-home grill deep-cleaning serving Cincinnati, Northern Kentucky & Dayton. Owner: Jeff. Free quote / text line: ${SITE.phone}. Site: tristategrillcleaning.com. Voice: warm, direct, local, zero corporate fluff, first person PLURAL (we/us — never I/me), no emoji spray, no ALL CAPS, honest. Soft CTA only.`;

async function claudeText(system: string, user: string, maxTokens = 1600): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic();
  const r = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: maxTokens,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  const t = r.content.find((b) => b.type === "text");
  return t && t.type === "text" ? t.text.trim() : "";
}

export async function generateSocialPost(jobSummary: string): Promise<string> {
  const system = `You write social posts for ${BRAND}

Given details of a finished grill-cleaning job, write THREE platform-specific posts. Format exactly:

=== FACEBOOK ===
<2-4 sentences, native (no link in body — say "free quote link in comments"), concrete about the grill + what you cleaned, soft CTA>

=== INSTAGRAM ===
<shorter, punchy, 3-6 relevant hashtags at the end like #cincinnati #grillcleaning>

=== NEXTDOOR ===
<neighbor-to-neighbor, mention the neighborhood, helpful tone, no hard sell>

Be specific to the job details given. Never invent a price.`;
  return claudeText(system, `Finished job details:\n${jobSummary}\n\nWrite the three posts.`);
}

export async function generateBlogPost(topic: string): Promise<string> {
  const system = `You write SEO blog posts for ${BRAND}

Write a helpful, locally-flavored blog post (~600-800 words) in Markdown for the topic given. Include: an H1 title, 3-5 H2 sections, practical advice a Cincinnati-area homeowner can use, a short closing CTA to a free quote. Genuinely useful first, lightly promotional. End with a one-line meta description prefixed "META: ".`;
  return claudeText(system, `Blog topic: ${topic}\n\nWrite the post.`, 2200);
}

export async function draftRadarReply(postText: string, source: string): Promise<string> {
  // Compliant "Assist lane" from docs/leads-radar.md — Jeff posts it himself.
  const system = `You draft replies Jeff posts HIMSELF (publicly, on-platform) to people who've asked for a grill cleaner. ${BRAND}

Rules: 2-4 sentences, neighbor-to-neighbor, reference a detail from their post, one line of credibility, one soft CTA to the free quote form or his text line ${SITE.phone}. Never ask for their number; never imply you'll contact them first. No price quotes. No spam tells. If the post isn't actually someone seeking grill cleaning, say so plainly and don't invent a pitch.`;
  return claudeText(system, `Source: ${source}\nPublic post:\n"""${postText}"""\n\nDraft Jeff's reply.`, 500);
}
