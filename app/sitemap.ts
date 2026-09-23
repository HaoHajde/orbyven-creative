import type { MetadataRoute } from "next";

import { seoCaseStudies, seoGuides, seoLandingPages } from "@/lib/seo-foundation";
import { getSiteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  const coreRoutes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/servicii", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/templates", changeFrequency: "weekly" as const, priority: 0.85 },
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
