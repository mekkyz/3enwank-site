import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n";
import { fill, messagesFor } from "./index";

type Tree = { [k: string]: unknown };

/** Every string in a dictionary with its dotted path. */
function strings(tree: Tree, prefix = ""): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.push([key, v]);
    else if (Array.isArray(v)) v.forEach((item, i) => (typeof item === "string" ? out.push([`${key}[${i}]`, item]) : out.push(...strings(item as Tree, `${key}[${i}]`))));
    else if (v && typeof v === "object") out.push(...strings(v as Tree, key));
  }
  return out;
}

/** The catalogue translation maps are keyed by English source text and are not copy. */
function copy(locale: (typeof locales)[number]): Array<[string, string]> {
  const { features, ...rest } = messagesFor(locale);
  void features;
  return strings(rest as Tree);
}

describe("message placeholders", () => {
  it("carries exactly one {price} in hosting.addonBody", () => {
    for (const locale of locales) {
      const body = messagesFor(locale).hosting.addonBody;
      expect(body.match(/\{price\}/g), locale).toHaveLength(1);
      const [before, after] = body.split("{price}");
      expect(before!.trim().length, locale).toBeGreaterThan(0);
      expect(after!.trim().length, locale).toBeGreaterThan(0);
    }
  });

  it("carries {deposit} and {rest} once each and no hard-coded split", () => {
    for (const locale of locales) {
      const t = messagesFor(locale);
      expect(t.websites.deposit.match(/\{deposit\}/g), locale).toHaveLength(1);
      expect(t.websites.deposit.match(/\{rest\}/g), locale).toHaveLength(1);
      expect(t.websites.deposit, locale).not.toMatch(/\d+%/);
      expect(fill(t.websites.deposit, { deposit: 30, rest: 70 })).toContain("30");
    }
  });

  it("uses {legalName}, {version} and {rate} where the screens fill them", () => {
    for (const locale of locales) {
      const t = messagesFor(locale);
      expect(t.about.lede, locale).toContain("{legalName}");
      expect(t.terms.intro, locale).toContain("{version}");
      expect(t.common.vatIncluded.match(/\{rate\}/g), locale).toHaveLength(1);
    }
  });
});

describe("writing rules", () => {
  it("has no em dashes anywhere", () => {
    for (const locale of locales) {
      const bad = strings(messagesFor(locale) as unknown as Tree).filter(([, s]) => s.includes("—"));
      expect(bad, locale).toEqual([]);
    }
  });

  it("has no exclamation marks and none of the words that read as generated copy", () => {
    const banned = /\b(seamless(ly)?|elevate[sd]?|empower(s|ed|ing)?|unlock(s|ed|ing)?|cutting-edge|leverage|synergy|robust|world-class|next-level|effortless(ly)?|hassle-free)\b/i;
    for (const locale of locales) {
      const bad = copy(locale).filter(([, s]) => banned.test(s) || /[!！]/.test(s));
      expect(bad, locale).toEqual([]);
    }
  });

  it("does not describe the service as Egypt-only", () => {
    const bad = copy("en").filter(([k, s]) => /for (Egyptian|Egypt's) (businesses|companies)|businesses in Egypt\b(?! and)/i.test(s) && !k.startsWith("about."));
    expect(bad).toEqual([]);
  });
});

describe("Egyptian Arabic", () => {
  const eg = copy("ar-eg");
  const egText = eg.map(([, s]) => s).join("\n");

  it("uses Egyptian vocabulary, not formal Arabic with a few words swapped", () => {
    expect(egText).toContain("إيميل");
    expect(egText).toContain("دومين");
    expect(egText).toContain("باقة");
    expect(messagesFor("ar-eg").common.unlimited).toBe("مفتوح");
    expect(messagesFor("ar-eg").common.choose).toBe("اطلبها");
    // Formal words the dialect does not use (legal pages are formal by design and excluded).
    const legal = ["terms.", "privacy.", "delivery.", "refunds."];
    const informal = eg.filter(([k]) => !legal.some((p) => k.startsWith(p)));
    // Whole words only. Arabic has no \b that helps here — \bالتي\b matches inside التيكتات, which
    // is dialect for "the tickets" — so each word is fenced by "no Arabic letter either side".
    const A = "\\u0600-\\u06FF";
    const word = (w: string) => new RegExp(`(?<![${A}])${w}(?![${A}])`);
    const formalWords = ["بريد(?!ك الإلكتروني)", "نطاق", "غير محدود", "بالإضافة إلى", "حيث", "الذي", "التي", "لديك", "يمكنك"];
    const formal = informal.filter(([, s]) => formalWords.some((w) => word(w).test(s)));
    expect(formal).toEqual([]);
  });

  it("follows a sentence-initial waw with a non-breaking space", () => {
    // "و" starting a sentence: at the beginning of a string or after ., ؟, ! and a space.
    const bad = eg.filter(([, s]) => /(^|[.؟!]\s+)و[ \t]/.test(s));
    expect(bad).toEqual([]);
    const nb = eg.filter(([, s]) => /(^|[.؟!]\s+)و /.test(s));
    expect(nb.length).toBeGreaterThan(3);
  });
});

describe("formal Arabic", () => {
  it("is its own text, not the Egyptian one and not the English one", () => {
    const ar = messagesFor("ar");
    const eg = messagesFor("ar-eg");
    const en = messagesFor("en");
    const pairs: Array<[string, string, string]> = [
      [ar.home.h1, eg.home.h1, en.home.h1],
      [ar.home.lede, eg.home.lede, en.home.lede],
      [ar.hosting.lede, eg.hosting.lede, en.hosting.lede],
      [ar.contact.h2, eg.contact.h2, en.contact.h2],
    ];
    for (const [a, b, c] of pairs) {
      expect(a).not.toBe(b);
      expect(a).not.toBe(c);
      expect(a).toMatch(/[؀-ۿ]/);
    }
  });
});
