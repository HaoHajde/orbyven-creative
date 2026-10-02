export const siteConfig = {
  name: "ORBYVEN CREATIVE",
  shortName: "ORBYVEN",
  description:
    "ORBYVEN builds premium websites, AI-assisted digital experiences and modular business workspaces. Explore templates, services and the ORBYVEN ecosystem.",
  defaultUrl: "https://orbyven.com",
  locale: "en_US",
  language: "en",
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
