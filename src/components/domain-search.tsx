"use client";

import type { ReactNode } from "react";
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
  renewsAt: string;
  renewsSame: string;
  cartTotal: string;
  tabRegister: string;
  tabTransfer: string;
  tabIdeas: string;
  transferLabel: string;
  transferPlaceholder: string;
  transferButton: string;
  transferThis: string;
  authCodeLabel: string;
  authCodePlaceholder: string;
  cartErrors: Record<string, string>;
  allExtensions: string;
  transferHint: string;
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
  renew?: { gross: number; formatted: string; currency: Currency } | null;
  reason?: "not_offered" | "unknown";
};
type SearchResponse = {
  query: string;
  currency: Currency;
  invalid: boolean;
  enabled: boolean;
  primary: Result | null;
  suggestions: Result[];
};
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

/**
 * The bar every tab uses: label above, field and button on one row, hint below.
 *
 * Each tab grew its own version — one had a visible label and another a screen-reader one, one hint
 * sat above the field and another below, the fields were different heights and the buttons were
 * filled on two tabs and outlined on the third. Switching tabs redrew the box rather than changing
 * what it asks for, which is the one thing a tab is supposed not to do.
 */
function SearchBar({
  id,
  label,
  hint,
  button,
  busy = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  button: ReactNode;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        {children}
        <button
          type="submit"
          disabled={busy}
          className="btn-primary inline-flex min-h-12 shrink-0 items-center justify-center rounded-full px-7 text-sm font-bold disabled:opacity-70"
        >
          {button}
        </button>
      </div>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </>
  );
}

const FIELD =
  "block min-h-12 w-full rounded-full border border-line-strong bg-surface px-4 text-lg text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft";

function statusOf(r: Result, l: DomainSearchLabels): { text: string; tone: keyof typeof TONE } {
  if (r.available === null)
    return r.reason === "not_offered" ? { text: l.notOffered, tone: "muted" } : { text: l.unknown, tone: "warn" };
  if (r.premium) return { text: l.premium, tone: "brand" };
  return r.available ? { text: l.available, tone: "ok" } : { text: l.taken, tone: "muted" };
}

function Row({
  r,
  primary = false,
  index = 0,
  enabled,
  locale,
  cartUrl,
  searchPath,
  contactHref,
  labels,
  added,
  onAdd,
  onTransfer,
}: {
  r: Result;
  primary?: boolean;
  index?: number;
  enabled: boolean;
  locale: Locale;
  cartUrl: string;
  searchPath: string;
  contactHref: string;
  labels: DomainSearchLabels;
  added: boolean;
  onAdd: (name: string) => void;
  onTransfer?: (name: string) => void;
}) {
  const s = statusOf(r, labels);
  const price = r.price
    ? formatPrice({ gross: r.price.gross, formatted: r.price.formatted }, r.price.currency, locale)
    : null;
  /*
   * Every row says what year two costs, including the rows where it costs the same.
   *
   * Printing "renews at 899" under "899" was noise, so the line was left off — and a row with
   * nothing where its neighbours have a second line reads as a gap in the data, not as "the same".
   * Saying so plainly is also the better news: it is the opposite of a 199 name that renews at
   * 3,199, and that contrast is the reason this number is on the page at all.
   */
  const sameRenewal = r.renew != null && r.price != null && r.renew.gross === r.price.gross;
  const renew = r.renew ? formatPrice({ gross: r.renew.gross, formatted: r.renew.formatted }, r.renew.currency, locale) : null;
  const free = r.available === true && !r.premium;
  return (
    <li
      className="row-in flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line py-3.5 first:border-t-0"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <bdi dir="ltr" className={`break-all font-extrabold text-ink ${primary ? "text-xl sm:text-2xl" : "text-base"}`}>
          {r.name}
        </bdi>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[s.tone]}`}>
          {s.text}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {/*
         * Only on a name that can actually be bought.
         *
         * "Taken — EGP 899" and "Premium name, not sold online — EGP 199" both quote a price for
         * something not on sale, and the premium one is not even the right number: a premium name
         * costs whatever the registry asks, which is why we do not sell it online.
         */}
        {price && free && r.sellable ? (
          <span className="whitespace-nowrap text-sm text-muted">
            <span className="block">
              <bdi dir="ltr" className="tabular font-bold text-ink">
                {price}
              </bdi>{" "}
              {labels.perYear}
            </span>
            {/*
             * The second year, under the first, and only when they differ.
             *
             * A cheap opening year is how this market is sold: .store is 199 to register and 3,199
             * to renew. That comparison used to live in a table under the search; the table is gone,
             * so this row is the only place a customer can meet the number before they buy.
             */}
            {renew ? (
              <span className="block text-xs text-faint">
                {sameRenewal ? (
                  labels.renewsSame
                ) : (
                  <>
                    {labels.renewsAt}{" "}
                    <bdi dir="ltr" className="tabular">
                      {renew}
                    </bdi>
                  </>
                )}
              </span>
            ) : null}
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
                className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-bold transition ${added ? "border-[1.5px] border-line-strong bg-panel text-muted" : "btn-primary"}`}
              >
                {added ? (
                  <>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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
        ) : r.available === false && onTransfer ? (
          // Taken is only a dead end if it is not yours.
          <button type="button" onClick={() => onTransfer(r.name)} className="whitespace-nowrap text-sm font-bold text-brand-strong hover:text-brand">
            {labels.transferThis}
          </button>
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

/*
 * A long answer scrolls inside itself rather than pushing the page down.
 *
 * Both lists here get long for the same reason: "show more" turns five endings into seventeen, and
 * a name suggestion is checked on every ending we sell, so a good answer is thirty or forty rows.
 * Either one moved the rest of the page out of sight. About seven rows tall, which shows there is
 * more without making the reader scroll past it to reach anything else. `overscroll-contain` stops
 * the page itself scrolling on when the list reaches its end.
 */
const SCROLL_LIST = "max-h-[24rem] overflow-y-auto overscroll-contain pe-1";

/** A row that is still being checked. Same height as a real one, so nothing jumps when it lands. */
function Pending({ name }: { name?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
      <div className="min-w-0 flex-1">
        {name ? (
          <span className="block truncate text-sm font-bold text-muted" dir="ltr">
            {name}
          </span>
        ) : (
          <span className="waiting block h-4 w-40 max-w-full rounded" />
        )}
      </div>
      <span className="waiting h-4 w-20 shrink-0 rounded" />
      <span className="waiting h-9 w-24 shrink-0 rounded-full" />
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
  tlds = [],
  turnstileSiteKey = null,
  initialQuery = "",
  initialResults = null,
  initialAdded = [],
  initialError = null,
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
  /** Every extension we sell, for the block under the search. */
  tlds?: string[];
  turnstileSiteKey?: string | null;
  /** Set when the page was asked for with ?q=, so the answer is in the HTML before React runs. */
  initialQuery?: string;
  initialResults?: SearchResponse | null;
  /** Names the server already knows are in the cart, from ?added= after a no-JavaScript post. */
  initialAdded?: string[];
  /** A refusal the store redirected back with, e.g. a transfer with no authorisation code. */
  initialError?: string | null;
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
    async (
      q: string,
      c: Currency,
      suggest: number,
      signal: AbortSignal,
    ): Promise<SearchResponse | "limited" | "error"> => {
      const res = await fetch(`${apiUrl}?q=${encodeURIComponent(q)}&currency=${c}&suggest=${suggest}`, {
        signal,
        headers: { Accept: "application/json" },
      });
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

  /**
   * Pick an ending: it joins whatever name is typed and searches.
   *
   * A visitor with "mybakery" in the box and no idea which ending to try is the person this block
   * is for, so clicking one finishes their sentence rather than starting a new one. With nothing
   * typed there is nothing to search for, so the box takes focus and waits.
   */
  const pick = useCallback(
    (tld: string) => {
      const base = query.trim().toLowerCase().replace(/\.$/, "");
      const label = base.includes(".") ? base.slice(0, base.indexOf(".")) : base;
      if (!label) {
        document.getElementById(`${id}-q`)?.focus();
        return;
      }
      const next = `${label}.${tld}`;
      setQuery(next);
      void run(next, currency);
    },
    [currency, id, query, run],
  );

  function submit(e: FormEvent<HTMLFormElement>) {
    const q = query.trim();
    if (!q) return;
    e.preventDefault();
    void run(q, currency);
  }

  const [desc, setDesc] = useState("");
  const [tab, setTab] = useState<"register" | "transfer" | "ideas">(initialError ? "transfer" : "register");
  const [transferName, setTransferName] = useState("");

  /**
   * A taken name is not a dead end: it belongs to somebody, and that somebody might be the visitor.
   * Sending them to the transfer tab with the name already in the field turns the most common
   * disappointment on this page into the other thing we sell.
   */
  const transferThis = useCallback((name: string) => {
    setTransferName(name);
    setTab("transfer");
  }, []);
  const [ideasStatus, setIdeasStatus] = useState<IdeasStatus>("idle");
  const [ideasData, setIdeasData] = useState<IdeasResponse | null>(null);

  async function suggest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = desc.trim();
    if (d.length < 10 || ideasStatus === "loading") return;
    setIdeasStatus("loading");
    try {
      const token = await turnstileToken(turnstileSiteKey);
      const res = await fetch(ideasUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ description: d, locale, currency, ...(token ? { turnstileToken: token } : {}) }),
      });
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

  const rowProps = { enabled, locale, cartUrl, searchPath, contactHref, labels, onAdd: add, onTransfer: transferThis };
  const freeIdeas = ideasData?.ideas.filter((r) => r.available !== false) ?? [];
  const tabs = ([["register", labels.tabRegister], ["transfer", labels.tabTransfer], ...(ideas ? [["ideas", labels.tabIdeas] as const] : [])] as const).filter(Boolean);
  return (
    <div>
      {/*
       * Three doors on one box, the way a registrar does it: registering a new name, moving one you
       * already own, and describing a business you have not named yet. They were stacked before,
       * which made the third of them a wall of text under a divider that most visitors scrolled
       * past on their way to the only field they wanted.
       */}
      <div role="tablist" aria-label={labels.label} className="mb-5 inline-flex rounded-full border border-line bg-surface-alt p-1 text-sm font-bold">
        {tabs.map(([key, text]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-9 rounded-full px-4 transition ${tab === key ? "bg-panel text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {text}
          </button>
        ))}
      </div>

      {tab === "transfer" ? (
        /*
         * A plain post, not intercepted: the store checks that the name really is registered
         * somewhere else before it goes in the cart, because a name that is free to register is
         * exactly the one that cannot be transferred. The authorisation code is asked for at
         * checkout, never here — it moves the domain, and this page is not where credentials belong.
         */
        <form action={cartUrl} method="post">
          {/*
           * The store refuses a transfer by redirecting back here with a code, and without this the
           * page redrew as if nothing had happened. A form whose failures are invisible is worse
           * than one that cannot fail.
           */}
          {initialError ? (
            <p className="mb-3 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">{labels.cartErrors[initialError] ?? labels.cartErrors.generic}</p>
          ) : null}
          <input type="hidden" name="kind" value="transfer" />
          <input type="hidden" name="years" value="1" />
          <input type="hidden" name="return" value={searchPath} />
          <SearchBar id={`${id}-transfer`} label={labels.transferLabel} hint={labels.transferHint} button={labels.transferButton}>
            <input
              id={`${id}-transfer`}
              name="name"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={253}
              required
              dir="ltr"
              value={transferName}
              onChange={(e) => setTransferName(e.target.value)}
              placeholder={labels.transferPlaceholder}
              className={FIELD}
            />
            {/*
             * The code sits beside the name, where the customer is already looking and already at
             * their old registrar with it in front of them. It is posted to the store and parked
             * there; what comes back in the cart is the id of that row, never the code, because the
             * cart is a cookie. Required, because a transfer without one is a transfer we cannot
             * submit, and refusing that here costs a sentence while refusing it after payment costs
             * a refund.
             */}
            <input
              name="authCode"
              type="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={128}
              required
              dir="ltr"
              placeholder={labels.authCodePlaceholder}
              aria-label={labels.authCodeLabel}
              className={`${FIELD} sm:max-w-56`}
            />
          </SearchBar>
        </form>
      ) : null}

      <form action={searchPath} method="get" onSubmit={submit} role="search" hidden={tab !== "register"}>
        <SearchBar
          id={`${id}-q`}
          label={labels.label}
          hint={labels.hint}
          busy={status === "loading"}
          button={status === "loading" ? labels.checking : labels.button}
        >
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
            className={FIELD}
          />
        </SearchBar>
      </form>

      {/* Results belong to the tab that asked for them: a name search still showing while the
          "Suggest names" tab is open answers a question nobody on that tab asked. */}
      {/*
       * Every ending we sell, under the search and only until there is something better to show.
       *
       * The page lost its price table, which nobody read, and gained a search box floating in an
       * empty screen. These are not a picture of the table: they are the shortest path to a result
       * for the visitor who has a name but no idea what to put after it, and they disappear the
       * moment a search answers, because then the answer is the thing worth looking at.
       */}
      {tab === "register" && tlds.length && !data && status === "idle" ? (
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-faint">{labels.allExtensions}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {tlds.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => pick(t)}
                  className="tabular rounded-full border border-line px-3 py-1.5 text-sm font-bold text-muted transition hover:border-brand hover:bg-brand-soft hover:text-brand-strong"
                >
                  <bdi dir="ltr">.{t}</bdi>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div aria-live="polite" hidden={tab !== "register"}>
        {status === "error" ? <p className="mt-4 text-sm text-warn">{labels.error}</p> : null}
        {status === "limited" ? <p className="mt-4 text-sm text-warn">{labels.rateLimited}</p> : null}
        {status === "invalid" ? <p className="mt-4 text-sm text-warn">{labels.error}</p> : null}
        {status === "loading" && !data ? (
          <div className="mt-6">
            <ul>
              <Pending name={query.trim().includes(".") ? query.trim().toLowerCase() : undefined} />
            </ul>
            <h3 className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
              {labels.otherExtensions}
            </h3>
            <ul className="mt-1">
              {Array.from({ length: SHORTLIST }, (_, i) => (
                <Pending key={`first-${i}`} />
              ))}
            </ul>
          </div>
        ) : null}
        {data && (status === "done" || status === "loading") ? (
          <div className="mt-6">
            {added.length ? (
              // What is in the cart, where the adding happens: the badge is up in the navigation bar,
              // which is off screen by the time a visitor has scrolled through forty endings.
              <p className="mb-3 text-sm font-bold text-brand-strong">{labels.cartTotal.replace("{count}", String(added.length))}</p>
            ) : null}
            {data.primary ? (
              <ul>
                <Row r={data.primary} primary {...rowProps} added={added.includes(data.primary.name)} />
              </ul>
            ) : null}
            {data.suggestions.length || awaiting ? (
              <>
                <h3 className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
                  {labels.otherExtensions}
                </h3>
                {/*
                 * Cheapest first among the ones that can be bought, and everything unavailable after
                 * them. The registrar answers in whatever order it likes, which put a 3,999 .io above
                 * a 199 .shop and a taken name above both.
                 */}
                <ul className={`mt-1 ${SCROLL_LIST}`}>
                  {[...data.suggestions]
                    .sort((a, b) => {
                      const buyable = (x: typeof a) => (x.available === true && x.sellable && !x.premium ? 0 : 1);
                      return buyable(a) - buyable(b) || (a.price?.gross ?? Infinity) - (b.price?.gross ?? Infinity);
                    })
                    .map((r, i) => (
                      <Row key={r.name} r={r} index={i + 1} {...rowProps} added={added.includes(r.name)} />
                    ))}
                  {Array.from({ length: awaiting }, (_, i) => (
                    <Pending key={`pending-${i}`} />
                  ))}
                </ul>
                {!moreLoaded && !awaiting && data.suggestions.length >= SHORTLIST ? (
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-line-strong px-4 text-sm font-bold text-muted hover:border-brand hover:text-ink"
                  >
                    {labels.moreExtensions}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {ideas && tab === "ideas" ? (
        <div>
          <form onSubmit={suggest}>
            <SearchBar
              id={`${id}-desc`}
              label={labels.ideasTitle}
              hint={labels.ideasHint}
              busy={ideasStatus === "loading"}
              button={ideasStatus === "loading" ? labels.ideasWorking : labels.ideasButton}
            >
              <input
                id={`${id}-desc`}
                type="text"
                maxLength={300}
                minLength={10}
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={labels.ideasPlaceholder}
                className={FIELD}
              />
            </SearchBar>
          </form>
          <div aria-live="polite">
            {ideasStatus === "loading" ? (
              <ul className="mt-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Pending key={`idea-${i}`} />
                ))}
              </ul>
            ) : null}
            {ideasStatus === "unavailable" ? (
              <p className="mt-3 text-sm text-muted">{labels.ideasUnavailable}</p>
            ) : null}
            {ideasStatus === "limited" ? <p className="mt-3 text-sm text-warn">{labels.rateLimited}</p> : null}
            {ideasStatus === "error" ? <p className="mt-3 text-sm text-warn">{labels.error}</p> : null}
            {ideasStatus === "done" ? (
              freeIdeas.length ? (
                <ul className={`mt-3 ${SCROLL_LIST}`}>
                  {freeIdeas.map((r, i) => (
                    <Row
                      key={r.name}
                      r={r}
                      index={i}
                      {...rowProps}
                      enabled={enabled || r.sellable}
                      added={added.includes(r.name)}
                    />
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
