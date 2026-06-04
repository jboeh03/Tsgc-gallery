import { NextRequest, NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";

/**
 * Combined middleware:
 *  - /preview and /api/preview are hidden on production hosts
 *    (Jeff still wants the tool live on *.vercel.app for testing).
 *  - /admin/* is gated by a password session cookie. The cookie is
 *    HMAC-signed via Web Crypto (lib/auth/session.ts); we verify
 *    here without any DB hop.
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host")?.toLowerCase() ?? "";
  const isPublicHost = SITE.publicHosts.some((h) => host === h);

  if (pathname.startsWith("/preview") || pathname.startsWith("/api/preview")) {
    if (isPublicHost) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.next();
  }

  const isAuthEntryPath =
    pathname === "/admin/sign-in" || pathname === "/admin/oauth-finish";
  if (pathname.startsWith("/admin") && !isAuthEntryPath) {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const iat = await verifySession(cookie);
    if (!iat) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/sign-in";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/preview",
    "/preview/:path*",
    "/api/preview",
    "/api/preview/:path*",
    "/admin/:path*",
  ],
};
