export type PublicLocale = "ro" | "en";

export function normalizeHost(host: string | null | undefined) {
  return (host ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

export function publicLocaleForHost(host: string | null | undefined): PublicLocale {
  const normalized = normalizeHost(host);
  return normalized === "orbyven.com" || normalized === "www.orbyven.com" ? "en" : "ro";
}

export function publicOriginForLocale(locale: PublicLocale) {
  return locale === "en" ? "https://www.orbyven.com" : "https://orbyven.ro";
}

export const ENGLISH_PUBLIC_PATHS = new Set([
  "/",
  "/servicii",
  "/templates",
  "/contact",
  "/ai-web-design",
]);
