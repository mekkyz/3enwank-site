"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { turnstileToken } from "@/lib/turnstile";
import { withPlan } from "@/lib/whatsapp";
import { useContactQuery } from "./contact-prefill";

/** Every string the form shows, passed from the server so no dictionary reaches the browser bundle. */
export type LeadFormLabels = {
  needLegend: string;
  need: { hosting: string; website: string; domains: string; care: string; move: string; other: string };
  /** One {plan}: the note the form starts with when the page was opened from a plan or package. */
  planNote: string;
  name: string;
  reach: string;
  note: string;
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
  blocked: string;
};

// "move" is the "Move my site" option the home page's moving section links to (S6).
const NEEDS = ["hosting", "website", "domains", "care", "move", "other"] as const;
type Need = (typeof NEEDS)[number];
const isNeed = (v: unknown): v is Need => typeof v === "string" && (NEEDS as readonly string[]).includes(v);

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

type State = "idle" | "sending" | "sent" | "failed" | "limited" | "blocked";

/** One thing wrong, and which field it is about, so the field can be marked as well as the list. */
type Fault = { field: "need" | "name" | "reach"; message: string };

export function LeadForm({
  endpoint,
  labels,
  locale,
  dir,
  turnstileSiteKey,
  waHref,
  source,
  prefill = false,
}: {
  endpoint: string;
  labels: LeadFormLabels;
  locale: string;
  /**
   * The page's direction, for the free-text fields. They were dir="auto", which Chromium resolves
   * from the value alone, so on the Arabic page both sat left-aligned with the placeholder against
   * the left edge until the first Arabic letter was typed. A field on an Arabic page starts Arabic.
   */
  dir: "ltr" | "rtl";
  turnstileSiteKey: string | null;
  waHref: string;
  /** Which form this is, for the ticket: "home-contact" or "contact-page". */
  source: string;
  /** Start from the page's ?need= and ?plan= (the contact page only). */
  prefill?: boolean;
}) {
  const id = useId();
  /*
   * The need and the note start from the address bar on the contact page, and are the visitor's own
   * once they touch them: `null` means untouched. Derived rather than copied into state in an effect,
   * so the query is never written over something the visitor already chose or typed.
   */
  const query = useContactQuery();
  const [picked, setNeed] = useState<Need | "" | null>(null);
  const need: Need | "" = picked ?? (prefill && isNeed(query.need) ? query.need : "");
  const [name, setName] = useState("");
  const [reach, setReach] = useState("");
  const [typed, setNote] = useState<string | null>(null);
  // A handed-over question (?note=, from the assistant) wins over the plan line: it is the visitor's own words.
  const note = typed ?? (prefill && query.note ? query.note : prefill && query.plan ? withPlan(labels.planNote, query.plan) : "");
  const [state, setState] = useState<State>("idle");
  const [errors, setErrors] = useState<Fault[]>([]);
  const errorBox = useRef<HTMLDivElement | null>(null);
  // Left empty by people, filled in by anything submitting every field it finds.
  const honeypot = useRef<HTMLInputElement | null>(null);

  /*
   * Say it in text and move to it, rather than turning three boxes red and hoping. Done here and
   * not in submit: the box is only rendered once `errors` is set, so a focus() in the same tick as
   * setErrors() ran against a null ref and the first failed submit moved nothing. On a phone the
   * box also sits five fields above the button, out of the viewport, so it is scrolled to as well.
   * A new array on every failed submit, so a second tap re-runs this and brings the box back.
   */
  useEffect(() => {
    if (!errors.length || !errorBox.current) return;
    errorBox.current.focus({ preventScroll: true });
    errorBox.current.scrollIntoView({ block: "nearest" });
  }, [errors]);
  const faulty = (field: Fault["field"]) => errors.some((f) => f.field === field);
  /** The id of the list item that names the fault, for aria-describedby; undefined when the field is fine. */
  const describedBy = (field: Fault["field"]) => (faulty(field) ? `${id}-fault-${field}` : undefined);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: Fault[] = [];
    if (!need) found.push({ field: "need", message: labels.errors.need });
    if (!name.trim()) found.push({ field: "name", message: labels.errors.name });
    if (!reach.trim()) found.push({ field: "reach", message: labels.errors.reach });
    else if (!reachLooksReal(reach)) found.push({ field: "reach", message: labels.errors.reachFormat });
    setErrors(found);
    if (found.length) return;
    setState("sending");
    try {
      // Null when the challenge is off, blocked, or slow. Omitted rather than sent as null: the
      // store treats a missing token as a captcha question and can say so, where a null used to be
      // a schema error and came back as an unexplained failure.
      const token = await turnstileToken(turnstileSiteKey);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        /*
         * The store's lead schema knows five needs and not "move" (platform src/lib/support/lead.ts
         * LEAD_NEEDS), and refuses an unknown one with a 400. A move is a hosting lead, so it goes as
         * one, with the option's own words at the head of the note and its own source, which is how
         * the ticket still says what was asked for.
         */
        body: JSON.stringify({
          need: need === "move" ? "hosting" : need,
          name: name.trim(),
          reach: reach.trim(),
          note: (need === "move" ? `${labels.need.move}. ${note.trim()}` : note.trim()).trim().slice(0, 300),
          locale,
          source: need === "move" ? "move-site" : source,
          company: honeypot.current?.value ?? "",
          ...(token ? { turnstileToken: token } : {}),
        }),
      });
      if (res.status === 429) return setState("limited");
      /*
       * A refused challenge is not a broken form, and telling someone to "try again" when their
       * browser is blocking the challenge sends them round the same loop for ever. But the store
       * answers 403 for two causes, {"error":"captcha"} from the spam check and {"error":"forbidden"}
       * for an origin it does not accept, and the second is our misconfiguration, not the visitor's
       * browser: it gets the generic failure. The body is read only on a 403.
       */
      if (res.status === 403) {
        const code = await res
          .json()
          .then((b: unknown) => (b && typeof b === "object" && "error" in b ? String((b as { error: unknown }).error) : ""))
          .catch(() => "");
        return setState(code === "captcha" ? "blocked" : "failed");
      }
      if (!res.ok) return setState("failed");
      setState("sent");
    } catch {
      setState("failed");
    }
  };

  if (state === "sent") {
    return (
      <div aria-live="polite" className="rounded-lg border border-ok/40 bg-ok-soft p-6">
        <p className="text-lg font-extrabold text-ink">{labels.sentTitle}</p>
        <p className="mt-2 text-sm text-muted">{labels.sentBody.replace("{reach}", reach.trim())}</p>
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {/* Both 44px tall: the two things to do next, on a phone, right after sending. */}
          <a href={waHref} rel="noopener" target="_blank" className="inline-flex min-h-11 items-center font-bold text-brand-strong hover:text-brand">
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
            className="min-h-11 font-bold text-muted hover:text-ink"
          >
            {labels.sentAgain}
          </button>
        </p>
      </div>
    );
  }

  /*
   * One ring, not a border plus a ring. The edge of a control takes the strong token and keeps its
   * 3:1; on focus the ring changes colour and thickens instead of a border and a ring both being
   * painted, which used to nudge the text by a pixel as you clicked in.
   */
  // The card radius for every field (rounded-lg below): pills are for buttons and tabs only (site review justDo).
  // A field named in the error list takes the danger ring, so it is also findable when tabbing back through.
  const field =
    "block w-full bg-surface px-4 py-3 text-sm text-ink ring-1 ring-line-strong transition placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand aria-invalid:ring-danger";

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {errors.length ? (
        <div
          ref={errorBox}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm"
        >
          <p className="font-bold text-ink">{labels.errorTitle}</p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-muted">
            {errors.map((f) => (
              <li key={f.message} id={`${id}-fault-${f.field}`}>
                {f.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* aria-invalid is supported by neither a group nor a radio, so the fieldset points at the message and the chips take the danger ring. */}
      <fieldset aria-describedby={describedBy("need")}>
        <legend className="mb-2 block text-sm font-bold text-ink">{labels.needLegend}</legend>
        {/*
         * A grid of rectangles, two columns on a phone and three from sm. They were pills, and at 390px
         * "A new website" broke onto two lines inside a pill shape. Two columns fit every label in both
         * languages at 390px now that the form has no panel padding on a phone (contact.tsx); a
         * min-width track fell to one column there and stacked six options down the screen.
         */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {NEEDS.map((k) => (
            /*
             * The input is hidden but real, and it comes first so the visible span can be styled
             * from its state: `peer-*` only reaches a later sibling, so with the input nested inside
             * the styled element the focus ring silently never appeared.
             *
             * The chosen one differs by shape as well as colour, an empty ring becoming a filled
             * dot, so the state never rests on hue alone.
             */
            <label key={k} className="group block cursor-pointer">
              <input
                type="radio"
                name="need"
                value={k}
                checked={need === k}
                onChange={() => setNeed(k)}
                className="peer sr-only"
              />
              <span
                className={`flex min-h-12 items-center gap-2.5 rounded-lg px-3.5 text-sm font-bold transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${
                  need === k
                    ? "bg-brand-soft text-brand-strong ring-2 ring-brand"
                    : `bg-surface text-muted ring-1 ${faulty("need") ? "ring-danger" : "ring-line-strong"} hover:bg-brand-soft/40 hover:text-ink hover:ring-brand`
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition ${need === k ? "border-brand" : "border-line-strong group-hover:border-brand"}`}
                >
                  <span className={`h-2 w-2 rounded-full transition ${need === k ? "bg-brand" : "bg-transparent"}`} />
                </span>
                {labels.need[k]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-bold text-ink">
            {labels.name}
          </label>
          <input
            id={`${id}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            dir={dir}
            autoComplete="name"
            maxLength={80}
            aria-invalid={faulty("name") || undefined}
            aria-describedby={describedBy("name")}
            className={`${field} min-h-12 rounded-lg`}
          />
        </div>
        <div>
          <label htmlFor={`${id}-reach`} className="mb-2 block text-sm font-bold text-ink">
            {labels.reach}
          </label>
          {/* Left to right whatever the page direction: a phone number and an address both read that way. */}
          <input
            id={`${id}-reach`}
            value={reach}
            onChange={(e) => setReach(e.target.value)}
            dir="ltr"
            className={`${field} min-h-12 rounded-lg text-start`}
            autoComplete="off"
            maxLength={120}
            aria-invalid={faulty("reach") || undefined}
            aria-describedby={describedBy("reach")}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-note`} className="mb-2 block text-sm font-bold text-ink">
          {labels.note}
        </label>
        <textarea
          id={`${id}-note`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          dir={dir}
          rows={3}
          maxLength={300}
          placeholder={labels.notePlaceholder}
          className={`${field} rounded-lg`}
        />
      </div>

      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor={`${id}-company`}>Company</label>
        <input id={`${id}-company`} ref={honeypot} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state === "failed" ? <p className="text-sm text-warn">{labels.failed}</p> : null}
      {state === "limited" ? <p className="text-sm text-warn">{labels.limited}</p> : null}
      {state === "blocked" ? <p className="text-sm text-warn">{labels.blocked}</p> : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === "sending"}
          className="btn-primary inline-flex min-h-11 items-center rounded-full px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "sending" ? labels.sending : labels.submit}
        </button>
      </div>
    </form>
  );
}
