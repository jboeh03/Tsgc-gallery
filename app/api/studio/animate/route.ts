import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  downloadVeoVideo,
  pollVeoOperation,
  startVeoAnimation,
} from "@/lib/studio/gemini";
import { readPhotoAsBase64 } from "@/lib/studio/files";
import { ensureOutputsDir } from "@/lib/studio/photos";
import { outputUrlFor, parsePhotoId } from "@/lib/studio/paths";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { photoId, prompt } → kick off Veo, return { operationName, photoId }.
 * Client should poll via GET ?op=<operationName>&photoId=<id>.
 */
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
  try {
    const op = await startVeoAnimation({
      imageBase64: photo.base64,
      imageMimeType: photo.mimeType,
      prompt,
    });
    return NextResponse.json({ operationName: op.name, photoId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Veo kickoff failed" },
      { status: 500 }
    );
  }
}

/**
 * GET ?op=<name>&photoId=<id> → poll. When done, downloads + writes the
 * MP4 to the outputs dir and returns { done: true, filename, url }.
 * While pending: { done: false }.
 */
export async function GET(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not set" },
      { status: 500 }
    );
  }
  const url = new URL(req.url);
  const op = url.searchParams.get("op");
  const photoId = url.searchParams.get("photoId");
  if (!op || !photoId) {
    return NextResponse.json(
      { error: "op and photoId required" },
      { status: 400 }
    );
  }
  if (!parsePhotoId(photoId)) {
    return NextResponse.json({ error: "Bad photoId" }, { status: 400 });
  }

  let poll;
  try {
    poll = await pollVeoOperation(op);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Poll failed" },
      { status: 500 }
    );
  }

  if (!poll.done) return NextResponse.json({ done: false });
  if ("error" in poll) {
    return NextResponse.json({ done: true, error: poll.error }, { status: 502 });
  }

  let buf: Buffer;
  try {
    buf = await downloadVeoVideo(poll.videoUri);
  } catch (err) {
    return NextResponse.json(
      {
        done: true,
        error: err instanceof Error ? err.message : "Video download failed",
      },
      { status: 502 }
    );
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `animate-${stamp}.mp4`;
  const dir = await ensureOutputsDir(photoId);
  await fs.writeFile(path.join(dir, filename), new Uint8Array(buf));

  return NextResponse.json({
    done: true,
    filename,
    url: outputUrlFor(photoId, filename),
  });
}
