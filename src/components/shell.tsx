import type { ReactNode } from "react";
import { ASSISTANT_PREVIEW, STORE_URL, currentYear } from "@/lib/site";
import { anchorFor, languageLinks, pathFor, storeLink, type Locale, type PageKey } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { Assistant } from "./assistant";
import { CartLink } from "./cart-link";
import { CurrencySwitch } from "./currency";
import { LanguageIcon } from "./icons";
import { Logo, LogoFull } from "./logo";
import { ThemeSwitch } from "./theme";
import { Trust, type TrustInfo } from "./trust";

/**
 * Header, navigation and footer shared by every page. Server-rendered, no JavaScript: the language
 * menu is a <details> element and every store link is a plain anchor.
 */
export function Shell({ locale, page, storeUrl, legalName, address, supportEmail, trust, assistantEnabled = false, turnstileSiteKey = null, children }: { locale: Locale; page: PageKey; storeUrl?: string; legalName?: string; address?: string; supportEmail?: string; trust?: TrustInfo; assistantEnabled?: boolean; turnstileSiteKey?: string | null; children: ReactNode }) {
  const t = messagesFor(locale);
  const languages = languageLinks(page, locale);
  const current = languages.find((l) => l.current)!;
  const store = (storeUrl ?? STORE_URL).replace(/\/+$/, "");
  // The bar sells; About and Contact live in the footer (Contact is a section of the home page).
  const items: Array<[string, string, boolean]> = [
    [pathFor("hosting", locale), t.nav.hosting, page === "hosting"],
    [pathFor("websites", locale), t.nav.websites, page === "websites"],
    [pathFor("care", locale), t.nav.care, page === "care"],
    [pathFor("domains", locale), t.nav.domains, page === "domains"],
  ];
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow">
        {t.nav.skip}
      </a>
      <header data-bar className="sticky top-0 z-40 border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <a href={pathFor("home", locale)} className="flex shrink-0 items-center" aria-label={t.meta.siteName}>
            <Logo className="h-7 sm:h-8" />
          </a>
          <nav aria-label={t.nav.menu} className="hidden items-center gap-6 text-[15px] font-semibold text-muted lg:flex">
            {items.map(([href, label, active]) => (
              <a key={href} href={href} aria-current={active ? "page" : undefined} className={`hover:text-ink ${active ? "text-ink" : ""}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <CurrencySwitch label={t.common.currency} />
            <CartLink href={storeLink(`${store}/cart`, locale)} label={t.nav.cart} />
            <details data-menu className="relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg px-2 text-sm font-semibold text-muted hover:text-ink [&::-webkit-details-marker]:hidden" aria-label={`${t.nav.language}: ${current.name}`} title={t.nav.language}>
                <LanguageIcon />
              </summary>
              <ul className="absolute end-0 z-50 mt-1 w-max rounded-lg border border-line bg-panel p-1 text-sm shadow-lg">
                {languages.map((l) => (
                  <li key={l.code}>
                    {/* The chosen one is the coloured one: a tick as well was a second thing saying
                        the same thing, and it set the width of the whole menu. */}
                    <a href={l.path} hrefLang={l.lang} lang={l.lang} dir={l.dir} aria-current={l.current ? "true" : undefined} className={`block whitespace-nowrap rounded-md px-3 py-1.5 font-bold ${l.current ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-brand-soft hover:text-ink"}`}>
                      {l.name}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
            <a href={storeLink(`${store}/login`, locale)} className="hidden min-h-11 items-center px-2 text-sm font-bold text-brand-strong hover:text-brand sm:inline-flex">
              {t.nav.login}
            </a>
            <a href={anchorFor("contact", locale)} className="btn-primary inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-[13px] font-bold sm:px-4 sm:text-sm">
              {t.nav.contact}
            </a>
          </div>
        </div>
        <nav aria-label={t.nav.menu} className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-5 pb-2.5 text-sm font-semibold sm:px-8 lg:hidden">
          {items.map(([href, label, active]) => (
            <a key={href} href={href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap ${active ? "text-ink" : "text-muted"}`}>
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="mt-16 border-t border-line bg-surface-alt">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))]">
          <div className="text-sm text-muted">
            <LogoFull className="h-20" />
            {legalName ? (
              <p className="mt-4">
                {t.footer.operatedBy} {legalName}
              </p>
            ) : null}
            {address ? <p className="mt-1">{address}</p> : null}
            {supportEmail ? (
              <p className="mt-1">
                <a href={`mailto:${supportEmail}`} className="hover:text-ink" dir="ltr">
                  {supportEmail}
                </a>
              </p>
            ) : null}
            {trust ? <Trust t={t} trust={trust} /> : null}
          </div>
          <FooterColumn title={t.footer.products} links={[["hosting", t.nav.hosting], ["websites", t.nav.websites], ["care", t.nav.care], ["domains", t.nav.domains]].map(([key, label]) => [pathFor(key as PageKey, locale), label as string])} />
          <FooterColumn
            title={t.footer.account}
            links={[
              [storeLink(`${store}/login`, locale), t.footer.login],
              [storeLink(`${store}/invoices`, locale), t.footer.invoices],
              [storeLink(`${store}/tickets`, locale), t.footer.tickets],
            ]}
          />
          <FooterColumn
            title={t.footer.company}
            links={[
              [pathFor("about", locale), t.nav.about],
              [anchorFor("contact", locale), t.nav.contact],
              [pathFor("terms", locale), t.terms.title],
              [pathFor("privacy", locale), t.privacy.title],
            ]}
          />
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 text-xs text-faint sm:px-8">
            <p>
              © <span className="tabular">{currentYear()}</span> {t.meta.siteName}. {t.footer.copyright}
            </p>
            <ThemeSwitch label={t.footer.theme} dark={t.footer.themeDark} light={t.footer.themeLight} />
          </div>
        </div>
      </footer>
      {assistantEnabled || ASSISTANT_PREVIEW ? <Assistant url={`${store}/api/public/assistant`} locale={locale} labels={t.assistant} supportEmail={supportEmail} turnstileSiteKey={turnstileSiteKey} /> : null}
    </>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <nav aria-label={title} className="text-sm">
      <p className="mb-3 font-extrabold text-ink">{title}</p>
      <ul className="space-y-2.5">
        {links.map(([href, label]) => (
          <li key={href + label}>
            <a href={href} className="text-muted hover:text-ink">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
