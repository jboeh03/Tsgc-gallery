import Image from "next/image";
import Link from "next/link";
import { signIn, auth, isAdmin } from "@/auth";
import { redirect } from "next/navigation";

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
        <p className="mt-1 text-sm text-ink/65">Sign in to access the dashboard.</p>

        {error && (
          <div className="mt-5 rounded-md border border-burgundy/30 bg-burgundy/5 text-burgundy text-sm px-3 py-2">
            {error === "AccessDenied"
              ? "That Google account isn't on the admin list. Talk to Jeff to get added."
              : "Sign-in failed. Try again."}
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-3 rounded-md border border-border bg-white hover:bg-bone hover:border-navy/30 text-navy font-semibold px-4 py-2.5 transition"
          >
            <GoogleIcon className="h-5 w-5" />
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-[11px] text-ink/45">
          Restricted access · By invitation only ·{" "}
          <Link href="/" className="underline hover:text-burgundy">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.75h3.56c2.08-1.92 3.28-4.74 3.28-8.08z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.56-2.75c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.59 6.59 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.4c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.45 2.12 14.96 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.33 9.14 5.4 12 5.4z"
      />
    </svg>
  );
}
