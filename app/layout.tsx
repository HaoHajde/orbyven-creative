import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Geist, Geist_Mono } from "next/font/google";

import CookieConsent from "@/components/legal/CookieConsent";
import PublicCommerceLinkRouter from "@/components/PublicCommerceLinkRouter";
import AppModeRuntime from "@/components/pwa/AppModeRuntime";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
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
    default: "ORBYVEN — Web Design, AI & Business Workspace",
    template: "%s | ORBYVEN CREATIVE",
  },

  description: siteConfig.description,

  applicationName: siteConfig.name,

  keywords: [
    "ORBYVEN",
    "ORBYVEN CREATIVE",
    "web design",
    "website development",
    "business website",
    "website business",
    "landing page",
    "redesign website",
    "digital experiences",
    "digital wedding invitations",
    "digital christening invitations",
    "custom digital invitations",
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

  appleWebApp: {
    capable: true,
    title: "ORBYVEN",
    statusBarStyle: "black-translucent",
  },

  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
  },

  icons: {
    icon: [
      { url: "/branding/orbyven-favicon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32" },
    ],
    shortcut: "/branding/orbyven-favicon-96.png",
    apple: [
      {
        url: "/branding/orbyven-app-icon.png",
        type: "image/png",
        sizes: "1024x1024",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StructuredData />
        <PublicCommerceLinkRouter />
        <ServiceWorkerRegistration />
        <AppModeRuntime />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
