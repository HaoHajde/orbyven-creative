import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Geist, Geist_Mono } from "next/font/google";

import CookieConsent from "@/components/legal/CookieConsent";
import PublicCommerceLinkRouter from "@/components/PublicCommerceLinkRouter";
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
    default: "ORBYVEN CREATIVE — Web Design & Invitații Digitale",
    template: "%s | ORBYVEN CREATIVE",
  },

  description: siteConfig.description,

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
    "invitații nuntă digitale",
    "invitații botez digitale",
    "invitații online personalizate",
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

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32" },
    ],
    shortcut: "/favicon.ico",
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
        <PublicCommerceLinkRouter />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
