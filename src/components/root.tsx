import type { ReactNode } from "react";
import { dirFor, langTag, type Locale } from "@/lib/i18n";
import { CurrencyProvider } from "./currency";

/** The <html>/<body> both root layouts render; the locale decides lang, dir and the font stack (globals.css). */
export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={langTag(locale)} dir={dirFor(locale)} className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
