import "./globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { metaDescription, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

// The font files live in app/fonts, so building the site never needs the internet and the
// result never depends on what Google sends that day. They are served from our own domain:
// no request to Google, no layout jump (display: swap + a size-matched fallback font).
const display = localFont({
  src: [{ path: "./fonts/SpaceGrotesk-latin.woff2", weight: "300 700", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});

const sans = localFont({
  src: [{ path: "./fonts/DMSans-latin.woff2", weight: "100 1000", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0B1220",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings(db);
  const description = metaDescription(
    `${s.shopName}: ${s.tagline}. New and used mobile phones in Pakistan, graded by condition and clearly marked PTA Approved, Non-PTA or JV. Cash on delivery.`,
  );
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${s.shopName} | New and Used Mobile Phones in Pakistan`, template: `%s | ${s.shopName}` },
    description,
    applicationName: s.shopName,
    openGraph: {
      type: "website",
      siteName: s.shopName,
      locale: "en_PK",
      title: `${s.shopName} | New and Used Mobile Phones`,
      description,
    },
    twitter: { card: "summary", title: `${s.shopName} | New and Used Mobile Phones`, description },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
