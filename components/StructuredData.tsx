import { getSiteUrl, siteConfig } from "@/lib/site-config";

export default function StructuredData() {
  const siteUrl = getSiteUrl();

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        description: siteConfig.description,
        url: siteUrl,
        logo: `${siteUrl}/branding/orbyven-logo-dark.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        description: siteConfig.description,
        inLanguage: siteConfig.language,
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
      },
      {
        "@type": "ProfessionalService",
        "@id": `${siteUrl}/#service`,
        name: siteConfig.name,
        url: siteUrl,
        description: siteConfig.description,
        areaServed: {
          "@type": "Country",
          name: "Romania",
        },
        provider: {
          "@id": `${siteUrl}/#organization`,
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Servicii ORBYVEN CREATIVE",
          itemListElement: [
            {
              "@type": "OfferCatalog",
              name: "Web design și creare website",
              url: `${siteUrl}/servicii`,
            },
            {
              "@type": "OfferCatalog",
              name: "Invitații de nuntă digitale",
              url: `${siteUrl}/invitatii-nunta`,
            },
            {
              "@type": "OfferCatalog",
              name: "Invitații de botez digitale",
              url: `${siteUrl}/invitatii-botez`,
            },
          ],
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
