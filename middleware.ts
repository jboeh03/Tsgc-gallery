import { NextResponse, type NextRequest } from "next/server";
import { SITE } from "@/lib/site";

/**
 * Block /preview and /api/preview on production-facing hosts.
 * The tool stays accessible on *.vercel.app for testing.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host")?.toLowerCase() ?? "";
  const isPublic = SITE.publicHosts.some((h) => host === h);
  if (isPublic) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/preview", "/preview/:path*", "/api/preview", "/api/preview/:path*"],
};
