import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Geist, Geist_Mono } from "next/font/google";

import StructuredData from "@/components/StructuredData";
import { getSiteUrl, siteConfig } from "@/lib/site-config";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),

  title: {
    default: "ORBYVEN CREATIVE — Web Design & Digital Experiences",
    template: "%s | ORBYVEN CREATIVE",
  },

  description: siteConfig.description,

  alternates: {
    canonical: "/",
  },

  applicationName: siteConfig.name,

  keywords: [
    "ORBYVEN",
    "ORBYVEN CREATIVE",
    "web design România",
    "creare website",
    "site prezentare",
    "website business",
    "landing page",
    "redesign website",
    "experiențe digitale",
  ],

  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "technology",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: "/",
    title: "ORBYVEN CREATIVE — Web Design & Digital Experiences",
    description:
      "Website-uri, landing pages, redesign-uri și experiențe digitale construite pentru o prezență care rămâne în minte.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ORBYVEN CREATIVE — Web Design & Digital Experiences",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ORBYVEN CREATIVE — Web Design & Digital Experiences",
    description:
      "Website-uri, landing pages, redesign-uri și experiențe digitale construite pentru o prezență care rămâne în minte.",
    images: ["/opengraph-image"],
  },

  manifest: "/manifest.webmanifest",

  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#ffffff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#000000",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
