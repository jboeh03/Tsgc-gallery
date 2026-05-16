import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ · Tri-State Grill Cleaning",
  description:
    "Common questions about grill deep-cleaning service from Tri-State Grill Cleaning.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How long does a cleaning take?",
    a: "Most cart-style grills take 2.5 to 3.5 hours. Built-in islands and heavily soiled grills can run 4 to 5. We give you a window when we book.",
  },
  {
    q: "Do I need to be home?",
    a: "Not the whole time. We just need access to the grill, water, and a 110V outlet. Many of our customers leave a side gate code and head to work.",
  },
  {
    q: "What's the difference between this and using my grill brush?",
    a: "Brushing keeps the grates honest week to week. We pull the grill apart — flavorizer bars, heat shields, burners, drip pan — and degrease every surface that fire and food touch. That's the part that nobody can do without disassembly.",
  },
  {
    q: "Are the chemicals safe for food contact?",
    a: "Yes. We use food-safe degreasers throughout the cookbox, then rinse and season the grates. Your next cook is on a clean surface.",
  },
  {
    q: "Can you fix it if something is broken?",
    a: "Often yes. We carry OEM-compatible flavorizer bars, heat shields, regulator hoses, and ignitor parts for the most common brands. Anything else we source and roll into a return visit.",
  },
  {
    q: "Do you take the grill with you?",
    a: "Almost never. We service in place on your driveway, patio, or dockside. Built-in islands are serviced where they sit.",
  },
  {
    q: "How often should I get a deep clean?",
    a: "Once a year if you grill weekly in summer. Twice a year if you cook year-round or run a lot of fatty proteins.",
  },
  {
    q: "What if I'm not happy?",
    a: "Every job comes with a 30-day satisfaction guarantee. If something's off after we leave, call us and we come back.",
  },
  {
    q: "Are you insured?",
    a: "Fully. We carry general liability and we're happy to send a COI if your HOA or building requires one.",
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <p className="uppercase tracking-widest text-burgundy-400 text-xs font-semibold">
            FAQ
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            Quick answers to the questions we get most.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <div className="space-y-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-lg border border-navy/10 bg-white open:shadow-md"
            >
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4 p-5 font-semibold text-navy">
                <span>{item.q}</span>
                <svg
                  aria-hidden
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-burgundy shrink-0 mt-1 transition-transform group-open:rotate-45"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-ink/80">{item.a}</div>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-bone border border-navy/10 p-6 text-center">
          <p className="text-ink/80">Question not answered here?</p>
          <Link
            href="/quote"
            className="inline-block mt-3 rounded-md bg-burgundy text-bone px-6 py-3 font-semibold hover:bg-burgundy-400"
          >
            Ask us directly
          </Link>
        </div>
      </section>
    </>
  );
}
