import { notFound } from "next/navigation";

import SeoGuidePage from "@/components/seo/SeoGuidePage";
import { buildSeoMetadata, getGuideBySlug } from "@/lib/seo-foundation";

const page = getGuideBySlug("site-sau-facebook-pentru-afacere");

export const metadata = page
  ? buildSeoMetadata({ path: page.path, title: page.metaTitle, description: page.description })
  : {};

export default function Page() {
  if (!page) notFound();
  return <SeoGuidePage page={page} />;
}
