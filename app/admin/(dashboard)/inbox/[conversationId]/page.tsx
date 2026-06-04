import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import Composer from "@/components/admin/inbox/Composer";
import ContactPanel from "@/components/admin/inbox/ContactPanel";
import { readConversation } from "@/lib/db/reads";
import { computeMissingFields } from "@/lib/comms/missingFields";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const session = await auth();
  const thread = await readConversation(params.conversationId);
  if (!thread || !thread.contact) notFound();

  const contact = thread.contact;
  const hasPhoto = thread.messages.some(
    (m) => m.direction === "inbound" && m.media_urls?.length > 0
  );
  const missing = computeMissingFields(contact, { hasPhoto });

  return (
    <>
      <Header
        email={session?.user?.email}
        title={contact.name || contact.phone_e164 || "Conversation"}
        showRange={false}
      />
      <div className="p-6">
        <Link href="/admin/inbox" className="text-xs uppercase tracking-wider text-muted hover:text-burgundy">
          ← All conversations
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Conversation + composer */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-white p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {thread.messages.length === 0 ? (
                <p className="text-sm text-muted">No messages yet.</p>
              ) : (
                thread.messages.map((m) => {
                  const out = m.direction === "outbound";
                  return (
                    <div key={m.id} className={out ? "flex justify-end" : "flex justify-start"}>
                      <div
                        className={[
                          "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                          out ? "bg-burgundy text-bone" : "bg-bone/70 text-ink",
                        ].join(" ")}
                      >
                        {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                        {m.media_urls?.map((u) => (
                          <a key={u} href={u} target="_blank" rel="noopener noreferrer"
                            className="block underline text-[11px] mt-1 opacity-80">
                            📷 photo
                          </a>
                        ))}
                        <p className={`mt-1 text-[10px] ${out ? "text-bone/60" : "text-muted"}`}>
                          {format(new Date(m.created_at), "MMM d, h:mma")}
                          {m.ai_generated ? " · AI" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Composer
              conversationId={thread.id}
              initialDraft={thread.activeDraft?.body ?? ""}
              hasDraft={Boolean(thread.activeDraft)}
              optedOut={Boolean(contact.sms_opt_out)}
            />
          </div>

          {/* Contact + readiness + schedule */}
          <ContactPanel
            contact={contact}
            job={thread.job}
            missing={missing}
            conversationId={thread.id}
          />
        </div>
      </div>
    </>
  );
}
