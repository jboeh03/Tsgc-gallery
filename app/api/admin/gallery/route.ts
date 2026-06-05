/**
 * Admin gallery management — upload a before/after pair (+ metadata) straight
 * to Supabase storage + the gallery_jobs table, so new gallery entries go live
 * on the public site without touching GitHub. Revalidates the gallery cache.
 */

import { revalidateTag, revalidatePath } from "next/cache";
import { auth, isAdmin } from "@/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

type SB = ReturnType<typeof getSupabase>;

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

async function uploadImg(sb: SB, base64: string, mime: string): Promise<string | null> {
  try {
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const path = `g-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const { error } = await sb.storage.from("gallery").upload(path, Buffer.from(base64, "base64"), { contentType: mime });
    if (error) return null;
    return sb.storage.from("gallery").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) return Response.json({ error: "Database not configured" }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as {
    beforeBase64?: string; beforeMime?: string; afterBase64?: string; afterMime?: string;
    neighborhood?: string; grillModel?: string; grillType?: string; serviceHours?: string | number;
    date?: string; featured?: boolean; beforeAlt?: string; afterAlt?: string; notes?: string;
  };
  if (!b.beforeBase64 || !b.afterBase64) {
    return Response.json({ error: "Both a before and after photo are required." }, { status: 400 });
  }

  const sb = getSupabase();
  const beforeUrl = await uploadImg(sb, b.beforeBase64, b.beforeMime || "image/jpeg");
  const afterUrl = await uploadImg(sb, b.afterBase64, b.afterMime || "image/jpeg");
  if (!beforeUrl || !afterUrl) return Response.json({ error: "Photo upload failed." }, { status: 500 });

  const base = slugify(`${b.grillModel || ""}-${b.neighborhood || "job"}`) || "job";
  const public_id = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await sb.from("gallery_jobs").insert({
    public_id,
    neighborhood: b.neighborhood || null,
    date: b.date || new Date().toISOString().slice(0, 10),
    grill_type: b.grillType || "gas",
    grill_model: b.grillModel || null,
    service_hours: b.serviceHours ? Number(b.serviceHours) : null,
    before_url: beforeUrl,
    after_url: afterUrl,
    before_alt: b.beforeAlt || `${b.grillModel || "Grill"} before cleaning`,
    after_alt: b.afterAlt || `${b.grillModel || "Grill"} after cleaning`,
    notes: b.notes || null,
    featured: Boolean(b.featured),
  }).select("id").single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  revalidateTag("gallery");
  revalidatePath("/gallery");
  return Response.json({ ok: true, id: (data as { id: string }).id, public_id });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const { error } = await getSupabase().from("gallery_jobs").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  revalidateTag("gallery");
  revalidatePath("/gallery");
  return Response.json({ ok: true });
}
