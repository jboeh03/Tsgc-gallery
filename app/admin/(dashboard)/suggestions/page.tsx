import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import SuggestionsList from "@/components/admin/SuggestionsList";
import { checkDbHealth } from "@/lib/db/supabase";
import { getSuggestions } from "@/lib/admin/suggestions";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  const session = await auth();
  const health = await checkDbHealth();

  if (!health.ok) {
    return (
      <>
        <Header email={session?.user?.email} title="Suggestions" showRange={false} />
        <div className="p-6">
          <EmptyState
            title={health.configured ? "Database error" : "Database not configured"}
            body={health.error}
          />
        </div>
      </>
    );
  }

  const suggestions = await getSuggestions();

  return (
    <>
      <Header email={session?.user?.email} title="Suggestions" showRange={false} />
      <div className="p-6 space-y-4">
        <p className="text-xs text-muted">
          Smart CRM updates from your schedule &amp; job lifecycle.{" "}
          <strong className="text-ink">{suggestions.length}</strong> to review.
        </p>
        <SuggestionsList suggestions={suggestions} />
      </div>
    </>
  );
}
