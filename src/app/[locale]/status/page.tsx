import { localeParams, type LocaleParams, localeFromParams } from "@/lib/route-locale";
import { status } from "@/screens/status";

export const dynamicParams = false;
// See the English route: per request, so a refused feed is never covered by an old render.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return localeParams();
}

export async function generateMetadata({ params }: LocaleParams) {
  return status.metadata(await localeFromParams(params));
}

export default async function Page({ params }: LocaleParams) {
  return status.render(await localeFromParams(params));
}
