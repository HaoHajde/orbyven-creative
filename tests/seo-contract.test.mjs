import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("robots permits reading noindex and excludes API", () => {
  const robots = read("app/robots.ts");
  assert.ok(robots.includes('disallow: ["/api/"]'));
  assert.ok(!robots.includes('"/admin/",'));
  assert.ok(robots.includes("sitemap: "));
});

test("auth and workspace have HTTP and HTML noindex", () => {
  const config = read("next.config.ts");
  for (const route of ["/admin/:path*", "/workspace/:path*", "/control-center/:path*"]) {
    assert.ok(config.includes(route), route);
  }
  assert.ok(config.includes("X-Robots-Tag"));
  assert.ok(config.includes("noindex, nofollow, noarchive"));
  for (const path of ["app/admin/layout.tsx", "app/workspace/layout.tsx", "app/control-center/layout.tsx"]) {
    assert.ok(read(path).includes("robots: { index: false, follow: false"), path);
  }
});

test("demo noindex leaves templates catalog eligible", () => {
  const config = read("next.config.ts");
  for (const route of ["/templates/:path+", "/demo/:path*", "/orbyven-demos/:path*"]) {
    assert.ok(config.includes(route), route);
  }
  assert.ok(config.includes("noindex, follow, noarchive"));
  assert.ok(read("app/templates/layout.tsx").includes('canonical: "/templates"'));
  assert.ok(read("app/templates/[slug]/page.tsx").includes("index: false"));
});

test("ORBYVEN icon declarations keep PNG SVG and ICO", () => {
  const layout = read("app/layout.tsx");
  const manifest = read("app/manifest.ts");
  for (const source of [layout, manifest]) {
    assert.ok(source.includes("/branding/orbyven-favicon-96.png"));
    assert.ok(source.includes("/icon.svg"));
  }
  assert.ok(layout.includes("/favicon.ico"));
});

test("SEO landing canonicals and social previews remain distinct", () => {
  const seo = read("lib/seo-foundation.ts");
  const sitemap = read("app/sitemap.ts");
  assert.ok(seo.includes("canonical: path"));
  assert.ok(seo.includes("absolute: title"));
  assert.ok(seo.includes('images: [{ url: "/opengraph-image"'));
  assert.ok(read("lib/site-config.ts").includes("https://orbyven.ro"));
  for (const route of ["/invitatii-nunta", "/invitatii-botez", "/invitatii-majorat"]) {
    assert.ok(sitemap.includes(route), route);
    assert.ok(read("app" + route + "/page.tsx").includes('canonical: "' + route + '"'));
  }
  for (const route of ["/workspace", "/admin", "/control-center", "/demo/nunta"]) {
    assert.ok(!sitemap.includes('path: "' + route + '"'), route);
  }
});

test("SEO V3.1 connects commercial pages through indexable topic clusters", () => {
  const clusters = read("lib/seo-clusters.ts");
  const related = read("components/seo/SeoRelatedLinks.tsx");
  const landing = read("components/seo/SeoLandingPage.tsx");
  const caseStudy = read("components/seo/SeoCaseStudyPage.tsx");
  const guide = read("components/seo/SeoGuidePage.tsx");

  assert.ok(clusters.includes('"/site-pentru-instalatori"'));
  assert.ok(clusters.includes('"/studii-de-caz/neagu-costica-srl"'));
  assert.ok(clusters.includes('"/site-pentru-detailing-auto"'));
  assert.ok(clusters.includes('"/studii-de-caz/haos-customs"'));
  assert.ok(clusters.includes("isIndexableClusterTarget"));
  assert.ok(clusters.includes('href.startsWith("/templates/")'));
  assert.ok(related.includes('href="/cerere"'));
  for (const source of [landing, caseStudy, guide]) {
    assert.ok(source.includes("SeoRelatedLinks"));
  }
});

test("service and invitation hubs expose descriptive internal links", () => {
  const services = read("app/servicii/page.tsx");
  const invitations = read("components/InvitationServiceLanding.tsx");
  for (const route of ["/creare-site", "/site-prezentare", "/redesign-site", "/studii-de-caz"]) {
    assert.ok(services.includes(route), route);
  }
  for (const route of ["/invitatii-nunta", "/invitatii-botez", "/invitatii-majorat"]) {
    assert.ok(invitations.includes(route), route);
  }
  assert.ok(invitations.includes("relatedInvitationCategories"));
});

