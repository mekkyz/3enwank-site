import { readFileSync, readdirSync } from "node:fs";
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

  it("has no em dashes in the components either", () => {
    /*
     * The rule above only sees strings that live in a message file. A dash typed straight into JSX
     * is just as visible on the page and was how one got onto the care page, so the components are
     * read as text here. Comments are exempt: prose about the code is not copy on the page.
     */
    const dir = "src";
    const files = readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".tsx"));
    const bad: string[] = [];
    for (const file of files) {
      readFileSync(`${dir}/${file}`, "utf8")
        .split("\n")
        .forEach((line, i) => {
          const code = line.replace(/\/\/.*$/, "").replace(/^\s*\*.*$/, "");
          if (code.includes("\u2014")) bad.push(`${file}:${i + 1}`);
        });
    }
    expect(bad).toEqual([]);
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
  // The site has one Arabic now, and it is the Egyptian copy: the formal /ar-eg/ split is gone, so
  // these rules bind "ar". The legal pages are the exception and stay formal, as below.
  const eg = copy("ar");
  const egText = eg.map(([, s]) => s).join("\n");

  it("uses Egyptian vocabulary, not formal Arabic with a few words swapped", () => {
    expect(egText).toContain("إيميل");
    expect(egText).toContain("دومين");
    expect(egText).toContain("باقة");
    expect(messagesFor("ar").common.unlimited).toBe("مفتوح");
    // اطلبها is the order button. common.choose is a different label ("Choose") and says so.
    expect(messagesFor("ar").common.order).toBe("اطلبها");
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

  it("attaches a sentence-initial waw to its word", () => {
    // و is a prefix, not a word: neither a space nor a non-breaking space may follow it. The file
    // used to require a NBSP there, which rendered as a visible gap ("و الدعم" for "والدعم").
    const bad = eg.filter(([, s]) => /(^|[.؟!،]\s*)و[ \t\u00a0]/.test(s));
    expect(bad).toEqual([]);
  });

  it("is its own text, not the English one", () => {
    // What is left of the old "formal Arabic" check. It used to prove /ar/ was neither the Egyptian
    // copy nor the English one; the first half died with the Egyptian locale, the second still holds.
    const t = messagesFor("ar");
    const en = messagesFor("en");
    for (const [a, b] of [[t.home.h1, en.home.h1], [t.home.lede, en.home.lede], [t.hosting.lede, en.hosting.lede], [t.contact.h2, en.contact.h2]]) {
      expect(a).not.toBe(b);
      expect(a).toMatch(/[؀-ۿ]/);
    }
  });
});
