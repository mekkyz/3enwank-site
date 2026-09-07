import type { ReactNode } from "react";
import { BUILD_YEAR, STORE_URL } from "@/lib/site";
import { dirFor, pathFor, switchLocalePath, type Locale, type PageKey } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { Logo } from "./logo";

/**
 * Header, navigation and footer shared by every page. Server-rendered, no JavaScript: the language
 * switch is a link to the same page in the other locale and the store links are plain anchors.
 */
export function Shell({ locale, page, storeUrl, legalName, children }: { locale: Locale; page: PageKey; storeUrl?: string; legalName?: string; children: ReactNode }) {
  const t = messagesFor(locale);
  const other = switchLocalePath(page, locale);
  const store = (storeUrl ?? STORE_URL).replace(/\/+$/, "");
  const items: Array<[PageKey, string]> = [
    ["hosting", t.nav.hosting],
    ["websites", t.nav.websites],
    ["care", t.nav.care],
    ["domains", t.nav.domains],
    ["about", t.nav.about],
    ["contact", t.nav.contact],
  ];
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow">
        {t.nav.skip}
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href={pathFor("home", locale)} className="flex items-center gap-2" aria-label={t.meta.siteName}>
            <Logo className="h-7 w-auto" />
            <span className="hidden text-sm text-muted sm:inline" lang="ar" dir="rtl">
              {t.meta.slogan}
            </span>
          </a>
          <nav aria-label={t.nav.menu} className="hidden items-center gap-5 text-sm font-medium text-ink md:flex">
            {items.map(([key, label]) => (
              <a key={key} href={pathFor(key, locale)} aria-current={key === page ? "page" : undefined} className={`hover:text-brand ${key === page ? "text-brand" : ""}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <a href={other.path} hrefLang={other.locale} lang={other.locale} dir={dirFor(other.locale)} aria-label={t.nav.languageLabel} className="rounded-md px-2 py-1 font-medium text-muted hover:bg-brand-soft hover:text-brand-strong">
              {t.nav.language}
            </a>
            <a href={`${store}/login`} className="inline-flex items-center rounded-md bg-brand px-3 py-1.5 font-semibold text-white hover:bg-brand-strong">
              {t.nav.login}
            </a>
          </div>
        </div>
        <nav aria-label={t.nav.menu} className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-2 text-sm font-medium md:hidden">
          {items.map(([key, label]) => (
            <a key={key} href={pathFor(key, locale)} aria-current={key === page ? "page" : undefined} className={`whitespace-nowrap ${key === page ? "text-brand" : "text-ink"}`}>
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="mt-16 border-t border-line bg-ink text-white/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <Logo className="h-6 w-auto text-white" light />
            <p className="mt-2 text-sm">{t.footer.line}</p>
            {legalName ? (
              <p className="mt-2 text-xs text-white/60">
                {t.footer.company} {legalName}
              </p>
            ) : null}
          </div>
          <nav aria-label={t.footer.store} className="text-sm">
            <ul className="space-y-2">
              {items.map(([key, label]) => (
                <li key={key}>
                  <a href={pathFor(key, locale)} className="hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t.footer.terms} className="text-sm">
            <ul className="space-y-2">
              <li>
                <a href={`${store}/login`} className="hover:text-white">
                  {t.footer.store}
                </a>
              </li>
              <li>
                <a href={pathFor("terms", locale)} className="hover:text-white">
                  {t.footer.terms}
                </a>
              </li>
              <li>
                <a href={pathFor("privacy", locale)} className="hover:text-white">
                  {t.footer.privacy}
                </a>
              </li>
              <li>
                <a href={pathFor("contact", locale)} className="hover:text-white">
                  {t.footer.contact}
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/60">
            © <span className="tabular">{BUILD_YEAR}</span> {t.meta.siteName}. {t.footer.copyright}
          </p>
        </div>
      </footer>
    </>
  );
}
