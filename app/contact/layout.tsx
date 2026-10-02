import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pornește cu ORBYVEN | Invitații, Web Design & Dashboard",
  description:
    "Alege cum vrei să începi cu ORBYVEN: invitație online personalizată, web design sau web design conectat cu Dashboard.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    url: "/contact",
    title: "Pornește cu ORBYVEN",
    description:
      "Invitații online personalizate, web design și ecosistem website + dashboard într-un singur punct de pornire.",
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <div className="orbyven-start-scope">{children}</div>;
}
