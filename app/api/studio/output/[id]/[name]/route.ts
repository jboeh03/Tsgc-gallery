import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { outputsDirFor, parsePhotoId, VIDEO_EXTENSIONS } from "@/lib/studio/paths";
import { mimeForFilename } from "@/lib/studio/files";

export const runtime = "nodejs";

function mimeFor(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  return mimeForFilename(name);
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string; name: string } }
) {
  const id = decodeURIComponent(params.id);
  const name = decodeURIComponent(params.name);
  if (!parsePhotoId(id)) {
    return new NextResponse("Bad id", { status: 400 });
  }
  if (!name || name.includes("/") || name.includes("..")) {
    return new NextResponse("Bad name", { status: 400 });
  }
  const abs = path.join(outputsDirFor(id), name);
  try {
    const buf = await fs.readFile(abs);
    const isVideo = VIDEO_EXTENSIONS.has(path.extname(name).toLowerCase());
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": mimeFor(name),
        "Cache-Control": "private, max-age=60",
        ...(isVideo ? { "Accept-Ranges": "bytes" } : {}),
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }
    throw err;
  }
}
