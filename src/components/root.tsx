import type { ReactNode } from "react";
import { dirFor, langTag, type Locale } from "@/lib/i18n";
import { CurrencyProvider } from "./currency";
import { THEME_KEY } from "@/lib/theme";

/** Applied before paint: the stored theme, dark by default. */
const THEME_SCRIPT = `document.documentElement.classList.add("js");try{document.documentElement.dataset.theme=localStorage.getItem(${JSON.stringify(THEME_KEY)})==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

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
        <CurrencyProvider>{children}</CurrencyProvider>
        <script dangerouslySetInnerHTML={{ __html: MENU_SCRIPT }} />
      </body>
    </html>
  );
}
