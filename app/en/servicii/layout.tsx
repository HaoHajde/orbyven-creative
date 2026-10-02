import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Web Design, Websites & Digital Experiences",
  description:
    "ORBYVEN builds business websites, landing pages, redesigns and AI-assisted digital experiences for modern companies.",
  alternates: {
    canonical: "https://www.orbyven.com/servicii",
  },
  openGraph: {
    url: "https://www.orbyven.com/servicii",
    title: "Web Design & Digital Experiences | ORBYVEN CREATIVE",
    description:
      "Business websites, landing pages, redesign and connected digital experiences built with clarity and performance.",
  },
};

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return children;
}
