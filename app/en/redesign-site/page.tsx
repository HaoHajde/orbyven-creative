import { notFound } from "next/navigation";

import SeoLandingPage from "@/components/seo/SeoLandingPage";
import { buildEnglishSeoMetadata, getLandingBySlugEn } from "@/lib/seo-foundation-en";

const page = getLandingBySlugEn("redesign-site");

export const metadata = page
  ? buildEnglishSeoMetadata({ path: page.path, title: page.metaTitle, description: page.description })
  : {};

export default function Page() {
  if (!page) notFound();
  return <SeoLandingPage page={page} locale="en" />;
}
