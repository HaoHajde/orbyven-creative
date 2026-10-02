import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Templates — Web Design & Digital Experiences",
  description:
    "Explore ORBYVEN website, event, hospitality, automotive, medical, retail and digital invitation design directions.",
  alternates: {
    canonical: "https://orbyven.com/templates",
    languages: {
      en: "https://orbyven.com/templates",
      ro: "https://orbyven.ro/templates",
      "x-default": "https://orbyven.com/templates",
    },
  },
};

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
