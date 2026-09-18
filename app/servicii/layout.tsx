import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Web design, creare site & servicii digitale",
  description:
    "Web design, creare site, landing pages și redesign pentru firme. ORBYVEN construiește experiențe digitale clare, rapide și pregătite pentru SEO.",
  alternates: {
    canonical: "/servicii",
  },
  openGraph: {
    url: "/servicii",
    title: "Web design, creare site & servicii digitale | ORBYVEN",
    description:
      "Website-uri, landing pages, redesign și experiențe digitale construite cu claritate, atenție la detalii și impact.",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
