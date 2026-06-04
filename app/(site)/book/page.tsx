import type { Metadata } from "next";
import BookingForm from "@/components/BookingForm";
import { SITE } from "@/lib/site";

// Link-only page (Jeff texts it to customers). Keep it out of search.
export const metadata: Metadata = {
  title: "Book Your Grill Cleaning | Tri-State Grill Cleaning",
  robots: { index: false, follow: false },
};

export default function BookPage() {
  return (
    <section className="bg-bone min-h-[70vh]">
      <div className="mx-auto max-w-xl px-5 py-12 md:py-16">
        <div className="text-center">
          <p className="uppercase tracking-[0.2em] text-burgundy text-xs font-semibold">
            {SITE.shortName} · At-home service
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl text-navy">Book your cleaning</h1>
          <p className="mt-3 text-ink/70">
            Pick a day and time that works — we&apos;ll text you to confirm. We come to you across
            Cincinnati, Northern Kentucky &amp; Dayton.
          </p>
        </div>
        <div className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm">
          <BookingForm />
        </div>
      </div>
    </section>
  );
}
