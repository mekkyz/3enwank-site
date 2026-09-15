import type { ReactNode } from "react";
import { ASSISTANT_PREVIEW, STATUS_URL, STORE_URL, currentYear } from "@/lib/site";
import { contactHref, languageLinks, pathFor, storeLink, type Locale, type PageKey } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { Assistant } from "./assistant";
import { CartLink } from "./cart-link";
import { CurrencySwitch } from "./currency";
import { LanguageIcon } from "./icons";
import { Logo, LogoFull } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { ThemeSwitch } from "./theme";
import { Trust, type TrustInfo } from "./trust";

/**
 * Header, navigation and footer shared by every page. Server-rendered; the desktop language menu is
 * a <details> element and every store link is a plain anchor. The phone Menu sheet is the one client
 * island in the bar besides the currency switch and the cart count (components/mobile-menu.tsx).
 */
export function Shell({
  locale,
  page,
  storeUrl,
  legalName,
  trust,
  whatsapp = null,
  assistantEnabled = false,
  turnstileSiteKey = null,
  children,
}: {
  locale: Locale;
  page: PageKey;
  storeUrl?: string;
  legalName?: string;
  trust?: TrustInfo;
  /** For the assistant's "Continue on WhatsApp" (S8); screens pass whatsappNumber(catalogue). */
  whatsapp?: string | null;
  assistantEnabled?: boolean;
  turnstileSiteKey?: string | null;
  children: ReactNode;
}) {
  const t = messagesFor(locale);
  const assistant = assistantEnabled || ASSISTANT_PREVIEW;
  const languages = languageLinks(page, locale);
  const current = languages.find((l) => l.current)!;
  const store = (storeUrl ?? STORE_URL).replace(/\/+$/, "");
  const loginHref = storeLink(`${store}/login`, locale);
  // Contact is a page of its own since 2026-09-15 (S7), not the foot of the home page.
  const contact = contactHref(locale);
  const items: Array<[string, string, boolean]> = [
    [pathFor("hosting", locale), t.nav.hosting, page === "hosting"],
    [pathFor("websites", locale), t.nav.websites, page === "websites"],
    [pathFor("care", locale), t.nav.care, page === "care"],
    [pathFor("domains", locale), t.nav.domains, page === "domains"],
  ];
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow"
      >
        {t.nav.skip}
      </a>
      {/*
       * A solid bar with a hairline at every scroll position: no transparency at the top and no blur
       * (owner, 2026-09-15, "no glass"). One row at every width, 69px, which --header-h in globals.css
       * follows for anchored sections.
       *
       * Below lg the row is the logo, the cart and one Menu button (S15). It used to be the logo beside
       * five controls (currency, cart, language, an account icon and a Contact pill) with a second row
       * of product links under it that scrolled sideways, and the wordmark had to shrink to fit at
       * 360px. With two controls it keeps its h-7 down to 360px, and still shrinks (`min-w-0`) rather
       * than overflow on anything narrower.
       */}
      <header className="sticky top-0 z-40 border-b border-line bg-panel">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          {/* min-h-11: the row is already 44px tall from the controls, so the home link can be a full-height target at no cost. */}
          <a href={pathFor("home", locale)} className="flex min-h-11 min-w-0 items-center lg:shrink-0" aria-label={t.meta.siteName}>
            <Logo className="h-auto max-h-7 max-w-full sm:max-h-8" />
          </a>
          <nav aria-label={t.nav.menu} className="hidden items-center gap-6 text-[15px] font-semibold text-muted lg:flex">
            {items.map(([href, label, active]) => (
              <a key={href} href={href} aria-current={active ? "page" : undefined} className={`hover:text-ink ${active ? "text-ink" : ""}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 lg:gap-2">
            {/* `hidden lg:contents`: from lg the wrapper is not a box, so its controls are the row's own items. */}
            <div className="hidden lg:contents">
              <CurrencySwitch label={t.common.currency} />
            </div>
            <CartLink href={storeLink(`${store}/cart`, locale)} label={t.nav.cart} />
            <div className="hidden lg:contents">
              <details data-menu className="relative">
                <summary
                  className="flex min-h-11 cursor-pointer list-none items-center rounded-full px-2 text-sm font-semibold text-muted hover:text-ink [&::-webkit-details-marker]:hidden"
                  aria-label={`${t.nav.language}: ${current.name}`}
                  title={t.nav.language}
                >
                  <LanguageIcon />
                </summary>
                {/* A container (rounded-lg) of rows (rounded-md): pills are for buttons and tabs only. */}
                <ul className="absolute end-0 z-50 mt-1 w-max rounded-lg border border-line bg-panel p-1 text-sm shadow-lg">
                  {languages.map((l) => (
                    <li key={l.code}>
                      <a
                        href={l.path}
                        hrefLang={l.lang}
                        lang={l.lang}
                        dir={l.dir}
                        aria-current={l.current ? "true" : undefined}
                        className={`flex min-h-11 items-center whitespace-nowrap rounded-md px-3 font-bold ${l.current ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-brand-soft hover:text-ink"}`}
                      >
                        {l.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
              <a href={loginHref} className="inline-flex min-h-11 items-center rounded-full px-2 text-sm font-bold text-brand-strong hover:text-brand">
                {t.nav.login}
              </a>
              <a
                href={contact}
                aria-current={page === "contact" ? "page" : undefined}
                className="btn-primary inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-bold"
              >
                {t.nav.contact}
              </a>
            </div>
            <div className="lg:hidden">
              <MobileMenu
                labels={{ menu: t.nav.menu, close: t.nav.closeMenu, language: t.nav.language, currency: t.common.currency, login: t.nav.login, contact: t.nav.contact, status: t.nav.status }}
                links={items.map(([href, label, active]) => ({ href, label, current: active }))}
                languages={languages.map((l) => ({ code: l.code, href: l.path, name: l.name, lang: l.lang, dir: l.dir, current: l.current }))}
                loginHref={loginHref}
                contactHref={contact}
                contactCurrent={page === "contact"}
                statusHref={STATUS_URL || null}
              />
            </div>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="mt-16 border-t border-line bg-surface-alt">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {/*
           * Every column is sized to its own content and the space left over is dealt out evenly
           * between them, which is the gap a reader is actually looking at.
           */}
          {/* Two link columns side by side on a phone too: stacked one under another, the four took over a screen and a half. */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 lg:grid-cols-[auto_repeat(4,auto)] lg:justify-between">
            <div className="col-span-2 text-sm text-muted md:col-span-4 lg:col-span-1">
              <LogoFull className="h-20" />
              {legalName ? (
                <p className="mt-4">
                  {t.footer.operatedBy} {legalName}
                </p>
              ) : null}
              {trust ? <Trust t={t} trust={trust} /> : null}
            </div>
            <FooterColumn
              title={t.footer.products}
              links={[
                ["hosting", t.nav.hosting],
                ["websites", t.nav.websites],
                ["care", t.nav.care],
                ["domains", t.nav.domains],
              ].map(([key, label]) => [pathFor(key as PageKey, locale), label as string])}
            />
            <FooterColumn
              title={t.footer.account}
              links={[
                [loginHref, t.footer.login],
                [storeLink(`${store}/invoices`, locale), t.footer.invoices],
                [storeLink(`${store}/tickets`, locale), t.footer.tickets],
              ]}
            />
            <FooterColumn
              title={t.footer.company}
              links={[
                [pathFor("about", locale), t.nav.about],
                [contact, t.nav.contact],
                // Only once there is a status page to link (S14): STATUS_URL is empty until it is built.
                ...(STATUS_URL ? [[STATUS_URL, t.nav.status] as [string, string]] : []),
              ]}
            />
            <FooterColumn
              title={t.footer.legal}
              links={[
                [pathFor("terms", locale), t.terms.title],
                [pathFor("privacy", locale), t.privacy.title],
                [pathFor("delivery", locale), t.delivery.title],
                [pathFor("refunds", locale), t.refunds.title],
              ]}
            />
          </div>
        </div>
        <div className="border-t border-line">
          {/* text-muted, not text-faint: faint on the footer's surface-alt is under 4.5:1 in the light theme. */}
          {/* Room under the last line on a phone for the assistant's corner button, so the theme switch is never under it (S8). */}
          <div className={`mx-auto max-w-7xl px-5 py-5 text-xs text-muted sm:px-8 ${assistant ? "pb-20 md:pb-5" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <p>
                {/* The Latin run isolated left to right: on the Arabic pages it laid out as "© 3enwank 2026." */}
                <bdi dir="ltr" className="tabular">
                  © {currentYear()} {t.meta.siteName}.
                </bdi>{" "}
                {t.footer.copyright}
              </p>
              <ThemeSwitch label={t.footer.theme} dark={t.footer.themeDark} light={t.footer.themeLight} />
            </div>
          </div>
        </div>
      </footer>
      {assistant ? (
        <Assistant url={`${store}/api/public/assistant`} store={store} locale={locale} labels={t.assistant} whatsapp={whatsapp} turnstileSiteKey={turnstileSiteKey} />
      ) : null}
    </>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <nav aria-label={title} className="text-sm">
      <p className="mb-3 font-extrabold text-ink">{title}</p>
      {/* Below sm each link is a 44px row: a footer on a phone is tapped. From sm up the list keeps its spacing. */}
      <ul className="sm:space-y-2.5">
        {links.map(([href, label]) => (
          <li key={href + label}>
            <a href={href} className="flex min-h-11 items-center text-muted hover:text-ink sm:inline sm:min-h-0">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
