import type { ReactNode } from "react";
import { dirFor, langTag, type Locale } from "@/lib/i18n";
import { CurrencyProvider } from "./currency";
import { THEME_KEY } from "@/lib/theme";

/** Applied before paint: the stored theme, dark by default. */
const THEME_SCRIPT = `document.documentElement.classList.add("js");try{document.documentElement.dataset.theme=localStorage.getItem(${JSON.stringify(THEME_KEY)})==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

/**
 * The header drops its background and its border while the page is at the top, and this class is what
 * both states are keyed off (globals.css, `header[data-bar]`). It goes on <html>, not on the header,
 * because this runs at the top of <body>, where the header has not been parsed yet. Mounted after the
 * shell, as MENU_SCRIPT is, a reload halfway down a page or a back-navigation paints a bare bar over
 * the content first and fills it in a frame later. It also has to run after THEME_SCRIPT, which is
 * what adds the `js` class the rule asks for.
 *
 * Two thresholds rather than one: it turns on past 8px and off again below 4px, so a page resting at
 * the very top does not flicker as a trackpad nudges it across a single boundary.
 */
const BAR_SCRIPT = `(function(){var r=document.documentElement,on=r.classList.contains("is-scrolled");function f(){var y=window.scrollY||0;if(on?y<4:y>8){on=!on;r.classList.toggle("is-scrolled",on)}}f();addEventListener("scroll",f,{passive:true});addEventListener("pageshow",f)})();`;

/**
 * The bar's menus are <details>, so they open and close without JavaScript. What plain <details>
 * cannot do is close when you look away, which leaves a menu hanging over the page after you have
 * clicked something else. One listener for all of them, added here rather than in each island.
 */
const MENU_SCRIPT = `(function(){var d=document;function shut(except){d.querySelectorAll("details[data-menu][open]").forEach(function(el){if(el!==except)el.open=false})}d.addEventListener("click",function(e){var open=d.querySelectorAll("details[data-menu][open]");if(!open.length)return;open.forEach(function(el){if(!el.contains(e.target))el.open=false})});d.addEventListener("keydown",function(e){if(e.key==="Escape")shut(null)});d.addEventListener("toggle",function(e){var t=e.target;if(t&&t.matches&&t.matches("details[data-menu]")&&t.open)shut(t)},true)})();`;

/** The <html>/<body> both root layouts render; the locale decides lang, dir and the font stack (globals.css). */
export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html
      lang={langTag(locale)}
      dir={dirFor(locale)}
      data-theme="dark"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: BAR_SCRIPT }} />
        <CurrencyProvider>{children}</CurrencyProvider>
        <script dangerouslySetInnerHTML={{ __html: MENU_SCRIPT }} />
      </body>
    </html>
  );
}
