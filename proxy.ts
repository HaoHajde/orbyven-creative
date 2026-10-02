import { NextResponse, type NextRequest } from "next/server";

import { ENGLISH_PUBLIC_PATHS, publicLocaleForHost } from "@/lib/domain-locale";

export function proxy(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const locale = publicLocaleForHost(host);
  const pathname = request.nextUrl.pathname;

  if (locale !== "en" || !ENGLISH_PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/", "/servicii", "/templates", "/contact", "/ai-web-design"],
};
