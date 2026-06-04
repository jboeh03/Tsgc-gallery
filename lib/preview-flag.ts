import { headers } from "next/headers";
import { SITE } from "./site";

/**
 * Whether the AI preview tool should be visible on the current request.
 * Hidden on production-facing custom domains while we iterate; visible
 * on *.vercel.app subdomains for testing.
 */
export function isPreviewVisible(): boolean {
  const host = headers().get("host")?.toLowerCase() ?? "";
  if (!host) return true;
  return !SITE.publicHosts.some((h) => host === h);
}

/**
 * Whether the internal /studio editor should be visible. Same host-gate
 * as the preview tool — hidden on production, available on *.vercel.app
 * and locally.
 */
export function isStudioVisible(): boolean {
  return isPreviewVisible();
}
