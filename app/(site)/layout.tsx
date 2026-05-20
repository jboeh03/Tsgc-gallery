import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import { isPreviewVisible } from "@/lib/preview-flag";
import { isCampaignActive } from "@/lib/campaign";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PromoBanner active={isCampaignActive()} />
      <Nav showPreview={isPreviewVisible()} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
