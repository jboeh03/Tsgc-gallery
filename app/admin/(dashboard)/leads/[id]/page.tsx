import Link from "next/link";
import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import CrmEditor from "@/components/admin/CrmEditor";
import CrmConversation from "@/components/admin/CrmConversation";
import LeadSmsComposer from "@/components/admin/LeadSmsComposer";
import SendPaymentLinkButton from "@/components/admin/SendPaymentLinkButton";
import { readJobDetail, readContactThread } from "@/lib/db/reads";
import { getSupabase } from "@/lib/db/supabase";

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
  const thread = detail.contact ? await readContactThread(detail.contact.id) : null;

  // Prefill the SMS composer with the AI-suggested draft (if one is waiting).
  let initialDraft = "";
  if (thread?.conversationId) {
    const { data } = await getSupabase()
      .from("drafts")
      .select("body")
      .eq("conversation_id", thread.conversationId)
      .eq("status", "suggested")
      .maybeSingle();
    initialDraft = (data as { body: string | null } | null)?.body ?? "";
  }

  return (
    <>
      <Header email={session?.user?.email} title={title} showRange={false} />
      <div className="p-6 space-y-4">
        <Link href="/admin/leads" className="inline-block text-xs uppercase tracking-wider text-muted hover:text-burgundy">
          ← Back to CRM
        </Link>
        {(() => {
          const photo = detail.job.notes?.match(/Photo:\s*(https?:\/\/\S+)/)?.[1];
          const isWeber = detail.job.source === "weber-sprint";
          if (!photo && !isWeber) return null;
          return (
            <div className="max-w-3xl rounded-xl border border-burgundy/30 bg-burgundy/[0.03] p-4">
              {isWeber && (
                <p className="mb-2 text-[11px] uppercase tracking-wider text-burgundy">
                  🔥 Weber Sprint request{detail.job.quote_amount != null ? ` · suggested $${detail.job.quote_amount}` : ""}
                </p>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photo && <img src={photo} alt="Customer grill photo" className="max-h-72 rounded-md" />}
              {isWeber && (
                <>
                  <p className="mt-2 text-xs text-ink/60">
                    Confirm/adjust the quote below, then send the payment link. Paying auto-creates the appointment + calendar event.
                  </p>
                  <SendPaymentLinkButton jobId={detail.job.id} amount={detail.job.quote_amount} />
                </>
              )}
            </div>
          );
        })()}
        <div className="max-w-3xl">
          <CrmConversation conversationId={thread?.conversationId ?? null} messages={thread?.messages ?? []} />
        </div>
        {detail.contact?.phone_e164 && (
          <div className="max-w-3xl">
            <LeadSmsComposer
              contactId={detail.contact.id}
              phone={detail.contact.phone_e164}
              initialDraft={initialDraft}
              sendEnabled={process.env.SMS_SEND_ENABLED === "true"}
            />
          </div>
        )}
        <CrmEditor job={detail.job} contact={detail.contact} />
      </div>
    </>
  );
}
