import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import EmptyState from "@/components/admin/EmptyState";
import CooConsole from "@/components/admin/CooConsole";
import { getSupabase, isSupabaseConfigured, checkDbHealth } from "@/lib/db/supabase";
import { checkTwilioHealth } from "@/lib/sms/twilio";
import { checkStripeHealth } from "@/lib/stripe/client";
import { readCooTasks, readCooHistory } from "@/lib/db/reads";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type Ev = { created_at: string; kind: string; meta: Record<string, unknown> };

export default async function AgentsPage() {
  const session = await auth();

  const [db, twilio, stripe] = await Promise.all([checkDbHealth(), checkTwilioHealth(), checkStripeHealth()]);
  const anthropicOk = Boolean(process.env.ANTHROPIC_API_KEY);

  let runs: Ev[] = [];
  let errors: Ev[] = [];
  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    const [{ data: r }, { data: e }] = await Promise.all([
      sb.from("events").select("created_at, kind, meta").eq("kind", "agent_run").order("created_at", { ascending: false }).limit(20),
      sb.from("events").select("created_at, kind, meta").eq("kind", "error").order("created_at", { ascending: false }).limit(15),
    ]);
    runs = (r ?? []) as Ev[];
    errors = (e ?? []) as Ev[];
  }

  const [cooTasks, cooHistory] = await Promise.all([readCooTasks(), readCooHistory()]);

  return (
    <>
      <Header email={session?.user?.email} title="Agents & Health" showRange={false} />
      <div className="p-6 space-y-6 max-w-4xl">
        <CooConsole initialHistory={cooHistory} initialTasks={cooTasks} />

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-display text-base text-navy mb-3">System health</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            <HealthRow label="Supabase (CRM)" ok={db.ok} detail={db.ok ? "connected" : db.error || "—"} />
            <HealthRow label="Twilio (SMS)" ok={twilio.ok} detail={twilio.ok ? twilio.number || "connected" : twilio.error || "not configured"} />
            <HealthRow label="Stripe (payments)" ok={stripe.ok} detail={stripe.ok ? "connected" : stripe.error || "not configured"} />
            <HealthRow label="Anthropic (AI)" ok={anthropicOk} detail={anthropicOk ? "key set" : "not configured"} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-display text-base text-navy mb-1">Agent activity</h2>
          <p className="text-xs text-muted mb-3">Background agents run on a schedule and queue drafts/suggestions for you to approve — they never send on their own.</p>
          {runs.length === 0 ? (
            <p className="text-sm text-ink/60">No agent runs yet. They start on their daily schedule (or trigger manually).</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {runs.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3 font-medium text-navy whitespace-nowrap">{String(r.meta?.agent ?? "?")}</td>
                    <td className="py-2 pr-3 text-ink/75">{Number(r.meta?.produced ?? 0)} produced</td>
                    <td className="py-2 text-ink/55 whitespace-nowrap text-right">{format(new Date(r.created_at), "MMM d, h:mma")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-display text-base text-navy mb-3">Recent errors</h2>
          {errors.length === 0 ? (
            <p className="text-sm text-emerald-700">No errors logged. 🎉</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {errors.map((e, i) => (
                <li key={i} className="flex justify-between gap-3 rounded-md bg-bone/50 px-3 py-2">
                  <span className="min-w-0">
                    <span className="font-medium text-burgundy">{String(e.meta?.scope ?? "error")}</span>{" "}
                    <span className="text-ink/70">{String(e.meta?.message ?? "")}</span>
                  </span>
                  <span className="text-ink/45 whitespace-nowrap">{format(new Date(e.created_at), "MMM d, h:mma")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!db.ok && <EmptyState title="Database not connected" body={db.error} />}
      </div>
    </>
  );
}

function HealthRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md bg-bone/50 px-3 py-2">
      <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-burgundy"}`} />
      <span className="text-sm text-ink/85">{label}</span>
      <span className="ml-auto text-xs text-ink/50 truncate">{detail}</span>
    </div>
  );
}
