export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /checkout",
    "Disallow: /workspace",
    "Disallow: /admin",
    "Disallow: /control-center",
    "",
    "Sitemap: https://orbyven.com/sitemap.xml",
    "Host: https://orbyven.com",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
