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
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — veteran-founded grill cleaning in Cincinnati, NKY & Dayton`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Cincinnati, NKY & Dayton`,
    description: SITE.tagline,
    images: ["/og.png"],
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["HomeAndConstructionBusiness", "LocalBusiness"],
  name: SITE.name,
  description: SITE.tagline,
  url: SITE.canonicalUrl,
  logo: `${SITE.canonicalUrl}/logos/logo-2-color.png`,
  image: `${SITE.canonicalUrl}/gallery/tsg-011-after.webp`,
  telephone: "+16578314276",
  email: SITE.email,
  foundingDate: String(SITE.foundedYear),
  founder: { "@type": "Person", name: SITE.owner },
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

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.canonicalUrl,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
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
