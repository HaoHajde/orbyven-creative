import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import {
  publicLocaleForHost,
  publicOriginForLocale,
} from "@/lib/domain-locale";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host");
  const locale = publicLocaleForHost(host);
  const siteUrl = publicOriginForLocale(locale);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Do not block noindex pages: bots must be able to read their headers.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
