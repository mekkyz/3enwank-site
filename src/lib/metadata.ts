import type { Metadata } from "next";
import { alternatesFor, LOCALES, langTag, localeInfo, pathFor, type Locale, type PageKey } from "./i18n";
import { SITE_URL } from "./site";
import { messagesFor } from "@/messages";

/** Title, description, canonical, hreflang and OpenGraph for one page in one locale. */
export function pageMetadata(page: PageKey, locale: Locale, title: string, description: string): Metadata {
  const t = messagesFor(locale);
  const path = pathFor(page, locale);
  const fullTitle = page === "home" ? `${t.meta.siteName}: ${title}` : `${title} · ${t.meta.titleSuffix}`;
  const info = localeInfo(locale);
  return {
    title: fullTitle,
    description,
    alternates: { canonical: `${SITE_URL}${path}`, languages: alternatesFor(page, SITE_URL) },
    openGraph: {
      type: "website",
      siteName: t.meta.siteName,
      title: fullTitle,
      description,
      url: `${SITE_URL}${path}`,
      locale: info.og,
      alternateLocale: LOCALES.filter((l) => l.code !== locale).map((l) => l.og),
      images: [{ url: `${SITE_URL}/og.jpg`, width: 1200, height: 630, alt: t.meta.siteName }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
    robots: { index: true, follow: true },
    icons: {
      // Two cuts rather than one halved by the browser, and a square tile for iOS, which rounds its own.
      icon: [
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-icon-180.png",
    },
    other: { "content-language": langTag(locale) },
  };
}
