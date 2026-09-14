import { serializeLd, type JsonLd as Data } from "@/lib/structured-data";

/**
 * A page's structured data as <script type="application/ld+json">, rendered in the page body as the
 * Next.js JSON-LD guide recommends. Server component: it ships no JavaScript, and a browser does not
 * run a script of this type.
 */
export function JsonLd({ data }: { data: Data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(data) }} />;
}
