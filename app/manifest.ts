import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    id: "/workspace",
    start_url: "/workspace",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#08111f",
    theme_color: "#08111f",
    lang: siteConfig.language,
    icons: [
      {
        src: "/branding/orbyven-app-icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/branding/orbyven-favicon-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg?v=oc-orbit-2",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Workspace",
        short_name: "Workspace",
        url: "/workspace",
      },
    ],
  };
}
