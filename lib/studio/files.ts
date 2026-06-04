import fs from "node:fs/promises";
import path from "node:path";
import { absolutePathFor, parsePhotoId } from "./paths";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function mimeForFilename(filename: string): string {
  return MIME_BY_EXT[path.extname(filename).toLowerCase()] ?? "application/octet-stream";
}

export async function readPhotoAsBase64(id: string): Promise<{
  base64: string;
  mimeType: string;
} | null> {
  const parsed = parsePhotoId(id);
  if (!parsed) return null;
  const abs = absolutePathFor(parsed.source, parsed.filename);
  try {
    const buf = await fs.readFile(abs);
    return {
      base64: buf.toString("base64"),
      mimeType: mimeForFilename(parsed.filename),
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export function safeFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
