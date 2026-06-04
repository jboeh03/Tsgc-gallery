import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import BacklogList from "@/components/admin/BacklogList";
import { getSupabase, isSupabaseConfigured, checkDbHealth } from "@/lib/db/supabase";
import type { BacklogRow } from "@/lib/db/types";

export const dynamic = "force-dynamic";

const RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default async function BacklogPage() {
  const session = await auth();
  const health = await checkDbHealth();
  if (!health.ok) {
    return (
      <>
        <Header email={session?.user?.email} title="Backlog" showRange={false} />
        <div className="p-6"><EmptyState title={health.configured ? "Database error" : "Database not configured"} body={health.error} /></div>
      </>
    );
  }

  let items: BacklogRow[] = [];
  if (isSupabaseConfigured()) {
    const { data } = await getSupabase()
      .from("backlog")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(60);
    items = ((data ?? []) as BacklogRow[]).sort(
      (a, b) => (RANK[a.priority || "low"] ?? 3) - (RANK[b.priority || "low"] ?? 3)
    );
  }

  return (
    <>
      <Header email={session?.user?.email} title="Backlog" showRange={false} />
      <div className="p-6 space-y-4 max-w-3xl">
        <p className="text-xs text-muted">
          Improvement ideas filed weekly by the PM agent — and worked by you + your developer.{" "}
          <strong className="text-ink">{items.length}</strong> open. The agent proposes; nothing ships on its own.
        </p>
        <BacklogList items={items} />
      </div>
    </>
  );
}
