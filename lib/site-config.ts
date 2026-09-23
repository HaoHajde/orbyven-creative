export const siteConfig = {
  name: "ORBYVEN CREATIVE",
  shortName: "ORBYVEN",
  description:
    "ORBYVEN CREATIVE: web design modern, website-uri pentru afaceri și invitații digitale de nuntă și botez personalizabile. Descoperă modelele și serviciile noastre.",
  defaultUrl: "https://orbyven.ro",
  locale: "ro_RO",
  language: "ro",
} as const;

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return siteConfig.defaultUrl;
  }

  const withProtocol = /^https?:\/\//i.test(configuredUrl)
    ? configuredUrl
    : `https://${configuredUrl}`;

  return withProtocol.replace(/\/+$/, "");
}
