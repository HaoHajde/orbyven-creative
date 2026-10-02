import type { Metadata } from "next";
import HomePageClient from "@/components/HomePageClient";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    url: "/",
    title: "ORBYVEN — Web Design, AI & Business Workspace",
    description: siteConfig.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ORBYVEN — Web Design, AI & Business Workspace",
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
