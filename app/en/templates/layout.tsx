import type { Metadata } from "next";
import type { ReactNode } from "react";

import TemplateExperienceLayer from "@/components/TemplateExperienceLayer";

export const metadata: Metadata = {
  title: "Templates & Portfolio",
  description:
    "Explore ORBYVEN website templates, digital experiences and customizable starting points for modern businesses.",
  alternates: {
    canonical: "https://www.orbyven.com/templates",
  },
  openGraph: {
    url: "https://www.orbyven.com/templates",
    title: "Templates & Portfolio | ORBYVEN CREATIVE",
    description:
      "Explore ORBYVEN projects and start from an existing direction or from a blank page.",
  },
};

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <TemplateExperienceLayer />
    </>
  );
}
