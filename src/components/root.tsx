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
 *
 * Escape hands focus back to the menu's own summary. Closing a <details> hides the item that had
 * focus, and the browser then drops focus to <body>, so a keyboard user who opened the language menu
 * and pressed Escape had to tab through the whole page again to get back to the bar. Only a menu
 * that actually held focus takes it back; one opened with the mouse leaves focus where it was.
 */
const MENU_SCRIPT = `(function(){var d=document;function shut(except){d.querySelectorAll("details[data-menu][open]").forEach(function(el){if(el!==except)el.open=false})}d.addEventListener("click",function(e){var open=d.querySelectorAll("details[data-menu][open]");if(!open.length)return;open.forEach(function(el){if(!el.contains(e.target))el.open=false})});d.addEventListener("keydown",function(e){if(e.key!=="Escape")return;d.querySelectorAll("details[data-menu][open]").forEach(function(el){var had=el.contains(d.activeElement);el.open=false;var s=el.querySelector("summary");if(had&&s)s.focus()})});d.addEventListener("toggle",function(e){var t=e.target;if(t&&t.matches&&t.matches("details[data-menu]")&&t.open)shut(t)},true)})();`;

/** The <html>/<body> both root layouts render; the locale decides lang, dir and the font stack (globals.css). */
/**
 * Reveal on scroll (owner, 2026-09-14): section headings, cards, the FAQ and the band fade up once
 * as they come into view, a few in a row slightly staggered. Everything is visible in the HTML;
 * only elements that start below the first screen are hidden, and only by this script, so nothing
 * on the first screen waits, a visitor without JavaScript sees the whole page, and printing shows
 * everything (globals.css). It does nothing under reduced motion, and nothing for an automated
 * browser (navigator.webdriver): the render check and its full-page screenshots must see the page
 * as it ends up, not a column of blanks that never scrolled into view.
 *
 * The state is a data attribute, never a class or a style: the cards inside the plan tabs are
 * hydrated by React, and a className React did not render is a hydration mismatch, while an
 * attribute it does not know about is left alone. When the animation ends the state becomes "done"
 * and the animation property goes away, so a card's hover lift works as before.
 */
const REVEAL_SCRIPT = `(function(){var d=document,r=d.documentElement;if(!("IntersectionObserver" in window)||navigator.webdriver)return;try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return}catch(e){}var rtl=r.dir==="rtl",vh=window.innerHeight;var io=new IntersectionObserver(function(entries){var n=0;entries.filter(function(e){return e.isIntersecting}).sort(function(a,b){var ra=a.boundingClientRect,rb=b.boundingClientRect,dy=Math.round(ra.top/12)-Math.round(rb.top/12);return dy||(rtl?rb.left-ra.left:ra.left-rb.left)}).forEach(function(e){var el=e.target;io.unobserve(el);el.setAttribute("data-reveal-i",String(Math.min(n++,5)));el.setAttribute("data-reveal-state","in");el.addEventListener("animationend",function f(ev){if(ev.target!==el)return;el.removeEventListener("animationend",f);el.setAttribute("data-reveal-state","done")})})},{rootMargin:"0px 0px -6% 0px"});d.querySelectorAll("[data-reveal]").forEach(function(el){if(el.getBoundingClientRect().top<vh)return;el.setAttribute("data-reveal-state","pending");io.observe(el)})})();`;

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
        <script dangerouslySetInnerHTML={{ __html: BAR_SCRIPT }} />
        <CurrencyProvider>{children}</CurrencyProvider>
        <script dangerouslySetInnerHTML={{ __html: MENU_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
      </body>
    </html>
  );
}
