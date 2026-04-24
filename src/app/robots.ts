import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/spreads", "/cards"],
        disallow: ["/api/", "/r/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
