import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isStudioVisible } from "@/lib/preview-flag";
import { listStudioPhotos } from "@/lib/studio/photos";
import StudioGallery from "@/components/studio/StudioGallery";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Studio — internal",
  robots: { index: false, follow: false },
};

export default async function StudioPage() {
  if (!isStudioVisible()) notFound();
  const photos = await listStudioPhotos();
  return (
    <section className="bg-bone min-h-[80vh]">
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-12">
        <header className="mb-6">
          <p className="uppercase tracking-widest text-muted text-xs font-semibold">
            Internal · not indexed
          </p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl text-navy">
            Showcase Studio
          </h1>
          <p className="mt-2 text-ink/75 max-w-2xl text-sm leading-relaxed">
            Edit and animate photos before they ship. Sources: live gallery
            (<code className="text-xs">public/gallery/</code>) and raw uploads
            (<code className="text-xs">marketing/all-photos-raw/</code>).
            Approved outputs copy into{" "}
            <code className="text-xs">public/gallery/studio/</code>.
          </p>
        </header>
        <StudioGallery initialPhotos={photos} />
      </div>
    </section>
  );
}
