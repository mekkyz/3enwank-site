/**
 * Locales and URL trees. English owns the root (/hosting/); every other locale lives under its
 * prefix (/ar/hosting/, /ar-eg/hosting/). Adding a locale means one entry in LOCALES and one
 * messages file; the [locale] route tree builds it through generateStaticParams.
 */
export type Locale = "en" | "ar" | "ar-eg";

export type LocaleInfo = {
  code: Locale;
  /** BCP 47 tag for <html lang> and hreflang. */
  lang: string;
  dir: "ltr" | "rtl";
  /** Native name for the language menu; the same in every locale. */
  name: string;
  /** OpenGraph locale. */
  og: string;
  /** Which of the catalogue's two copies (en, ar) this locale reads product names and features from. */
  catalogue: "en" | "ar";
};

export const LOCALES: readonly LocaleInfo[] = [
  { code: "en", lang: "en", dir: "ltr", name: "English", og: "en_US", catalogue: "en" },
  { code: "ar", lang: "ar", dir: "rtl", name: "العربية", og: "ar_AR", catalogue: "ar" },
  { code: "ar-eg", lang: "ar-EG", dir: "rtl", name: "مصري", og: "ar_EG", catalogue: "ar" },
];

export const locales: readonly Locale[] = LOCALES.map((l) => l.code);
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function localeInfo(locale: Locale): LocaleInfo {
  return LOCALES.find((l) => l.code === locale)!;
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return localeInfo(locale).dir;
}

export function langTag(locale: Locale): string {
  return localeInfo(locale).lang;
}

/** The catalogue key this locale reads. */
export function catalogueLocale(locale: Locale): "en" | "ar" {
  return localeInfo(locale).catalogue;
}

/** Locales that live under a prefix; the default locale owns the root. */
export function prefixedLocales(): Locale[] {
  return locales.filter((l) => l !== defaultLocale);
}

export function localeParams(): Array<{ locale: Locale }> {
  return prefixedLocales().map((locale) => ({ locale }));
}

export type PageKey = "home" | "hosting" | "websites" | "care" | "domains" | "about" | "terms" | "privacy";

/** Sections of the home page that other pages link into. */
export type SectionKey = "domains" | "contact";

export const pageKeys: readonly PageKey[] = ["home", "hosting", "websites", "care", "domains", "about", "terms", "privacy"];

const SLUGS: Record<PageKey, string> = {
  home: "",
  hosting: "hosting",
  websites: "websites",
  care: "care",
  domains: "domains",
  about: "about",
  terms: "terms",
  privacy: "privacy",
};

/** Site-relative path with a trailing slash (the export writes index.html per folder). */
export function pathFor(page: PageKey, locale: Locale): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const slug = SLUGS[page];
  return `${prefix}/${slug ? `${slug}/` : ""}` || "/";
}

/** Anchor into a section of the home page, e.g. "/ar/#contact". */
export function anchorFor(section: SectionKey, locale: Locale): string {
  return `${pathFor("home", locale)}#${section}`;
}

/** The same page in every locale, for the language menu (current one included, marked). */
export function languageLinks(page: PageKey, current: Locale): Array<LocaleInfo & { path: string; current: boolean }> {
  return LOCALES.map((l) => ({ ...l, path: pathFor(page, l.code), current: l.code === current }));
}

/** hreflang map for <link rel="alternate">, keyed by BCP 47 tag plus x-default. */
export function alternatesFor(page: PageKey, siteUrl: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[l.lang] = `${siteUrl}${pathFor(page, l.code)}`;
  out["x-default"] = `${siteUrl}${pathFor(page, defaultLocale)}`;
  return out;
}
