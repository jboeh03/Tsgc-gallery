import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About Us" },
  { href: "/gallery", label: "Gallery" },
  { href: "/products", label: "Recommended Gear" },
  { href: "/parts", label: "Grill Parts" },
  { href: "/quote", label: "Get a Quote" },
];

const SERVICES = [
  "Gas Grill Cleaning",
  "Charcoal Grill Cleaning",
  "Smoker Cleaning",
  "Flat Top Cleaning",
  "Safety Inspection",
];

export default function Footer() {
  return (
    <footer className="bg-navy text-bone/85 mt-16">
      <div className="mx-auto max-w-6xl px-5 py-14 grid gap-10 md:grid-cols-4 text-sm">
        <div>
          <Image
            src="/logos/logo-white.png"
            alt={SITE.name}
            width={72}
            height={72}
            className="h-16 w-16 mb-3"
          />
          <p className="font-display text-xl text-bone tracking-wide">
            {SITE.name}
          </p>
          <p className="mt-3 text-bone/70">{SITE.tagline}</p>
          <div className="mt-5 flex gap-3">
            <a
              href={SITE.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-bone/20 hover:border-burgundy-400 hover:text-burgundy-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-bone/20 hover:border-burgundy-400 hover:text-burgundy-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href={SITE.emailHref}
              aria-label="Email"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-bone/20 hover:border-burgundy-400 hover:text-burgundy-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <p className="uppercase tracking-widest text-burgundy-400 text-xs font-semibold">
            Navigation
          </p>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-burgundy-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="uppercase tracking-widest text-burgundy-400 text-xs font-semibold">
            Services
          </p>
          <ul className="mt-3 space-y-2 text-bone/70">
            {SERVICES.map((s) => (
              <li key={s}>{s}</li>
            ))}
            <li>
              <Link href="/grill-repair" className="text-bone/85 hover:text-burgundy-400">
                Grill Repair
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="uppercase tracking-widest text-burgundy-400 text-xs font-semibold">
            Contact
          </p>
          <ul className="mt-3 space-y-2">
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
            <li className="text-bone/70">{SITE.cityState}</li>
            <li className="text-bone/60 text-xs mt-3">
              Serving: {SITE.serviceArea.join(" · ")}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-bone/10">
        <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-bone/60 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p>★ Veteran-Founded &amp; Operated</p>
        </div>
      </div>
    </footer>
  );
}
