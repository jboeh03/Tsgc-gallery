import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import { isPreviewVisible } from "@/lib/preview-flag";
import { isCampaignActive } from "@/lib/campaign";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  // Giveaway banner is hidden for now (per request). PromoBanner still falls
  // back to the discount campaign when one is active.
  const bannerActive = isCampaignActive();

  return (
    <>
      <PromoBanner active={bannerActive} />
      <Nav showPreview={isPreviewVisible()} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
