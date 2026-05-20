# Admin Dashboard — Setup & Operations

Internal dashboard at `/admin` for Jeff and Jason. Reads from the same
Google Sheet that the website's quote form already writes to. Auth is
Google OAuth restricted to an explicit email allowlist.

```
/admin              Overview — KPIs, leads-by-day chart, source/status mix
/admin/leads        All leads in a sortable, searchable table
/admin/jobs         CRM jobs grouped by month
/admin/campaigns    Promo code performance (Memorial Day, Jason10, FB10, …)
/admin/traffic      Vercel Web Analytics link-out + channel summaries
/admin/products     Affiliate-link click tracking for /products
/admin/settings     Env-var status, admin allowlist, connection health
/admin/sign-in      Google sign-in (only public page in /admin)
```

## One-time setup

### 1. Create Google OAuth credentials

1. Open https://console.cloud.google.com → create or select a project.
2. **APIs & Services → OAuth consent screen** → External → fill the basics
   (app name "TSGC Admin", support email = Jeff's, developer email same).
   Don't bother with verification — the app is restricted by allowlist.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs (add both):
     ```
     https://tristategrillcleaning.com/api/auth/callback/google
     https://<your-vercel-preview-domain>/api/auth/callback/google
     ```
4. Copy the **client ID** and **client secret** — they'll go in env vars below.

### 2. Create a Google Sheets API key

1. Same Google Cloud project: **APIs & Services → Library → Google Sheets
   API → Enable**.
2. **APIs & Services → Credentials → Create Credentials → API key**.
3. Click the new key → **Edit API key**:
   - Application restrictions: **HTTP referrers** (or **None** if you'll
     also use it from the field-agent server-side; HTTP referrers is
     safer if it's read only from a single domain).
   - API restrictions: **Restrict key** → Google Sheets API only.
4. Copy the key.
5. On the CRM sheet (`18DaRXOuAI8…`) → **Share → General access → Anyone
   with the link → Viewer**. The URL is only ever read by our server-side
   code; it never reaches the browser.

### 3. Set Vercel environment variables

On the gallery project in Vercel → **Settings → Environment Variables**.
Add for **Production** and **Preview** (skip Development unless you also
run admin locally):

```
AUTH_SECRET                  = <openssl rand -base64 32>
GOOGLE_OAUTH_CLIENT_ID       = <from step 1>
GOOGLE_OAUTH_CLIENT_SECRET   = <from step 1>
ADMIN_EMAILS                 = jeff@cincygrillcleaning.com,<jason's email>
GOOGLE_SHEETS_API_KEY        = <from step 2>
GOOGLE_SHEET_ID              = 18DaRXOuAI8VjYd1qrpy-rr9SoOTi57VpfPOx05aolCo
```

Optional but nice:

```
VERCEL_TEAM_SLUG             = <your team slug, e.g. "jboeh03">
VERCEL_PROJECT_SLUG          = tsgc-gallery
```

Redeploy after saving env vars — Vercel needs the env to be present at
build time for some of them.

### 4. Re-deploy the Apps Script (for affiliate click logging)

The Apps Script at `integrations/apps-script-endpoint.js` gained a new
`kind: "affiliate_click"` branch that writes to a **🔗 Affiliate Clicks**
tab. Without the redeploy, /products clicks still work fine (they
redirect normally) but `/admin/products` will sit at zero.

1. Open script.google.com → the existing TSGC Website Lead Intake project.
2. Replace the script with the updated contents of
   `integrations/apps-script-endpoint.js`.
3. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.**
4. The deployment URL stays the same — no website changes needed.

The first time a visitor clicks a product card on /products, the script
creates the new tab automatically with a header row.

## How it works

**Data flow:**

```
Website quote form  ──POST──→  Apps Script  ──→  🌐 Website Leads tab
                                            ──→  📋 CRM + Jobs tab (linked)
                                            ──→  email to Jeff + SMS

/products click     ──GET──→   /api/track/click
                                  │
                                  ├──→ fire-and-forget POST to Apps Script
                                  │       (kind: "affiliate_click")
                                  │       → 🔗 Affiliate Clicks tab
                                  │
                                  └──→ 302 to Amazon / GPR

/admin/*            ──→ middleware checks ADMIN_EMAILS allowlist
                    ──→ server components read sheet via GOOGLE_SHEETS_API_KEY
                         (60s cache via unstable_cache)
                    ──→ Recharts on the client for visualizations
```

**Sheet schema reference:**

| Tab | Required headers (case-insensitive) |
|---|---|
| 🌐 Website Leads | Timestamp · Status · Name · Phone · Email · ZIP · Services · Grill Make/Model · Source · Referred By · Best Time · Promo Code · Notes · Lead ID |
| 📋 CRM + Jobs | Lead ID · Date · Name · Phone · Email · ZIP · Service · Grill Model · Source · Referred By · Notes · Status |
| 🔗 Affiliate Clicks | Timestamp · Product ID · Product Name · Affiliate · Destination · Referer · User Agent (auto-created by the Apps Script on first click) |

Column ordering doesn't matter — readers look up by header name.

## Common operations

**Add a new admin:** edit `ADMIN_EMAILS` on Vercel → redeploy (or wait
for the next deploy). New users won't see anything until their email is
on the list.

**Add a new promo code:** edit `PROMO_CODES` in
`integrations/apps-script-endpoint.js`, redeploy the Apps Script. The
new code shows up on `/admin/campaigns` automatically the first time it
appears in a lead.

**Force-refresh data:** the dashboard caches sheet reads for 60s. Hard
reload the admin page after that interval — or shorten the cache by
changing `revalidate: 60` in `lib/admin/sheets.ts`.

**Hide /admin from search engines:** already done. `app/admin/layout.tsx`
sets `robots: noindex` and the sign-in page is the only publicly
reachable URL under /admin.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| "Sheets not configured" empty state | `GOOGLE_SHEETS_API_KEY` or `GOOGLE_SHEET_ID` env var missing → set on Vercel, redeploy. |
| "Couldn't read the sheet" with 403 in details | Sheet not shared as "Anyone with the link can view". |
| "Couldn't read the sheet" with 400 | API key restricted to wrong domain — open Google Cloud → Credentials → edit referrers. |
| Sign-in works but you land back on sign-in | Email isn't in `ADMIN_EMAILS`. Add it (comma-separated, no spaces), redeploy. |
| Sign-in fails immediately with "AccessDenied" | Same — email not on allowlist. |
| Sign-in fails with config error | `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` not set, or `AUTH_SECRET` not set. |
| /admin/products stays at zero clicks | Apps Script not redeployed with the `affiliate_click` handler (see step 4 above). |
| /admin/traffic shows the "open in Vercel" button only | Expected — Vercel Web Analytics API requires a Pro plan to read programmatically. Upgrade or live with the link-out. |
