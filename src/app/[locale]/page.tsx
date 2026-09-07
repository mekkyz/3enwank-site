import { localeParams, type LocaleParams, localeFromParams } from "@/lib/route-locale";
import { screens } from "@/screens";

export const dynamicParams = false;

export function generateStaticParams() {
  return localeParams();
}

export async function generateMetadata({ params }: LocaleParams) {
  return screens.home.metadata(await localeFromParams(params));
}

export default async function Page({ params }: LocaleParams) {
  return screens.home.render(await localeFromParams(params));
}
