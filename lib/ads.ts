import { FD_VARIANT_COOKIE } from "@/lib/ab";

/** Read a cookie value in the browser (returns undefined server-side / if absent). */
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/**
 * Fire a Google Ads "lead" conversion when a quote request succeeds, tagged
 * with the active Father's Day A/B variant (fd_variant cookie) so we can see
 * which homepage treatment drove the quote.
 *
 * The Ads conversion is a no-op until both env vars are set:
 *   NEXT_PUBLIC_GOOGLE_ADS_ID            e.g. "AW-1234567890"
 *   NEXT_PUBLIC_GOOGLE_ADS_QUOTE_LABEL   the conversion label from Google Ads
 * A parallel `quote_submit` GA event (carrying fd_variant) fires whenever gtag
 * is present, so the A/B signal is captured even before the Ads label is wired.
 * Called from the main quote form + the Weber booking form on success.
 */
export function trackQuoteConversion(): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;

  const fdVariant = readCookie(FD_VARIANT_COOKIE);

  // A/B signal — fires regardless of Ads config (visible in GA4).
  gtag("event", "quote_submit", fdVariant ? { fd_variant: fdVariant } : {});

  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_QUOTE_LABEL;
  if (!id || !label) return;
  gtag("event", "conversion", {
    send_to: `${id}/${label}`,
    ...(fdVariant ? { fd_variant: fdVariant } : {}),
  });
}
