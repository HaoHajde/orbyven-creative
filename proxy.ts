import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const userAgent =
    request.headers.get("user-agent") ?? "";

  const isPhone =
    /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(
      userAgent
    );

  if (isPhone) {
    const url = request.nextUrl.clone();
    url.pathname = "/mobile-home";

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
