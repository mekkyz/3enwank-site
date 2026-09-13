/**
 * Locales and URL trees. English owns the root (/hosting/); every other locale lives under its
 * prefix (/ar/hosting/). Adding a locale means one entry in LOCALES and one messages file; the
 * [locale] route tree builds it through generateStaticParams.
 *
 * There were three: /ar/ was formal Arabic and /ar-eg/ was Egyptian. The Egyptian copy won, so /ar/
 * now carries it and the third locale is gone, with no redirect for its old URLs. Anything that
 * lists the locales has to be taken off ar-eg with it, including the health check in
 * scripts/deploy.sh, which fails a release over a 404.
 */
export type Locale = "en" | "ar";

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

export type PageKey = "home" | "hosting" | "websites" | "care" | "domains" | "about" | "terms" | "privacy" | "delivery" | "refunds";

/** Sections of the home page that other pages link into. */
export type SectionKey = "domains" | "contact";

export const pageKeys: readonly PageKey[] = ["home", "hosting", "websites", "care", "domains", "about", "terms", "privacy", "delivery", "refunds"];

const SLUGS: Record<PageKey, string> = {
  home: "",
  hosting: "hosting",
  websites: "websites",
  care: "care",
  domains: "domains",
  about: "about",
  terms: "terms",
  privacy: "privacy",
  delivery: "delivery",
  refunds: "refunds",
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

/**
 * A link that leaves this site for the customer area, carrying the language the reader is on.
 *
 * The two applications share one origin but not one idea of language: this site puts the locale in
 * the path (/ar/hosting/), the customer area keeps it in a cookie. Without this, an Arabic visitor
 * who pressed Order landed in an English store, which is the moment the shop stopped feeling like
 * the same company. `lang` is read by the customer area's proxy, which sets its cookie from it, so
 * the whole journey stays in one language. The customer area has one Arabic, so the Arabic pages
 * send "ar".
 */
export function storeLink(url: string, locale: Locale): string {
  const lang = localeInfo(locale).catalogue;
  const [path, hash] = url.split("#");
  const joined = `${path}${path!.includes("?") ? "&" : "?"}lang=${lang}`;
  return hash ? `${joined}#${hash}` : joined;
}
