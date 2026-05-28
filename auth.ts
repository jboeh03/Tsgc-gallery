/**
 * Lightweight password-cookie auth for the /admin dashboard.
 *
 * Replaces the Auth.js v5 Google OAuth flow that was here before — the
 * OAuth client kept rejecting the sign-in, and a single shared password
 * is plenty for now. Restore the previous auth.ts from git history if
 * we ever want OAuth back.
 *
 * The crypto helpers live in lib/auth/session.ts because middleware.ts
 * runs on Edge and can't use node:crypto / next/headers. This file
 * adds the Node-only bits: cookies(), redirect(), server actions.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_PRINCIPAL,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  constantTimeEqualString,
  getAdminPassword,
  signSession,
  verifySession,
} from "@/lib/auth/session";

export { verifySession as verifySessionCookie } from "@/lib/auth/session";

/**
 * Server helper: returns the current session if one is valid, or null.
 * Mirrors the Auth.js auth() signature so dashboard pages that do
 *   const session = await auth();
 *   session?.user?.email
 * keep working.
 */
export async function auth(): Promise<{ user: { email: string } } | null> {
  const raw = cookies().get(SESSION_COOKIE_NAME)?.value;
  const iat = await verifySession(raw);
  return iat ? { user: { email: ADMIN_PRINCIPAL } } : null;
}

export function isAdmin(email?: string | null): boolean {
  return email === ADMIN_PRINCIPAL;
}

/**
 * Server action used by the sign-in form. Validates the password,
 * sets the session cookie, then redirects. On failure returns a
 * short error message for the form to display.
 */
export async function signInWithPassword(formData: FormData): Promise<string | void> {
  "use server";
  const provided = (formData.get("password") || "").toString();
  const callbackUrl = (formData.get("callbackUrl") || "/admin").toString();

  if (!constantTimeEqualString(provided, getAdminPassword())) {
    return "Wrong password.";
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

  // Only redirect to in-app paths so a tampered callbackUrl can't
  // bounce off-site.
  const safeCallback = callbackUrl.startsWith("/") ? callbackUrl : "/admin";
  redirect(safeCallback);
}

/**
 * Mirror of Auth.js signOut(). Clears the session cookie and
 * redirects to the sign-in page.
 */
export async function signOut(opts?: { redirectTo?: string }): Promise<void> {
  "use server";
  cookies().delete(SESSION_COOKIE_NAME);
  redirect(opts?.redirectTo || "/admin/sign-in");
}
