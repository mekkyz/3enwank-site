import { status } from "@/screens/status";

/*
 * Rendered per request, never ISR (platform docs/design/status-page.md 6.3): ISR serves the page it
 * rendered last while it refreshes, so the first visitor after a quiet hour would get an hour-old
 * green. src/lib/status.ts memoises the feed for 20 s, which is the only cache.
 */
export const dynamic = "force-dynamic";

export function generateMetadata() {
  return status.metadata("en");
}

export default function Page() {
  return status.render("en");
}
