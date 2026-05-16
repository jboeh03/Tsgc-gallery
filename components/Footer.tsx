export default function Footer() {
  return (
    <footer className="bg-navy text-bone/80 mt-16">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p>
          Tri-State Grill Cleaning · Veteran-founded · Cincinnati · Northern
          Kentucky · Dayton
        </p>
        <p>&copy; {new Date().getFullYear()} Tri-State Grill Cleaning</p>
      </div>
    </footer>
  );
}
