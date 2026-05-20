import Link from "next/link";
import { signOut } from "@/auth";
import RangePicker from "@/components/admin/RangePicker";

export default function Header({
  email,
  title,
  showRange = true,
}: {
  email?: string | null;
  title: string;
  showRange?: boolean;
}) {
  return (
    <header className="bg-white border-b border-border">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="font-display text-xl text-navy">{title}</h1>
        <div className="flex items-center gap-3">
          {showRange && <RangePicker />}
          <div className="hidden sm:flex items-center gap-3 text-sm text-ink/70 border-l border-border pl-3">
            <span className="truncate max-w-[180px]">{email ?? "—"}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/sign-in" });
              }}
            >
              <button
                type="submit"
                className="text-xs uppercase tracking-wider text-burgundy hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
          <Link
            href="/"
            className="sm:hidden text-xs uppercase tracking-wider text-burgundy"
          >
            Site
          </Link>
        </div>
      </div>
    </header>
  );
}
