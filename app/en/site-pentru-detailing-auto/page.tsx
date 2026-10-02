import { notFound } from "next/navigation";

import EnglishSeoLandingPage from "@/components/seo/EnglishSeoLandingPage";
import { buildEnglishLandingMetadata, getEnglishLanding } from "@/lib/seo-public-en";

const page = getEnglishLanding("site-pentru-detailing-auto");

export const metadata = page ? buildEnglishLandingMetadata(page) : {};

export default function Page() {
  if (!page) notFound();
  return <EnglishSeoLandingPage page={page} />;
}
