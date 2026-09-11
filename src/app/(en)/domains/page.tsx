import { screens } from "@/screens";

export const metadata = screens.domains.metadata("en");

/**
 * `?q=` makes this page dynamic, which is the point: without JavaScript the search form comes back
 * here and the answer has to be rendered. With no query it is the cached page it always was.
 */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  return screens.domains.render("en", { q: one(sp.q), added: one(sp.added), error: one(sp.error) });
}
