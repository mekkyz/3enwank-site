"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { turnstileToken } from "@/lib/turnstile";

/** Every string the form shows, passed from the server so no dictionary reaches the browser bundle. */
export type LeadFormLabels = {
  needLegend: string;
  need: { hosting: string; website: string; move: string; care: string; other: string };
  name: string;
  reach: string;
  reachHint: string;
  note: string;
  noteHint: string;
  notePlaceholder: string;
  submit: string;
  sending: string;
  errorTitle: string;
  errors: { need: string; name: string; reach: string; reachFormat: string };
  sentTitle: string;
  sentBody: string;
  sentWa: string;
  sentAgain: string;
  failed: string;
  limited: string;
  privacy: string;
};

const NEEDS = ["hosting", "website", "move", "care", "other"] as const;
type Need = (typeof NEEDS)[number];

/**
 * Loose on purpose, and the same rule the store applies.
 *
 * This decides whether we can answer someone, not whether an address will deliver. A form that
 * rejects a real Egyptian mobile because of how it is spaced is worse than a ticket a person reads.
 */
export function reachLooksReal(raw: string): boolean {
  const value = raw.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return true;
  return /^\d{8,15}$/.test(value.replace(/[\s()+-]/g, ""));
}

type State = "idle" | "sending" | "sent" | "failed" | "limited";

export function LeadForm({ endpoint, labels, locale, turnstileSiteKey, waHref }: { endpoint: string; labels: LeadFormLabels; locale: string; turnstileSiteKey: string | null; waHref: string }) {
  const id = useId();
  const [need, setNeed] = useState<Need | "">("");
  const [name, setName] = useState("");
  const [reach, setReach] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const errorBox = useRef<HTMLDivElement | null>(null);
  // Left empty by people, filled in by anything submitting every field it finds.
  const honeypot = useRef<HTMLInputElement | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: string[] = [];
    if (!need) found.push(labels.errors.need);
    if (!name.trim()) found.push(labels.errors.name);
    if (!reach.trim()) found.push(labels.errors.reach);
    else if (!reachLooksReal(reach)) found.push(labels.errors.reachFormat);
    setErrors(found);
    if (found.length) {
      // Say it in text and move to it, rather than turning three boxes red and hoping.
      errorBox.current?.focus();
      return;
    }
    setState("sending");
    try {
      const token = await turnstileToken(turnstileSiteKey);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ need, name: name.trim(), reach: reach.trim(), note: note.trim(), locale, source: "home-contact", company: honeypot.current?.value ?? "", turnstileToken: token }),
      });
      if (res.status === 429) return setState("limited");
      if (!res.ok) return setState("failed");
      setState("sent");
    } catch {
      setState("failed");
    }
  };

  if (state === "sent") {
    return (
      <div aria-live="polite" className="rounded-xl border border-ok/40 bg-ok-soft p-6">
        <p className="text-lg font-extrabold text-ink">{labels.sentTitle}</p>
        <p className="mt-2 text-sm text-muted">{labels.sentBody.replace("{reach}", reach.trim())}</p>
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <a href={waHref} rel="noopener" target="_blank" className="font-bold text-brand-strong hover:text-brand">
            {labels.sentWa}
          </a>
          <button
            type="button"
            onClick={() => {
              setState("idle");
              setNeed("");
              setName("");
              setReach("");
              setNote("");
            }}
            className="font-bold text-muted hover:text-ink"
          >
            {labels.sentAgain}
          </button>
        </p>
      </div>
    );
  }

  const field = "block w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand";

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {errors.length ? (
        <div ref={errorBox} tabIndex={-1} role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm">
          <p className="font-bold text-ink">{labels.errorTitle}</p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-muted">
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset>
        <legend className="mb-2 block text-sm font-bold text-ink">{labels.needLegend}</legend>
        <div className="flex flex-wrap gap-2">
          {NEEDS.map((k) => (
            // A real radio, visible: the chosen one is not carried by colour alone.
            <label key={k} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-[1.5px] px-3.5 text-sm font-bold transition ${need === k ? "border-brand bg-brand-soft text-brand-strong" : "border-line-strong text-muted hover:text-ink"}`}>
              <input type="radio" name="need" value={k} checked={need === k} onChange={() => setNeed(k)} className="h-4 w-4 accent-[var(--color-brand-ink)]" />
              {labels.need[k]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm font-bold text-ink">
            {labels.name}
          </label>
          <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} dir="auto" autoComplete="name" maxLength={80} className={`${field} min-h-11`} />
        </div>
        <div>
          <label htmlFor={`${id}-reach`} className="mb-1.5 block text-sm font-bold text-ink">
            {labels.reach}
          </label>
          {/* Left to right whatever the page direction: a phone number and an address both read that way. */}
          <input id={`${id}-reach`} value={reach} onChange={(e) => setReach(e.target.value)} dir="ltr" className={`${field} min-h-11 text-start`} autoComplete="off" maxLength={120} aria-describedby={`${id}-reach-hint`} />
          <p id={`${id}-reach-hint`} className="mt-1.5 text-xs text-faint">
            {labels.reachHint}
          </p>
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-note`} className="mb-1.5 block text-sm font-bold text-ink">
          {labels.note}
        </label>
        <textarea id={`${id}-note`} value={note} onChange={(e) => setNote(e.target.value)} dir="auto" rows={3} maxLength={300} placeholder={labels.notePlaceholder} className={field} aria-describedby={`${id}-note-hint`} />
        <p id={`${id}-note-hint`} className="mt-1.5 text-xs text-faint">
          {labels.noteHint}
        </p>
      </div>

      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor={`${id}-company`}>Company</label>
        <input id={`${id}-company`} ref={honeypot} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state === "failed" ? <p className="text-sm text-warn">{labels.failed}</p> : null}
      {state === "limited" ? <p className="text-sm text-warn">{labels.limited}</p> : null}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={state === "sending"} className="btn-primary inline-flex min-h-11 items-center rounded-lg px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70">
          {state === "sending" ? labels.sending : labels.submit}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-faint">{labels.privacy}</p>
    </form>
  );
}
