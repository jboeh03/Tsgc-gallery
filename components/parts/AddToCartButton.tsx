"use client";

import { useState } from "react";
import type { Part } from "@/lib/parts/catalog";
import { useCart } from "./CartProvider";

export default function AddToCartButton({ part }: { part: Part }) {
  const { add, items } = useCart();
  const inCart = items.find((i) => i.partId === part.id)?.qty ?? 0;
  const [pulsed, setPulsed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add(part);
        setPulsed(true);
        setTimeout(() => setPulsed(false), 900);
      }}
      className="inline-flex items-center gap-2 rounded-md bg-burgundy hover:bg-burgundy-700 text-bone px-4 py-2 text-sm font-semibold transition"
      aria-label={`Add ${part.brand} ${part.name} to cart`}
    >
      {pulsed ? "Added ✓" : inCart > 0 ? `Add another (${inCart})` : "Add to cart"}
    </button>
  );
}
