import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import {
  publicLocaleForHost,
  publicOriginForLocale,
} from "@/lib/domain-locale";
import { seoCaseStudies, seoGuides, seoLandingPages } from "@/lib/seo-foundation";

async function requestLocale() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host");

  return publicLocaleForHost(host);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locale = await requestLocale();
  const siteUrl = publicOriginForLocale(locale);

  const englishRoutes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/servicii", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/templates", changeFrequency: "weekly" as const, priority: 0.85 },
    { path: "/ai-web-design", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.75 },
    { path: "/invitatii-nunta", changeFrequency: "monthly" as const, priority: 0.85 },
    { path: "/invitatii-botez", changeFrequency: "monthly" as const, priority: 0.85 },
    { path: "/invitatii-majorat", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/solutii", changeFrequency: "monthly" as const, priority: 0.85 },
    { path: "/studii-de-caz", changeFrequency: "monthly" as const, priority: 0.75 },
    { path: "/ghid", changeFrequency: "monthly" as const, priority: 0.75 },
    { path: "/despre", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/creare-site", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/site-prezentare", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/web-design-bucuresti", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/redesign-site", changeFrequency: "monthly" as const, priority: 0.85 },
    { path: "/site-pentru-firme-mici", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/site-pentru-instalatori", changeFrequency: "monthly" as const, priority: 0.75 },
    { path: "/site-pentru-detailing-auto", changeFrequency: "monthly" as const, priority: 0.75 },
    { path: "/site-pentru-servicii-evenimente", changeFrequency: "monthly" as const, priority: 0.75 },
  ];

  if (locale === "en") {
    return englishRoutes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));
  }

  const coreRoutes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/servicii", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/templates", changeFrequency: "weekly" as const, priority: 0.85 },
    { path: "/ai-web-design", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/invitatii-nunta", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/invitatii-botez", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/invitatii-majorat", changeFrequency: "monthly" as const, priority: 0.85 },
    { path: "/solutii", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/studii-de-caz", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/ghid", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/despre", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.75 },
  ];

  const landingRoutes = seoLandingPages.map((page) => ({
    path: page.path,
    changeFrequency: "monthly" as const,
    priority: page.slug === "creare-site" || page.slug === "site-prezentare" ? 0.95 : 0.85,
  }));

  const caseStudyRoutes = seoCaseStudies.map((page) => ({
    path: page.path,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const guideRoutes = seoGuides.map((page) => ({
    path: page.path,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...coreRoutes, ...landingRoutes, ...caseStudyRoutes, ...guideRoutes].map((route) => ({
    url: `${siteUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
