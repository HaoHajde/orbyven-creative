import type { Metadata } from "next";

import AiWebDesignEntryEn from "@/components/AiWebDesignEntryEn";

export const metadata: Metadata = {
  title: "AI Web Design — Generate & Refine Websites",
  description:
    "ORBYVEN AI Web Design turns a business brief into a coherent website direction with live preview, controlled structure and AI-assisted refinement.",
  alternates: {
    canonical: "https://orbyven.com/ai-web-design",
    languages: {
      en: "https://orbyven.com/ai-web-design",
      ro: "https://orbyven.ro/ai-web-design",
      "x-default": "https://orbyven.com/ai-web-design",
    },
  },
};

export default function AiWebDesignPage() {
  return <AiWebDesignEntryEn />;
}
