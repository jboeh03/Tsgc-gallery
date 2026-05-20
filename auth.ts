import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Auth.js v5 config for the /admin dashboard.
 *
 * Access is gated by an email allowlist (ADMIN_EMAILS env var, comma-
 * separated). Anyone else who completes the Google sign-in flow gets
 * bounced to /admin/sign-in?error=AccessDenied.
 *
 * Session strategy: JWT (no database). The JWT stores the verified
 * email; the middleware checks the allowlist on every /admin/* request.
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/admin/sign-in",
    error: "/admin/sign-in",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ profile }) {
      // Block the sign-in entirely if the Google account isn't on the
      // allowlist. This avoids creating a session that the middleware
      // would then have to reject on every page navigation.
      return isAdmin(profile?.email);
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
