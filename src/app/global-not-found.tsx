import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./globals.css";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { THEME_SCRIPT } from "@/components/root";
import { LOCALES, defaultLocale, localeInfo, pathFor, prefixedLocales } from "@/lib/i18n";
import { currentYear } from "@/lib/site";
import { messagesFor } from "@/messages";

/**
 * The site's 404, served for any unknown path in every language. It bypasses the layouts, so it
 * carries its own <html> and speaks every language: the export is static, so nothing on the server
 * knows which language a wrong URL was typed in.
 *
 * The browser does, from the address bar. LOCALE_SCRIPT reads the path before first paint and,
 * under a locale prefix (/ar/…), stamps that locale's lang and dir on <html> and puts its block
 * first, so an Arabic reader who mistyped an Arabic URL gets an Arabic page that reads right to
 * left, in the Arabic face, and a screen reader announces it in Arabic. It used to be English-first
 * with lang="en" for every wrong URL, /ar/ ones included. Without JavaScript the page is still
 * every language in turn, each block with its own lang and dir, English first.
 *
 * It is built like every other page now, which it was not: a skip link, a banner, one h1, main and
 * a footer. The landmarks sit inside the card rather than around it, which keeps the card's shape;
 * a <header> or <footer> is only demoted from a landmark inside <main>, <nav>, <article>, <aside>
 * or <section>, and the card is a plain <div>. THEME_SCRIPT runs in <head>, so a visitor who chose
 * the light theme gets it here too.
 */
/*
 * No `robots` here: Next already writes <meta name="robots" content="noindex"> on its not-found
 * response, and a second tag from this metadata put two robots metas on every 404 (audit item).
 */
export const metadata: Metadata = { title: "404 · 3enwank" };

const LOCALE_SCRIPT = `(function(){var p=location.pathname,r=document.documentElement,l=${JSON.stringify(prefixedLocales().map((code) => ({ code, lang: localeInfo(code).lang, dir: localeInfo(code).dir })))};for(var i=0;i<l.length;i++){if(p==="/"+l[i].code||p.indexOf("/"+l[i].code+"/")===0){r.lang=l[i].lang;r.dir=l[i].dir;r.dataset.locale=l[i].code;break}}})();`;

/*
 * The block of the locale the path names goes first; the rule is one line per prefixed locale so a
 * new locale needs no edit here.
 *
 * The chrome that can only say one thing at a time (the skip link, the h1's words, the footer line)
 * carries one span per locale marked data-only, and shows the one the path names: the default
 * locale's when <html> has no data-locale, a prefixed locale's only when it has that one.
 */
const LOCALE_CSS = [
  ...prefixedLocales().map((code) => `html[data-locale="${code}"] [data-locale="${code}"]{order:-1}`),
  `html[data-locale] [data-only="${defaultLocale}"]{display:none}`,
  ...prefixedLocales().map((code) => `html:not([data-locale="${code}"]) [data-only="${code}"]{display:none}`),
].join("");

/** One span per locale, of which LOCALE_CSS shows one. */
function EachLocale({ text, className }: { text: (t: ReturnType<typeof messagesFor>) => string; className?: string }) {
  return (
    <>
      {LOCALES.map((l) => (
        <span key={l.code} lang={l.lang} dir={l.dir} data-only={l.code} className={className}>
          {text(messagesFor(l.code))}
        </span>
      ))}
    </>
  );
}

export default function GlobalNotFound() {
  const base = localeInfo(defaultLocale);
  return (
    <html lang={base.lang} dir={base.dir} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: LOCALE_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col items-center justify-center bg-surface px-5 py-16 text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow"
        >
          <EachLocale text={(t) => t.nav.skip} />
        </a>
        <div className="w-full max-w-md rounded-xl border border-line bg-panel p-8">
          <header>
            <Logo />
          </header>
          <main id="main" tabIndex={-1} className="focus:outline-none">
            {/* The h1 reads "404" and then the page's own words for it, in the language the path names; the kicker's look is kept. */}
            <h1 className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-brand tabular">
              404
              <EachLocale text={(t) => ` ${t.notFound.title}`} className="sr-only" />
            </h1>
            {/* A flex column so the blocks can be reordered by the stylesheet above; every block carries the same hairline, so the order does not show. */}
            <div className="flex flex-col">
              {LOCALES.map((l) => {
                const t = messagesFor(l.code);
                return (
                  <div key={l.code} lang={l.lang} dir={l.dir} data-locale={l.code} className="mt-6 border-t border-line pt-6">
                    <h2 className="text-2xl font-extrabold">{t.notFound.title}</h2>
                    <p className="mt-2 text-muted">{t.notFound.body}</p>
                    <a href={pathFor("home", l.code)} className="mt-3 inline-flex min-h-11 items-center font-bold text-brand-strong hover:underline">
                      {t.notFound.home}
                    </a>
                  </div>
                );
              })}
            </div>
          </main>
          <footer className="mt-6 border-t border-line pt-5 text-xs text-muted">
            {/* The Latin run isolated left to right: under dir="rtl" it laid out as "© 3enwank 2026." */}
            <bdi dir="ltr" className="tabular">© {currentYear()} 3enwank.</bdi> <EachLocale text={(t) => t.footer.copyright} />
          </footer>
        </div>
      </body>
    </html>
  );
}
