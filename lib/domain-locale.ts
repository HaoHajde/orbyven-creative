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


const ROMANIAN_ONLY_PUBLIC_PATHS = new Set([
  "/cerere",
  "/creare-site",
  "/site-prezentare",
  "/redesign-site",
  "/invitatii-nunta",
  "/invitatii-botez",
  "/invitatii-majorat",
  "/solutii",
  "/studii-de-caz",
  "/ghid",
  "/despre",
]);

const ROMANIAN_ONLY_PUBLIC_PREFIXES = [
  "/porneste/",
  "/solutii/",
  "/studii-de-caz/",
  "/ghid/",
] as const;

export function shouldRedirectEnglishHostToRomanian(pathname: string) {
  return (
    ROMANIAN_ONLY_PUBLIC_PATHS.has(pathname) ||
    ROMANIAN_ONLY_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
