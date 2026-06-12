"use client";

import { useEffect } from "react";

/** Clears the persisted parts cart once an order is confirmed. */
export default function ClearCartOnMount() {
  useEffect(() => {
    try {
      localStorage.removeItem("tsgc_parts_cart_v1");
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
