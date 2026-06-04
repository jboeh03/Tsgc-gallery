import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAdmin, signInWithPassword } from "@/auth";
import { oauthSignIn } from "@/lib/auth/oauth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { from?: string; error?: string };
}) {
  const session = await auth();
  if (isAdmin(session?.user?.email)) {
    redirect(searchParams.from || "/admin");
  }

  const error = searchParams.error;
  const callbackUrl = searchParams.from || "/admin";

  async function attemptSignIn(formData: FormData): Promise<void> {
    "use server";
    const result = await signInWithPassword(formData);
    if (result) {
      const url = new URL("/admin/sign-in", "http://localhost");
      const cb = (formData.get("callbackUrl") || "/admin").toString();
      if (cb.startsWith("/")) url.searchParams.set("from", cb);
      url.searchParams.set("error", result);
      redirect(url.pathname + "?" + url.searchParams.toString());
    }
  }

  async function googleSignIn(): Promise<void> {
    "use server";
    await oauthSignIn("google", { redirectTo: "/admin/oauth-finish" });
  }

  return (
    <div className="min-h-screen bg-bone flex items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-xl border border-border bg-white shadow-sm p-8 text-center">
        <Image
          src="/logos/logo-blue.png"
          alt="Tri-State Grill Cleaning"
          width={56}
          height={56}
          className="mx-auto h-14 w-14"
        />
        <h1 className="mt-5 font-display text-xl text-navy">TSGC Admin</h1>
        <p className="mt-1 text-sm text-ink/65">Enter the admin password to continue.</p>

        {error && (
          <div className="mt-5 rounded-md border border-burgundy/30 bg-burgundy/5 text-burgundy text-sm px-3 py-2">
            {error}
          </div>
        )}

        <form action={googleSignIn} className="mt-6">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white hover:bg-bone text-ink font-semibold px-4 py-2.5 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            Sign in with Google
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted">
          <span className="h-px flex-1 bg-border" /> or password <span className="h-px flex-1 bg-border" />
        </div>

        <form action={attemptSignIn} className="space-y-3 text-left">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label className="block">
            <span className="block text-[11px] uppercase tracking-widest text-muted font-semibold mb-1">
              Password
            </span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-navy/50"
            />
          </label>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center rounded-md bg-navy hover:bg-navy/90 text-bone font-semibold px-4 py-2.5 transition"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-[11px] text-ink/45">
          Restricted access ·{" "}
          <Link href="/" className="underline hover:text-burgundy">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
