import type { Metadata } from "next";
import Link from "next/link";
import PreviewClient from "@/components/preview/PreviewClient";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `See your grill clean (AI preview) | ${SITE.name}`,
  description:
    "Upload a photo of your grill and our AI inspector will give you a personalized condition report and a preview of what it could look like after a Tri-State Grill Cleaning deep clean.",
};

const BUILD_ID = `v7-${new Date().toISOString().slice(0, 16).replace("T", "-")}`;

export default function PreviewPage() {
  return (
    <>
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20 text-center">
          <p className="uppercase tracking-widest text-bone/55 text-xs font-semibold">
            AI Preview · Free
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            See your grill, clean.
          </h1>
          <p className="mt-5 text-bone/85 max-w-2xl mx-auto">
            Upload a photo. Our AI inspector will tell you what we&apos;d
            address and show you a preview of what it could look like after a
            Tri-State deep clean.
          </p>
          <p className="mt-3 text-bone/60 text-sm">
            Built on real customer before-and-after pairs. Real results vary —
            see our{" "}
            <Link href="/gallery" className="text-burgundy-400 hover:underline">
              actual gallery
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-bone">
        <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
          <div className="rounded-xl border border-border bg-white shadow-sm p-6 md:p-8">
            <PreviewClient />
          </div>

          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-center text-sm">
            <Step n="1" title="Upload" body="A clear photo of your grill (hood open works best)." />
            <Step n="2" title="Inspect" body="AI grades the buildup and recommends a service tier." />
            <Step n="3" title="Decide" body="Like the preview? Get a real quote — no commitment." />
          </div>

          <p className="mt-8 text-center text-[10px] text-muted/60 font-mono">
            build {BUILD_ID}
          </p>
        </div>
      </section>
    </>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-md bg-white border border-border p-4">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-burgundy text-bone font-display">
        {n}
      </span>
      <p className="mt-3 font-display text-base text-navy">{title}</p>
      <p className="mt-1 text-ink/75 text-xs leading-relaxed">{body}</p>
    </div>
  );
}
