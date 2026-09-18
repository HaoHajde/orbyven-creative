import type { MetadataRoute } from "next";

import { clientTemplateList } from "@/lib/client-template-catalog";
import { getSiteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  const routes = [
    {
      path: "",
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      path: "/templates",
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      path: "/servicii",
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    {
      path: "/contact",
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];

  const publicRoutes = routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const templateRoutes = clientTemplateList.map((template) => ({
    url: `${siteUrl}/templates/${template.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...publicRoutes, ...templateRoutes];
}
