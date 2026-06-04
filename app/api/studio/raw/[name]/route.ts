import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { RAW_DIR } from "@/lib/studio/paths";
import { mimeForFilename } from "@/lib/studio/files";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { name: string } }
) {
  const name = decodeURIComponent(params.name);
  if (!name || name.includes("/") || name.includes("..")) {
    return new NextResponse("Bad name", { status: 400 });
  }
  const abs = path.join(RAW_DIR, name);
  try {
    const buf = await fs.readFile(abs);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": mimeForFilename(name),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }
    throw err;
  }
}
