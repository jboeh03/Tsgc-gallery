import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  GALLERY_STUDIO_DIR,
  outputsDirFor,
  parsePhotoId,
} from "@/lib/studio/paths";
import { safeFilename } from "@/lib/studio/files";

export const runtime = "nodejs";

/**
 * Copy a finished output from marketing/all-photos-raw/.outputs/<id>/<file>
 * into public/gallery/studio/<id>--<file>, where it becomes a static asset.
 *
 * The user can then reference it from data/jobs.json (or anywhere else)
 * via /gallery/studio/<filename>. This does NOT modify jobs.json — that
 * step stays manual so we never silently change the public site.
 */
export async function POST(req: NextRequest) {
  let body: { photoId?: string; outputFilename?: string; targetName?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const { photoId, outputFilename, targetName } = body;
  if (!photoId || !outputFilename) {
    return NextResponse.json(
      { error: "photoId and outputFilename required" },
      { status: 400 }
    );
  }
  if (!parsePhotoId(photoId)) {
    return NextResponse.json({ error: "Bad photoId" }, { status: 400 });
  }
  if (
    outputFilename.includes("/") ||
    outputFilename.includes("..") ||
    outputFilename.startsWith(".")
  ) {
    return NextResponse.json({ error: "Bad outputFilename" }, { status: 400 });
  }

  const src = path.join(outputsDirFor(photoId), outputFilename);
  try {
    await fs.access(src);
  } catch {
    return NextResponse.json({ error: "Output not found" }, { status: 404 });
  }

  await fs.mkdir(GALLERY_STUDIO_DIR, { recursive: true });
  const ext = path.extname(outputFilename);
  const baseName = targetName
    ? safeFilename(targetName.replace(/\.[^.]+$/, "")) || "studio"
    : `${safeFilename(photoId.replace(/--/, "-"))}-${path.basename(
        outputFilename,
        ext
      )}`;
  const finalName = `${baseName}${ext}`;
  const dest = path.join(GALLERY_STUDIO_DIR, finalName);
  await fs.copyFile(src, dest);

  return NextResponse.json({
    publicPath: `/gallery/studio/${finalName}`,
    filename: finalName,
  });
}
