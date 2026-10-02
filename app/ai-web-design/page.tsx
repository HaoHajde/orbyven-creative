import type { Metadata } from "next";

import AiWebDesignEntry from "@/components/AiWebDesignEntry";

export const metadata: Metadata = {
  title: "AI Web Design ORBYVEN | Website generat și rafinat inteligent",
  description:
    "ORBYVEN AI Web Design transformă brief-ul unei afaceri într-o direcție de website coerentă, cu preview live, structură controlată și rafinare asistată de AI.",
  alternates: {
    canonical: "/ai-web-design",
  },
};

export default function AiWebDesignPage() {
  return <AiWebDesignEntry />;
}
