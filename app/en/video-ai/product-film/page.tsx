import type { Metadata } from "next";

import ProductFilmStudio from "@/components/video-ai/ProductFilmStudio";

export const metadata: Metadata = {
  title: "ORBYVEN Product Film Engine | Video AI",
  description:
    "The ORBYVEN product-film engine uses the real interface, live animation and vertical 60 fps browser recording.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrbyvenProductFilmPageEn() {
  return <ProductFilmStudio locale="en" />;
}
