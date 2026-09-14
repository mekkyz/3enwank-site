import type { Metadata } from "next";
import { alternatesFor, LOCALES, langTag, localeInfo, pathFor, type Locale, type PageKey } from "./i18n";
import { SITE_URL } from "./site";
import { messagesFor } from "@/messages";

/** Where a search result cuts a description. */
export const DESCRIPTION_MAX = 160;

/**
 * A description no longer than `max`, cut between words with an ellipsis.
 *
 * The screens build most descriptions from a heading plus a lede, and the legal ones from an
 * intro, and they were sliced at 160 characters wherever that fell: the Terms description ended
 * "…by placing an ord". A cut now lands on the last space that leaves room for the ellipsis, and
 * the punctuation before it goes too, so it never reads ",…". A single word longer than the whole
 * budget is the one case cut mid-word, since there is no space to cut at.
 */
export function clipDescription(text: string, max = DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const room = clean.slice(0, max - 1);
  const space = room.lastIndexOf(" ");
  const cut = space > 0 ? room.slice(0, space) : room;
  return `${cut.replace(/[\s,.;:،؛]+$/u, "")}…`;
}

/** Title, description, canonical, hreflang and OpenGraph for one page in one locale. */
export function pageMetadata(page: PageKey, locale: Locale, title: string, rawDescription: string): Metadata {
  const t = messagesFor(locale);
  const path = pathFor(page, locale);
  const description = clipDescription(rawDescription);
  /*
   * The suffix is left off a title that already names the brand: "About 3enwank" came out as
   * "About 3enwank · 3enwank". The home title is its own short string (home.metaTitle), prefixed
   * with the brand, and stays under sixty characters, where a search result cuts.
   */
  const named = title.includes(t.meta.siteName);
  const fullTitle =
    page === "home" ? `${t.meta.siteName}: ${title}` : named ? title : `${title} · ${t.meta.titleSuffix}`;
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
