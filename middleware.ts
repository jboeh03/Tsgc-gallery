import { NextRequest, NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { isFathersDayActive } from "@/lib/campaign-fathers-day";
import { FD_VARIANT_COOKIE, isFdVariant, pickFdVariant } from "@/lib/ab";

/**
 * Combined middleware:
 *  - /preview and /api/preview are hidden on production hosts
 *    (Jeff still wants the tool live on *.vercel.app for testing).
 *  - /admin/* is gated by a password session cookie. The cookie is
 *    HMAC-signed via Web Crypto (lib/auth/session.ts); we verify
 *    here without any DB hop.
 *  - Homepage Father's Day A/B: assign a sticky control|modal|hero cookie
 *    once per visitor while the campaign is active (lib/ab.ts).
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

  // Father's Day A/B — bucket the visitor once (homepage only, while active).
  // `?fd=hero|modal|control` forces a variant (QA preview); otherwise assign an
  // even-split bucket on first visit. Set on the request too so the homepage
  // RSC reads it on the same request.
  if (pathname === "/" && isFathersDayActive()) {
    const override = req.nextUrl.searchParams.get("fd");
    const existing = req.cookies.get(FD_VARIANT_COOKIE)?.value;
    const v =
      override && isFdVariant(override)
        ? override
        : !existing
        ? pickFdVariant()
        : null;
    if (v) {
      req.cookies.set(FD_VARIANT_COOKIE, v);
      const res = NextResponse.next({ request: { headers: req.headers } });
      res.cookies.set(FD_VARIANT_COOKIE, v, {
        path: "/",
        maxAge: 60 * 60 * 24 * 20, // ~through the campaign
        sameSite: "lax",
      });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/preview",
    "/preview/:path*",
    "/api/preview",
    "/api/preview/:path*",
    "/admin/:path*",
  ],
};
