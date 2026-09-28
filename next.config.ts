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

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
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
