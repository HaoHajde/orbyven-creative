export const siteConfig = {
  name: "ORBYVEN CREATIVE",
  shortName: "ORBYVEN",
  description:
    "ORBYVEN CREATIVE este un studio de web design și software modular pentru afaceri din România: website-uri, landing pages, redesign și instrumente digitale.",
  defaultUrl: "https://orbyven.ro",
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
