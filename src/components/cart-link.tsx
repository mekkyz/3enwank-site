"use client";

import { useSyncExternalStore } from "react";
import { CartIcon } from "./icons";

/**
 * The basket in the bar, linking to the store's cart on the same origin.
 *
 * The count comes from the `cart_count` cookie the platform writes beside its signed cart
 * (3enwank-platform/src/lib/cart/cookie.ts). It is read here with script rather than on the server
 * on purpose: every page of this site is statically rendered and revalidated from the catalogue, and
 * reading a cookie on the server would opt all of them into rendering per request. So the icon is
 * part of the cached HTML and only the number arrives after hydration — the server snapshot is 0,
 * which is what the cached HTML must say for a visitor who has no cart at all.
 *
 * A visitor who edits that cookie changes this badge and nothing else: the cart the checkout reads
 * is signed and httpOnly, and every price is recomputed there.
 */
function subscribe(onChange: () => void) {
  // The customer may add something in a store tab and come back to this one...
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("pageshow", onChange);
  // ...or add a domain from the search on this page, which never navigates.
  window.addEventListener("enwank:cart", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("pageshow", onChange);
    window.removeEventListener("enwank:cart", onChange);
  };
}

function getSnapshot(): number {
  try {
    const raw = document.cookie.split("; ").find((c) => c.startsWith("cart_count="));
    const n = raw ? Number.parseInt(raw.slice("cart_count=".length), 10) : 0;
    return Number.isFinite(n) && n > 0 ? Math.min(n, 99) : 0;
  } catch {
    return 0;
  }
}

function getServerSnapshot(): number {
  return 0;
}

export function CartLink({ href, label }: { href: string; label: string }) {
  const count = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <a
      href={href}
      className="relative flex min-h-11 items-center rounded-full px-2 text-muted hover:text-ink"
      aria-label={count > 0 ? `${label} (${count})` : label}
      title={label}
    >
      <CartIcon />
      {count > 0 ? (
        <span className="tabular absolute end-0.5 top-1 inline-flex min-w-[17px] items-center justify-center rounded-full bg-brand-ink px-1 text-[10px] font-extrabold leading-[15px] text-white">
          {count}
        </span>
      ) : null}
    </a>
  );
}
