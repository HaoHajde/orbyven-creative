import type { NextConfig } from "next";

// Crawlers need to reach private/demo pages to observe their noindex signals.
const privateSeoRoutes = [
  "/admin/:path*",
  "/control-center/:path*",
  "/workspace/:path*",
  "/mobile-home",
  "/mobile-contact",
  "/mobile-servicii",
  "/mobile-templates",
];
const demoSeoRoutes = [
  "/templates/:path+",
  "/demo/:path*",
  "/orbyven-demos/:path*",
];

const englishDomainHosts = ["orbyven.com", "www.orbyven.com"] as const;

const englishPublicRoutes = [
  { source: "/", destination: "/en" },
  { source: "/templates", destination: "/en/templates" },
  { source: "/services", destination: "/en/services" },
  { source: "/servicii", destination: "/en/services" },
  { source: "/contact", destination: "/en/contact" },
  { source: "/cerere", destination: "/en/contact" },
  { source: "/checkout", destination: "/en/checkout" },
  { source: "/porneste/plata", destination: "/en/checkout" },
  { source: "/success", destination: "/en/success" },
  { source: "/porneste/succes", destination: "/en/success" },
  { source: "/legal", destination: "/en/legal" },
  { source: "/legal/terms", destination: "/en/legal/terms" },
  { source: "/legal/privacy", destination: "/en/legal/privacy" },
  { source: "/legal/cookies", destination: "/en/legal/cookies" },
  { source: "/legal/consumer", destination: "/en/legal/consumer" },
  { source: "/legal/ai", destination: "/en/legal/ai" },
  { source: "/sitemap.xml", destination: "/en/sitemap.xml" },
  { source: "/robots.txt", destination: "/en/robots.txt" },
] as const;

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: englishDomainHosts.flatMap((host) =>
        englishPublicRoutes.map(({ source, destination }) => ({
          source,
          destination,
          has: [{ type: "host" as const, value: host }],
        }))
      ),
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
      ...privateSeoRoutes.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      })),
      ...demoSeoRoutes.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow, noarchive" }],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
    ];
  },
};

export default nextConfig;
