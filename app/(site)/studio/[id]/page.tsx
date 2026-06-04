import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isStudioVisible } from "@/lib/preview-flag";
import { getStudioPhoto } from "@/lib/studio/photos";
import StudioEditor from "@/components/studio/StudioEditor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Studio editor — internal",
  robots: { index: false, follow: false },
};

export default async function StudioEditorPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isStudioVisible()) notFound();
  const id = decodeURIComponent(params.id);
  const photo = await getStudioPhoto(id);
  if (!photo) notFound();
  return (
    <section className="bg-bone min-h-[80vh]">
      <div className="mx-auto max-w-6xl px-5 py-8 md:py-10">
        <Link
          href="/studio"
          className="text-sm text-muted hover:text-navy inline-flex items-center gap-1"
        >
          ← All photos
        </Link>
        <h1 className="mt-3 font-display text-2xl md:text-3xl text-navy break-all">
          {photo.filename}
        </h1>
        <p className="mt-1 text-xs text-muted uppercase tracking-widest">
          Source: {photo.source}
        </p>
        <StudioEditor photo={photo} />
      </div>
    </section>
  );
}
