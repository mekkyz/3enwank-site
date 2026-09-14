import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./globals.css";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { THEME_SCRIPT } from "@/components/root";
import { LOCALES, defaultLocale, localeInfo, pathFor, prefixedLocales } from "@/lib/i18n";
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
 */
export const metadata: Metadata = { title: "404 · 3enwank", robots: { index: false, follow: false } };

const LOCALE_SCRIPT = `(function(){var p=location.pathname,r=document.documentElement,l=${JSON.stringify(prefixedLocales().map((code) => ({ code, lang: localeInfo(code).lang, dir: localeInfo(code).dir })))};for(var i=0;i<l.length;i++){if(p==="/"+l[i].code||p.indexOf("/"+l[i].code+"/")===0){r.lang=l[i].lang;r.dir=l[i].dir;r.dataset.locale=l[i].code;break}}})();`;

/* The block of the locale the path names goes first; the rule is one line per prefixed locale so a new locale needs no edit here. */
const ORDER_CSS = prefixedLocales()
  .map((code) => `html[data-locale="${code}"] [data-locale="${code}"]{order:-1}`)
  .join("");

export default function GlobalNotFound() {
  const base = localeInfo(defaultLocale);
  return (
    <html lang={base.lang} dir={base.dir} data-theme="dark" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: ORDER_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col items-center justify-center bg-surface px-5 py-16 text-ink">
        <main className="w-full max-w-md rounded-xl border border-line bg-panel p-8">
          <Logo />
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-brand tabular">404</p>
          {/* A flex column so the blocks can be reordered by the stylesheet above; every block carries the same hairline, so the order does not show. */}
          <div className="flex flex-col">
            {LOCALES.map((l) => {
              const t = messagesFor(l.code);
              return (
                <div key={l.code} lang={l.lang} dir={l.dir} data-locale={l.code} className="mt-6 border-t border-line pt-6">
                  <h2 className="text-2xl font-extrabold">{t.notFound.title}</h2>
                  <p className="mt-2 text-muted">{t.notFound.body}</p>
                  <a href={pathFor("home", l.code)} className="mt-3 inline-block font-bold text-brand-strong hover:underline">
                    {t.notFound.home}
                  </a>
                </div>
              );
            })}
          </div>
        </main>
      </body>
    </html>
  );
}
