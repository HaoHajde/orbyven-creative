export const siteConfig = {
  name: "ORBYVEN CREATIVE",
  shortName: "ORBYVEN",
  description:
    "Website-uri, landing pages, redesign-uri și experiențe digitale construite pentru branduri și afaceri care vor o prezență greu de ignorat.",
  defaultUrl: "https://orbyven-creative.vercel.app",
  locale: "ro_RO",
  language: "ro",
} as const;

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (!configuredUrl) {
    return siteConfig.defaultUrl;
  }

  const withProtocol = /^https?:\/\//i.test(configuredUrl)
    ? configuredUrl
    : `https://${configuredUrl}`;

  return withProtocol.replace(/\/+$/, "");
}
