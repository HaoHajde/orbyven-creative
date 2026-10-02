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
  "/despre",
  "/solutii",
  "/studii-de-caz",
  "/ghid",
  "/creare-site",
  "/site-prezentare",
  "/web-design-bucuresti",
  "/redesign-site",
  "/site-pentru-firme-mici",
  "/site-pentru-instalatori",
  "/site-pentru-detailing-auto",
  "/site-pentru-servicii-evenimente",
  "/invitatii-nunta",
  "/invitatii-botez",
  "/invitatii-majorat",
  "/legal",
  "/legal/privacy",
  "/legal/terms",
  "/porneste/oferta",
  "/porneste/plata",
]);

const ROMANIAN_ONLY_PUBLIC_PATHS = new Set([
  "/cerere",
]);

const ROMANIAN_ONLY_PUBLIC_PREFIXES = [
  "/porneste/",
  "/solutii/",
  "/studii-de-caz/",
  "/ghid/",
  "/legal/",
] as const;

export function shouldRedirectEnglishHostToRomanian(pathname: string) {
  return (
    ROMANIAN_ONLY_PUBLIC_PATHS.has(pathname) ||
    ROMANIAN_ONLY_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
