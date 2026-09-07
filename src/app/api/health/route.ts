/** Liveness for the deploy script and monitors: the process answers, nothing more. */
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({ ok: true, version: process.env.SITE_VERSION ?? null }, { headers: { "Cache-Control": "no-store" } });
}
