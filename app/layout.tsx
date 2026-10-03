import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";

import CookieConsent from "@/components/legal/CookieConsent";
import PublicCommerceLinkRouter from "@/components/PublicCommerceLinkRouter";
import AppModeRuntime from "@/components/pwa/AppModeRuntime";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import StructuredData from "@/components/StructuredData";
import {
  publicLocaleForHost,
  publicOriginForLocale,
} from "@/lib/domain-locale";
import { siteConfig, siteConfigEn } from "@/lib/site-config";

import "./globals.css";
import "./home-seamless-galaxy.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function requestLocale() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host");

  return publicLocaleForHost(host);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  const config = locale === "en" ? siteConfigEn : siteConfig;
  const origin = publicOriginForLocale(locale);

  const title =
    locale === "en"
      ? "ORBYVEN — Web Design, AI & Business Workspace"
      : "ORBYVEN CREATIVE — Web Design & Invitații Digitale";

  const keywords =
    locale === "en"
      ? [
          "ORBYVEN",
          "ORBYVEN CREATIVE",
          "web design",
          "website development",
          "business website",
          "landing page",
          "website redesign",
          "digital experiences",
          "digital wedding invitations",
          "digital christening invitations",
          "custom digital invitations",
        ]
      : [
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
        ];

  return {
    metadataBase: new URL(origin),
    title: {
      default: title,
      template: "%s | ORBYVEN CREATIVE",
    },
    description: config.description,
    applicationName: config.name,
    keywords,
    authors: [{ name: config.name }],
    creator: config.name,
    publisher: config.name,
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
}

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

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await requestLocale();
  const siteUrl = publicOriginForLocale(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StructuredData locale={locale} siteUrl={siteUrl} />
        <PublicCommerceLinkRouter />
        <ServiceWorkerRegistration />
        <AppModeRuntime />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
