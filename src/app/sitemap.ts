import type { MetadataRoute } from "next";

import { getAllCards, getAllSpreads } from "@/lib/tarot/catalog";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
    },
    {
      url: absoluteUrl("/spreads"),
      lastModified: now,
    },
    ...getAllSpreads().map((spread) => ({
      url: absoluteUrl(`/spreads/${spread.slug}`),
      lastModified: now,
    })),
    ...getAllCards().map((card) => ({
      url: absoluteUrl(`/cards/${card.slug}`),
      lastModified: now,
    })),
  ];
}
