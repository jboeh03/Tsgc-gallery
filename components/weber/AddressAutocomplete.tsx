"use client";

import { useEffect, useRef } from "react";

/**
 * Service-address field with Google Places autocomplete. Loads the Maps JS API
 * only when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set; otherwise it's a plain
 * controlled input (graceful fallback, no setup needed to ship).
 */

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type GAutocomplete = {
  addListener(event: string, cb: () => void): void;
  getPlace(): { formatted_address?: string };
};
type GMaps = {
  maps: { places: { Autocomplete: new (el: HTMLInputElement, opts: Record<string, unknown>) => GAutocomplete } };
};

let scriptPromise: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (!KEY) return Promise.reject(new Error("no key"));
  if (typeof window !== "undefined" && (window as unknown as { google?: GMaps }).google?.maps?.places) {
    return Promise.resolve();
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("maps load failed"));
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export default function AddressAutocomplete({
  value,
  onChange,
  className,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!KEY || !ref.current) return;
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current) return;
        const g = (window as unknown as { google?: GMaps }).google;
        if (!g) return;
        const ac = new g.maps.places.Autocomplete(ref.current, {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["formatted_address"],
        });
        ac.addListener("place_changed", () => {
          const p = ac.getPlace();
          if (p?.formatted_address) onChange(p.formatted_address);
        });
      })
      .catch(() => {
        /* fall back to plain input */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder={placeholder}
      required={required}
      autoComplete="off"
    />
  );
}
