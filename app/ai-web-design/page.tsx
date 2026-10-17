import type { Metadata } from "next";

import AiWebDesignEntry from "@/components/AiWebDesignEntry";

export const metadata: Metadata = {
  title: "AI Web Design ORBYVEN | Website-uri și invitații online",
  description:
    "ORBYVEN AI Design generează și rafinează website-uri și invitații online pentru nuntă, botez sau evenimente, cu preview live și structură controlată.",
  alternates: {
    canonical: "/ai-web-design",
  },
};

export default function AiWebDesignPage() {
  return <AiWebDesignEntry />;
}
