"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { currencies, type Currency, type Money } from "@/lib/catalogue";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

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

const CurrencyContext = createContext<{ currency: Currency; setCurrency: (c: Currency) => void }>({ currency: DEFAULT, setCurrency: () => {} });

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
export function Price({ prices, locale, className = "", fallback, normal }: { prices: Partial<Record<Currency, Money>>; locale: Locale; className?: string; fallback: string; normal?: Partial<Record<Currency, Money>> }) {
  const { currency } = useCurrency();
  const chosen = prices[currency] ? currency : currencies.find((c) => prices[c]);
  const money = chosen ? prices[chosen] : undefined;
  const was = chosen && normal?.[chosen] && normal[chosen]!.gross > (money?.gross ?? 0) ? normal[chosen] : undefined;
  if (!money || !chosen) return <span className={className}>{fallback}</span>;
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      {was ? (
        <bdi dir="ltr" className="tabular whitespace-nowrap text-sm font-medium text-faint line-through">
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
  return (
    <details className="relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-muted hover:text-ink [&::-webkit-details-marker]:hidden" aria-label={label} title={label}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2.5" />
          <circle cx="12" cy="12" r="2.75" />
        </svg>
        <span className="tabular">{currency}</span>
      </summary>
      <ul className="absolute end-0 z-50 mt-1 min-w-28 rounded-lg border border-line bg-panel p-1 text-sm shadow-lg">
        {currencies.map((c) => (
          <li key={c}>
            <button
              type="button"
              onClick={() => setCurrency(c)}
              aria-pressed={currency === c}
              className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 font-bold ${currency === c ? "bg-brand-soft text-brand-strong" : "text-ink hover:bg-brand-soft"}`}
            >
              <span className="tabular">{c}</span>
              {currency === c ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
