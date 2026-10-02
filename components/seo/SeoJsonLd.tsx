import type { SeoCaseStudy, SeoGuide, SeoLandingPage, SeoLink } from "@/lib/seo-foundation";
import { getSiteUrl } from "@/lib/site-config";
import { publicOriginForLocale } from "@/lib/domain-locale";

type Props =
  | { kind: "landing"; page: SeoLandingPage; breadcrumbs: SeoLink[]; locale?: "ro" | "en" }
  | { kind: "case-study"; page: SeoCaseStudy; breadcrumbs: SeoLink[]; locale?: "ro" | "en" }
  | { kind: "guide"; page: SeoGuide; breadcrumbs: SeoLink[]; locale?: "ro" | "en" };

export default function SeoJsonLd(props: Props) {
  const locale = props.locale ?? "ro";
  const siteUrl = locale === "en" ? publicOriginForLocale("en") : getSiteUrl();
  const pageUrl = `${siteUrl}${props.page.path}`;
  const breadcrumbList = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "ro" ? "Acasă" : "Home", item: siteUrl },
      ...props.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        item: `${siteUrl}${item.href}`,
      })),
    ],
  };

  let content: Record<string, unknown>;

  if (props.kind === "landing") {
    content = {
      "@type": "Service",
      name: props.page.title,
      description: props.page.description,
      url: pageUrl,
      provider: { "@id": `${siteUrl}/#organization` },
      areaServed: locale === "ro" ? { "@type": "Country", name: "Romania" } : undefined,
    };
  } else if (props.kind === "case-study") {
    content = {
      "@type": "CreativeWork",
      name: props.page.title,
      headline: props.page.h1,
      description: props.page.description,
      url: pageUrl,
      author: { "@id": `${siteUrl}/#organization` },
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: locale,
    };
  } else {
    content = {
      "@type": "Article",
      headline: props.page.h1,
      name: props.page.title,
      description: props.page.description,
      url: pageUrl,
      image: `${siteUrl}/opengraph-image`,
      datePublished: "2026-09-18",
      dateModified: "2026-09-18",
      author: { "@id": `${siteUrl}/#organization` },
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: locale,
    };
  }

  const graph: Record<string, unknown>[] = [content, breadcrumbList];

  if (props.kind === "landing" && props.page.faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: props.page.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  const data = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
