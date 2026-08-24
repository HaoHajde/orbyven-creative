import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Geist, Geist_Mono } from "next/font/google";

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
  title: {
    default: "ORBYVEN CREATIVE — Web Design & Digital Experiences",
    template: "%s | ORBYVEN CREATIVE",
  },

  description:
    "ORBYVEN CREATIVE construiește website-uri, landing pages, redesign-uri și experiențe digitale moderne pentru branduri, firme și proiecte care vor să fie greu de ignorat.",

  applicationName: "ORBYVEN CREATIVE",

  keywords: [
    "ORBYVEN",
    "ORBYVEN CREATIVE",
    "web design",
    "website business",
    "landing page",
    "redesign website",
    "digital experiences",
    "web design România",
    "site prezentare",
  ],

  authors: [
    {
      name: "ORBYVEN CREATIVE",
    },
  ],

  creator: "ORBYVEN CREATIVE",
  publisher: "ORBYVEN CREATIVE",

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
    locale: "ro_RO",
    siteName: "ORBYVEN CREATIVE",
    title: "ORBYVEN CREATIVE — Web Design & Digital Experiences",
    description:
      "Website-uri, landing pages, redesign-uri și experiențe digitale construite pentru o prezență care rămâne în minte.",
  },

  twitter: {
    card: "summary_large_image",
    title: "ORBYVEN CREATIVE — Web Design & Digital Experiences",
    description:
      "Website-uri, landing pages, redesign-uri și experiențe digitale construite pentru o prezență care rămâne în minte.",
  },

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
        {children}
      </body>
    </html>
  );
}
