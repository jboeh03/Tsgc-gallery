"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE } from "@/lib/site";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/quote", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-navy text-bone shadow-md">
      <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0"
          onClick={() => setOpen(false)}
          aria-label={SITE.name}
        >
          <Image
            src="/logos/logo-white.png"
            alt=""
            width={48}
            height={48}
            priority
            className="h-10 w-10 md:h-12 md:w-12"
          />
          <span className="font-display text-lg md:text-xl tracking-wide hidden sm:inline">
            <span className="text-bone">{SITE.shortName}</span>{" "}
            <span className="text-burgundy-400">Grill Cleaning</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm uppercase tracking-widest">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`hover:text-burgundy-400 ${
                    isActive(l.href) ? "text-burgundy-400" : ""
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <a
            href={SITE.phoneHref}
            className="text-sm font-semibold hover:text-burgundy-400"
          >
            ☎ {SITE.phone}
          </a>
          <Link
            href="/quote"
            className="rounded-md bg-burgundy px-4 py-2 text-sm uppercase tracking-widest hover:bg-burgundy-400"
          >
            Get a Quote
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden p-2 rounded hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            {open ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M6 18l12-12" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Primary mobile"
        className={`md:hidden border-t border-navy-700 ${open ? "block" : "hidden"}`}
      >
        <ul className="flex flex-col px-5 py-3 text-sm uppercase tracking-widest">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block py-3 hover:text-burgundy-400 ${
                  isActive(l.href) ? "text-burgundy-400" : ""
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="mt-2">
            <a
              href={SITE.phoneHref}
              onClick={() => setOpen(false)}
              className="block py-3 hover:text-burgundy-400"
            >
              ☎ {SITE.phone}
            </a>
          </li>
          <li className="mt-2 mb-3">
            <Link
              href="/quote"
              onClick={() => setOpen(false)}
              className="block text-center rounded-md bg-burgundy px-4 py-3 hover:bg-burgundy-400"
            >
              Get a Quote
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
