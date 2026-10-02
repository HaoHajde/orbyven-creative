import { siteConfig, siteConfigEn } from "@/lib/site-config";
import type { PublicLocale } from "@/lib/domain-locale";

export default function StructuredData({
  locale = "ro",
  siteUrl,
}: {
  locale?: PublicLocale;
  siteUrl?: string;
}) {
  const config = locale === "en" ? siteConfigEn : siteConfig;
  const resolvedSiteUrl = siteUrl ?? config.defaultUrl;

  const offerCatalog =
    locale === "en"
      ? {
          name: "ORBYVEN CREATIVE Services",
          items: [
            ["Web design and website development", "/servicii"],
            ["Digital wedding invitations", "/invitatii-nunta"],
            ["Digital christening invitations", "/invitatii-botez"],
            ["Digital event invitations", "/invitatii-majorat"],
          ],
        }
      : {
          name: "Servicii ORBYVEN CREATIVE",
          items: [
            ["Web design și creare website", "/servicii"],
            ["Invitații de nuntă digitale", "/invitatii-nunta"],
            ["Invitații de botez digitale", "/invitatii-botez"],
            ["Invitații de majorat digitale", "/invitatii-majorat"],
          ],
        };

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${resolvedSiteUrl}/#organization`,
        name: config.name,
        alternateName: config.shortName,
        description: config.description,
        url: resolvedSiteUrl,
        logo: `${resolvedSiteUrl}/branding/orbyven-logo-dark.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${resolvedSiteUrl}/#website`,
        url: resolvedSiteUrl,
        name: config.name,
        alternateName: config.shortName,
        description: config.description,
        inLanguage: config.language,
        publisher: {
          "@id": `${resolvedSiteUrl}/#organization`,
        },
      },
      {
        "@type": "ProfessionalService",
        "@id": `${resolvedSiteUrl}/#service`,
        name: config.name,
        url: resolvedSiteUrl,
        description: config.description,
        areaServed: {
          "@type": "Country",
          name: "Romania",
        },
        provider: {
          "@id": `${resolvedSiteUrl}/#organization`,
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: offerCatalog.name,
          itemListElement: offerCatalog.items.map(([name, path]) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name,
              url: `${resolvedSiteUrl}${path}`,
            },
          })),
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
