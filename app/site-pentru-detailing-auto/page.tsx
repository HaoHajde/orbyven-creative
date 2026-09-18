import { notFound } from "next/navigation";

import SeoLandingPage from "@/components/seo/SeoLandingPage";
import { buildSeoMetadata, getLandingBySlug } from "@/lib/seo-foundation";

const page = getLandingBySlug("site-pentru-detailing-auto");

export const metadata = page
  ? buildSeoMetadata({ path: page.path, title: page.metaTitle, description: page.description })
  : {};

export default function Page() {
  if (!page) notFound();
  return <SeoLandingPage page={page} />;
}
