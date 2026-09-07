import "@fontsource-variable/inter";
import "@fontsource-variable/noto-naskh-arabic";
import "./globals.css";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { pathFor } from "@/lib/i18n";
import { messagesFor } from "@/messages";

/**
 * The site's 404 (out/404.html, which Cloudflare Pages serves for any unknown path). It bypasses the
 * layouts, so it carries its own <html> and speaks both languages: a wrong URL has no locale.
 */
export const metadata: Metadata = { title: "404 · 3enwank", robots: { index: false, follow: false } };

export default function GlobalNotFound() {
  const en = messagesFor("en");
  const ar = messagesFor("ar");
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center bg-surface px-4 py-16 text-ink">
        <main className="w-full max-w-md rounded-xl border border-line bg-panel p-8 shadow-sm">
          <Logo className="h-7 w-auto" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brand tabular">404</p>
          <h1 className="mt-1 text-2xl font-bold">{en.notFound.title}</h1>
          <p className="mt-2 text-muted">{en.notFound.body}</p>
          <a href={pathFor("home", "en")} className="mt-4 inline-block font-semibold text-brand hover:underline">
            {en.notFound.home} →
          </a>
          <div lang="ar" dir="rtl" className="mt-8 border-t border-line pt-6">
            <h2 className="text-2xl font-bold">{ar.notFound.title}</h2>
            <p className="mt-2 text-muted">{ar.notFound.body}</p>
            <a href={pathFor("home", "ar")} className="mt-4 inline-block font-semibold text-brand hover:underline">
              {ar.notFound.home} ←
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
