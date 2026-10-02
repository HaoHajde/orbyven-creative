import { NextResponse, type NextRequest } from "next/server";

import {
  ENGLISH_PUBLIC_PATHS,
  publicLocaleForHost,
  shouldRedirectEnglishHostToRomanian,
} from "@/lib/domain-locale";

export function proxy(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const locale = publicLocaleForHost(host);
  const pathname = request.nextUrl.pathname;

  if (locale !== "en") {
    return NextResponse.next();
  }

  if (ENGLISH_PUBLIC_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (shouldRedirectEnglishHostToRomanian(pathname)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = "orbyven.ro";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/servicii",
    "/templates",
    "/contact",
    "/ai-web-design",
    "/cerere",
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
    "/solutii/:path*",
    "/studii-de-caz/:path*",
    "/ghid/:path*",
    "/despre",
    "/legal/:path*",
    "/porneste/:path*",
  ],
};
