import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fallbackCatalogue } from "@/lib/catalogue";
import { locales } from "@/lib/i18n";
import { vatLine } from "@/lib/vat";
import { homePaymentsCopy } from "@/lib/payments";
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

  it("uses {legalName} and {version} where the screens fill them", () => {
    for (const locale of locales) {
      const t = messagesFor(locale);
      expect(t.about.lede, locale).toContain("{legalName}");
      expect(t.terms.intro, locale).toContain("{version}");
    }
  });

  it("sets a Latin value in an Arabic sentence as its own left-to-right run, percent sign included", () => {
    /*
     * "2026-09-10" after an Arabic letter was laid out as "10-09-2026", and the percent sign in
     * "{deposit}٪ … و{rest}٪" landed on a different side of each number. The isolates are U+2066
     * and U+2069; English sentences and metadata text (isolate: false) carry none.
     */
    const ar = messagesFor("ar");
    const en = messagesFor("en");
    expect(fill(ar.terms.intro, { legalName: "X", version: "2026-09-10" })).toContain("\u20662026-09-10\u2069");
    expect(fill(ar.websites.deposit, { deposit: 50, rest: 50 })).toBe("\u206650٪\u2069 في الأول، و\u206650٪\u2069 عند الموافقة");
    expect(fill(ar.common.vatIncluded, { rate: 14 })).toContain("\u206614٪\u2069");
    expect(fill(ar.terms.intro, { legalName: "X", version: "2026-09-10" }, { isolate: false })).not.toMatch(/[\u2066\u2069]/);
    expect(fill(en.websites.deposit, { deposit: 50, rest: 50 })).toBe("50% to start, 50% on approval");
  });

  it("states VAT once near prices with the catalogue's rate, and not at all while the business is not registered", () => {
    /*
     * This used to only check that vatIncluded carries {rate}. The business is below Egypt's VAT
     * registration threshold, so the catalogue publishes rateBp 0 until the owner flips registration
     * on, and the sentence must then not appear rather than read "0% VAT". The dictionary keeps the
     * sentence, with the placeholder and no rate typed into it, and the screens render it only when
     * the rate is above zero (lib/vat.ts); both halves are what a flip relies on.
     */
    const registered = { ...fallbackCatalogue(), vat: { rateBp: 1400, pricesIncludeVat: true } };
    const unregistered = { ...registered, vat: { rateBp: 0, pricesIncludeVat: true } };
    for (const locale of locales) {
      const t = messagesFor(locale);
      expect(t.common.vatIncluded.match(/\{rate\}/g), locale).toHaveLength(1);
      expect(t.common.vatIncluded, locale).not.toMatch(/\d/);
      expect(vatLine(t, registered), locale).toContain("14");
      expect(vatLine(t, unregistered), locale).toBeNull();
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

describe("home page copy the layout depends on", () => {
  it("keeps four reasons, four included items and six FAQ entries in both languages", () => {
    // screens/home.tsx pairs REASON_ICONS and WHY_ICONS with these arrays by position, and the FAQ is published as FAQPage JSON-LD.
    for (const locale of locales) {
      const t = messagesFor(locale);
      expect(t.home.reasons, locale).toHaveLength(4);
      expect(t.home.why, locale).toHaveLength(4);
      expect(t.home.faq, locale).toHaveLength(6);
      for (const item of [...t.home.reasons, ...t.home.why]) expect(item.title.trim() && item.body.trim(), locale).toBeTruthy();
      for (const item of t.home.faq) expect(item.q.trim() && item.a.trim(), locale).toBeTruthy();
    }
  });

  it("names the ways to pay only through placeholders the catalogue fills", () => {
    // lib/payments.ts fills these from catalogue.payments (D5). A method typed straight into the copy is one the store may not take.
    for (const locale of locales) {
      const t = messagesFor(locale);
      expect(t.home.payments.line.match(/\{methods\}/g), locale).toHaveLength(1);
      expect(t.home.reasons.filter((r) => r.body.includes("{kinds}")), locale).toHaveLength(1);
      expect(t.home.faq.filter((f) => f.a.includes("{methods}")), locale).toHaveLength(1);
      const { payments, ...homeRest } = t.home;
      void payments;
      expect(JSON.stringify(homeRest), locale).not.toMatch(/Vodafone|فودافون|InstaPay|إنستاباي|\bcard\b|كارت/i);
    }
  });

  it("states no VAT rate in the hero, the reasons, the payments line or the FAQ", () => {
    // Whether VAT is charged is the catalogue's to say (lib/vat.ts); copy written by hand may only say "where it applies".
    // The hero joined the check when it replaced heroFacts, which carried the old assertion (audit item).
    const every = { ...fallbackCatalogue(), payments: { bankTransfer: true, instapay: true, vodafoneCash: true, card: true } };
    for (const locale of locales) {
      const t = messagesFor(locale);
      const pay = homePaymentsCopy(t, every);
      const hero = [t.home.h1, t.home.lede, t.home.metaTitle, ...Object.values(t.home.tiles), ...Object.values(t.home.products).map((p) => p.title)];
      const copy = [...hero, pay.line, ...pay.reasons.map((r) => r.body), ...pay.faq.map((f) => f.a)].join(" ");
      expect(copy, locale).not.toMatch(/\d+\s*[%٪]/);
    }
  });
});

describe("legal pages say what the platform does", () => {
  /*
   * Each pattern is a sentence that once claimed more than the code: outbound mail goes through the
   * box's own postfix, not the email provider; invoices have no cancellation grace period (removal is
   * an admin terminate); anonymise.ts also refuses live domains and leftover credit and never edits a
   * backup or the support mailbox; the off-site backups sit with a storage provider (D12).
   */
  const text = (locale: (typeof locales)[number], page: "terms" | "privacy") => JSON.stringify(messagesFor(locale)[page]);
  const expected = {
    en: {
      terms: { absent: [/grace period/i], present: [/parked with its files kept until we terminate it/] },
      privacy: {
        absent: [/to and from our support address/],
        present: [/receives the mail sent to our support address/, /storage provider in Europe that holds our backups/, /no domain still registered with us or in transfer/, /no account credit left/, /backups are not edited/, /deleted from our mailbox by hand/],
      },
    },
    ar: {
      terms: { absent: [/مهلة الإلغاء/], present: [/مع الاحتفاظ بملفاته إلى أن نُنهيه/] },
      privacy: {
        absent: [/من عنوان الدعم وإليه/],
        present: [/تصل عبره الرسائل المرسلة إلى عنوان الدعم/, /مزوّد تخزين في أوروبا يحتفظ بنسخنا الاحتياطية/, /ولا نطاقات ما زالت مسجّلة لدينا أو قيد النقل/, /ولا رصيد متبقٍ في الحساب/, /ولا تُعدَّل نسخنا الاحتياطية/, /وتُحذف يدويًا من صندوق بريدنا/],
      },
    },
  } as const;

  it("matches the platform in both languages", () => {
    for (const locale of locales) {
      for (const page of ["terms", "privacy"] as const) {
        const rules = expected[locale][page];
        for (const re of rules.absent) expect(text(locale, page), `${locale} ${page}`).not.toMatch(re);
        for (const re of rules.present) expect(text(locale, page), `${locale} ${page}`).toMatch(re);
      }
    }
  });
});
