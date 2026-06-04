import Link from "next/link";
import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import CrmEditor from "@/components/admin/CrmEditor";
import { readJobDetail } from "@/lib/db/reads";

export const dynamic = "force-dynamic";

export default async function CrmDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const detail = await readJobDetail(params.id);

  if (!detail) {
    return (
      <>
        <Header email={session?.user?.email} title="CRM" showRange={false} />
        <div className="p-6">
          <EmptyState title="Record not found" body="This lead/job may have been removed." />
          <Link href="/admin/leads" className="mt-4 inline-block text-sm text-burgundy hover:underline">
            ← Back to CRM
          </Link>
        </div>
      </>
    );
  }

  const title = detail.contact?.name || detail.contact?.phone_e164 || "CRM record";

  return (
    <>
      <Header email={session?.user?.email} title={title} showRange={false} />
      <div className="p-6 space-y-4">
        <Link href="/admin/leads" className="inline-block text-xs uppercase tracking-wider text-muted hover:text-burgundy">
          ← Back to CRM
        </Link>
        <CrmEditor job={detail.job} contact={detail.contact} />
      </div>
    </>
  );
}
