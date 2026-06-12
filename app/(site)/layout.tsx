import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import SmoothScroll from "@/components/motion/SmoothScroll";
import Cursor from "@/components/motion/Cursor";
import GoogleAdsTag from "@/components/GoogleAdsTag";
import ConciergeWidget from "@/components/ConciergeWidget";
import { isPreviewVisible } from "@/lib/preview-flag";
import { isCampaignActive } from "@/lib/campaign";
import { isWeberSprintActive } from "@/lib/campaign-weber";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  // Banner shows while the Weber sprint is live (top priority in PromoBanner),
  // and otherwise falls back to the discount campaign. Giveaway is hidden for now.
  const bannerActive = isWeberSprintActive() || isCampaignActive();

  return (
    <SmoothScroll>
      <GoogleAdsTag />
      <Cursor />
      <PromoBanner active={bannerActive} />
      <Nav showPreview={isPreviewVisible()} bannerActive={bannerActive} />
      <main className="flex-1">{children}</main>
      <Footer />
      <ConciergeWidget />
    </SmoothScroll>
  );
}
