import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/*
 * No `host` line. Next writes it as given, and SITE_URL is a URL where Host expects a bare hostname;
 * the directive was Yandex's alone and Yandex retired it, reading the canonical tags instead, which
 * every page already carries. Dropping it is correct for every crawler that ever read it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
