import type { Metadata } from "next";
import BarbershopExperience from "@/components/pilot006/BarbershopExperience";

export const metadata: Metadata = {
  title: "NOIR CUTS · Barbershop | ORBYVEN Pilot #006",
  description: "Template booking-first pentru frizerii și barbershop-uri: servicii, echipă, lookbook și demonstrație interactivă de programare.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/templates" },
};

export default function Pilot006BarbershopPage() {
  return <BarbershopExperience />;
}
