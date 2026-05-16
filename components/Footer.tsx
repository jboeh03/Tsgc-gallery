import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="bg-navy text-bone/85 mt-16">
      <div className="mx-auto max-w-6xl px-5 py-12 grid gap-10 md:grid-cols-3 text-sm">
        <div>
          <p className="font-display text-lg text-bone">{SITE.name}</p>
          <p className="mt-2 text-bone/70">{SITE.tagline}</p>
          <p className="mt-3 text-bone/70">{SITE.hoursSummary}</p>
        </div>

        <div>
          <p className="uppercase tracking-widest text-burgundy-400 text-xs">
            Get in touch
          </p>
          <ul className="mt-3 space-y-1.5">
            <li>
              <a href={SITE.phoneHref} className="hover:text-burgundy-400">
                {SITE.phone}
              </a>
            </li>
            <li>
              <a href={SITE.emailHref} className="hover:text-burgundy-400">
                {SITE.email}
              </a>
            </li>
            <li>
              <Link href="/quote" className="hover:text-burgundy-400">
                Request a quote &rarr;
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="uppercase tracking-widest text-burgundy-400 text-xs">
            Service area
          </p>
          <ul className="mt-3 space-y-1.5">
            {SITE.serviceArea.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-bone/10">
        <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-bone/60 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SITE.name}. Veteran-founded,
            locally operated.
          </p>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-4">
              <li>
                <Link href="/services" className="hover:text-burgundy-400">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-burgundy-400">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-burgundy-400">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-burgundy-400">
                  About
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-burgundy-400">
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
