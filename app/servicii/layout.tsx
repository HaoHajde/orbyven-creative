import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Web design, site-uri și invitații digitale",
  description:
    "Web design și creare site pentru firme, invitații digitale de nuntă, botez și majorat. ORBYVEN CREATIVE construiește experiențe online personalizate.",
  alternates: {
    canonical: "/servicii",
  },
  openGraph: {
    url: "/servicii",
    title: "Web design și invitații digitale | ORBYVEN CREATIVE",
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
