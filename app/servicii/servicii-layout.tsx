import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Servicii",
  description:
    "Website-uri, landing pages, redesign și experiențe digitale construite de ORBYVEN CREATIVE pentru branduri și afaceri care vor o prezență digitală mai puternică.",
  openGraph: {
    title: "Servicii | ORBYVEN CREATIVE",
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
