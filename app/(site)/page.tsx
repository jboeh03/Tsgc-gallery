import { cookies } from "next/headers";
import Hero from "@/components/home/Hero";
import FathersDayHero from "@/components/home/FathersDayHero";
import FathersDayPromoModal from "@/components/FathersDayPromoModal";
import WeberPromoSection from "@/components/home/WeberPromoSection";
import Manifesto from "@/components/home/Manifesto";
import ExpandingReveal from "@/components/home/ExpandingReveal";
import Services from "@/components/home/Services";
import Process from "@/components/home/Process";
import GalleryStrip from "@/components/home/GalleryStrip";
import Testimonials from "@/components/home/Testimonials";
import ClosingCta from "@/components/home/ClosingCta";
import { isFathersDayActive } from "@/lib/campaign-fathers-day";
import { FD_VARIANT_COOKIE, isFdVariant } from "@/lib/ab";
import { SHOW_REVIEWS } from "@/lib/site";

export default function Home() {
  // Father's Day A/B treatment (assigned by middleware while the campaign is
  // active): control = normal hero, hero = swapped hero, modal = scroll pop-up.
  const fdActive = isFathersDayActive();
  const raw = cookies().get(FD_VARIANT_COOKIE)?.value;
  const variant = fdActive && isFdVariant(raw) ? raw : "control";

  return (
    <>
      {variant === "hero" ? <FathersDayHero /> : <Hero />}
      {variant === "modal" && <FathersDayPromoModal />}
      <WeberPromoSection />
      <Manifesto />
      <ExpandingReveal />
      <Services />
      <Process />
      <GalleryStrip />
      {SHOW_REVIEWS && <Testimonials />}
      <ClosingCta />
    </>
  );
}
