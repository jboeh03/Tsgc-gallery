import Hero from "@/components/home/Hero";
import WeberPromoSection from "@/components/home/WeberPromoSection";
import Manifesto from "@/components/home/Manifesto";
import ExpandingReveal from "@/components/home/ExpandingReveal";
import Services from "@/components/home/Services";
import Process from "@/components/home/Process";
import GalleryStrip from "@/components/home/GalleryStrip";
import Testimonials from "@/components/home/Testimonials";
import ClosingCta from "@/components/home/ClosingCta";

export default function Home() {
  return (
    <>
      <Hero />
      <WeberPromoSection />
      <Manifesto />
      <ExpandingReveal />
      <Services />
      <Process />
      <GalleryStrip />
      <Testimonials />
      <ClosingCta />
    </>
  );
}
