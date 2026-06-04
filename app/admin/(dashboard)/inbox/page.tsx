import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import ThreadList from "@/components/admin/inbox/ThreadList";
import { checkDbHealth } from "@/lib/db/supabase";
import { readConversations } from "@/lib/db/reads";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await auth();
  const health = await checkDbHealth();

  if (!health.ok) {
    return (
      <>
        <Header email={session?.user?.email} title="Inbox" showRange={false} />
        <div className="p-6">
          <EmptyState
            title={health.configured ? "Supabase error" : "Comms not configured"}
            body={
              health.configured
                ? health.error
                : "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable the text inbox."
            }
          />
        </div>
      </>
    );
  }

  const conversations = await readConversations();

  return (
    <>
      <Header email={session?.user?.email} title="Inbox" showRange={false} />
      <div className="p-6 space-y-4">
        <p className="text-xs text-muted">
          <strong className="text-ink">{conversations.length}</strong> conversation
          {conversations.length === 1 ? "" : "s"} · texts to the Tri-State number land here.
        </p>
        <ThreadList conversations={conversations} />
      </div>
    </>
  );
}
