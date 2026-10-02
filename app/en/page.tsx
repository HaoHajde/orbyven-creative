import type { Metadata } from "next";

import HomePageClientEn from "@/components/HomePageClientEn";

const description =
  "ORBYVEN CREATIVE builds premium websites, connected business workspaces, digital experiences and interactive invitations.";

export const metadata: Metadata = {
  title: "ORBYVEN CREATIVE — Web Design, Business Workspace & Digital Experiences",
  description,
  alternates: {
    canonical: "https://orbyven.com/",
    languages: {
      en: "https://orbyven.com/",
      ro: "https://orbyven.ro/",
      "x-default": "https://orbyven.com/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ORBYVEN CREATIVE",
    url: "https://orbyven.com/",
    title: "ORBYVEN CREATIVE — Web Design & Connected Digital Experiences",
    description,
    images: [
      {
        url: "https://orbyven.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ORBYVEN CREATIVE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ORBYVEN CREATIVE — Web Design & Connected Digital Experiences",
    description,
    images: ["https://orbyven.com/opengraph-image"],
  },
};

export default function EnglishHomePage() {
  return <HomePageClientEn />;
}
