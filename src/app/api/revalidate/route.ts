import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CATALOGUE_TAG } from "@/lib/catalogue";

/**
 * Refresh every page at once: the platform's "Publish website" button posts to /api/revalidate/ (the hook URL
 * carries the token, like a Cloudflare deploy hook did), and so can a shell script after a catalogue
 * change. Pages refresh on their own every five minutes anyway; this is for "I changed a price and
 * want to see it now". The answer mimics the shape the admin page already knows how to read.
 */
export const dynamic = "force-dynamic";

function tokenMatches(given: string | null): boolean {
  const expected = (process.env.SITE_REVALIDATE_SECRET ?? "").trim();
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!tokenMatches(url.searchParams.get("token") ?? bearer)) {
    return Response.json({ success: false, error: "forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  // The catalogue is the only thing this hook can change, and every page reads it through a fetch
  // carrying this tag, so invalidating the tag refreshes all of them.
  //
  // It used to also call revalidatePath("/", "layout"). That took every localised page off the air:
  // the Arabic and Egyptian pages are prerendered params of a dynamic [locale] route, and clearing
  // the layout subtree dropped their prerendered entries, after which Next answered NoFallbackError
  // and served 404 for /ar and /ar-eg until the service was restarted. Reproduced on the live site
  // on 2026-09-09; one press of "Publish website" in the admin was enough.
  revalidateTag(CATALOGUE_TAG, "max");
  const id = new Date().toISOString();
  return Response.json({ success: true, result: { id } }, { headers: { "Cache-Control": "no-store" } });
}
