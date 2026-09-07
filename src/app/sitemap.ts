import type { MetadataRoute } from "next";
import { alternatesFor, locales, pageKeys, pathFor, type PageKey } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const PRIORITY: Partial<Record<PageKey, number>> = { home: 1, hosting: 0.9, websites: 0.9, care: 0.8, domains: 0.8, about: 0.5, contact: 0.6, terms: 0.2, privacy: 0.2 };

/** Every page in every locale, each entry listing its translations. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return pageKeys.flatMap((page) =>
    locales.map((locale) => ({
      url: `${SITE_URL}${pathFor(page, locale)}`,
      lastModified,
      changeFrequency: page === "terms" || page === "privacy" ? ("yearly" as const) : ("monthly" as const),
      priority: PRIORITY[page] ?? 0.5,
      alternates: { languages: alternatesFor(page, SITE_URL) },
    })),
  );
}
