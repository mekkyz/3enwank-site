import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "../globals.css";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import { RootHtml } from "@/components/root";
import { localeFromParams, localeParams, type LocaleParams } from "@/lib/route-locale";

export const dynamicParams = false;

export const viewport: Viewport = { colorScheme: "dark light", themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0e1020" }, { media: "(prefers-color-scheme: light)", color: "#ffffff" }] };

export function generateStaticParams() {
  return localeParams();
}

/** Root layout of every prefixed locale (/ar/…): sets lang, dir and the Arabic font stack. */
export default async function LocaleLayout({ children, params }: LocaleParams & { children: ReactNode }) {
  const locale = await localeFromParams(params);
  return <RootHtml locale={locale}>{children}</RootHtml>;
}
