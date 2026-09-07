/**
 * Two locales, two URL trees: English at the root (/hosting/) and Arabic under /ar/ (/ar/hosting/).
 * Adding a locale means adding it to `locales` and a messages file; the [locale] route tree picks
 * it up through generateStaticParams.
 */
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** BCP 47 tag for <html lang> and hreflang. */
export function langTag(locale: Locale): string {
  return locale === "ar" ? "ar-EG" : "en";
}

/** Locales that live under a prefix; the default locale owns the root. */
export function prefixedLocales(): Locale[] {
  return locales.filter((l) => l !== defaultLocale);
}

export function localeParams(): Array<{ locale: Locale }> {
  return prefixedLocales().map((locale) => ({ locale }));
}

export type PageKey = "home" | "hosting" | "websites" | "care" | "domains" | "about" | "contact" | "terms" | "privacy";

export const pageKeys: readonly PageKey[] = ["home", "hosting", "websites", "care", "domains", "about", "contact", "terms", "privacy"];

const SLUGS: Record<PageKey, string> = {
  home: "",
  hosting: "hosting",
  websites: "websites",
  care: "care",
  domains: "domains",
  about: "about",
  contact: "contact",
  terms: "terms",
  privacy: "privacy",
};

/** Site-relative path with a trailing slash (the export writes index.html per folder). */
export function pathFor(page: PageKey, locale: Locale): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const slug = SLUGS[page];
  return `${prefix}/${slug ? `${slug}/` : ""}` || "/";
}

/** The same page in another locale, for the language switch. */
export function switchLocalePath(page: PageKey, from: Locale): { locale: Locale; path: string } {
  const other = locales.find((l) => l !== from) ?? defaultLocale;
  return { locale: other, path: pathFor(page, other) };
}

/** hreflang map for <link rel="alternate">, keyed by BCP 47 tag plus x-default. */
export function alternatesFor(page: PageKey, siteUrl: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of locales) out[langTag(l)] = `${siteUrl}${pathFor(page, l)}`;
  out["x-default"] = `${siteUrl}${pathFor(page, defaultLocale)}`;
  return out;
}
