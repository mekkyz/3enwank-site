"use client";

import { createContext, useContext, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
// From money.ts, not catalogue.ts: this is a client island, and the catalogue module carries zod.
import { currencies, type Currency, type Money } from "@/lib/money";
import { formatPrice } from "@/lib/format";
import { ltrRun } from "@/lib/bidi";
import type { Locale } from "@/lib/i18n";
import { CurrencyIcon } from "./icons";

/**
 * The EGP/USD switch. Pages render EGP on the server (what most visitors want and what search
 * engines index); after hydration the visitor's last choice is restored from localStorage and every
 * <Price> re-renders. No network, no cookie.
 */
const STORAGE_KEY = "3enwank.currency";
const DEFAULT: Currency = "EGP";

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
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
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
  const { currency } = useCurrency();
  const chosen = prices[currency] ? currency : currencies.find((c) => prices[c]);
  const money = chosen ? prices[chosen] : undefined;
  const was = chosen && normal?.[chosen] && normal[chosen]!.gross > (money?.gross ?? 0) ? normal[chosen] : undefined;
  if (!money || !chosen) return <span className={className}>{fallback}</span>;
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-1.5 ${className}`}>
      {was ? (
        <bdi dir="ltr" className="tabular whitespace-nowrap text-xs font-medium text-faint line-through">
          {formatPrice(was, chosen, locale)}
        </bdi>
      ) : null}
      <bdi dir="ltr" className="tabular whitespace-nowrap">
        {formatPrice(money, chosen, locale)}
      </bdi>
    </span>
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
      <ul className="absolute end-0 z-50 mt-1 w-max rounded-2xl border border-line bg-panel p-1 text-sm shadow-lg">
        {currencies.map((c) => (
          <li key={c}>
            <button
              type="button"
              onClick={() => choose(c)}
              aria-pressed={currency === c}
              className={`tabular block w-full whitespace-nowrap rounded-full px-3 py-1.5 text-start font-bold ${currency === c ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-brand-soft hover:text-ink"}`}
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
  const { currency } = useCurrency();
  const chosen = prices[currency] ? currency : currencies.find((c) => prices[c]);
  const money = chosen ? prices[chosen] : undefined;
  if (!money || !chosen) return null;
  // Its own left-to-right run, as fill() does for the dictionary: "2,499 EGP" after "بـ" came out as "EGP 2,499".
  return <p className={className}>{label.replace("{price}", ltrRun(formatPrice(money, chosen, locale)))}</p>;
}
