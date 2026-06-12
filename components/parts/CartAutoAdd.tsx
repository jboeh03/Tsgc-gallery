"use client";

import { useEffect, useRef } from "react";
import type { Part } from "@/lib/parts/catalog";
import { useCart } from "./CartProvider";

/**
 * Adds a part to the cart from a `/parts?add=<id>` link (what the concierge
 * hands out). Runs once after hydration: drops the part in the cart, asks the
 * drawer to open, and strips `add` from the URL so a refresh doesn't re-add.
 */
export default function CartAutoAdd({ parts }: { parts: Part[] }) {
  const { add, ready } = useCart();
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("add");
    if (!id) return;
    done.current = true;
    const part = parts.find((p) => p.id === id);
    if (part) {
      add(part);
      window.dispatchEvent(new CustomEvent("tsgc:open-cart"));
    }
    params.delete("add");
    const qs = params.toString();
    window.history.replaceState(null, "", `/parts${qs ? `?${qs}` : ""}`);
  }, [ready, parts, add]);

  return null;
}
