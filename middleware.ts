import { NextResponse } from "next/server";
import { auth, isAdmin } from "@/auth";
import { SITE } from "@/lib/site";

/**
 * Combined middleware:
 *  - /preview and /api/preview are hidden on production hosts
 *    (Jeff still wants the tool live on *.vercel.app for testing).
 *  - /admin/* is gated by Auth.js: requires an authenticated Google
 *    session whose email is in the ADMIN_EMAILS allowlist.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host")?.toLowerCase() ?? "";
  const isPublicHost = SITE.publicHosts.some((h) => host === h);

  if (pathname.startsWith("/preview") || pathname.startsWith("/api/preview")) {
    if (isPublicHost) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/sign-in") {
    const email = req.auth?.user?.email;
    if (!isAdmin(email)) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/sign-in";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/preview",
    "/preview/:path*",
    "/api/preview",
    "/api/preview/:path*",
    "/admin/:path*",
  ],
};
