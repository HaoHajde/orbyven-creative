import { siteConfig, siteConfigEn } from "@/lib/site-config";

export default function InvitationStructuredData({
  path,
  name,
  description,
  locale = "ro",
}: {
  path: "/invitatii-nunta" | "/invitatii-botez" | "/invitatii-majorat";
  name: string;
  description: string;
  locale?: "ro" | "en";
}) {
  const config = locale === "en" ? siteConfigEn : siteConfig;
  const home = config.defaultUrl;
  const url = `${home}${path}`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        inLanguage: locale === "en" ? "en" : "ro-RO",
        isPartOf: { "@id": `${home}/#website` },
        about: { "@id": `${url}#service` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name,
        serviceType: name,
        description,
        url,
        provider: { "@id": `${home}/#organization` },
        areaServed: { "@type": "Country", name: locale === "en" ? "Romania" : "România" },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: config.name, item: `${home}/` },
          { "@type": "ListItem", position: 2, name, item: url },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
