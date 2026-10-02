const urls = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/services", priority: "0.9", changefreq: "monthly" },
  { path: "/templates", priority: "0.85", changefreq: "weekly" },
  { path: "/contact", priority: "0.75", changefreq: "monthly" },
  { path: "/legal/terms", priority: "0.2", changefreq: "yearly" },
  { path: "/legal/privacy", priority: "0.2", changefreq: "yearly" },
  { path: "/legal/cookies", priority: "0.2", changefreq: "yearly" },
  { path: "/legal/consumer", priority: "0.2", changefreq: "yearly" },
  { path: "/legal/ai", priority: "0.2", changefreq: "yearly" },
] as const;

export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ path, priority, changefreq }) => `  <url>
    <loc>https://orbyven.com${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
