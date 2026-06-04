import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import MarketingTools from "@/components/admin/marketing/MarketingTools";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const session = await auth();
  return (
    <>
      <Header email={session?.user?.email} title="Marketing" showRange={false} />
      <div className="p-6 space-y-4 max-w-3xl">
        <p className="text-sm text-ink/65">
          Your content command center — generate social posts, blog drafts, and reply
          drafts for lead sourcing, all in your voice. Everything is a draft you review
          before it goes out.{" "}
          <a href="/studio" className="text-burgundy underline">Studio</a>{" "}
          (AI before/after images &amp; video) is a separate tool.
        </p>
        <MarketingTools />
      </div>
    </>
  );
}
