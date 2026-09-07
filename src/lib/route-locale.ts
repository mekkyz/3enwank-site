import { notFound } from "next/navigation";
import { isLocale, localeParams, type Locale } from "./i18n";

export type LocaleParams = { params: Promise<{ locale: string }> };

/** Only locales from generateStaticParams are built; anything else is a 404 during the build. */
export async function localeFromParams(params: LocaleParams["params"]): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export { localeParams };
