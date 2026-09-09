"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Currency } from "@/lib/catalogue";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { useCurrency } from "./currency";
import { turnstileToken } from "@/lib/turnstile";

/** Every string the widget shows; passed from the server so the dictionaries stay out of the browser bundle. */
export type DomainSearchLabels = {
  label: string;
  placeholder: string;
  button: string;
  hint: string;
  available: string;
  taken: string;
  unknown: string;
  premium: string;
  notOffered: string;
  register: string;
  added: string;
  askUs: string;
  checking: string;
  error: string;
  rateLimited: string;
  otherExtensions: string;
  moreExtensions: string;
  perYear: string;
  ideasTitle: string;
  ideasHint: string;
  ideasPlaceholder: string;
  ideasButton: string;
  ideasWorking: string;
  ideasEmpty: string;
  ideasUnavailable: string;
};

/** Shape of GET {store}/api/public/domains/search and of each idea from POST {store}/api/public/domains/ideas. */
type Result = {
  name: string;
  tld: string;
  available: boolean | null;
  premium: boolean;
  sellable: boolean;
  price: { gross: number; formatted: string; currency: Currency } | null;
  reason?: "not_offered" | "unknown";
};
type SearchResponse = { query: string; currency: Currency; invalid: boolean; enabled: boolean; primary: Result | null; suggestions: Result[] };
type IdeasResponse = { ideas: Result[]; checked: boolean };

type Status = "idle" | "loading" | "done" | "invalid" | "error" | "limited";

/** Names typed into the empty field one letter at a time, so the box shows what goes in it. */
const EXAMPLES = ["yourbrand.com", "cafe-cairo.net", "studio-name.org", "myshop.com"];
type IdeasStatus = "idle" | "loading" | "done" | "error" | "limited" | "unavailable";

const TONE = {
  ok: "bg-ok-soft text-ok",
  muted: "bg-surface-alt text-muted",
  warn: "bg-warn-soft text-warn",
  brand: "bg-brand-soft text-brand-strong",
} as const;

function statusOf(r: Result, l: DomainSearchLabels): { text: string; tone: keyof typeof TONE } {
  if (r.available === null) return r.reason === "not_offered" ? { text: l.notOffered, tone: "muted" } : { text: l.unknown, tone: "warn" };
  if (r.premium) return { text: l.premium, tone: "brand" };
  return r.available ? { text: l.available, tone: "ok" } : { text: l.taken, tone: "muted" };
}

function Row({ r, primary = false, index = 0, enabled, locale, cartUrl, searchPath, contactHref, labels, added, onAdd }: { r: Result; primary?: boolean; index?: number; enabled: boolean; locale: Locale; cartUrl: string; searchPath: string; contactHref: string; labels: DomainSearchLabels; added: boolean; onAdd: (name: string) => void }) {
  const s = statusOf(r, labels);
  const price = r.price ? formatPrice({ gross: r.price.gross, formatted: r.price.formatted }, r.price.currency, locale) : null;
  const free = r.available === true && !r.premium;
  return (
    <li className="row-in flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line py-3.5 first:border-t-0" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <bdi dir="ltr" className={`break-all font-extrabold text-ink ${primary ? "text-xl sm:text-2xl" : "text-base"}`}>
          {r.name}
        </bdi>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[s.tone]}`}>{s.text}</span>
      </div>
      <div className="flex items-center gap-4">
        {price ? (
          <span className="whitespace-nowrap text-sm text-muted">
            <bdi dir="ltr" className="tabular font-bold text-ink">
              {price}
            </bdi>{" "}
            {labels.perYear}
          </span>
        ) : null}
        {free ? (
          r.sellable && enabled ? (
            /*
             * A real form, so this works before React does and keeps working if it never runs. It
             * posts to the store on the shared origin, which writes the shared cart cookie and sends
             * the visitor back to this page. With JavaScript the submit is intercepted and the name
             * is added without leaving the results at all.
             */
            <form
              action={cartUrl}
              method="post"
              onSubmit={(e) => {
                e.preventDefault();
                onAdd(r.name);
              }}
            >
              <input type="hidden" name="name" value={r.name} />
              <input type="hidden" name="years" value="1" />
              <input type="hidden" name="return" value={`${searchPath}?q=${encodeURIComponent(r.name)}`} />
              <button
                type="submit"
                disabled={added}
                className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-sm font-bold transition ${added ? "border-[1.5px] border-line-strong bg-panel text-muted" : "btn-primary"}`}
              >
                {added ? (
                  <>
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {labels.added}
                  </>
                ) : (
                  labels.register
                )}
              </button>
            </form>
          ) : (
            <a href={contactHref} className="whitespace-nowrap text-sm font-bold text-brand-strong hover:text-brand">
              {labels.askUs}
            </a>
          )
        ) : null}
      </div>
    </li>
  );
}

/**
 * Availability search rendered on the site itself. Without JavaScript the form is a plain GET to the
 * store's search page; with it, the store's public API answers in place and "Register" hands the
 * name to the store. Prices follow the visitor's currency choice.
 */
/** Endings offered beside the name typed, and the longer list behind "show more". */
const SHORTLIST = 5;
const MORE = 17;

/** A row that is still being checked. Same height as a real one, so nothing jumps when it lands. */
function Pending({ name }: { name?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
      <div className="min-w-0 flex-1">
        {name ? <span className="block truncate text-sm font-bold text-muted" dir="ltr">{name}</span> : <span className="waiting block h-4 w-40 max-w-full rounded" />}
      </div>
      <span className="waiting h-4 w-20 shrink-0 rounded" />
      <span className="waiting h-9 w-24 shrink-0 rounded-lg" />
    </li>
  );
}

export function DomainSearch({
  locale,
  searchPath,
  cartUrl,
  apiUrl,
  ideasUrl,
  contactHref,
  labels,
  ideas,
  turnstileSiteKey = null,
  initialQuery = "",
  initialResults = null,
  initialAdded = [],
}: {
  locale: Locale;
  /** Where the form goes without JavaScript: this same page, which answers server-side. */
  searchPath: string;
  /** The store's add-to-cart endpoint on the shared origin. */
  cartUrl: string;
  apiUrl: string;
  ideasUrl: string;
  contactHref: string;
  labels: DomainSearchLabels;
  ideas: boolean;
  turnstileSiteKey?: string | null;
  /** Set when the page was asked for with ?q=, so the answer is in the HTML before React runs. */
  initialQuery?: string;
  initialResults?: SearchResponse | null;
  /** Names the server already knows are in the cart, from ?added= after a no-JavaScript post. */
  initialAdded?: string[];
}) {
  const { currency } = useCurrency();
  const id = useId();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<Status>(initialResults ? (initialResults.invalid ? "invalid" : "done") : "idle");
  const [data, setData] = useState<SearchResponse | null>(initialResults);
  /** How many endings are still being checked, so their rows can be drawn before the answers land. */
  const [awaiting, setAwaiting] = useState(0);
  const [moreLoaded, setMoreLoaded] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const searched = useRef("");
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);

  // The empty field types example names by itself; a focus or a keystroke stops it.
  useEffect(() => {
    if (query || focused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let example = 0;
    let chars = 0;
    let direction = 1;
    const id = window.setInterval(() => {
      const word = EXAMPLES[example]!;
      chars += direction;
      if (chars > word.length + 14) direction = -1;
      if (chars < 0) {
        direction = 1;
        chars = 0;
        example = (example + 1) % EXAMPLES.length;
      }
      setTyped(word.slice(0, Math.max(0, Math.min(chars, word.length))));
    }, 85);
    return () => window.clearInterval(id);
  }, [query, focused]);

  const ask = useCallback(
    async (q: string, c: Currency, suggest: number, signal: AbortSignal): Promise<SearchResponse | "limited" | "error"> => {
      const res = await fetch(`${apiUrl}?q=${encodeURIComponent(q)}&currency=${c}&suggest=${suggest}`, { signal, headers: { Accept: "application/json" } });
      if (res.status === 429) return "limited";
      if (!res.ok) return "error";
      return (await res.json()) as SearchResponse;
    },
    [apiUrl],
  );

  /**
   * Two requests, not one. The registrar answers about one name a second, so asking for the typed
   * name on its own puts a real answer on screen in about a second instead of holding everything
   * back until every other ending has been checked too. The second request re-uses the first
   * answer from the store's cache, so this costs the registrar nothing extra.
   */
  const run = useCallback(
    async (q: string, c: Currency) => {
      abort.current?.abort();
      const ctl = new AbortController();
      abort.current = ctl;
      setStatus("loading");
      setData(null);
      setMoreLoaded(false);
      setAwaiting(SHORTLIST);
      try {
        const first = await ask(q, c, 0, ctl.signal);
        if (first === "limited") return setStatus("limited");
        if (first === "error") return setStatus("error");
        searched.current = q;
        setData(first);
        if (first.invalid) {
          setAwaiting(0);
          return setStatus("invalid");
        }
        setStatus("done");

        const full = await ask(q, c, SHORTLIST, ctl.signal);
        setAwaiting(0);
        if (full === "limited" || full === "error") return;
        setData(full);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error");
        setAwaiting(0);
      }
    },
    [ask],
  );

  /** "Show more endings" asks for the long list; the six already answered come from the cache. */
  const loadMore = useCallback(async () => {
    const q = searched.current;
    if (!q || awaiting) return;
    const ctl = new AbortController();
    abort.current = ctl;
    setAwaiting(MORE - SHORTLIST);
    try {
      const full = await ask(q, currency, MORE, ctl.signal);
      if (full !== "limited" && full !== "error") {
        setData(full);
        setMoreLoaded(true);
      }
    } catch {
      // Leave the shortlist on screen; the button can be pressed again.
    } finally {
      setAwaiting(0);
    }
  }, [ask, awaiting, currency]);

  // A currency flip re-prices the names already on screen.
  useEffect(() => {
    if (!searched.current || !data || data.currency === currency) return;
    const t = setTimeout(() => void run(searched.current, currency), 0);
    return () => clearTimeout(t);
  }, [currency, data, run]);

  function submit(e: FormEvent<HTMLFormElement>) {
    const q = query.trim();
    if (!q) return;
    e.preventDefault();
    void run(q, currency);
  }

  const [desc, setDesc] = useState("");
  const [ideasStatus, setIdeasStatus] = useState<IdeasStatus>("idle");
  const [ideasData, setIdeasData] = useState<IdeasResponse | null>(null);

  async function suggest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = desc.trim();
    if (d.length < 10 || ideasStatus === "loading") return;
    setIdeasStatus("loading");
    try {
      const token = await turnstileToken(turnstileSiteKey);
      const res = await fetch(ideasUrl, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ description: d, locale, currency, ...(token ? { turnstileToken: token } : {}) }) });
      if (res.status === 503) return setIdeasStatus("unavailable");
      if (res.status === 429) return setIdeasStatus("limited");
      if (!res.ok) return setIdeasStatus("error");
      setIdeasData((await res.json()) as IdeasResponse);
      setIdeasStatus("done");
    } catch {
      setIdeasStatus("error");
    }
  }

  const enabled = data?.enabled ?? false;
  /*
   * Names already in the cart, so a row that has been added says so instead of offering again.
   * Seeded from ?added= for the no-JavaScript round trip, which comes back to this page.
   */
  const [added, setAdded] = useState<string[]>(initialAdded);
  const add = useCallback(
    async (name: string) => {
      setAdded((prev) => (prev.includes(name) ? prev : [...prev, name]));
      try {
        const res = await fetch(cartUrl, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name, years: 1 }),
        });
        if (!res.ok) throw new Error(String(res.status));
        // Tell the basket in the bar without waiting for a navigation.
        window.dispatchEvent(new CustomEvent("enwank:cart"));
      } catch {
        // Put the button back rather than claim something is in a cart that it is not.
        setAdded((prev) => prev.filter((n) => n !== name));
      }
    },
    [cartUrl],
  );

  const rowProps = { enabled, locale, cartUrl, searchPath, contactHref, labels, onAdd: add };
  const freeIdeas = ideasData?.ideas.filter((r) => r.available !== false) ?? [];
  return (
    <div>
      <form action={searchPath} method="get" onSubmit={submit} role="search">
        <label htmlFor={`${id}-q`} className="mb-2 block text-sm font-semibold text-ink">
          {labels.label}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={`${id}-q`}
            name="q"
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={253}
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={typed ?? labels.placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            dir="ltr"
            className="block min-h-12 w-full rounded-lg border border-line-strong bg-surface px-4 text-lg text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
          />
          <button type="submit" disabled={status === "loading"} className="btn-primary inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg px-7 text-sm font-bold disabled:opacity-70">
            {status === "loading" ? labels.checking : labels.button}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">{labels.hint}</p>
      </form>

      <div aria-live="polite">
        {status === "error" ? <p className="mt-4 text-sm text-warn">{labels.error}</p> : null}
        {status === "limited" ? <p className="mt-4 text-sm text-warn">{labels.rateLimited}</p> : null}
        {status === "invalid" ? <p className="mt-4 text-sm text-warn">{labels.error}</p> : null}
        {status === "loading" && !data ? (
          <div className="mt-6">
            <ul>
              <Pending name={query.trim().includes(".") ? query.trim().toLowerCase() : undefined} />
            </ul>
            <h3 className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">{labels.otherExtensions}</h3>
            <ul className="mt-1">
              {Array.from({ length: SHORTLIST }, (_, i) => (
                <Pending key={`first-${i}`} />
              ))}
            </ul>
          </div>
        ) : null}
        {data && (status === "done" || status === "loading") ? (
          <div className="mt-6">
            {data.primary ? (
              <ul>
                <Row r={data.primary} primary {...rowProps} added={added.includes(data.primary.name)} />
              </ul>
            ) : null}
            {data.suggestions.length || awaiting ? (
              <>
                <h3 className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">{labels.otherExtensions}</h3>
                <ul className="mt-1">
                  {data.suggestions.map((r, i) => (
                    <Row key={r.name} r={r} index={i + 1} {...rowProps} added={added.includes(r.name)} />
                  ))}
                  {Array.from({ length: awaiting }, (_, i) => (
                    <Pending key={`pending-${i}`} />
                  ))}
                </ul>
                {!moreLoaded && !awaiting && data.suggestions.length >= SHORTLIST ? (
                  <button type="button" onClick={() => void loadMore()} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border-[1.5px] border-line-strong px-4 text-sm font-bold text-muted hover:border-brand hover:text-ink">
                    {labels.moreExtensions}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {ideas ? (
        <div className="mt-8 border-t border-line pt-6">
          <h3 className="text-base font-extrabold text-ink">{labels.ideasTitle}</h3>
          <p className="mt-1 text-sm text-muted">{labels.ideasHint}</p>
          <form onSubmit={suggest} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label htmlFor={`${id}-desc`} className="sr-only">
              {labels.ideasHint}
            </label>
            <input id={`${id}-desc`} type="text" maxLength={300} minLength={10} required value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={labels.ideasPlaceholder} className="block min-h-11 w-full rounded-lg border border-line-strong bg-surface px-4 text-base text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft" />
            <button type="submit" disabled={ideasStatus === "loading"} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-brand px-5 text-sm font-bold text-brand-strong hover:bg-brand-soft disabled:opacity-70">
              {ideasStatus === "loading" ? (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="chat-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
                  <span aria-hidden="true" className="chat-dot inline-block h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: "0.16s" }} />
                  <span aria-hidden="true" className="chat-dot inline-block h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: "0.32s" }} />
                  <span>{labels.ideasWorking}</span>
                </span>
              ) : (
                labels.ideasButton
              )}
            </button>
          </form>
          <div aria-live="polite">
            {ideasStatus === "loading" ? (
              <ul className="mt-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Pending key={`idea-${i}`} />
                ))}
              </ul>
            ) : null}
            {ideasStatus === "unavailable" ? <p className="mt-3 text-sm text-muted">{labels.ideasUnavailable}</p> : null}
            {ideasStatus === "limited" ? <p className="mt-3 text-sm text-warn">{labels.rateLimited}</p> : null}
            {ideasStatus === "error" ? <p className="mt-3 text-sm text-warn">{labels.error}</p> : null}
            {ideasStatus === "done" ? (
              freeIdeas.length ? (
                <ul className="mt-3">
                  {freeIdeas.map((r, i) => (
                    <Row key={r.name} r={r} index={i} {...rowProps} enabled={enabled || r.sellable} added={added.includes(r.name)} />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">{labels.ideasEmpty}</p>
              )
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
