# ORBYVEN — SEO Upgrade V3 (27 September 2026)

Technical SEO patch; original site layout, template preview interactions and
private workspace behavior remain unchanged.

## Implemented
- HTML metadata and HTTP X-Robots-Tag noindex on admin, control center and workspace.
- HTTP noindex on individual template routes and interactive/static demos;
  /templates catalog remains eligible for Google indexing.
- robots.txt allows crawlers to read those directives; only /api is blocked.
- OC PNG in root icon metadata and manifest, retaining SVG and ICO.
- OG and Twitter preview images in SEO metadata generator.
- SEO contract tests are part of CI and npm validate.

## Not claimed without production data
- Actual Google indexed URL count, traffic, ranking, click-through rate or
  Core Web Vitals. Search Console requires active access.
- A successful Git push is not proof of a READY Vercel deployment.

## After deploy
Confirm live homepage, robots.txt, sitemap.xml and OC icons; inspect HTTP
X-Robots-Tag on /workspace/login and /templates/haos-customs; reconnect GSC,
inspect indexing coverage and measure mobile/desktop LCP, INP and CLS.
