import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAdmin, signInWithPassword } from "@/auth";

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

        <form action={attemptSignIn} className="mt-6 space-y-3 text-left">
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
