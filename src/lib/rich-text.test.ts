import { describe, expect, it } from "vitest";
import { parseInline, parseRichText } from "./rich-text";

describe("parseInline", () => {
  it("pulls bold out of a sentence", () => {
    expect(parseInline("XS is **EGP 1,999/year** including VAT")).toEqual([
      { type: "text", value: "XS is " },
      { type: "bold", value: "EGP 1,999/year" },
      { type: "text", value: " including VAT" },
    ]);
  });

  it("links a bare address without swallowing the sentence's full stop", () => {
    expect(parseInline("Order at https://3enwank.com/account.")).toEqual([
      { type: "text", value: "Order at " },
      { type: "link", href: "https://3enwank.com/account", value: "https://3enwank.com/account" },
      { type: "text", value: "." },
    ]);
  });

  it("leaves plain text alone and never links http or other schemes", () => {
    expect(parseInline("write to support@3enwank.com or visit http://example.com")).toEqual([
      { type: "text", value: "write to support@3enwank.com or visit http://example.com" },
    ]);
  });

  it("keeps a lone asterisk literal rather than guessing at bold", () => {
    expect(parseInline("2 * 3 is 6")).toEqual([{ type: "text", value: "2 * 3 is 6" }]);
  });
});

describe("parseRichText", () => {
  it("splits the answer the assistant actually writes into a paragraph and a list", () => {
    const blocks = parseRichText("It depends on what you need:\n\n- **XS**: one small website, **EGP 1,999/year**\n- **S**: small business website\n\nAll prices include VAT.");
    expect(blocks.map((b) => b.type)).toEqual(["p", "ul", "p"]);
    expect(blocks[1]).toMatchObject({ type: "ul" });
    const list = blocks[1] as { type: "ul"; items: unknown[] };
    expect(list.items).toHaveLength(2);
  });

  it("keeps consecutive lines of one paragraph together, and drops blank runs", () => {
    const blocks = parseRichText("first line\nsecond line\n\n\nnext paragraph");
    expect(blocks).toHaveLength(2);
    expect((blocks[0] as { lines: unknown[] }).lines).toHaveLength(2);
  });

  it("accepts the three bullet characters a model might choose", () => {
    for (const bullet of ["-", "*", "•"]) {
      const blocks = parseRichText(`${bullet} one\n${bullet} two`);
      expect(blocks[0]).toMatchObject({ type: "ul" });
      expect((blocks[0] as { items: unknown[] }).items).toHaveLength(2);
    }
  });

  it("returns nothing for an empty answer, so a streaming bubble stays empty", () => {
    expect(parseRichText("")).toEqual([]);
    expect(parseRichText("   \n\n  ")).toEqual([]);
  });
});
