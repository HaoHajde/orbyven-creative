import type { Metadata } from "next";

import { Pilot003ContactPage } from "@/components/pilot003/Pilot003Asfalt";

export const metadata: Metadata = {
  title: "Contact · VIAFORTE · Pilot #003",
  description:
    "Pagină demonstrativă de contact și solicitare ofertă pentru servicii de asfaltare în București și împrejurimi.",
};

export default function AsphaltPilot003ContactRoute() {
  return <Pilot003ContactPage />;
}
