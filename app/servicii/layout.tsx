import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Web design, creare site și invitații digitale",
  description:
    "Web design și creare site pentru firme, invitații digitale de nuntă, botez și majorat. ORBYVEN CREATIVE construiește experiențe online personalizate.",
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
