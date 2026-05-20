/**
 * Fire-and-forget event logger — sends event records to the Apps Script
 * web app, which writes them to the appropriate Sheet tab.
 *
 * The Apps Script branches on `kind`:
 *   kind: "lead"           → 🌐 Website Leads + alert email (default)
 *   kind: "affiliate_click" → 🔗 Affiliate Clicks
 *
 * Logging never blocks the response — if the script is slow or down,
 * the user-facing flow keeps working.
 */

import { SITE } from "@/lib/site";

type ClickEventInput = {
  productId: string;
  productName: string;
  affiliate: string;
  destinationUrl: string;
  referer?: string;
  userAgent?: string;
};

export function logAffiliateClick(input: ClickEventInput): void {
  const url = process.env.APPS_SCRIPT_URL || SITE.quoteEndpoint;
  if (!url) return;

  const body = JSON.stringify({
    kind: "affiliate_click",
    timestamp: new Date().toISOString(),
    ...input,
  });

  // Fire-and-forget. We deliberately don't await — the caller's redirect
  // should happen instantly even if Apps Script is slow. keepalive lets
  // the request finish after the response is sent.
  try {
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* swallow — logging is best-effort */
    });
  } catch {
    /* swallow */
  }
}
