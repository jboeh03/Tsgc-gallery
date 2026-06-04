import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes /admin installable as a standalone "HQ" app on the
 * home screen (Add to Home Screen on iOS, Install on Android/Chrome).
 * start_url + scope point at /admin so launching the icon opens straight into
 * the dashboard, not the marketing site.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tri-State Grill Cleaning — HQ",
    short_name: "TSGC HQ",
    description: "Tri-State Grill Cleaning operations hub: inbox, CRM, scheduling, invoicing.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1A3055",
    theme_color: "#1A3055",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
