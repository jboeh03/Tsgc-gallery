import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import Script from "next/script";
import { isPreviewVisible } from "@/lib/preview-flag";
import { isCampaignActive } from "@/lib/campaign";
import { isGiveawayActive, isGiveawayUpcoming } from "@/lib/giveaway";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const bannerActive =
    isCampaignActive() || isGiveawayActive() || isGiveawayUpcoming();

  return (
    <>
      <PromoBanner active={bannerActive} />
      <Nav showPreview={isPreviewVisible()} />
      <main className="flex-1">{children}</main>
      <Footer />
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-W2445WJHYB"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-W2445WJHYB');
        `}
      </Script>
    </>
  );
}
