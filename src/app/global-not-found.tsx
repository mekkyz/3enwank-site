import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./globals.css";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { LOCALES, pathFor } from "@/lib/i18n";
import { messagesFor } from "@/messages";

/**
 * The site's 404 (out/404.html, which the static host serves for any unknown path). It bypasses the
 * layouts, so it carries its own <html> and speaks every language: a wrong URL has no locale.
 */
export const metadata: Metadata = { title: "404 · 3enwank", robots: { index: false, follow: false } };

export default function GlobalNotFound() {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center bg-surface px-5 py-16 text-ink">
        <main className="w-full max-w-md rounded-xl border border-line bg-panel p-8">
          <Logo />
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-brand tabular">404</p>
          {LOCALES.map((l, i) => {
            const t = messagesFor(l.code);
            return (
              <div key={l.code} lang={l.lang} dir={l.dir} className={i ? "mt-6 border-t border-line pt-6" : "mt-1"}>
                <h2 className="text-2xl font-extrabold">{t.notFound.title}</h2>
                <p className="mt-2 text-muted">{t.notFound.body}</p>
                <a href={pathFor("home", l.code)} className="mt-3 inline-block font-bold text-brand-strong hover:underline">
                  {t.notFound.home}
                </a>
              </div>
            );
          })}
        </main>
      </body>
    </html>
  );
}
