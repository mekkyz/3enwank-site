import type { ReactNode } from "react";
import { ASSISTANT_PREVIEW, STORE_URL, currentYear } from "@/lib/site";
import { anchorFor, languageLinks, pathFor, storeLink, type Locale, type PageKey } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { Assistant } from "./assistant";
import { CartLink } from "./cart-link";
import { CurrencySwitch } from "./currency";
import { AccountIcon, LanguageIcon } from "./icons";
import { Logo, LogoFull } from "./logo";
import { ThemeSwitch } from "./theme";
import { Trust, type TrustInfo } from "./trust";

/**
 * Header, navigation and footer shared by every page. Server-rendered, no JavaScript: the language
 * menu is a <details> element and every store link is a plain anchor.
 */
export function Shell({
  locale,
  page,
  storeUrl,
  legalName,
  supportEmail,
  trust,
  assistantEnabled = false,
  turnstileSiteKey = null,
  children,
}: {
  locale: Locale;
  page: PageKey;
  storeUrl?: string;
  legalName?: string;
  supportEmail?: string;
  trust?: TrustInfo;
  assistantEnabled?: boolean;
  turnstileSiteKey?: string | null;
  children: ReactNode;
}) {
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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow"
      >
        {t.nav.skip}
      </a>
      {/*
       * The panel and the hairline are here, and globals.css takes them away while the page is at the
       * top: the wordmark, the links and the mobile row then sit straight on the page, which is what
       * the hero was drawn to hold. Written that way round so a reader without JavaScript keeps the
       * solid bar. The blur lives in globals.css with them, so it cannot be left on over a bar with
       * nothing behind it. `data-bar` is what that rule selects; the class BAR_SCRIPT (root.tsx)
       * toggles sits on <html>.
       */}
      <header data-bar className="sticky top-0 z-40 border-b border-line bg-panel/95">
        {/*
         * The row was a fixed-width wordmark beside controls whose width follows the language, and
         * every attempt to fit it by picking a smaller fixed wordmark failed on some phone nobody
         * had measured. h-7 (166px) overflowed a 390px phone by 31px; h-6 (142px) cleared 390 with
         * 8.8px to spare and still broke its own padding box by 6.2px at 375 and 21.2px at 360, which
         * are an iPhone SE and the commonest Android.
         *
         * The arithmetic says no fixed height can work. At 360 the page is 345px wide once
         * `scrollbar-gutter: stable` has taken its 15px, so the padding box is 305px; the English
         * controls are 176px (currency, cart, language, Contact) and the gap 8px, which leaves 121px
         * for a wordmark that wants 142px. The image is 640x108, so height is the expensive
         * dimension — every pixel of it costs about six of width — and h-5 would fit 360 by 2.5px and
         * still fail on a 320px screen.
         *
         * So the wordmark stops being fixed and becomes the part that gives. It is the flex row's
         * only shrinkable item below sm (`min-w-0` so it may shrink past its own width, `max-w-full`
         * and `h-auto` so it loses height with width rather than squashing), capped at the h-6 it
         * already had. The controls are what they are, the row is what the screen is, and the
         * wordmark takes the difference: 142px at 390 and up, 136px at 375, 121px at 360, and no
         * width left to break on. Nothing at sm and above changes: `sm:shrink-0` stops the shrinking
         * and `sm:max-h-8` is the h-8 that was there, to the pixel.
         *
         * The Log in control below sm is what the tighter gaps pay for. It is an icon there (27px
         * at px-1), and it would have cost the wordmark 35px at every phone width had the row
         * stayed as it was, since that was 9px over the slack at 390. So below sm the controls sit
         * 2px apart rather than 4, the icon controls carry px-1 rather than px-1.5, and the Contact
         * pill px-2 rather than px-2.5: 20px back, and the wordmark is 139px at 390 (was 142),
         * 124 at 375 (was 136) and 109 at 360 (was 121). Measured with the site's own fonts in
         * headless Chromium, English: currency 27, cart 26, language 27, account 27, Contact 73,
         * four gaps of 2, row gap 8. Arabic is narrower (كلمنا is 32px to Contact's 57) and keeps
         * the full 142 at every width from 360 up.
         */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-5 py-3 sm:gap-4 sm:px-8">
          {/* min-h-11: the row is already 44px tall from the icon controls, so the home link can be a full-height target at no cost to the layout. */}
          <a
            href={pathFor("home", locale)}
            className="flex min-h-11 min-w-0 items-center sm:shrink-0"
            aria-label={t.meta.siteName}
          >
            <Logo className="h-auto max-h-6 max-w-full sm:max-h-8" />
          </a>
          <nav
            aria-label={t.nav.menu}
            className="hidden items-center gap-6 text-[15px] font-semibold text-muted lg:flex"
          >
            {items.map(([href, label, active]) => (
              <a
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`hover:text-ink ${active ? "text-ink" : ""}`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-0.5 sm:gap-2">
            <CurrencySwitch label={t.common.currency} />
            <CartLink href={storeLink(`${store}/cart`, locale)} label={t.nav.cart} />
            <details data-menu className="relative">
              <summary
                className="flex min-h-11 cursor-pointer list-none items-center rounded-full px-1 text-sm font-semibold text-muted hover:text-ink sm:px-2 [&::-webkit-details-marker]:hidden"
                aria-label={`${t.nav.language}: ${current.name}`}
                title={t.nav.language}
              >
                <LanguageIcon />
              </summary>
              <ul className="absolute end-0 z-50 mt-1 w-max rounded-2xl border border-line bg-panel p-1 text-sm shadow-lg">
                {languages.map((l) => (
                  <li key={l.code}>
                    {/* The chosen one is the coloured one: a tick as well was a second thing saying
                        the same thing, and it set the width of the whole menu. */}
                    <a
                      href={l.path}
                      hrefLang={l.lang}
                      lang={l.lang}
                      dir={l.dir}
                      aria-current={l.current ? "true" : undefined}
                      className={`flex min-h-11 items-center whitespace-nowrap rounded-full px-3 font-bold ${l.current ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-brand-soft hover:text-ink"}`}
                    >
                      {l.name}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
            {/* One link, two faces: the account icon below sm, the words from sm up; the name is the same either way. */}
            <a
              href={storeLink(`${store}/login`, locale)}
              className="inline-flex min-h-11 items-center rounded-full px-1 text-sm font-bold text-brand-strong hover:text-brand sm:px-2"
              aria-label={t.nav.login}
              title={t.nav.login}
            >
              <AccountIcon className="shrink-0 sm:hidden" />
              <span className="hidden sm:inline">{t.nav.login}</span>
            </a>
            <a
              href={anchorFor("contact", locale)}
              className="btn-primary inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2 text-[13px] font-bold sm:px-4 sm:text-sm"
            >
              {t.nav.contact}
            </a>
          </div>
        </div>
        {/*
         * The phone row. Each link is a 44px target (min-h-11) where it was its 20px line of text,
         * and the row pays for that with its padding rather than with the page: -mt-3 tucks it into
         * the 12px under the logo row, which holds no control, and pb-0 replaces the 10px under it.
         * The text sits on the same pixels it did, and the bar is 101px rather than 99, which
         * --header-h in globals.css follows. `nav-fade` fades the end of the row when it scrolls
         * (320px in English), which was cutting "Domains" off with nothing to say more was there.
         */}
        <nav
          aria-label={t.nav.menu}
          className="nav-fade mx-auto -mt-3 flex max-w-7xl gap-5 overflow-x-auto px-5 text-sm font-semibold sm:px-8 lg:hidden"
        >
          {items.map(([href, label, active]) => (
            <a
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center whitespace-nowrap ${active ? "text-ink" : "text-muted"}`}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="mt-16 bg-surface-alt">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          {/*
           * Equal columns put the free space in the wrong places: the brand column's logo filled its
           * track while a link column's "Hosting" filled a third of its own, so the eye saw 64px
           * between the logo and Products and 140px between Products and Account. Every column is
           * sized to its own content instead, and the space left over is dealt out evenly between
           * them, which is the gap a reader is actually looking at.
           */}
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-[auto_repeat(4,auto)] lg:justify-between">
            <div className="text-sm text-muted md:col-span-4 lg:col-span-1">
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
          {/*
           * text-muted, not text-faint: faint on the footer's surface-alt is 4.2:1 in the light
           * theme, under the 4.5:1 that 12px text needs. Muted is well clear in both themes.
           */}
          <div className="mx-auto max-w-7xl px-5 py-5 text-xs text-muted sm:px-8">
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
      {assistantEnabled || ASSISTANT_PREVIEW ? (
        <Assistant
          url={`${store}/api/public/assistant`}
          locale={locale}
          labels={t.assistant}
          supportEmail={supportEmail}
          turnstileSiteKey={turnstileSiteKey}
        />
      ) : null}
    </>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <nav aria-label={title} className="text-sm">
      <p className="mb-3 font-extrabold text-ink">{title}</p>
      {/*
       * Below sm each link is a 44px row (min-h-11) instead of a 19px line 10px from the next: a
       * footer on a phone is tapped, and the rows touch rather than overlap. From sm up, where a
       * pointer is the likelier way in, the list keeps the spacing it was designed with.
       */}
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
