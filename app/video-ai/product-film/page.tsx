import type { Metadata } from "next";

import ProductFilmStudio from "@/components/video-ai/ProductFilmStudio";

export const metadata: Metadata = {
  title: "ORBYVEN Product Film Engine | Video AI",
  description:
    "Motorul ORBYVEN pentru filme de produs folosește interfața reală, animații live și captură video verticală la 60 fps.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrbyvenProductFilmPage() {
  return <ProductFilmStudio locale="ro" />;
}
