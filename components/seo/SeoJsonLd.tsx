import type { SeoCaseStudy, SeoGuide, SeoLandingPage, SeoLink } from "@/lib/seo-foundation";
import { getSiteUrl } from "@/lib/site-config";

type Props =
  | { kind: "landing"; page: SeoLandingPage; breadcrumbs: SeoLink[] }
  | { kind: "case-study"; page: SeoCaseStudy; breadcrumbs: SeoLink[] }
  | { kind: "guide"; page: SeoGuide; breadcrumbs: SeoLink[] };

export default function SeoJsonLd(props: Props) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${props.page.path}`;
  const breadcrumbList = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: siteUrl },
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
      areaServed: { "@type": "Country", name: "Romania" },
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
      inLanguage: "ro",
    };
  } else {
    content = {
      "@type": "Article",
      headline: props.page.h1,
      name: props.page.title,
      description: props.page.description,
      url: pageUrl,
      author: { "@id": `${siteUrl}/#organization` },
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "ro",
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
