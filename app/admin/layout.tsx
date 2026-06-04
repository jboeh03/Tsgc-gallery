import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin · Tri-State Grill Cleaning",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  // Installable home-screen app: launches standalone into the HQ.
  appleWebApp: {
    capable: true,
    title: "TSGC HQ",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A3055",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
