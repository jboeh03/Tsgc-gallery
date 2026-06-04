import { NextResponse } from "next/server";
import { listStudioPhotos } from "@/lib/studio/photos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const photos = await listStudioPhotos();
  return NextResponse.json({ photos });
}
