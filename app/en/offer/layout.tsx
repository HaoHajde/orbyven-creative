import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Your ORBYVEN Plan",
  description: "Review the selected ORBYVEN plan before continuing to secure checkout.",
  robots: { index: false, follow: false },
};

export default function OfferLayout({ children }: { children: ReactNode }) {
  return children;
}
