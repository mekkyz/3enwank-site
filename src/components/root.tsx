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
const MOTION_SCRIPT = `(function(){var d=document;if(!("IntersectionObserver" in window))return;var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var t=e.target;if(t.hasAttribute("data-reveal-stagger")){var c=t.children;for(var i=0;i<c.length;i++)c[i].style.transitionDelay=Math.min(i,9)*70+"ms"}t.classList.add("is-in");io.unobserve(t)})},{rootMargin:"0px 0px -8% 0px",threshold:0.08});d.querySelectorAll("[data-reveal],[data-reveal-stagger]").forEach(function(el){io.observe(el)});var h=d.querySelector("header[data-bar]");if(h){var s=function(){h.classList.toggle("is-scrolled",window.scrollY>8)};s();addEventListener("scroll",s,{passive:true})}})();`;

/** The <html>/<body> both root layouts render; the locale decides lang, dir and the font stack (globals.css). */
export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={langTag(locale)} dir={dirFor(locale)} data-theme="dark" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <CurrencyProvider>{children}</CurrencyProvider>
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
      </body>
    </html>
  );
}
