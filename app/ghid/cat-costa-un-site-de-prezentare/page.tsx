import { notFound } from "next/navigation";

import SeoGuidePage from "@/components/seo/SeoGuidePage";
import { buildSeoMetadata, getGuideBySlug } from "@/lib/seo-foundation";

const page = getGuideBySlug("cat-costa-un-site-de-prezentare");

export const metadata = page
  ? buildSeoMetadata({ path: page.path, title: page.metaTitle, description: page.description })
  : {};

export default function Page() {
  if (!page) notFound();
  return <SeoGuidePage page={page} />;
}
