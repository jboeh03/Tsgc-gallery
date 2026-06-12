"use client";

/**
 * Dependency-free cart for the /parts storefront. State lives in a reducer,
 * persists to localStorage, and stores a denormalized snapshot of each line so
 * the drawer renders without the catalog. The server NEVER trusts this — the
 * checkout route re-prices every line by part id, so a tampered cart can't
 * underpay. Prices shown here are display-only and corrected at checkout.
 */

import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from "react";
import type { Part } from "@/lib/parts/catalog";

const STORAGE_KEY = "tsgc_parts_cart_v1";

export type CartItem = {
  partId: string;
  partNumber: string;
  name: string;
  brand: string;
  unitPrice: number;
  qty: number;
};

type State = { items: CartItem[] };

type Action =
  | { type: "add"; part: Part }
  | { type: "setQty"; partId: string; qty: number }
  | { type: "remove"; partId: string }
  | { type: "clear" }
  | { type: "hydrate"; items: CartItem[] };

const MAX_QTY = 10;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { items: action.items };
    case "add": {
      const { part } = action;
      const existing = state.items.find((i) => i.partId === part.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.partId === part.id ? { ...i, qty: Math.min(MAX_QTY, i.qty + 1) } : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            partId: part.id,
            partNumber: part.partNumber,
            name: part.name,
            brand: part.brand,
            unitPrice: part.retailPrice,
            qty: 1,
          },
        ],
      };
    }
    case "setQty": {
      const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(action.qty) || 1));
      return { items: state.items.map((i) => (i.partId === action.partId ? { ...i, qty } : i)) };
    }
    case "remove":
      return { items: state.items.filter((i) => i.partId !== action.partId) };
    case "clear":
      return { items: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (part: Part) => void;
  setQty: (partId: string, qty: number) => void;
  remove: (partId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", items: parsed });
      }
    } catch {
      /* ignore bad storage */
    }
    setReady(true);
  }, []);

  // Persist on change (once hydrated).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* ignore */
    }
  }, [state.items, ready]);

  const count = state.items.reduce((n, i) => n + i.qty, 0);
  const subtotal = state.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  const value: CartContextValue = {
    items: state.items,
    count,
    subtotal,
    ready,
    add: (part) => dispatch({ type: "add", part }),
    setQty: (partId, qty) => dispatch({ type: "setQty", partId, qty }),
    remove: (partId) => dispatch({ type: "remove", partId }),
    clear: () => dispatch({ type: "clear" }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
