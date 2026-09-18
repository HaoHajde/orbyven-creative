import type { ReactNode } from "react";

import TemplateExperienceLayer from "@/components/TemplateExperienceLayer";

export default function WeddingDemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <TemplateExperienceLayer />
    </>
  );
}
