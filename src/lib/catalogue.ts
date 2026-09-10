import { z } from "zod";
import fallbackJson from "../../catalogue.fallback.json";
import { CATALOGUE_AUTH, CATALOGUE_SOURCE, CATALOGUE_URL } from "./site";

/**
 * The platform's public catalogue (GET /api/public/catalogue on the store; contract in the platform
 * repo, docs/design/website.md). Fetched once per build; when the store cannot be reached, or answers
 * something that does not validate, the checked-in catalogue.fallback.json is used and a warning is
 * printed in the build log. Refresh the fallback with the platform's scripts/export-catalogue.ts.
 */
const localized = z.object({ en: z.string(), ar: z.string() });
const money = z.object({ gross: z.number().int().nonnegative(), formatted: z.string() });
const prices = z.object({ EGP: money.optional(), USD: money.optional() });

export const currencies = ["EGP", "USD"] as const;
export type Currency = (typeof currencies)[number];

const product = z.object({
  slug: z.string().min(1),
  kind: z.enum(["hosting", "build", "care"]),
  cycle: z.enum(["annual", "one_time"]),
  name: localized,
  summary: localized.nullable(),
  features: z.object({ en: z.array(z.string()), ar: z.array(z.string()) }),
  description: localized.nullable().optional(),
  /** Builds: share invoiced up front in basis points (5000 = 50%), what checkout charges; null elsewhere. */
  depositBp: z.number().int().min(0).max(10000).nullable().optional(),
  prices,
  options: z.array(
    z.object({
      key: z.string(),
      name: localized,
      values: z.array(z.object({ value: z.string(), label: localized, isDefault: z.boolean(), prices })),
    }),
  ),
  storeUrl: z.url(),
});

const tldPrices = z.object({ register: money, renew: money, transfer: money.nullable() });

export const catalogueSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string(),
  currencies: z.array(z.enum(currencies)),
  vat: z.object({ rateBp: z.number().int(), pricesIncludeVat: z.boolean() }),
  company: z.object({
    displayName: z.string(),
    legalName: localized,
    address: localized,
    supportEmail: z.string(),
    /** Where a visitor writes before they are a customer. Older stores omit it. */
    contactEmail: z.string().default(""),
    phone: z.string().nullable(),
    website: z.string(),
    /**
     * The registration numbers printed on every invoice. Optional and nullable so an older store
     * still validates; the footer draws nothing when they are absent rather than a placeholder.
     */
    taxId: z.string().nullable().default(null),
    commercialRegistry: z.string().nullable().default(null),
  }),
  /** What the company can actually take today. An older store omits it and nothing is claimed. */
  payments: z
    .object({ bankTransfer: z.boolean(), instapay: z.boolean(), vodafoneCash: z.boolean(), card: z.boolean() })
    .default({ bankTransfer: true, instapay: false, vodafoneCash: false, card: false }),
  store: z.object({ url: z.url(), plansUrl: z.url(), domainSearchUrl: z.url(), loginUrl: z.url(), registerUrl: z.url() }),
  domains: z.object({ enabled: z.boolean() }),
  /** Chat and name suggestions are served by the store only once its API key is set; older stores omit the field. */
  assistant: z.object({ enabled: z.boolean(), turnstileSiteKey: z.string().nullable().default(null) }).default({ enabled: false, turnstileSiteKey: null }),
  products: z.object({ hosting: z.array(product), build: z.array(product), care: z.array(product) }),
  tlds: z.array(
    z.object({
      tld: z.string().min(1),
      minYears: z.number().int(),
      maxYears: z.number().int(),
      privacy: z.boolean(),
      prices: z.object({ EGP: tldPrices.optional(), USD: tldPrices.optional() }),
    }),
  ),
  /** Everything on sale, not only the rows above: the table lists the common ones, the rest are searched for. */
  tldCount: z.number().int().nonnegative().default(0),
});

export type Catalogue = z.infer<typeof catalogueSchema>;
export type Product = Catalogue["products"]["hosting"][number];
export type Tld = Catalogue["tlds"][number];
export type Money = z.infer<typeof money>;

export type CatalogueSource = "remote" | "fallback";
export type LoadedCatalogue = { catalogue: Catalogue; source: CatalogueSource; reason: string | null };

/** The checked-in copy, validated so a bad refresh fails the build loudly instead of shipping junk. */
export function fallbackCatalogue(): Catalogue {
  return catalogueSchema.parse(fallbackJson);
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * The URL a build actually fetches: the endpoint URL plus a `build=<id>` query the platform ignores.
 * nginx caches /api/public/ for five minutes keyed on the request URI, so a unique query makes every
 * build reach the application and carry the catalogue as it is now, not as it was when the cache
 * last filled. Without it, a publish pressed right after a price change could rebuild old prices.
 */
export function buildFetchUrl(url: string, buildId: string): string {
  const target = new URL(url);
  target.searchParams.set("build", buildId);
  return target.toString();
}

/**
 * Fetch and validate the remote catalogue, else fall back. Pure with respect to configuration so
 * the decision can be tested; the build calls it with the environment (see loadCatalogue).
 */
export async function resolveCatalogue(opts: {
  url: string;
  source: string;
  auth?: string;
  fetch?: FetchLike;
  fallback?: () => Catalogue;
  timeoutMs?: number;
  /** Cache-busting id sent as `?build=`; defaults to the current time. */
  buildId?: string;
}): Promise<LoadedCatalogue> {
  const fallback = opts.fallback ?? fallbackCatalogue;
  if (opts.source === "fallback") return { catalogue: fallback(), source: "fallback", reason: "CATALOGUE_SOURCE=fallback" };
  const doFetch = opts.fetch ?? ((url, init) => fetch(url, init));
  try {
    const headers: Record<string, string> = { accept: "application/json" };
    if (opts.auth) headers.authorization = `Basic ${Buffer.from(opts.auth, "utf8").toString("base64")}`;
    const res = await doFetch(buildFetchUrl(opts.url, opts.buildId ?? String(Date.now())), { headers, signal: AbortSignal.timeout(opts.timeoutMs ?? 15_000) });
    if (!res.ok) return { catalogue: fallback(), source: "fallback", reason: `${opts.url} answered HTTP ${res.status}` };
    const parsed = catalogueSchema.safeParse(await res.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { catalogue: fallback(), source: "fallback", reason: `${opts.url} did not match the catalogue contract (${issue ? `${issue.path.join(".")}: ${issue.message}` : "unknown"})` };
    }
    return { catalogue: parsed.data, source: "remote", reason: null };
  } catch (err) {
    const message = err instanceof Error ? (err.name === "TimeoutError" ? "timed out" : err.message) : String(err);
    return { catalogue: fallback(), source: "fallback", reason: `${opts.url}: ${message}` };
  }
}

const REVALIDATE_SECONDS = 300;
const CATALOGUE_TAG = "catalogue";

/** The last catalogue the store answered with in this process; stands in when a refresh fails. */
let lastGood: Catalogue | undefined;

function building(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build" || process.env.NODE_ENV !== "production";
}

/**
 * The catalogue behind every page. Next caches the response and refreshes it in the background at
 * most every five minutes, or at once when /api/revalidate is called, so pages stay static between
 * refreshes and every page shares one request. A refresh that fails keeps the previous catalogue:
 * the last good one in this process, or, when there is none yet, the error makes Next keep the
 * page it already has. Only a build (or `next dev`) falls back to catalogue.fallback.json, so the
 * site always builds.
 */
export async function loadCatalogue(): Promise<LoadedCatalogue> {
  const loaded = await resolveCatalogue({
    url: CATALOGUE_URL,
    source: CATALOGUE_SOURCE,
    auth: CATALOGUE_AUTH,
    // One URL for every page, so the cached response is shared; the store is reached over loopback, no nginx cache in between.
    buildId: "live",
    fetch: (url, init) => fetch(url, { ...init, next: { revalidate: REVALIDATE_SECONDS, tags: [CATALOGUE_TAG] } }),
    fallback: () => lastGood ?? fallbackCatalogue(),
  });
  if (loaded.source === "remote") {
    lastGood = loaded.catalogue;
    return loaded;
  }
  if (lastGood) return { catalogue: lastGood, source: "remote", reason: null };
  if (!building()) throw new Error(`[catalogue] ${loaded.reason}`);
  console.warn(`[catalogue] using catalogue.fallback.json: ${loaded.reason}`);
  return loaded;
}

export { CATALOGUE_TAG };
