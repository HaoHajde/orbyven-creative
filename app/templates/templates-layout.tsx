import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Templates & Portofoliu",
  description:
    "Explorează proiectele și direcțiile vizuale ORBYVEN CREATIVE pentru website-uri, landing pages și experiențe digitale personalizabile.",
  openGraph: {
    title: "Templates & Portofoliu | ORBYVEN CREATIVE",
    description:
      "Explorează proiecte ORBYVEN și pornește de la o direcție existentă sau de la o pagină complet albă.",
  },
};

export default function TemplatesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
