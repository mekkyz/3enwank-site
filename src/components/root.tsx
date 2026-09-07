import type { ReactNode } from "react";
import { dirFor, langTag, type Locale } from "@/lib/i18n";
import { CurrencyProvider } from "./currency";
import { THEME_KEY } from "./theme";

/** Applied before paint: the stored theme, dark by default. */
const THEME_SCRIPT = `try{document.documentElement.dataset.theme=localStorage.getItem(${JSON.stringify(THEME_KEY)})==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

/** The <html>/<body> both root layouts render; the locale decides lang, dir and the font stack (globals.css). */
export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={langTag(locale)} dir={dirFor(locale)} data-theme="dark" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
