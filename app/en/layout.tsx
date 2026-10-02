import type { Metadata } from "next";
import type { ReactNode } from "react";

const description =
  "ORBYVEN CREATIVE builds premium websites, connected business workspaces, digital experiences and interactive invitations.";

export const metadata: Metadata = {
  title: {
    default: "ORBYVEN CREATIVE",
    template: "%s | ORBYVEN CREATIVE",
  },
  description,
  keywords: [
    "ORBYVEN",
    "web design",
    "business website",
    "business workspace",
    "digital experiences",
    "digital invitations",
    "website redesign",
    "landing page",
  ],
};

export default function EnglishPublicLayout({ children }: { children: ReactNode }) {
  return <div lang="en">{children}</div>;
}
