"use client";

import Script from "next/script";

/**
 * Google Ads global site tag (gtag.js). Loads only when NEXT_PUBLIC_GOOGLE_ADS_ID
 * is set (e.g. "AW-1234567890"), so it's a no-op until the Ads account is wired.
 * Powers remarketing + the quote conversion fired from lib/ads.ts.
 */
export default function GoogleAdsTag() {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  if (!id) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="gads-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');
      `}</Script>
    </>
  );
}
