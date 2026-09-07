import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
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
  revalidateTag(CATALOGUE_TAG, "max");
  revalidatePath("/", "layout");
  const id = new Date().toISOString();
  return Response.json({ success: true, result: { id } }, { headers: { "Cache-Control": "no-store" } });
}
