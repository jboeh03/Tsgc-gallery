import Link from "next/link";
import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import { readConciergeChats } from "@/lib/db/reads";
import { checkDbHealth } from "@/lib/db/supabase";
import { format, formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ConciergePage() {
  const session = await auth();
  const health = await checkDbHealth();

  if (!health.ok) {
    return (
      <>
        <Header email={session?.user?.email} title="Concierge" showRange={false} />
        <div className="p-6">
          <EmptyState
            title={health.configured ? "Database error" : "Database not configured"}
            body={health.error}
          />
        </div>
      </>
    );
  }

  const chats = await readConciergeChats();
  const stats = {
    opens: chats.length,
    conversations: chats.filter((c) => c.message_count > 0).length,
    converted: chats.filter((c) => c.converted).length,
  };

  return (
    <>
      <Header email={session?.user?.email} title="Concierge" showRange={false} />
      <div className="p-6 space-y-4">
        <p className="text-sm text-ink/65 max-w-2xl">
          Every visitor who opens the website chat. A session with{" "}
          <span className="font-medium text-ink">0 messages</span> opened the widget but never
          typed; expand any row to read the full conversation.
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-xl">
          {[
            { label: "Opened", n: stats.opens },
            { label: "Conversations", n: stats.conversations },
            { label: "Captured leads", n: stats.converted },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-white p-4">
              <div className="font-display text-2xl text-navy">{s.n}</div>
              <div className="text-xs uppercase tracking-wider text-ink/55">{s.label}</div>
            </div>
          ))}
        </div>

        {!chats.length ? (
          <EmptyState
            title="No concierge chats yet"
            body="When someone opens the chat bubble on the site, it shows up here — including the ones who don't send a message."
          />
        ) : (
          <div className="space-y-2">
            {chats.map((c) => {
              const firstUser = c.transcript.find((m) => m.role === "user")?.content ?? null;
              const leadHref = c.contactPhone
                ? `/admin/leads?q=${encodeURIComponent(c.contactPhone)}`
                : "/admin/leads";
              return (
                <details
                  key={c.id}
                  className="group rounded-xl border border-border bg-white open:ring-1 open:ring-navy/10"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                    <span className="text-xs tabular-nums text-ink/55 w-28 flex-none">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                    <span
                      className={[
                        "flex-none rounded-full px-2 py-0.5 text-[11px] font-medium",
                        c.message_count > 0
                          ? "bg-navy/10 text-navy"
                          : "bg-ink/5 text-ink/50",
                      ].join(" ")}
                    >
                      {c.message_count > 0
                        ? `${c.message_count} msg${c.message_count === 1 ? "" : "s"}`
                        : "opened"}
                    </span>
                    {c.converted && (
                      <Link
                        href={leadHref}
                        className="flex-none rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:underline"
                      >
                        ✓ Lead{c.contactName ? ` · ${c.contactName}` : ""}
                      </Link>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-ink/80">
                      {firstUser ?? <span className="italic text-ink/40">opened, no message</span>}
                    </span>
                    <span className="ml-auto flex-none text-[11px] tabular-nums text-ink/35">
                      {c.ip ?? "—"}
                    </span>
                  </summary>

                  <div className="border-t border-border px-4 py-4">
                    <div className="mb-3 text-[11px] uppercase tracking-wider text-ink/45">
                      {format(new Date(c.created_at), "PPpp")}
                      {c.updated_at !== c.created_at &&
                        ` · last activity ${format(new Date(c.updated_at), "p")}`}
                    </div>
                    {c.transcript.length === 0 ? (
                      <p className="text-sm italic text-ink/40">
                        Opened the chat but never sent a message.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {c.transcript.map((m, i) => (
                          <div
                            key={i}
                            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                          >
                            <div
                              className={[
                                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                                m.role === "user"
                                  ? "bg-burgundy text-bone"
                                  : "bg-bone text-ink ring-1 ring-border",
                              ].join(" ")}
                            >
                              {m.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
