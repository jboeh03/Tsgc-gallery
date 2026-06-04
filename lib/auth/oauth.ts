/**
 * Google OAuth as a SECOND admin sign-in option, alongside the password gate.
 *
 * Auth.js handles the Google dance; on success the user is sent to
 * /admin/oauth-finish, which mints the SAME HMAC session cookie the password
 * gate uses (lib/auth/session.ts). That keeps middleware.ts unchanged — it
 * still only checks one cookie — so if anything here misbehaves, password
 * login is completely unaffected (no lockout risk).
 *
 * Requires GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / AUTH_SECRET
 * and the comma-separated ADMIN_EMAILS allowlist.
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { saveGoogleRefreshToken } from "@/lib/google/tokens";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export const { handlers, auth: oauthAuth, signIn: oauthSignIn, signOut: oauthSignOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      // Request Calendar access + an offline refresh token (prompt=consent so
      // Google actually returns a refresh_token we can reuse server-side).
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  pages: { signIn: "/admin/sign-in", error: "/admin/sign-in" },
  session: { strategy: "jwt" },
  callbacks: {
    // Block the OAuth sign-in entirely if the Google account isn't allowlisted.
    async signIn({ profile }) {
      return isAllowedEmail(profile?.email);
    },
    async jwt({ token, profile, account }) {
      if (profile?.email) token.email = profile.email;
      // Persist the refresh token (only present on first consent) for the
      // Calendar integration to use later, including from background reads.
      if (account?.refresh_token && profile?.email) {
        await saveGoogleRefreshToken(profile.email, account.refresh_token, account.scope ?? undefined);
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.email && session.user) session.user.email = token.email as string;
      return session;
    },
  },
  trustHost: true,
});
