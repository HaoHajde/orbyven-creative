import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isPhoneUserAgent(userAgent: string) {
  return /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(
    userAgent
  );
}

export function proxy(request: NextRequest) {
  const userAgent =
    request.headers.get("user-agent") ?? "";

  if (!isPhoneUserAgent(userAgent)) {
    return NextResponse.next();
  }

  const rewrites: Record<string, string> = {
    "/": "/mobile-home",
    "/contact": "/mobile-contact",
    "/servicii": "/mobile-servicii",
    "/templates": "/mobile-templates",
  };

  const destination = rewrites[request.nextUrl.pathname];

  if (!destination) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = destination;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/", "/contact", "/servicii", "/templates"],
};
