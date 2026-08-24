ORBYVEN — SEO + LAUNCH FOUNDATION

Copy the package contents over the matching project paths.

FILES
- app/layout.tsx
- app/robots.ts
- app/sitemap.ts
- app/manifest.ts
- app/opengraph-image.tsx
- app/contact/layout.tsx
- app/servicii/layout.tsx
- app/templates/layout.tsx
- components/StructuredData.tsx
- lib/site-config.ts

WHAT THIS ADDS
- metadataBase and centralized site URL
- robots.txt
- sitemap.xml
- web manifest
- Open Graph / social sharing image
- Organization + WebSite + ProfessionalService structured data
- canonical URLs for Contact / Servicii / Templates
- consistent social metadata
- internal mobile routes excluded from robots crawl
- no visual or mobile-performance changes

TEMPORARY URL
The fallback is:
https://orbyven-creative.vercel.app

Recommended Vercel environment variable:
NEXT_PUBLIC_SITE_URL=https://orbyven-creative.vercel.app

WHEN THE CUSTOM DOMAIN IS READY
Change ONLY:
NEXT_PUBLIC_SITE_URL=https://your-final-domain.ro

Then redeploy. Sitemap, metadata, structured data and social URLs will follow automatically.

IMPORTANT
Do NOT add /mobile-home, /mobile-contact, /mobile-servicii or /mobile-templates to the sitemap.
They are internal mobile-rendering routes, not public SEO pages.

GIT
git add .
git commit -m "Add SEO and launch foundation"
git push

AFTER DEPLOY
Check these URLs:
 /robots.txt
 /sitemap.xml
 /manifest.webmanifest
 /opengraph-image

Do not submit the site to Google Search Console until you are happy with the public content and, ideally, the final custom domain is connected.
