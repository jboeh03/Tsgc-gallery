# Integrations

These files are **Google Apps Script** sources, deployed separately from this
Next.js site. They power the quote form, CRM sheet automation, and gallery
auto-upload. They are checked in so we have version control and a single
source of truth — pasting from this folder into script.google.com is the
deploy step.

## Files

- `apps-script-endpoint.js` — Web app that receives the website quote form
  POST, writes to the CRM Google Sheet, and sends Jeff + the customer email
  notifications. Deployed URL is referenced by
  `SITE.quoteEndpoint` in `lib/site.ts`.
- `crm-sheet-script.js` — Container-bound script attached to Jeff's CRM
  Google Sheet (formatting, status workflows, alerts).
- `gallery-auto-upload.js` — Container-bound script that watches the
  before/after photos folder and prepares assets for the gallery page.

## How to deploy a change

1. Edit the file here, commit, push.
2. Open script.google.com → the matching project.
3. Paste the new contents over the existing code.
4. **Deploy → Manage deployments → Edit → New version → Deploy**
   (or save + run for container-bound scripts).
5. If the web-app URL changes, update `SITE.quoteEndpoint` in
   `lib/site.ts` and redeploy the Next.js site.
