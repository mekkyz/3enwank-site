"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { turnstileToken } from "@/lib/turnstile";
import { parseRichText, type Inline } from "@/lib/rich-text";

export type AssistantLabels = { open: string; close: string; title: string; intro: string; placeholder: string; send: string; thinking: string; error: string; unavailable: string; note: string; stop: string; retry: string; clear: string; suggestions: readonly string[] };
type Msg = { role: "user" | "assistant"; content: string };
type Status = "idle" | "streaming" | "error" | "unavailable";

const KEY = "3enwank.assistant";
const MAX_TURNS = 20;

function restore(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((m): m is Msg => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") : [];
  } catch {
    return [];
  }
}

/** Three dots while the answer is still on its way, so the panel is never silently blank. */
function Dots({ label }: { label: string }) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span key={i} aria-hidden="true" className="chat-dot inline-block h-1.5 w-1.5 rounded-full bg-muted" style={{ animationDelay: `${i * 0.16}s` }} />
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
          <a key={i} href={part.href} className="underline underline-offset-2 hover:text-brand" target="_blank" rel="noopener noreferrer">
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
 * The chat bubble in the corner. Talks to the store's public assistant endpoint, which streams
 * plain text; the conversation lives in this tab only. The panel is closed on the server render,
 * so restoring the conversation on the client changes no markup.
 */
export function Assistant({ url, locale, labels, supportEmail, turnstileSiteKey = null }: { url: string; locale: Locale; labels: AssistantLabels; supportEmail?: string; turnstileSiteKey?: string | null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(restore);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
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
    if (open) inputRef.current?.focus();
    else abortRef.current?.abort();
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

  const mail = supportEmail ? (
    <a href={`mailto:${supportEmail}`} className="font-bold text-brand-strong hover:text-brand" dir="ltr">
      {supportEmail}
    </a>
  ) : null;

  return (
    <div className="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-3 print:hidden">
      {open ? (
        <section
          role="dialog"
          aria-label={labels.title}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            setOpen(false);
            bubbleRef.current?.focus();
          }}
          className="chat-in flex h-[min(34rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">{labels.title}</h2>
            <div className="flex items-center gap-1">
              {messages.length ? (
                <button type="button" onClick={clear} className="rounded-lg px-2 py-1.5 text-xs font-bold text-muted hover:bg-surface-alt hover:text-ink">
                  {labels.clear}
                </button>
              ) : null}
            <button type="button" onClick={() => setOpen(false)} aria-label={labels.close} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-alt hover:text-ink">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            </div>
          </header>
          <div ref={listRef} onScroll={onScroll} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            <p className="me-auto max-w-[88%] rounded-2xl rounded-es-sm bg-surface-alt px-3.5 py-2.5 leading-relaxed text-ink">{labels.intro}</p>
            {messages.length === 0 && status === "idle" ? (
              <ul className="flex flex-wrap gap-2 pt-1">
                {labels.suggestions.map((question) => (
                  <li key={question}>
                    <button
                      type="button"
                      onClick={() => void send(question)}
                      className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-start text-xs font-bold text-muted transition-colors hover:border-brand hover:text-ink"
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
                  className={
                    m.role === "user"
                      ? "chat-in ms-auto max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-ee-sm bg-brand px-3.5 py-2.5 leading-relaxed text-white"
                      : "chat-in me-auto max-w-[88%] rounded-2xl rounded-es-sm bg-surface-alt px-3.5 py-2.5 leading-relaxed text-ink"
                  }
                >
                  {m.role === "assistant" ? (
                    m.content ? (
                      <>
                        <Rich text={m.content} />
                        {streaming ? <span aria-hidden="true" className="chat-caret ms-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 rounded-[1px] bg-muted" /> : null}
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
            {status === "streaming" && messages[messages.length - 1]?.role === "user" ? (
              <div className="me-auto rounded-2xl rounded-es-sm bg-surface-alt px-3.5 py-2.5">
                <Dots label={labels.thinking} />
              </div>
            ) : null}
            {status === "error" ? (
              <p className="text-xs text-warn" role="alert">
                {labels.error} {mail}{" "}
                <button type="button" onClick={retry} className="font-bold text-brand-strong underline underline-offset-2 hover:text-brand">
                  {labels.retry}
                </button>
              </p>
            ) : null}
            {status === "unavailable" ? (
              <p className="text-xs text-muted" role="status">
                {labels.unavailable} {mail}
              </p>
            ) : null}
          </div>
          <form onSubmit={submit} className="flex items-end gap-2 border-t border-line p-3">
            <label htmlFor="assistant-input" className="sr-only">
              {labels.placeholder}
            </label>
            <textarea id="assistant-input" ref={inputRef} rows={1} dir="auto" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={keys} maxLength={2000} placeholder={labels.placeholder} className="block max-h-32 min-h-11 w-full resize-none rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft" />
            {status === "streaming" ? (
              <button type="button" onClick={stop} className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-line px-4 text-sm font-bold text-muted hover:text-ink">
                {labels.stop}
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()} className="btn-primary inline-flex h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                {labels.send}
              </button>
            )}
          </form>
          <p className="px-4 pb-3 text-[11px] leading-snug text-faint">{labels.note}</p>
        </section>
      ) : null}
      <button ref={bubbleRef} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? labels.close : labels.open} title={open ? labels.close : labels.open} className="btn-primary pulse-once flex h-14 w-14 items-center justify-center rounded-full shadow-[0_16px_32px_-12px_rgba(124,95,165,0.9)]">
        {open ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.3A8 8 0 1 1 21 12z" />
            <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.6" />
          </svg>
        )}
      </button>
    </div>
  );
}
