import { describe, expect, it } from "vitest";
import { buildFetchUrl, catalogueSchema, fallbackCatalogue, resolveCatalogue, type FetchLike } from "./catalogue";

const URL = "https://3enwank.com/account/api/public/catalogue";

function fetchWith(handler: (url: string, init?: RequestInit) => Response | Promise<Response>): FetchLike {
  return async (url, init) => handler(url, init);
}

describe("catalogue fallback", () => {
  it("ships a fallback that validates and carries every product kind", () => {
    const c = fallbackCatalogue();
    expect(c.version).toBe(1);
    expect(c.products.hosting.length).toBeGreaterThan(0);
    expect(c.products.build.length).toBeGreaterThan(0);
    expect(c.products.care.length).toBeGreaterThan(0);
    for (const p of [...c.products.hosting, ...c.products.build, ...c.products.care]) {
      expect(p.prices.EGP?.gross).toBeGreaterThan(0);
      expect(p.storeUrl).toMatch(/^https:\/\/3enwank\.com\/account\/plans\//);
    }
  });

  it("carries the catalogue's depositBp for build packages", () => {
    const c = fallbackCatalogue();
    for (const p of c.products.build) expect(p.depositBp, p.slug).toBe(5000);
    for (const p of c.products.hosting) expect(p.depositBp, p.slug).toBeNull();
    const bad = structuredClone(c) as unknown as { products: { build: Array<{ depositBp: unknown }> } };
    bad.products.build[0]!.depositBp = 12000;
    expect(catalogueSchema.safeParse(bad).success).toBe(false);
  });

  it("uses the remote catalogue when it validates", async () => {
    const remote = { ...fallbackCatalogue(), generatedAt: "2030-01-01T00:00:00.000Z" };
    let seen: RequestInit | undefined;
    let seenUrl: string | undefined;
    const loaded = await resolveCatalogue({
      url: URL,
      source: "remote",
      auth: "staging:secret",
      buildId: "1700000000000",
      fetch: fetchWith((url, init) => {
        seenUrl = url;
        seen = init;
        return Response.json(remote);
      }),
    });
    expect(loaded.source).toBe("remote");
    expect(loaded.catalogue.generatedAt).toBe("2030-01-01T00:00:00.000Z");
    expect((seen?.headers as Record<string, string>).authorization).toBe(`Basic ${Buffer.from("staging:secret").toString("base64")}`);
    expect(seenUrl).toBe(`${URL}?build=1700000000000`);
  });

  it("fetches a URL no earlier build used, so the platform's 5-minute nginx cache never serves a build stale prices", async () => {
    const urls: string[] = [];
    const fetch = fetchWith((url) => {
      urls.push(url);
      return Response.json(fallbackCatalogue());
    });
    await resolveCatalogue({ url: URL, source: "remote", fetch });
    await new Promise((r) => setTimeout(r, 2));
    await resolveCatalogue({ url: URL, source: "remote", fetch });
    expect(urls).toHaveLength(2);
    for (const u of urls) expect(u).toMatch(/^https:\/\/3enwank\.com\/account\/api\/public\/catalogue\?build=\d+$/);
    expect(urls[0]).not.toBe(urls[1]);
    // The reason shown in the build log names the configured URL, not the cache-busted one.
    const failed = await resolveCatalogue({ url: URL, source: "remote", fetch: fetchWith(() => new Response("", { status: 503 })) });
    expect(failed.reason).toBe(`${URL} answered HTTP 503`);
  });

  it("keeps any query the configured URL already has", () => {
    expect(buildFetchUrl("https://staging.example/api/public/catalogue?x=1", "42")).toBe("https://staging.example/api/public/catalogue?x=1&build=42");
  });

  it("falls back on HTTP errors, network errors, invalid JSON and contract drift", async () => {
    const cases: Array<[string, FetchLike]> = [
      ["answered HTTP 404", fetchWith(() => new Response("not here", { status: 404 }))],
      ["fetch failed", fetchWith(() => Promise.reject(new TypeError("fetch failed")))],
      ["Unexpected", fetchWith(() => new Response("<html>", { status: 200 }))],
      ["did not match", fetchWith(() => Response.json({ version: 2 }))],
    ];
    for (const [reason, fetch] of cases) {
      const loaded = await resolveCatalogue({ url: URL, source: "remote", fetch });
      expect(loaded.source).toBe("fallback");
      expect(loaded.reason).toContain(reason);
      expect(loaded.catalogue).toEqual(fallbackCatalogue());
    }
  });

  it("skips the network when CATALOGUE_SOURCE=fallback", async () => {
    const loaded = await resolveCatalogue({ url: URL, source: "fallback", fetch: fetchWith(() => Promise.reject(new Error("must not be called"))) });
    expect(loaded).toMatchObject({ source: "fallback", reason: "CATALOGUE_SOURCE=fallback" });
  });

  it("gives up on a slow store", async () => {
    const loaded = await resolveCatalogue({
      url: URL,
      source: "remote",
      timeoutMs: 20,
      fetch: fetchWith((_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)))),
    });
    expect(loaded.source).toBe("fallback");
    expect(loaded.reason).toContain("timed out");
  });

  it("rejects prices that are not integers", () => {
    const bad = structuredClone(fallbackCatalogue()) as unknown as { products: { hosting: Array<{ prices: { EGP: { gross: number } } }> } };
    bad.products.hosting[0]!.prices.EGP.gross = 19.99;
    expect(catalogueSchema.safeParse(bad).success).toBe(false);
  });
});
