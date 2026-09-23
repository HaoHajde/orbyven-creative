import type { Metadata } from "next";
import type { ReactNode } from "react";

import TemplateExperienceLayer from "@/components/TemplateExperienceLayer";

export const metadata: Metadata = {
  title: "Templates & Portofoliu",
  description:
    "Explorează template-uri ORBYVEN CREATIVE pentru website-uri, invitații digitale de nuntă, botez și majorat, landing pages și experiențe personalizabile.",
  alternates: {
    canonical: "/templates",
  },
  openGraph: {
    url: "/templates",
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
  return (
    <>
      {children}
      <TemplateExperienceLayer />
    </>
  );
}
