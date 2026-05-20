import { auth } from "@/auth";
import Header from "@/components/admin/Header";
import { checkSheetHealth, SHEET_ID } from "@/lib/admin/sheets";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export default async function SettingsPage() {
  const session = await auth();
  const health = await checkSheetHealth();

  const envChecks = [
    {
      key: "ADMIN_EMAILS",
      ok: ADMIN_EMAILS.length > 0,
      value:
        ADMIN_EMAILS.length > 0
          ? `${ADMIN_EMAILS.length} email${ADMIN_EMAILS.length > 1 ? "s" : ""} configured`
          : "Not set — no one can sign in",
    },
    {
      key: "GOOGLE_OAUTH_CLIENT_ID",
      ok: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID),
      value: process.env.GOOGLE_OAUTH_CLIENT_ID ? "Set" : "Not set",
    },
    {
      key: "GOOGLE_OAUTH_CLIENT_SECRET",
      ok: Boolean(process.env.GOOGLE_OAUTH_CLIENT_SECRET),
      value: process.env.GOOGLE_OAUTH_CLIENT_SECRET ? "Set" : "Not set",
    },
    {
      key: "AUTH_SECRET",
      ok: Boolean(process.env.AUTH_SECRET),
      value: process.env.AUTH_SECRET ? "Set" : "Not set — sessions won't persist",
    },
    {
      key: "GOOGLE_SHEETS_API_KEY",
      ok: Boolean(process.env.GOOGLE_SHEETS_API_KEY),
      value: process.env.GOOGLE_SHEETS_API_KEY ? "Set" : "Not set",
    },
    {
      key: "GOOGLE_SHEET_ID",
      ok: Boolean(process.env.GOOGLE_SHEET_ID || SHEET_ID),
      value: process.env.GOOGLE_SHEET_ID
        ? "Set (overridden)"
        : `Defaulting to ${SHEET_ID.slice(0, 12)}…`,
    },
  ];

  return (
    <>
      <Header email={session?.user?.email} title="Settings" showRange={false} />
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-display text-base text-navy">Admin access</h2>
          <p className="mt-1 text-sm text-ink/65">
            Anyone signing in with a Google account on this list can access
            /admin. Edit by changing the <code className="bg-bone px-1.5 rounded">ADMIN_EMAILS</code> env var on Vercel
            (comma-separated).
          </p>
          <ul className="mt-4 space-y-2">
            {ADMIN_EMAILS.length === 0 ? (
              <li className="text-sm text-burgundy">
                No admins configured — set ADMIN_EMAILS on Vercel.
              </li>
            ) : (
              ADMIN_EMAILS.map((e) => (
                <li
                  key={e}
                  className="flex items-center gap-3 text-sm rounded-md bg-bone/50 px-3 py-2"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-ink/85">{e}</span>
                  {e.toLowerCase() === session?.user?.email?.toLowerCase() && (
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-muted">
                      You
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-display text-base text-navy">Connections</h2>
          <p className="mt-1 text-sm text-ink/65">
            Health check on the upstream services this dashboard depends on.
          </p>
          <div className="mt-4 space-y-2">
            <ConnectionRow
              label="Google Sheets API"
              ok={health.ok}
              detail={
                health.ok
                  ? `Connected to sheet ${health.sheetId?.slice(0, 12)}…`
                  : health.error || "Unknown error"
              }
            />
            <ConnectionRow
              label="Apps Script (lead intake)"
              ok={true}
              detail="Active — handles form submissions, alerts, SMS, and affiliate click logging."
            />
            <ConnectionRow
              label="Vercel Web Analytics"
              ok={true}
              detail="Tracking on every public page. Open the Traffic tab to view."
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-display text-base text-navy">Environment variables</h2>
          <p className="mt-1 text-sm text-ink/65">
            Status (values are never exposed — this only reflects whether each var is set).
          </p>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-border">
              {envChecks.map((c) => (
                <tr key={c.key}>
                  <td className="py-2 pr-4">
                    <code className="bg-bone px-1.5 py-0.5 rounded text-xs">{c.key}</code>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        c.ok ? "bg-emerald-500" : "bg-burgundy"
                      }`}
                    />
                  </td>
                  <td className="py-2 text-ink/75">{c.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-bone/40 p-5 text-sm text-ink/75">
          <p className="text-xs uppercase tracking-wider text-burgundy font-semibold">
            Setup docs
          </p>
          <p className="mt-2">
            One-time setup for the dashboard is documented in{" "}
            <code className="bg-white px-1.5 rounded">docs/admin-dashboard.md</code>{" "}
            in this repo — Google OAuth credential creation, env var values,
            and the Apps Script redeploy needed for affiliate-click logging.
          </p>
        </div>
      </div>
    </>
  );
}

function ConnectionRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-bone/50 px-3 py-2.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          ok ? "bg-emerald-500" : "bg-burgundy"
        }`}
      />
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink/85">{label}</div>
        <div className="text-xs text-ink/55 truncate">{detail}</div>
      </div>
    </div>
  );
}
