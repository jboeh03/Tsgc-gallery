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
    }),
  ],
  pages: { signIn: "/admin/sign-in", error: "/admin/sign-in" },
  session: { strategy: "jwt" },
  callbacks: {
    // Block the OAuth sign-in entirely if the Google account isn't allowlisted.
    async signIn({ profile }) {
      return isAllowedEmail(profile?.email);
    },
    async jwt({ token, profile }) {
      if (profile?.email) token.email = profile.email;
      return token;
    },
    async session({ session, token }) {
      if (token?.email && session.user) session.user.email = token.email as string;
      return session;
    },
  },
  trustHost: true,
});
