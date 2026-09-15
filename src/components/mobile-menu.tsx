"use client";

import { useRef, type KeyboardEvent, type MouseEvent } from "react";
import { ListIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { currencies } from "@/lib/money";
import { useCurrency } from "./currency";

export type MobileMenuLabels = { menu: string; close: string; language: string; currency: string; login: string; contact: string; status: string };
export type MenuLink = { href: string; label: string; current: boolean };
export type MenuLanguage = { code: string; href: string; name: string; lang: string; dir: "ltr" | "rtl"; current: boolean };

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The phone header's one Menu button and the sheet it opens (owner, 2026-09-15, S15).
 *
 * Below lg the bar is the logo, the cart and this button on one 69px row; the language, the
 * currency, Log in, the four product links and Contact all live in the sheet. It replaces a second
 * row of links that scrolled sideways under the logo and four icon controls squeezed beside it.
 *
 * A modal <dialog>: showModal() puts it in the top layer, makes the page behind it inert, moves focus
 * to the first control (the close button) and closes on Escape, all natively. Tab is also held inside
 * explicitly, because a modal dialog alone still lets focus leave for the browser's own toolbar and
 * come back in at an arbitrary point. Closing hands focus back to the Menu button. The sheet sits on
 * the end side of the page in either direction: `ms-auto` is margin-left in English and margin-right
 * in Arabic. It does not slide: nothing about opening a menu needs explaining by motion.
 *
 * Without JavaScript the button does nothing, and every link in the sheet is also in the footer.
 */
export function MobileMenu({
  labels,
  links,
  languages,
  loginHref,
  contactHref,
  contactCurrent,
  statusHref = null,
}: {
  labels: MobileMenuLabels;
  links: MenuLink[];
  languages: MenuLanguage[];
  loginHref: string;
  contactHref: string;
  contactCurrent: boolean;
  /** The status page, only while STATUS_URL is set (S14); nothing is drawn without it. */
  statusHref?: string | null;
}) {
  const dialog = useRef<HTMLDialogElement | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const { currency, setCurrency } = useCurrency();

  const open = () => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  };
  const close = () => dialog.current?.close();

  /** Tab past the last control comes back to the first, and Shift+Tab before the first goes to the last. */
  const trap = (e: KeyboardEvent<HTMLDialogElement>) => {
    const d = dialog.current;
    if (e.key !== "Tab" || !d) return;
    const items = Array.from(d.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !d.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !d.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };
  // A click whose target is the dialog itself landed on the backdrop: the sheet's content is one inner block.
  const backdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialog.current) close();
  };

  const row = "flex min-h-12 items-center border-b border-line text-lg font-bold";
  return (
    <>
      <button
        ref={opener}
        type="button"
        data-menu-button=""
        onClick={open}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-sm font-bold text-ink hover:border-brand hover:text-brand-strong"
      >
        <ListIcon size={18} weight="bold" aria-hidden="true" className="shrink-0" />
        {labels.menu}
      </button>
      <dialog
        ref={dialog}
        aria-label={labels.menu}
        onKeyDown={trap}
        onClick={backdrop}
        onClose={() => opener.current?.focus()}
        /*
         * The whole screen on a phone (verify, S15): a 15px strip of the page showed beside the sheet at 390px.
         * That strip is the scrollbar gutter (scrollbar-gutter: stable), which a width of 100% leaves out, so
         * under sm the sheet is pinned physically at left 0 and 100vw wide, in either direction. From sm it is
         * the 24rem side sheet on the end side again.
         */
        className="m-0 ms-auto h-dvh max-h-none w-full max-w-sm overflow-y-auto border-s border-line bg-panel p-0 text-ink backdrop:bg-black/50 max-sm:right-auto max-sm:left-0 max-sm:w-screen max-sm:max-w-none max-sm:border-s-0"
      >
        <div className="flex min-h-full flex-col px-5 pb-8">
          {/* The close control where the Menu button was, on a row the height of the bar. */}
          <div className="flex h-[68px] shrink-0 items-center justify-end">
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-sm font-bold text-ink hover:border-brand hover:text-brand-strong"
            >
              <XIcon size={18} weight="bold" aria-hidden="true" className="shrink-0" />
              {labels.close}
            </button>
          </div>
          <nav aria-label={labels.menu}>
            <ul className="border-t border-line">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} aria-current={l.current ? "page" : undefined} className={`${row} ${l.current ? "text-brand-strong" : "text-ink hover:text-brand-strong"}`}>
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={contactHref} aria-current={contactCurrent ? "page" : undefined} className={`${row} ${contactCurrent ? "text-brand-strong" : "text-ink hover:text-brand-strong"}`}>
                  {labels.contact}
                </a>
              </li>
              {statusHref ? (
                <li>
                  <a href={statusHref} className={`${row} text-ink hover:text-brand-strong`}>
                    {labels.status}
                  </a>
                </li>
              ) : null}
            </ul>
          </nav>
          <a href={loginHref} className="btn-primary mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-bold">
            {labels.login}
          </a>
          <div className="mt-8">
            <p className="text-sm font-bold text-muted">{labels.language}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {languages.map((l) => (
                <li key={l.code}>
                  <a
                    href={l.href}
                    hrefLang={l.lang}
                    lang={l.lang}
                    dir={l.dir}
                    aria-current={l.current ? "true" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold ${l.current ? "bg-brand-soft text-brand-strong" : "border border-line-strong text-ink hover:border-brand"}`}
                  >
                    {l.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-muted">{labels.currency}</p>
            <div role="group" aria-label={labels.currency} className="mt-2 flex flex-wrap gap-2">
              {currencies.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  aria-pressed={currency === c}
                  className={`tabular inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold ${currency === c ? "bg-brand-soft text-brand-strong" : "border border-line-strong text-ink hover:border-brand"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
