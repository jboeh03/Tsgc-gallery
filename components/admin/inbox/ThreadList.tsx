import Link from "next/link";
import { format } from "date-fns";
import type { ConversationSummary } from "@/lib/db/types";

export default function ThreadList({
  conversations,
  activeId,
}: {
  conversations: ConversationSummary[];
  activeId?: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
        <p className="font-display text-base text-navy">No conversations yet</p>
        <p className="mt-1.5 text-sm text-ink/60">
          Inbound texts to the Tri-State number will show up here.
        </p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden">
      {conversations.map((c) => {
        const when = c.last_message_at ? new Date(c.last_message_at) : null;
        const active = c.id === activeId;
        return (
          <li key={c.id}>
            <Link
              href={`/admin/inbox/${c.id}`}
              className={[
                "block px-4 py-3 transition",
                active ? "bg-bone/60" : "hover:bg-bone/40",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-navy truncate">
                  {c.contact?.name || c.contact?.phone_e164 || "Unknown"}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {c.unread && (
                    <span className="h-2 w-2 rounded-full bg-burgundy" aria-label="unread" />
                  )}
                  <span className="text-[11px] text-muted whitespace-nowrap">
                    {when ? format(when, "MMM d, h:mma") : ""}
                  </span>
                </span>
              </div>
              <p className="mt-0.5 text-sm text-ink/60 truncate">
                {c.last_direction === "outbound" ? "You: " : ""}
                {c.lastMessageBody || "—"}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
