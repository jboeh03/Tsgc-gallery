import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-navy text-bone shadow-md">
      <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-wide">
          <span className="text-bone">Tri-State</span>{" "}
          <span className="text-burgundy-400">Grill Cleaning</span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-6 text-sm uppercase tracking-widest">
            <li>
              <Link href="/" className="hover:text-burgundy-400">
                Home
              </Link>
            </li>
            <li>
              <Link href="/gallery" className="hover:text-burgundy-400">
                Gallery
              </Link>
            </li>
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
      </div>
    </header>
  );
}
