/**
 * Fire a Google Ads "lead" conversion when a quote request succeeds. No-op
 * until both env vars are set:
 *   NEXT_PUBLIC_GOOGLE_ADS_ID            e.g. "AW-1234567890"
 *   NEXT_PUBLIC_GOOGLE_ADS_QUOTE_LABEL   the conversion label from Google Ads
 * Called from the main quote form + the Weber booking form on success.
 */
export function trackQuoteConversion(): void {
  if (typeof window === "undefined") return;
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_QUOTE_LABEL;
  if (!id || !label) return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", "conversion", { send_to: `${id}/${label}` });
  }
}
