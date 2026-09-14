import type { Metadata } from "next";

import { Pilot003Home } from "@/components/pilot003/Pilot003Asfalt";

export const metadata: Metadata = {
  title: "VIAFORTE · Asfaltări București · Pilot #003",
  description:
    "Template demonstrativ ORBYVEN pentru o firmă de asfaltări din București și împrejurimi, cu lucrări, utilaje și transparență operațională.",
};

export default function AsphaltPilot003Page() {
  return <Pilot003Home />;
}
