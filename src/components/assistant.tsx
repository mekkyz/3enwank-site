"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { ChatCircleDotsIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { contactHref, storeLink, type Locale } from "@/lib/i18n";
import { turnstileToken } from "@/lib/turnstile";
import { parseRichText, type Inline } from "@/lib/rich-text";
import { HANDOFF_NOTE_MAX, buildHandoff, plainLine, ticketHref } from "@/lib/handoff";
import { waHref } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./icons";
import type { Messages } from "@/messages";

export type AssistantLabels = Messages["assistant"];
type Msg = { role: "user" | "assistant"; content: string };
type Status = "idle" | "streaming" | "error" | "unavailable";

const KEY = "3enwank.assistant";
const MAX_TURNS = 20;
/** The width below which the assistant is a full sheet and its button steps aside from content: Tailwind's md. */
const PHONE = "(max-width: 47.99rem)";
/**
 * What the corner button must never sit on while a phone reader looks at it (owner, 2026-09-15, S8):
 * tables, forms and their fields, every price (each <Price> span carries data-currency), the rows
 * marked data-float-avoid (plan specs, feature lists, domain results), and anything that is tapped (a
 * link, a button, a tab, an FAQ question): the first screenshots had it sitting on the Care plans tab.
 *
 * `[data-currency]:not(html)`: root.tsx also stamps data-currency on <html> for the currency switch, and
 * every element's closest() reached it, so the button stayed tucked on every phone page (verify, S8).
 * Only the <Price> spans are meant.
 */
const AVOID = "table, form, input, select, textarea, [data-currency]:not(html), [data-float-avoid], a[href], button, summary, [role=tab]";
const FOCUSABLE = 'a[href], button:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';

function restore(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (m): m is Msg => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
        )
      : [];
  } catch {
    return [];
  }
}

/** Whether the viewport is phone-sized, as an external store: false on the server, where nothing is open anyway. */
function subscribePhone(onChange: () => void) {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const isPhoneNow = () => window.matchMedia(PHONE).matches;
const isPhoneOnServer = () => false;

/** Three dots while the answer is still on its way, so the panel is never silently blank. */
function Dots({ label }: { label: string }) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="chat-dot inline-block h-1.5 w-1.5 rounded-full bg-muted"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

/** Renders the small Markdown subset the assistant writes, as React nodes rather than HTML. */
function Rich({ text }: { text: string }) {
  const inline = (parts: Inline[], key: number) => (
    <span key={key}>
      {parts.map((part, i) =>
        part.type === "bold" ? (
          <strong key={i} className="font-bold">
            {part.value}
          </strong>
        ) : part.type === "link" ? (
          <a
            key={i}
            href={part.href}
            className="underline underline-offset-2 hover:text-brand"
            target="_blank"
            rel="noopener noreferrer"
          >
            {part.value}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </span>
  );
  return (
    <>
      {parseRichText(text).map((block, b) =>
        block.type === "ul" ? (
          <ul key={b} className="my-1.5 space-y-1 ps-4">
            {block.items.map((item, i) => (
              <li key={i} className="list-disc">
                {inline(item, i)}
              </li>
            ))}
          </ul>
        ) : (
          <span key={b} className="block [&:not(:first-child)]:mt-2">
            {block.lines.map((line, i) => (
              <span key={i} className="block">
                {inline(line, i)}
              </span>
            ))}
          </span>
        ),
      )}
    </>
  );
}

/**
 * The assistant, as the owner set it on 2026-09-15 (S8).
 *
 * A labelled corner button, a small pill reading "Ask" with a speech mark and no rings, replacing a
 * 56px purple disc that sat on plan specs, prices and form fields on a phone. On a phone it tucks away
 * below the screen edge while the reader scrolls down, and stays away whenever it would cover a table,
 * a price, a form or a marked row (AVOID); it comes back when scrolling stops or turns up over plain
 * text. The slide says where it went, which is the one kind of motion this site keeps. A keyboard user
 * who tabs to it gets it back whatever the page is doing (focus-visible).
 *
 * Opened, it is a full sheet on a phone (modal: Tab stays inside, the page behind does not scroll) and
 * a docked panel down the end side on a wider screen, where the page beside it stays usable. It was a
 * 24rem popup floating over the page at every width.
 *
 * Handing over to a person: once the visitor has asked something, "Continue on WhatsApp" opens WhatsApp
 * with the question and a short summary written, "Send as a support ticket" opens the customer area's
 * new ticket page with the subject and message written (a signed-out visitor is sent through log in
 * first, with the address kept), and the contact form takes the question as its note for someone without
 * an account. The links are built here (lib/handoff.ts says why not from the store's handoff route).
 * Nothing in it tells people to email about an account problem any more.
 *
 * Talks to the store's public assistant endpoint, which streams plain text; the conversation lives in
 * this tab only. Closed on the server render, so restoring the conversation changes no markup.
 *
 * Icons are Phosphor's /dist/ssr entry at the bold weight, as everywhere else in the repo (see
 * components/icons.tsx); none takes `mirrored`, the speech mark being an object rather than a direction.
 */
export function Assistant({
  url,
  store,
  locale,
  labels,
  whatsapp,
  turnstileSiteKey = null,
}: {
  url: string;
  /** The store's URL, basePath included, for the ticket link. */
  store: string;
  locale: Locale;
  labels: AssistantLabels;
  whatsapp: string | null;
  turnstileSiteKey?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(restore);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [tucked, setTucked] = useState(false);
  const phone = useSyncExternalStore(subscribePhone, isPhoneNow, isPhoneOnServer);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  /** The fixed box the launcher sits in. It is never transformed, so it still measures where the button belongs while the button is tucked. */
  const dockRef = useRef<HTMLDivElement>(null);
  /** Set when the panel is closed by the visitor, so focus goes back to the launcher once it is rendered again. */
  const returnFocus = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  /** Follow the answer only while the reader is already at the bottom; never yank them back up. */
  const stickRef = useRef(true);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_TURNS)));
    } catch {
      // Storage blocked: the conversation lasts until the page changes.
    }
    if (stickRef.current) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      return;
    }
    abortRef.current?.abort();
    if (returnFocus.current) {
      returnFocus.current = false;
      launcherRef.current?.focus();
    }
  }, [open]);

  /*
   * Tucking on a phone. Scrolling down tucks the button; a pause of 600ms, or scrolling up, brings it
   * back unless the spot it would occupy is over something in AVOID. Measured at the centre and the
   * four inset corners of the dock with elementsFromPoint, skipping the button's own elements. Every
   * state change happens inside a frame or a timer callback, never in the effect body.
   */
  useEffect(() => {
    if (open) return;
    let lastY = window.scrollY;
    let frame = 0;
    let idle = 0;
    const covers = () => {
      const dock = dockRef.current;
      if (!dock) return false;
      const r = dock.getBoundingClientRect();
      const points: Array<[number, number]> = [
        [r.left + r.width / 2, r.top + r.height / 2],
        [r.left + 4, r.top + 4],
        [r.right - 4, r.top + 4],
        [r.left + 4, r.bottom - 4],
        [r.right - 4, r.bottom - 4],
      ];
      return points.some(([x, y]) => {
        const under = document.elementsFromPoint(x, y).find((el) => !dock.contains(el));
        return !!under?.closest(AVOID);
      });
    };
    const settle = () => setTucked(window.matchMedia(PHONE).matches && covers());
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const phoneNow = window.matchMedia(PHONE).matches;
        if (!phoneNow) setTucked(false);
        else if (y > lastY + 2) setTucked(true);
        else if (y < lastY - 2) setTucked(covers());
        lastY = y;
        window.clearTimeout(idle);
        idle = window.setTimeout(settle, 600);
      });
    };
    frame = requestAnimationFrame(settle);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || status === "streaming") return;
    const next = [...messages, { role: "user" as const, content: text }].slice(-MAX_TURNS);
    setMessages(next);
    setInput("");
    setStatus("streaming");
    stickRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const token = await turnstileToken(turnstileSiteKey);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ messages: next, locale, ...(token ? { turnstileToken: token } : {}) }),
      });
      if (res.status === 503) return setStatus("unavailable");
      if (!res.ok || !res.body) return setStatus("error");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      setMessages([...next, { role: "assistant", content: "" }]);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const snapshot = reply;
        setMessages([...next, { role: "assistant", content: snapshot }]);
      }
      setStatus(reply.trim() ? "idle" : "error");
    } catch (err) {
      // Stopping on purpose is not a failure: whatever arrived stays on screen.
      setStatus(err instanceof DOMException && err.name === "AbortError" ? "idle" : "error");
    } finally {
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  /** Re-ask the last question, dropping the answer that failed. */
  function retry() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const trimmed = messages.slice(0, messages.lastIndexOf(lastUser));
    setMessages(trimmed);
    void send(lastUser.content);
  }

  function clear() {
    abortRef.current?.abort();
    setMessages([]);
    setStatus("idle");
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      // Nothing to forget.
    }
    inputRef.current?.focus();
  }

  function close() {
    returnFocus.current = true;
    setOpen(false);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send();
  }

  function keys(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  /** Escape closes at every width; on a phone, where the sheet is modal, Tab also wraps inside it. */
  function sheetKeys(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    const sheet = sheetRef.current;
    if (e.key !== "Tab" || !phone || !sheet) return;
    const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !sheet.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !sheet.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  // Only once the answer has stopped arriving: a summary of half an answer is not one to send.
  const handoff = status === "streaming" ? null : buildHandoff(messages, labels.handoff);
  const h = labels.handoff;

  if (!open) {
    return (
      <div ref={dockRef} data-assistant="" /* 16px in from the corner at every width: at 24px it reached into the cards' 105px side margin on a 1440 screen. */ className="fixed bottom-4 end-4 z-40 print:hidden">
        <button
          ref={launcherRef}
          type="button"
          data-assistant-launcher=""
          data-tucked={tucked ? "" : undefined}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-label={labels.open}
          /*
           * The pill: "Ask" and a speech mark, 44px tall, a neutral shadow so it reads as above the page
           * in the light theme, no brand glow. Tucked, it slides below the screen edge and ignores the
           * pointer; focus-visible brings it back for a keyboard.
           */
          className={`btn-primary inline-flex min-h-11 items-center gap-2 rounded-full ps-3.5 pe-4 text-sm font-bold shadow-[0_2px_8px_rgba(16,24,40,0.25)] transition-[transform,opacity,background-color] duration-200 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100 ${tucked ? "pointer-events-none translate-y-[calc(100%+2rem)] opacity-0" : ""}`}
        >
          <ChatCircleDotsIcon aria-hidden="true" size={20} weight="bold" className="shrink-0" />
          {labels.launcher}
        </button>
      </div>
    );
  }

  return (
    <section
      ref={sheetRef}
      role="dialog"
      aria-modal={phone ? "true" : undefined}
      aria-labelledby="assistant-title"
      data-assistant-sheet=""
      onKeyDown={sheetKeys}
      /*
       * A full sheet on a phone; from md a panel docked down the end side at full height, with a hairline
       * on its inner edge. No rounded popup and no coloured shadow.
       */
      className="fixed inset-0 z-50 flex flex-col bg-panel text-ink print:hidden md:start-auto md:w-[26rem] md:border-s md:border-line md:shadow-[0_0_24px_rgba(16,24,40,0.18)]"
    >
      <header className="flex min-h-[68px] items-center justify-between gap-3 border-b border-line px-4">
        <h2 id="assistant-title" className="text-base font-extrabold text-ink">
          {labels.title}
        </h2>
        <div className="flex items-center gap-1">
          {messages.length ? (
            <button
              type="button"
              onClick={clear}
              className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-muted hover:text-ink"
            >
              {labels.clear}
            </button>
          ) : null}
          <button
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-alt hover:text-ink"
          >
            <XIcon aria-hidden="true" size={20} weight="bold" className="shrink-0" />
          </button>
        </div>
      </header>
      <div ref={listRef} onScroll={onScroll} role="log" aria-live="polite" className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-[15px]">
        <p className="leading-relaxed text-muted">{labels.intro}</p>
        {messages.length === 0 && status === "idle" ? (
          <ul className="flex flex-wrap gap-2">
            {labels.suggestions.map((question) => (
              <li key={question}>
                <button
                  type="button"
                  onClick={() => void send(question)}
                  className="min-h-11 rounded-full border border-line-strong bg-surface px-3.5 py-2 text-start text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand-strong"
                >
                  {question}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {messages.map((m, i) => {
          const streaming = status === "streaming" && i === messages.length - 1 && m.role === "assistant";
          return (
            <div
              key={i}
              dir="auto"
              /*
               * The visitor's turns in a tinted box on the end side, the assistant's as plain text on the
               * start side, both at the card radius. Chat bubbles with a clipped corner were the SaaS
               * widget look the plain pass removes.
               */
              className={
                m.role === "user"
                  ? "ms-auto max-w-[85%] whitespace-pre-wrap rounded-lg bg-brand-soft px-3.5 py-2.5 leading-relaxed text-ink"
                  : "me-auto max-w-[95%] leading-relaxed text-ink"
              }
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <>
                    <Rich text={m.content} />
                    {streaming ? (
                      <span aria-hidden="true" className="chat-caret ms-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 rounded-[1px] bg-muted" />
                    ) : null}
                  </>
                ) : (
                  <Dots label={labels.thinking} />
                )
              ) : (
                m.content
              )}
            </div>
          );
        })}
        {status === "streaming" && messages[messages.length - 1]?.role === "user" ? <Dots label={labels.thinking} /> : null}
        {status === "error" ? (
          <p className="text-sm text-warn" role="alert">
            {labels.error}{" "}
            <button type="button" onClick={retry} className="font-bold text-brand-strong underline underline-offset-2 hover:text-brand">
              {labels.retry}
            </button>
          </p>
        ) : null}
        {status === "unavailable" ? (
          <p className="text-sm text-muted" role="status">
            {labels.unavailable}
          </p>
        ) : null}
      </div>
      {handoff ? (
        <div className="border-t border-line px-4 py-3">
          <p className="text-sm font-bold text-ink">{h.title}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {whatsapp ? (
              <a
                href={waHref(whatsapp, handoff.whatsappText)}
                target="_blank"
                rel="noopener"
                className="btn-primary inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold"
              >
                <WhatsAppIcon />
                {h.wa}
              </a>
            ) : null}
            {/* Through storeLink, so the ticket page opens in the page's language (the store keeps it in a cookie set from ?lang=). */}
            <a
              href={storeLink(ticketHref(store, handoff.ticket), locale)}
              className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-line-strong bg-panel px-4 text-sm font-bold text-ink hover:border-brand hover:text-brand-strong"
            >
              {h.ticket}
            </a>
          </div>
          <a
            href={contactHref(locale, { need: "other", note: plainLine(handoff.question, HANDOFF_NOTE_MAX - 3) })}
            className="mt-1 inline-flex min-h-11 items-center text-sm font-bold text-brand-strong hover:text-brand"
          >
            {h.form}
          </a>
        </div>
      ) : null}
      <form onSubmit={submit} className="flex items-end gap-2 border-t border-line p-3">
        <label htmlFor="assistant-input" className="sr-only">
          {labels.placeholder}
        </label>
        <textarea
          id="assistant-input"
          ref={inputRef}
          rows={1}
          dir="auto"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={keys}
          maxLength={2000}
          placeholder={labels.placeholder}
          /* The field radius (rounded-lg) shared by every input on the site, not a pill: pills are for buttons (A3). */
          className="block max-h-32 min-h-11 w-full resize-none rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
        />
        {status === "streaming" ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-line-strong px-4 text-sm font-bold text-muted hover:text-ink"
          >
            {labels.stop}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn-primary inline-flex h-11 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold disabled:opacity-60"
          >
            {labels.send}
          </button>
        )}
      </form>
      {/* text-xs is the 13px floor (14px in Arabic, globals.css); it was an 11px line. Muted rather than faint, for contrast. */}
      <p className="px-4 pb-3 text-xs leading-snug text-muted">{labels.note}</p>
    </section>
  );
}
