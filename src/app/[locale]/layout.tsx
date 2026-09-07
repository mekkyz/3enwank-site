import "@fontsource-variable/inter";
import "@fontsource-variable/noto-naskh-arabic";
import "../globals.css";
import type { ReactNode } from "react";
import { RootHtml } from "@/components/root";
import { localeFromParams, localeParams, type LocaleParams } from "@/lib/route-locale";

export const dynamicParams = false;

export function generateStaticParams() {
  return localeParams();
}

/** Root layout of every prefixed locale (/ar/…): sets lang, dir and the Arabic font stack. */
export default async function LocaleLayout({ children, params }: LocaleParams & { children: ReactNode }) {
  const locale = await localeFromParams(params);
  return <RootHtml locale={locale}>{children}</RootHtml>;
}
