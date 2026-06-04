import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { RAW_DIR } from "@/lib/studio/paths";
import { ensureRawDir } from "@/lib/studio/photos";
import { safeFilename } from "@/lib/studio/files";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 15 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Bad form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported type — JPG, PNG, or WebP only" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Too large — max ${MAX_BYTES / 1024 / 1024} MB` },
      { status: 400 }
    );
  }

  await ensureRawDir();
  const ext = EXT_BY_MIME[file.type] ?? path.extname(file.name) ?? "";
  const baseRaw = file.name.replace(/\.[^.]+$/, "");
  const base = safeFilename(baseRaw) || "upload";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `${base}-${stamp}${ext}`;
  const abs = path.join(RAW_DIR, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(abs, new Uint8Array(buf));

  return NextResponse.json({ filename });
}
