/**
 * The little bit of Markdown the assistant actually writes: bullet lists, bold and bare links.
 * The model was already writing them and the panel showed the asterisks, which reads as broken.
 *
 * This produces a structure, not HTML, so the component can render React nodes and there is no
 * escaping to get wrong. Anything not listed here stays literal text: headings, tables and code
 * fences are not rendered, and the assistant is told not to write them.
 */
export type Inline = { type: "text"; value: string } | { type: "bold"; value: string } | { type: "link"; href: string; value: string };

export type Block = { type: "p"; lines: Inline[][] } | { type: "ul"; items: Inline[][] };

const BOLD = /\*\*(.+?)\*\*/g;
// Bare links only, and only https: the assistant is told to give our own addresses.
const LINK = /https:\/\/[^\s<>"')\]]+/g;

function trimTrailingPunctuation(url: string): { href: string; rest: string } {
  const match = /[.,;:!?)\]]+$/.exec(url);
  if (!match) return { href: url, rest: "" };
  return { href: url.slice(0, match.index), rest: url.slice(match.index) };
}

/** Split one line into text, bold and link runs. Bold is resolved first, then links inside the text runs. */
export function parseInline(line: string): Inline[] {
  const out: Inline[] = [];
  const pushText = (value: string) => {
    if (!value) return;
    let last = 0;
    for (const m of value.matchAll(LINK)) {
      const start = m.index ?? 0;
      if (start > last) out.push({ type: "text", value: value.slice(last, start) });
      const { href, rest } = trimTrailingPunctuation(m[0]);
      out.push({ type: "link", href, value: href });
      if (rest) out.push({ type: "text", value: rest });
      last = start + m[0].length;
    }
    if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  };

  let cursor = 0;
  for (const m of line.matchAll(BOLD)) {
    const start = m.index ?? 0;
    pushText(line.slice(cursor, start));
    out.push({ type: "bold", value: m[1]! });
    cursor = start + m[0].length;
  }
  pushText(line.slice(cursor));
  return out;
}

const BULLET = /^\s*[-*•]\s+/;

/** Group the answer into paragraphs and bullet lists. Blank lines separate blocks. */
export function parseRichText(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: Inline[][] = [];
  let list: Inline[][] = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "p", lines: paragraph });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "ul", items: list });
    list = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      flushParagraph();
      continue;
    }
    if (BULLET.test(line)) {
      flushParagraph();
      list.push(parseInline(line.replace(BULLET, "")));
      continue;
    }
    flushList();
    paragraph.push(parseInline(line));
  }
  flushList();
  flushParagraph();
  return blocks;
}
