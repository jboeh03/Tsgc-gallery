import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { restyleImage } from "@/lib/studio/gemini";
import { readPhotoAsBase64 } from "@/lib/studio/files";
import { ensureOutputsDir } from "@/lib/studio/photos";
import { outputUrlFor } from "@/lib/studio/paths";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not set" },
      { status: 500 }
    );
  }

  let body: { photoId?: string; prompt?: string };
  try {
    body = (await req.json()) as { photoId?: string; prompt?: string };
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const { photoId, prompt } = body;
  if (!photoId || !prompt) {
    return NextResponse.json(
      { error: "photoId and prompt required" },
      { status: 400 }
    );
  }

  const photo = await readPhotoAsBase64(photoId);
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  let result;
  try {
    result = await restyleImage({
      imageBase64: photo.base64,
      imageMimeType: photo.mimeType,
      prompt,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Restyle failed" },
      { status: 500 }
    );
  }
  if (!result) {
    return NextResponse.json(
      { error: "Restyle returned no image" },
      { status: 502 }
    );
  }

  const ext = result.mimeType === "image/png" ? ".png" : ".jpg";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `restyle-${stamp}${ext}`;
  const dir = await ensureOutputsDir(photoId);
  await fs.writeFile(
    path.join(dir, filename),
    new Uint8Array(Buffer.from(result.base64, "base64"))
  );

  return NextResponse.json({
    filename,
    url: outputUrlFor(photoId, filename),
  });
}
