"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Locale } from "@/lib/i18n";

export type AssistantLabels = { open: string; close: string; title: string; intro: string; placeholder: string; send: string; thinking: string; error: string; unavailable: string; note: string };
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

/**
 * The chat bubble in the corner. Talks to the store's public assistant endpoint, which streams
 * plain text; the conversation lives in this tab only. The panel is closed on the server render,
 * so restoring the conversation on the client changes no markup.
 */
export function Assistant({ url, locale, labels, supportEmail }: { url: string; locale: Locale; labels: AssistantLabels; supportEmail?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(restore);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_TURNS)));
    } catch {
      // Storage blocked: the conversation lasts until the page changes.
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || status === "streaming") return;
    const next = [...messages, { role: "user" as const, content: text }].slice(-MAX_TURNS);
    setMessages(next);
    setInput("");
    setStatus("streaming");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, locale }) });
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
    } catch {
      setStatus("error");
    }
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
            if (e.key === "Escape") setOpen(false);
          }}
          className="flex max-h-[min(34rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">{labels.title}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={labels.close} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-alt hover:text-ink">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            <p className="me-auto max-w-[88%] rounded-2xl rounded-es-sm bg-surface-alt px-3.5 py-2.5 leading-relaxed text-ink">{labels.intro}</p>
            {messages.map((m, i) => (
              <p key={i} dir="auto" className={m.role === "user" ? "ms-auto max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-ee-sm bg-brand px-3.5 py-2.5 leading-relaxed text-white" : "me-auto max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-es-sm bg-surface-alt px-3.5 py-2.5 leading-relaxed text-ink"}>
                {m.content || (status === "streaming" ? labels.thinking : "")}
              </p>
            ))}
            {status === "error" ? (
              <p className="text-xs text-warn" role="alert">
                {labels.error} {mail}
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
            <textarea id="assistant-input" ref={inputRef} rows={1} dir="auto" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={keys} maxLength={2000} placeholder={labels.placeholder} className="block max-h-32 min-h-11 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft" />
            <button type="submit" disabled={status === "streaming" || !input.trim()} className="btn-gradient inline-flex h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-bold disabled:opacity-60">
              {labels.send}
            </button>
          </form>
          <p className="px-4 pb-3 text-[11px] leading-snug text-faint">{labels.note}</p>
        </section>
      ) : null}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? labels.close : labels.open} title={open ? labels.close : labels.open} className="btn-gradient flex h-14 w-14 items-center justify-center rounded-full shadow-[0_16px_32px_-12px_rgba(124,95,165,0.9)]">
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
