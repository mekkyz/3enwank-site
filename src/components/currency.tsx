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

export function CurrencyToggle({ label, hint }: { label: string; hint: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div role="group" aria-label={label} className="inline-flex rounded-lg border border-line bg-panel p-0.5 text-sm font-bold">
        {currencies.map((c) => (
          <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)} className={`min-h-9 rounded-md px-3.5 transition ${currency === c ? "bg-brand text-white" : "text-muted hover:text-ink"}`}>
            {c}
          </button>
        ))}
      </div>
      <p className="max-w-xs text-end text-xs text-muted">{hint}</p>
    </div>
  );
}
