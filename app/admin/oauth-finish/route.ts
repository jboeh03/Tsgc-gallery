/**
 * Bridge from a successful Google OAuth sign-in to the password-gate session
 * cookie. Auth.js redirects here after verifying the Google account is on the
 * ADMIN_EMAILS allowlist; we mint the same HMAC admin cookie and send the user
 * into /admin. Middleware then sees a normal admin session — no OAuth-awareness
 * needed anywhere else.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { oauthAuth, isAllowedEmail } from "@/lib/auth/oauth";
import { SESSION_COOKIE_NAME, SESSION_TTL_MS, signSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await oauthAuth();
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.redirect(new URL("/admin/sign-in?error=That+Google+account+isn%27t+authorized.", req.url));
  }

  const iat = Date.now();
  const value = await signSession(iat);
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return NextResponse.redirect(new URL("/admin", req.url));
}
