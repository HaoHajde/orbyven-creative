import type { Metadata } from "next";

import AiWebDesignEntry from "@/components/AiWebDesignEntryEn";

export const metadata: Metadata = {
  title: "ORBYVEN AI Web Design | Generate and refine websites intelligently",
  description:
    "ORBYVEN AI Web Design turns a business brief into a coherent website direction with live preview, controlled structure and AI-assisted refinement.",
  alternates: {
    canonical: "https://www.orbyven.com/ai-web-design",
  },
};

export default function AiWebDesignPage() {
  return <AiWebDesignEntry />;
}
