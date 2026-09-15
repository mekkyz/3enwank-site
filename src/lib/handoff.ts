/**
 * Handing an assistant conversation to a person (owner, 2026-09-15, S8): "Continue on WhatsApp" opens
 * WhatsApp with the visitor's question and a short summary written, "Send as a support ticket" opens
 * the customer area's new ticket page with a subject and message written, and the contact form can take
 * the question as its note.
 *
 * Built here in the browser, in the same shape and to the same limits as the platform's
 * src/lib/assistant/handoff.ts, rather than by POSTing to its /api/public/assistant/handoff route:
 *  - that route refuses while the assistant is switched off, which is exactly when the chat answers
 *    "not switched on yet" and a person is the only way forward;
 *  - the links have to be real hrefs, because a window opened after an awaited fetch is a popup that
 *    Safari blocks;
 *  - nothing here calls a model or stores anything, so there is nothing the server adds. The ticket
 *    page still cleans and limits both fields itself (platform support/prefill.ts ticketPrefill).
 * Pure, so the tests can pin the output.
 */
export type HandoffMessage = { role: "user" | "assistant"; content: string };

export const HANDOFF_QUESTION_MAX = 400;
export const HANDOFF_ANSWER_MAX = 300;
/** wa.me carries the text in the URL; this keeps the whole link comfortably short. */
export const HANDOFF_WHATSAPP_MAX = 1200;
export const HANDOFF_SUBJECT_MAX = 80;
/** The platform's PREFILL_MESSAGE_MAX: anything longer would be cut on arrival anyway. */
export const HANDOFF_MESSAGE_MAX = 2000;
/** The contact form's note is sent cut to 300 (lead-form.tsx). */
export const HANDOFF_NOTE_MAX = 300;

/** The words around the quoted messages, in the page's language. */
export type HandoffLabels = { waIntro: string; question: string; alsoAsked: string; assistantSaid: string; fromChat: string };

export type Handoff = { question: string; summary: string; whatsappText: string; ticket: { subject: string; message: string } };

/** Cut to `max` characters without splitting a surrogate pair. */
function cut(text: string, max: number): string {
  const chars = Array.from(text);
  return chars.length > max ? `${chars.slice(0, max).join("").trimEnd()}...` : text;
}

/**
 * The chat's own markup ("- " bullets, **bold**, [links](url)) removed and the lines joined into one.
 * A line that does not end a sentence is joined with "; ", so two bullets do not run into one clause
 * ("email and database The site stays online" in the first screenshots).
 */
export function plainLine(text: string, max: number): string {
  const lines = text
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[<>]/g, " ")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*-\s+/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const joined = lines.reduce((acc, line) => (acc ? `${acc}${/[.:;?!؟،,]$/.test(acc) ? " " : "; "}${line}` : line), "");
  return cut(joined, max);
}

/** Null when the visitor has not asked anything yet: there is nothing to hand over. */
export function buildHandoff(messages: readonly HandoffMessage[], labels: HandoffLabels): Handoff | null {
  const asked = messages.filter((m) => m.role === "user").map((m) => plainLine(m.content, HANDOFF_QUESTION_MAX)).filter(Boolean);
  if (!asked.length) return null;
  const answers = messages.filter((m) => m.role === "assistant").map((m) => plainLine(m.content, HANDOFF_ANSWER_MAX)).filter(Boolean);
  const question = asked[0]!;
  const lines: string[] = [];
  if (asked.length > 1) lines.push(`${labels.alsoAsked}: ${asked[asked.length - 1]}`);
  if (answers.length) lines.push(`${labels.assistantSaid}: ${answers[answers.length - 1]}`);
  const summary = lines.join("\n");
  const whatsappText = Array.from([labels.waIntro, `${labels.question}: ${question}`, ...(summary ? ["", summary] : [])].join("\n"))
    .slice(0, HANDOFF_WHATSAPP_MAX)
    .join("");
  const subject = plainLine(question, HANDOFF_SUBJECT_MAX);
  const message = Array.from([question, ...(summary ? ["", `${labels.fromChat}:`, summary] : [])].join("\n"))
    .slice(0, HANDOFF_MESSAGE_MAX)
    .join("");
  return { question, summary, whatsappText, ticket: { subject, message } };
}

/** The customer area's new ticket page with both fields written; `store` is the store's URL, basePath included. */
export function ticketHref(store: string, ticket: { subject: string; message: string }): string {
  const qs = new URLSearchParams({ subject: ticket.subject, message: ticket.message });
  return `${store.replace(/\/+$/, "")}/tickets/new?${qs.toString()}`;
}
