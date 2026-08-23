import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/quickstart", "/daily", "/walkthrough", "/api", "/schemas", "/protocols", "/build"].map(
    (path) => ({
      url: `${siteUrl}${path}`,
    }),
  );
}
