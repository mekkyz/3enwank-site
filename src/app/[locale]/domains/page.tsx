import { localeParams, type LocaleParams, localeFromParams } from "@/lib/route-locale";
import { screens } from "@/screens";

export const dynamicParams = false;

export function generateStaticParams() {
  return localeParams();
}

export async function generateMetadata({ params }: LocaleParams) {
  return screens.domains.metadata(await localeFromParams(params));
}

/** See the English route: `?q=` renders the answer here rather than on a second page. */
export default async function Page({ params, searchParams }: LocaleParams & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [locale, sp] = await Promise.all([localeFromParams(params), searchParams]);
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  return screens.domains.render(locale, { q: one(sp.q), added: one(sp.added) });
}
