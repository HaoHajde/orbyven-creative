import type { Metadata } from "next";

import { Pilot003GalleryPage } from "@/components/pilot003/Pilot003Asfalt";

export const metadata: Metadata = {
  title: "Galerie lucrări · VIAFORTE · Pilot #003",
  description:
    "Galerie demonstrativă pentru lucrări de asfaltare, platforme, drumuri de acces și reparații în București și împrejurimi.",
};

export default function AsphaltPilot003GalleryPage() {
  return <Pilot003GalleryPage />;
}
