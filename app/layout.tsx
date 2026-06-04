import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.canonicalUrl),
  title: `${SITE.name} — Cincinnati, NKY & Dayton`,
  description: SITE.tagline,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — Cincinnati, NKY & Dayton`,
    description: SITE.tagline,
    type: "website",
    url: SITE.canonicalUrl,
    siteName: SITE.name,
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE.name,
  description: SITE.tagline,
  url: SITE.canonicalUrl,
  telephone: "+15137904040",
  email: SITE.email,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cincinnati",
    addressRegion: "OH",
    postalCode: "45233",
    addressCountry: "US",
  },
  areaServed: [
    { "@type": "City", name: "Cincinnati" },
    { "@type": "City", name: "Covington" },
    { "@type": "City", name: "Florence" },
    { "@type": "City", name: "Dayton" },
    { "@type": "State", name: "Ohio" },
  ],
  priceRange: "$$",
  sameAs: [SITE.social.facebook, SITE.social.instagram],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
