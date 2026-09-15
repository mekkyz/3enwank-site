import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ThemeSwitch } from "@/components/theme";
import { contactHref, LOCALES, pathFor, type Locale } from "@/lib/i18n";
import { SITE_URL, currentYear } from "@/lib/site";
import { PAGE_RELOAD_MS, PAGE_STALE_MS, statusHref } from "@/lib/status";
import { fill, messagesFor } from "@/messages";

/** The status page's content column: narrower than the site's, since it is one list read top to bottom. */
export const STATUS_COLUMN = "mx-auto w-full max-w-3xl px-5 sm:px-8";

/**
 * In the browser, after the page (design 6.3). A tab left open or a page restored from the back
 * button can be hours old and still green: once the render is ten minutes old the states are hidden
 * and the unavailable line shown. A visible tab reloads every two minutes, except within ten seconds
 * of someone pointing at a bar. No framework, so it works before and without hydration.
 */
const STATUS_SCRIPT = `(function(){var r=document.querySelector("[data-status-root]");if(!r)return;var g=Date.parse(r.getAttribute("data-generated-at")||""),loaded=Date.now();function stale(){if(isNaN(g)||Date.now()-g<=${PAGE_STALE_MS})return;r.querySelectorAll("[data-status-live]").forEach(function(e){e.hidden=true});var u=r.querySelector("[data-status-unavailable]");if(u)u.hidden=false}function tick(){stale();if(document.visibilityState!=="visible"||Date.now()-loaded<${PAGE_RELOAD_MS})return;if(Date.now()-(Number(r.getAttribute("data-touched-at"))||0)<10000)return;location.reload()}stale();addEventListener("pageshow",tick);document.addEventListener("visibilitychange",tick);setInterval(tick,15000)})();`;

/**
 * Header and footer of status.3enwank.com: not the marketing Shell, which brings the navigation, the
 * cart and the assistant. Every link is a plain <a>, and every link off the page is absolute to
 * SITE_URL, because on the status host a relative link would land on nginx's redirect (design 6.1).
 */
export function StatusShell({ locale, generatedAt, children }: { locale: Locale; generatedAt: string | null; children: ReactNode }) {
  const t = messagesFor(locale);
  const other = LOCALES.find((l) => l.code !== locale)!;
  const siteHome = `${SITE_URL}${pathFor("home", locale)}`;
  const siteName = SITE_URL.replace(/^https?:\/\//, "");
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow"
      >
        {t.nav.skip}
      </a>
      <header className="border-b border-line bg-panel">
        <div className={`${STATUS_COLUMN} flex items-center justify-between gap-4 py-3`}>
          <div className="flex min-w-0 items-center gap-3">
            <a href={siteHome} className="flex min-h-11 min-w-0 items-center" aria-label={t.meta.siteName}>
              <Logo className="h-auto max-h-7 max-w-full sm:max-h-8" />
            </a>
            <span aria-hidden="true" className="h-5 w-px shrink-0 bg-line" />
            <span className="shrink-0 text-[15px] font-bold text-ink">{t.status.header}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-sm font-semibold">
            <a href={siteHome} className="hidden min-h-11 items-center px-2 text-muted hover:text-ink sm:inline-flex">
              <bdi dir="ltr">{siteName}</bdi>
            </a>
            <a href={statusHref(other.code)} hrefLang={other.lang} lang={other.lang} dir={other.dir} className="inline-flex min-h-11 items-center px-2 font-bold text-brand-strong hover:text-brand">
              {other.name}
            </a>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1" data-status-root="" data-generated-at={generatedAt ?? undefined}>
        {children}
      </main>
      <footer className="border-t border-line bg-surface-alt">
        <div className={`${STATUS_COLUMN} flex flex-col gap-4 py-6 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between`}>
          <ul className="flex flex-col sm:flex-row sm:gap-6">
            <li>
              <a href={siteHome} className="flex min-h-11 items-center text-muted hover:text-ink sm:inline sm:min-h-0">
                {fill(t.status.back, { site: siteName })}
              </a>
            </li>
            <li>
              <a href={`${SITE_URL}${contactHref(locale)}`} className="flex min-h-11 items-center text-muted hover:text-ink sm:inline sm:min-h-0">
                {t.status.support}
              </a>
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ThemeSwitch label={t.footer.theme} dark={t.footer.themeDark} light={t.footer.themeLight} />
            <p className="text-xs text-muted">
              <bdi dir="ltr" className="tabular">
                © {currentYear()} {t.meta.siteName}
              </bdi>
            </p>
          </div>
        </div>
      </footer>
      <script dangerouslySetInnerHTML={{ __html: STATUS_SCRIPT }} />
    </>
  );
}
