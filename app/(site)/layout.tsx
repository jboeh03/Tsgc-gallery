import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import SmoothScroll from "@/components/motion/SmoothScroll";
import Cursor from "@/components/motion/Cursor";
import { isPreviewVisible } from "@/lib/preview-flag";
import { isCampaignActive } from "@/lib/campaign";
import { isGiveawayActive, isGiveawayUpcoming } from "@/lib/giveaway";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const bannerActive =
    isCampaignActive() || isGiveawayActive() || isGiveawayUpcoming();

  return (
    <SmoothScroll>
      <Cursor />
      <PromoBanner active={bannerActive} />
      <Nav showPreview={isPreviewVisible()} bannerActive={bannerActive} />
      <main className="flex-1">{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
