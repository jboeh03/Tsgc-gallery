import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-20 text-center">
      <h1 className="font-display text-5xl md:text-6xl text-navy">
        Grills, restored.
      </h1>
      <p className="mt-6 text-lg text-ink/80">
        Veteran-founded, locally operated grill cleaning across Cincinnati,
        Northern Kentucky, and Dayton.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/gallery"
          className="rounded-md bg-navy text-bone px-6 py-3 hover:bg-navy-700"
        >
          See the Gallery
        </Link>
        <Link
          href="/quote"
          className="rounded-md bg-burgundy text-bone px-6 py-3 hover:bg-burgundy-400"
        >
          Get a Quote
        </Link>
      </div>
    </section>
  );
}
