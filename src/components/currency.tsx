"use client";

import { createContext, useContext, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
// From money.ts, not catalogue.ts: this is a client island, and the catalogue module carries zod.
import { CURRENCY_KEY, DEFAULT_CURRENCY, currencies, type Currency, type Money } from "@/lib/money";
import { formatPrice } from "@/lib/format";
import { isolateDir, ltrRun } from "@/lib/bidi";
import type { Locale } from "@/lib/i18n";
import { CurrencyIcon } from "./icons";

/**
 * The EGP/USD switch. No network, no cookie.
 *
 * Every <Price> and <RenewalNote> is rendered in both currencies, each in its own
 * `span[data-currency]`, and globals.css hides the ones <html data-currency> does not name. The
 * attribute is stamped from localStorage by the before-paint script in root.tsx and moved by
 * setCurrency below. This used to be done by re-rendering after hydration, which painted EGP first
 * for a visitor who had chosen USD; with CSS choosing, the first frame is already right, and
 * without JavaScript the page is EGP, which is what search engines index.
 */
const STORAGE_KEY = CURRENCY_KEY;
const DEFAULT: Currency = DEFAULT_CURRENCY;

/** The price shown for one currency: its own, or, when the store has none in it, the first it does have. */
function pick<T>(prices: Partial<Record<Currency, T>>, c: Currency): Currency | undefined {
  return prices[c] ? c : currencies.find((x) => prices[x]);
}

/**
 * Moves the CSS switch. Written straight to <html>, not through React, so it cannot lag a render
 * behind. A real change also sets `currency-switching` for a moment, which fades the prices in
 * (globals.css), so the figures visibly change rather than blinking; stamping the value the page
 * already has does nothing, so a page load never fades.
 */
function stamp(c: Currency) {
  const root = document.documentElement;
  if (root.dataset.currency === c) return;
  root.classList.add("currency-switching");
  window.setTimeout(() => root.classList.remove("currency-switching"), 400);
  root.dataset.currency = c;
}

function isCurrency(v: unknown): v is Currency {
  return typeof v === "string" && (currencies as readonly string[]).includes(v);
}

/**
 * localStorage as an external store: the server snapshot is always EGP (what the HTML carries), the
 * client snapshot is the visitor's last choice, and React reconciles the two after hydration.
 */
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  // A choice made in another tab moves this tab's prices too, which now means moving the attribute.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) stamp(getSnapshot());
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
function getSnapshot(): Currency {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isCurrency(stored) ? stored : DEFAULT;
  } catch {
    return DEFAULT;
  }
}
function getServerSnapshot(): Currency {
  return DEFAULT;
}
function store(c: Currency) {
  // First, and outside the try: a visitor whose storage is blocked still sees the switch take effect.
  stamp(c);
  try {
    window.localStorage.setItem(STORAGE_KEY, c);
  } catch {
    // Private mode or storage disabled: the choice lasts until the next page.
  }
  for (const l of listeners) l();
}

const CurrencyContext = createContext<{ currency: Currency; setCurrency: (c: Currency) => void }>({
  currency: DEFAULT,
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // A visitor whose storage is blocked still gets a working toggle for the current page.
  const [override, setOverride] = useState<Currency | null>(null);
  const currency = override ?? stored;
  const setCurrency = (c: Currency) => {
    setOverride(c);
    store(c);
  };
  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

/** A price in the chosen currency, isolated left-to-right; `normal` shows a crossed-out list price when the chosen currency has one. */
export function Price({
  prices,
  locale,
  className = "",
  fallback,
  normal,
}: {
  prices: Partial<Record<Currency, Money>>;
  locale: Locale;
  className?: string;
  fallback: string;
  normal?: Partial<Record<Currency, Money>>;
}) {
  if (!currencies.some((c) => prices[c])) return <span className={className}>{fallback}</span>;
  /*
   * One span per currency, and CSS shows the one <html data-currency> names (see the note at the
   * top of this file). `contents` keeps each span out of the layout, so the struck-out figure and
   * the price are still the flex row's own items and the gap between them is unchanged. A currency
   * the store has no price in shows the first one it does have, as before.
   */
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-1.5 ${className}`}>
      {currencies.map((c) => {
        const chosen = pick(prices, c)!;
        const money = prices[chosen]!;
        const was = normal?.[chosen] && normal[chosen]!.gross > money.gross ? normal[chosen] : undefined;
        const wasText = was ? formatPrice(was, chosen, locale) : "";
        const text = formatPrice(money, chosen, locale);
        return (
          <span key={c} data-currency={c} className="contents">
            {/* isolateDir, not dir="ltr": an Arabic EGP price is "1,999 جنيه" now (S12), and forcing it left to right would put the word first. */}
            {was ? (
              <bdi dir={isolateDir(wasText)} className="tabular whitespace-nowrap text-xs font-medium text-faint line-through">
                {wasText}
              </bdi>
            ) : null}
            <bdi dir={isolateDir(text)} className="tabular whitespace-nowrap">
              {text}
            </bdi>
          </span>
        );
      })}
    </span>
  );
}

/**
 * A sentence with one {price} in it, the price following the currency switch: the care, websites and
 * domains intros ("Care plans: updates, scans and edits, from EGP 3,999 a year.", S13). With no price
 * at all it renders `fallback`, the same statement without the clause, rather than a sentence with a
 * hole in it.
 */
export function PricedText({ template, prices, locale, fallback }: { template: string; prices: Partial<Record<Currency, Money>>; locale: Locale; fallback: string }) {
  const at = template.indexOf("{price}");
  if (at < 0 || !currencies.some((c) => prices[c])) return <>{fallback}</>;
  return (
    <>
      {template.slice(0, at)}
      <Price prices={prices} locale={locale} fallback="" className="inline" />
      {template.slice(at + "{price}".length)}
    </>
  );
}

/**
 * The EGP/USD switch, in the bar beside the language menu.
 *
 * It used to be a segmented control sitting above each price table, with a line of explanation under
 * it, repeated on five pages. Currency is a property of the whole visit rather than of one table, so
 * it belongs where the language menu is; and the explanation it carried ("invoices in either currency
 * are paid by bank transfer") is on the invoice itself and in the terms, which is where a person
 * looks for it.
 *
 * The three-letter code stays visible at every width: it is the state, and an icon alone would not
 * say which currency the prices are in.
 */
export function CurrencySwitch({ label }: { label: string }) {
  const { currency, setCurrency } = useCurrency();
  const menu = useRef<HTMLDetailsElement | null>(null);
  const summary = useRef<HTMLElement | null>(null);
  /*
   * Choosing closes the menu. A <details> only closes itself on a click outside or on Escape (the
   * script in root.tsx), so after a choice the list stayed open over the page with the pressed
   * button highlighted, and a keyboard user was left inside a menu that had already done its job.
   * Focus goes back to the summary, which is where it was before the menu opened.
   */
  const choose = (c: Currency) => {
    setCurrency(c);
    if (menu.current) menu.current.open = false;
    summary.current?.focus();
  };
  return (
    <details data-menu ref={menu} className="relative">
      <summary
        ref={summary}
        className="flex min-h-11 cursor-pointer list-none items-center rounded-full px-1 text-sm font-bold text-muted hover:text-ink sm:px-2 [&::-webkit-details-marker]:hidden"
        aria-label={`${label}: ${currency}`}
        title={label}
      >
        <CurrencyIcon />
      </summary>
      {/* The menu is a container (rounded-lg) and its options are rows (rounded-md): pills are for buttons and tabs. */}
      <ul className="absolute end-0 z-50 mt-1 w-max rounded-lg border border-line bg-panel p-1 text-sm shadow-lg">
        {currencies.map((c) => (
          <li key={c}>
            <button
              type="button"
              onClick={() => choose(c)}
              aria-pressed={currency === c}
              className={`tabular flex min-h-11 w-full items-center whitespace-nowrap rounded-md px-3 text-start font-bold ${currency === c ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-brand-soft hover:text-ink"}`}
            >
              {c}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * "First year. Renews at EGP 2,499 a year." in whichever currency the visitor is looking at.
 *
 * A client island for the same reason <Price> is one: the currency lives in the browser, and the
 * renewal figure has to move with it or the card would quote a year-one price in dollars beside a
 * renewal in pounds.
 */
export function RenewalNote({
  prices,
  locale,
  label,
  className = "",
}: {
  prices: Partial<Record<Currency, Money>>;
  locale: Locale;
  label: string;
  className?: string;
}) {
  if (!currencies.some((c) => prices[c])) return null;
  // Both sentences, one per currency, and CSS shows the chosen one, as <Price> does.
  return (
    <p className={className}>
      {currencies.map((c) => {
        const chosen = pick(prices, c)!;
        // Its own left-to-right run, as fill() does for the dictionary: "2,499 EGP" after "بـ" came out as "EGP 2,499".
        return (
          <span key={c} data-currency={c} className="contents">
            {label.replace("{price}", ltrRun(formatPrice(prices[chosen]!, chosen, locale)))}
          </span>
        );
      })}
    </p>
  );
}
