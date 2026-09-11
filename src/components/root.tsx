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


/**
 * A recorder for the freeze nobody can reproduce on demand.
 *
 * Off unless a visitor turns it on for themselves, so it costs everyone else the bytes of this
 * string and nothing more. What it is really for is telling two very different faults apart, which
 * look identical from the driving seat:
 *
 *   - the tab stopped running   → a "stall" entry, with how many milliseconds went missing
 *   - the navigation never came → a "click" with no "load" after it, and heartbeats continuing
 *
 * The first is our JavaScript. The second is the request. Nothing else about the page can tell you
 * which, because in both cases the screen simply sits there.
 *
 *   localStorage.setItem("enwank:debug", "1")   then reload and reproduce
 *   copy(enwankDebug.dump())                    then paste it back
 *   enwankDebug.off()                           when we are done
 */
const DEBUG_SCRIPT = `(function(){try{if(localStorage.getItem("enwank:debug")!=="1")return}catch(e){return}var K="enwank:debuglog";function log(k,d){try{var a=JSON.parse(localStorage.getItem(K)||"[]");a.push({t:Date.now(),p:location.pathname,k:k,d:d});if(a.length>400)a=a.slice(-400);localStorage.setItem(K,JSON.stringify(a))}catch(e){}}window.enwankDebug={dump:function(){return localStorage.getItem(K)||"[]"},clear:function(){localStorage.removeItem(K)},off:function(){localStorage.removeItem("enwank:debug");localStorage.removeItem(K)}};var nav=performance.getEntriesByType("navigation")[0]||{};log("load",{type:nav.type});addEventListener("error",function(e){log("error",{m:String(e.message||"").slice(0,160),f:String(e.filename||"").slice(-70)})},true);addEventListener("unhandledrejection",function(e){log("reject",String(e.reason||"").slice(0,160))});addEventListener("pageshow",function(e){log("pageshow",{bfcache:e.persisted})});addEventListener("pagehide",function(e){log("pagehide",{bfcache:e.persisted})});document.addEventListener("visibilitychange",function(){log("vis",document.visibilityState)});addEventListener("click",function(e){var t=e.target;var a=t&&t.closest?t.closest("a,button"):null;if(a)log("click",(a.getAttribute("href")||a.textContent||"").trim().slice(0,60))},true);try{new PerformanceObserver(function(l){l.getEntries().forEach(function(en){if(en.duration>200)log("longtask",Math.round(en.duration))})}).observe({type:"longtask",buffered:true})}catch(e){}var last=Date.now();setInterval(function(){var n=Date.now(),g=n-last;last=n;if(g>1200)log("stall",g)},250);addEventListener("load",function(){var n=performance.getEntriesByType("navigation")[0]||{};log("loaded",{ttfb:Math.round(n.responseStart||0),dom:Math.round(n.domContentLoadedEventEnd||0),end:Math.round(n.loadEventEnd||0)})});setTimeout(function(){log("react",!!document.querySelector("[data-bar] details[data-menu] summary"))},3000)})();`

/** The <html>/<body> both root layouts render; the locale decides lang, dir and the font stack (globals.css). */
export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={langTag(locale)} dir={dirFor(locale)} data-theme="dark" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <CurrencyProvider>{children}</CurrencyProvider>
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: MENU_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: DEBUG_SCRIPT }} />
      </body>
    </html>
  );
}
