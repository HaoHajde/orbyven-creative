import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Oferta ta ORBYVEN | Confirmare plan",
  description:
    "Vezi rapid ce include planul ORBYVEN selectat și confirmă înainte de redirectul către Stripe Checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfferLayout({ children }: { children: ReactNode }) {
  return children;
}
