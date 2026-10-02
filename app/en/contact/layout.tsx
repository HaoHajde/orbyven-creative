import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Start a Project",
  description:
    "Choose the ORBYVEN direction that fits your project and continue directly into the dedicated flow.",
  alternates: {
    canonical: "https://orbyven.com/contact",
    languages: {
      en: "https://orbyven.com/contact",
      ro: "https://orbyven.ro/contact",
      "x-default": "https://orbyven.com/contact",
    },
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
