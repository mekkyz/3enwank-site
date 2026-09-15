import type { ReactNode } from "react";
import { dirFor, langTag, type Locale } from "@/lib/i18n";
import { CurrencyProvider } from "./currency";
import { CURRENCY_KEY, DEFAULT_CURRENCY, currencies } from "@/lib/money";
import { THEME_KEY } from "@/lib/theme";

/**
 * Applied before paint: the stored theme, else the system setting (prefers-color-scheme; dark when the
 * browser reports nothing), and the stored currency, EGP by default.
 * Exported for the 404 page, which has an <html> of its own.
 *
 * The currency is here for the same reason the theme is. Every <Price> carries both currencies and
 * globals.css shows the one html[data-currency] names; when the choice was only read after
 * hydration, a visitor who had picked USD saw every price in EGP for a frame and then watched them
 * change. Anything stored that is not a currency we sell reads as the default.
 */
export const THEME_SCRIPT = `(function(){var r=document.documentElement;r.classList.add("js");try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});r.dataset.theme=t==="light"||t==="dark"?t:matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}catch(e){r.dataset.theme=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}var c=${JSON.stringify(DEFAULT_CURRENCY)};try{var s=localStorage.getItem(${JSON.stringify(CURRENCY_KEY)});if(${JSON.stringify(currencies)}.indexOf(s)>=0)c=s}catch(e){}r.dataset.currency=c})();`;

/**
 * The bar's menus are <details>, so they open and close without JavaScript. What plain <details>
 * cannot do is close when you look away, which leaves a menu hanging over the page after you have
 * clicked something else. One listener for all of them, added here rather than in each island.
 *
 * Escape hands focus back to the menu's own summary. Closing a <details> hides the item that had
 * focus, and the browser then drops focus to <body>, so a keyboard user who opened the language menu
 * and pressed Escape had to tab through the whole page again to get back to the bar. Only a menu
 * that actually held focus takes it back; one opened with the mouse leaves focus where it was.
 */
const MENU_SCRIPT = `(function(){var d=document;function shut(except){d.querySelectorAll("details[data-menu][open]").forEach(function(el){if(el!==except)el.open=false})}d.addEventListener("click",function(e){var open=d.querySelectorAll("details[data-menu][open]");if(!open.length)return;open.forEach(function(el){if(!el.contains(e.target))el.open=false})});d.addEventListener("keydown",function(e){if(e.key!=="Escape")return;d.querySelectorAll("details[data-menu][open]").forEach(function(el){var had=el.contains(d.activeElement);el.open=false;var s=el.querySelector("summary");if(had&&s)s.focus()})});d.addEventListener("toggle",function(e){var t=e.target;if(t&&t.matches&&t.matches("details[data-menu]")&&t.open)shut(t)},true)})();`;

/*
 * No reveal-on-scroll script and no bar script any more (owner, 2026-09-15). REVEAL_SCRIPT hid
 * everything below the first screen until it scrolled in, which also left in-page jumps landing on
 * blank sections; BAR_SCRIPT made the header transparent over the hero's glow, which is gone.
 */
/** The <html>/<body> both root layouts render; the locale decides lang, dir and the font stack (globals.css). */
export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html
      lang={langTag(locale)}
      dir={dirFor(locale)}
      /*
       * No data-theme from the server: the before-paint script stamps it from the saved choice or
       * the system setting, and a no-JavaScript visitor gets the prefers-color-scheme block in
       * globals.css, which is keyed on the attribute being absent. Stamping "dark" here would
       * override that for the one visitor the script cannot help.
       */
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <CurrencyProvider>{children}</CurrencyProvider>
        <script dangerouslySetInnerHTML={{ __html: MENU_SCRIPT }} />
      </body>
    </html>
  );
}
