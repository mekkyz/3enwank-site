import type { ReactNode } from "react";
import { dirFor, langTag, type Locale } from "@/lib/i18n";
import { CurrencyProvider } from "./currency";
import { THEME_KEY } from "@/lib/theme";

/** Applied before paint: the stored theme, dark by default. */
const THEME_SCRIPT = `document.documentElement.classList.add("js");try{document.documentElement.dataset.theme=localStorage.getItem(${JSON.stringify(THEME_KEY)})==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

/**
 * Runs at the end of the body, before React: sections marked data-reveal (or data-reveal-stagger
 * for a grid whose children come one after the other) get .is-in when they scroll into view, and
 * the bar gets .is-scrolled once the page has moved. Plain script, so it works even when hydration
 * is slow.
 */
/**
 * The bar's menus are <details>, so they open and close without JavaScript. What plain <details>
 * cannot do is close when you look away, which leaves a menu hanging over the page after you have
 * clicked something else. One listener for all of them, added here rather than in each island.
 */
const MENU_SCRIPT = `(function(){var d=document;function shut(except){d.querySelectorAll("details[data-menu][open]").forEach(function(el){if(el!==except)el.open=false})}d.addEventListener("click",function(e){var open=d.querySelectorAll("details[data-menu][open]");if(!open.length)return;open.forEach(function(el){if(!el.contains(e.target))el.open=false})});d.addEventListener("keydown",function(e){if(e.key==="Escape")shut(null)});d.addEventListener("toggle",function(e){var t=e.target;if(t&&t.matches&&t.matches("details[data-menu]")&&t.open)shut(t)},true)})();`;

const MOTION_SCRIPT = `(function(){var d=document;if(!("IntersectionObserver" in window))return;var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var t=e.target;if(t.hasAttribute("data-reveal-stagger")){var c=t.children;for(var i=0;i<c.length;i++)c[i].style.transitionDelay=Math.min(i,9)*70+"ms"}t.classList.add("is-in");io.unobserve(t)})},{rootMargin:"0px 0px -8% 0px",threshold:0.08});d.querySelectorAll("[data-reveal],[data-reveal-stagger]").forEach(function(el){io.observe(el)});var h=d.querySelector("header[data-bar]");if(h){var s=function(){h.classList.toggle("is-scrolled",window.scrollY>8)};s();addEventListener("scroll",s,{passive:true})}})();`;

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
        <CurrencyProvider>{children}</CurrencyProvider>
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: MENU_SCRIPT }} />
      </body>
    </html>
  );
}
