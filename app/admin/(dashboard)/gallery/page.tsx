import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import GalleryUploader from "@/components/admin/GalleryUploader";
import { checkDbHealth } from "@/lib/db/supabase";
import { readGalleryJobs } from "@/lib/db/reads";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const session = await auth();
  const health = await checkDbHealth();
  if (!health.ok) {
    return (
      <>
        <Header email={session?.user?.email} title="Gallery" showRange={false} />
        <div className="p-6">
          <EmptyState
            title={health.configured ? "Database error" : "Database not configured"}
            body={health.error}
          />
        </div>
      </>
    );
  }

  const existing = await readGalleryJobs();

  return (
    <>
      <Header email={session?.user?.email} title="Gallery" showRange={false} />
      <div className="p-6 space-y-4">
        <p className="max-w-3xl text-xs text-muted">
          Upload a before/after pair and it goes live on the public{" "}
          <strong className="text-ink">/gallery</strong> within ~30 seconds — no
          GitHub, no deploy. Photos are stored in Supabase.
        </p>
        <GalleryUploader existing={existing} />
      </div>
    </>
  );
}
