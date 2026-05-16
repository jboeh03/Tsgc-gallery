"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE } from "@/lib/site";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-navy text-bone shadow-md">
      <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-xl tracking-wide shrink-0"
          onClick={() => setOpen(false)}
        >
          <span className="text-bone">{SITE.shortName}</span>{" "}
          <span className="text-burgundy-400">Grill Cleaning</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm uppercase tracking-widest">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-burgundy-400">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/quote"
                className="rounded-md bg-burgundy px-4 py-2 hover:bg-burgundy-400"
              >
                Get a Quote
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile toggle */}
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

      {/* Mobile menu */}
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
                className="block py-3 hover:text-burgundy-400"
              >
                {l.label}
              </Link>
            </li>
          ))}
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
