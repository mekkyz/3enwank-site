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
    phone: z.string().nullable(),
    website: z.string(),
  }),
  store: z.object({ url: z.url(), plansUrl: z.url(), domainSearchUrl: z.url(), loginUrl: z.url(), registerUrl: z.url() }),
  domains: z.object({ enabled: z.boolean() }),
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

let loading: Promise<LoadedCatalogue> | undefined;

/** One fetch per build process; every page shares the result. */
export function loadCatalogue(): Promise<LoadedCatalogue> {
  loading ??= resolveCatalogue({ url: CATALOGUE_URL, source: CATALOGUE_SOURCE, auth: CATALOGUE_AUTH }).then((loaded) => {
    if (loaded.source === "fallback") console.warn(`[catalogue] using catalogue.fallback.json: ${loaded.reason}`);
    else console.info(`[catalogue] loaded ${CATALOGUE_URL} (generated ${loaded.catalogue.generatedAt})`);
    return loaded;
  });
  return loading;
}
