import { notFound } from "next/navigation";

import SeoCaseStudyPage from "@/components/seo/SeoCaseStudyPage";
import { buildSeoMetadata, getCaseStudyBySlug } from "@/lib/seo-foundation";

const page = getCaseStudyBySlug("neagu-costica-srl");

export const metadata = page
  ? buildSeoMetadata({ path: page.path, title: page.metaTitle, description: page.description })
  : {};

export default function Page() {
  if (!page) notFound();
  return <SeoCaseStudyPage page={page} />;
}
