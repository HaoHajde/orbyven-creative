import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Services — Websites, Workspace & Digital Experiences",
  description:
    "Explore ORBYVEN web design, landing pages, redesign, connected business workspace modules and custom digital experiences.",
  alternates: {
    canonical: "https://orbyven.com/services",
    languages: {
      en: "https://orbyven.com/services",
      ro: "https://orbyven.ro/servicii",
      "x-default": "https://orbyven.com/services",
    },
  },
};

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return children;
}
