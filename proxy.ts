import { NextResponse } from "next/server";

export function proxy() {
  // Public pages are now canonical and responsive across desktop and mobile.
  // Legacy /mobile-* routes remain available temporarily, but phones are no
  // longer rewritten to a separate implementation that can drift over time.
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/contact", "/servicii", "/templates"],
};
