"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type TabItem = { id: string; label: string; panel: ReactNode };

/**
 * Arrow keys, Home and End for a role="tablist", the WAI-ARIA way: the tablist is one stop in the
 * tab order (only the selected tab has tabIndex 0), and the arrows move both focus and selection.
 * Every tab stop used to be separate, so a keyboard user tabbed through three tabs to reach the
 * panel they had already chosen, and the arrows did nothing.
 *
 * Selection follows focus because every panel here is cheap to show: the plan panels are already in
 * the HTML and the domain tabs only swap a form. Left and Right follow what the eye sees, so on an
 * Arabic page, where the first tab is on the right, ArrowLeft moves to the next one. The direction is
 * read from the tablist itself rather than passed in, so the helper needs no locale.
 *
 * Exported for the domain search, which has its own tablist with the same rules.
 */
export function tabKeys<K extends string>(e: KeyboardEvent<HTMLElement>, keys: readonly K[], current: K, select: (key: K) => void, tabId: (key: K) => string) {
  const i = keys.indexOf(current);
  if (i < 0 || !keys.length) return;
  const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
  let next: number;
  switch (e.key) {
    case "ArrowRight":
      next = rtl ? i - 1 : i + 1;
      break;
    case "ArrowLeft":
      next = rtl ? i + 1 : i - 1;
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = keys.length - 1;
      break;
    default:
      return;
  }
  e.preventDefault();
  const key = keys[(next + keys.length) % keys.length]!;
  select(key);
  document.getElementById(tabId(key))?.focus();
}

/**
 * The one tab strip on the site. The plans on the home page and the domain search each drew their
 * own, on different grounds (bg-surface and bg-surface-alt), with a selected pill painted in the
 * panel colour, which on the domain search's panel was the colour of the panel itself (owner,
 * 2026-09-14: "the tabs for domains and for plans have no same look"). Both use this now.
 *
 * The strip is a translucent tint of the ink colour, so it reads the same on the page, on a tinted
 * section and inside a panel. The selected tab is marked by one pill that slides to it, in the
 * brand-soft and brand-strong pair the footer theme switch and the "Most chosen" badge already use.
 * Until the pill has been measured (the server render, and a visitor without JavaScript) the
 * selected button paints that same colour itself, so the switch-over at hydration is invisible.
 *
 * The pill is measured from the selected button (offsetLeft/offsetTop, which are physical, so an
 * Arabic strip needs nothing extra) and re-measured when the strip resizes: on a phone the tabs
 * share the row, and a web font arriving changes every label's width. A pill that appears for the
 * first time does not slide in from the corner, because a newly mounted element has no previous
 * position to transition from.
 */
export function TabStrip<K extends string>({
  label,
  tabs,
  current,
  onSelect,
  tabId,
  panelId,
}: {
  label: string;
  tabs: ReadonlyArray<{ id: K; label: string }>;
  current: K;
  onSelect: (id: K) => void;
  tabId: (id: K) => string;
  panelId: (id: K) => string;
}) {
  const list = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const measure = useCallback(() => {
    const el = list.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!el) return;
    const next = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    setPill((p) => (p && p.x === next.x && p.y === next.y && p.w === next.w && p.h === next.h ? p : next));
  }, []);
  // Before paint, so the pill is under the new tab in the same frame its text turns bold-coloured.
  useLayoutEffect(() => {
    measure();
  }, [current, measure]);
  useEffect(() => {
    const el = list.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    document.fonts?.ready.then(() => measure()).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);
  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      onKeyDown={(e) => tabKeys(e, tabs.map((x) => x.id), current, onSelect, tabId)}
      className="relative isolate mb-5 flex w-full rounded-full border border-line bg-ink/5 p-1 text-sm font-bold sm:inline-flex sm:w-auto"
    >
      {pill ? (
        <span
          aria-hidden="true"
          className="absolute -z-10 rounded-full bg-brand-soft shadow-sm"
          style={{
            left: 0,
            top: 0,
            width: pill.w,
            height: pill.h,
            transform: `translate(${pill.x}px, ${pill.y}px)`,
            transition: "transform 0.32s cubic-bezier(0.2, 0.7, 0.2, 1), width 0.32s cubic-bezier(0.2, 0.7, 0.2, 1)",
          }}
        />
      ) : null}
      {tabs.map((tab) => {
        const on = current === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabId(tab.id)}
            aria-selected={on}
            aria-controls={panelId(tab.id)}
            tabIndex={on ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            className={`min-h-11 flex-1 whitespace-nowrap rounded-full px-3 transition-[color,background-color,scale] duration-200 active:scale-[0.97] sm:flex-none sm:px-4 ${on ? `text-brand-strong ${pill ? "" : "bg-brand-soft"}` : "text-muted hover:text-ink"}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A smooth height change between tab panels whose content is only rendered while the tab is open
 * (the domain search: a one-line search, a two-field transfer form, a results list that grows).
 * The outer box is locked at the old height, then eased to the new one, then released to auto, so
 * the page below moves smoothly instead of jumping, and content that grows later (search results)
 * is never clipped. Overflow is hidden only while the height moves, so focus rings are not cut off
 * the rest of the time. The last height is kept by a ResizeObserver; its callbacks arrive after
 * layout, so when the tab changes the stored figure is still the old panel's.
 *
 * A component rather than a hook: it has to write to the element's style, and the react-hooks lint
 * only allows that on refs the same component created.
 *
 * `fade` marks the panels for the fade-up in globals.css (data-tab-fade). The caller turns it on
 * once a tab has been chosen, so the panel a visitor lands on does not fade in at hydration.
 */
export function HeightTween({ tweenKey, fade, children }: { tweenKey: string; fade: boolean; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const last = useRef<number | null>(null);
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const to = i.offsetHeight;
    const from = last.current;
    last.current = to;
    if (from === null || from === to) return;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      // No matchMedia: animate.
    }
    const reset = () => {
      o.style.height = "";
      o.style.overflow = "";
      o.style.transition = "";
    };
    o.style.height = `${from}px`;
    o.style.overflow = "hidden";
    void o.offsetHeight;
    o.style.transition = "height 0.32s cubic-bezier(0.2, 0.7, 0.2, 1)";
    o.style.height = `${to}px`;
    const timer = window.setTimeout(() => {
      reset();
      if (inner.current) last.current = inner.current.offsetHeight;
    }, 360);
    return () => {
      window.clearTimeout(timer);
      reset();
    };
  }, [tweenKey]);
  useEffect(() => {
    const i = inner.current;
    if (!i || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (!outer.current?.style.height && inner.current) last.current = inner.current.offsetHeight;
    });
    ro.observe(i);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outer}>
      <div ref={inner} data-tab-fade={fade ? "" : undefined}>
        {children}
      </div>
    </div>
  );
}

/**
 * Pill tabs over panels that are rendered on the server: every panel is in the HTML, so the prices
 * inside them come from the catalogue like any other part of the page.
 *
 * The panels share one grid cell, so the box is as tall as the tallest panel and choosing a tab
 * never moves the page below it. They used to swap with `hidden`, and hosting's cards are a line
 * taller than the other two families' (26px on a laptop, 78px on a phone), so the rest of the page
 * jumped by that much on every click (owner, 2026-09-14). The panel leaving fades out quickly and
 * the one arriving fades up a moment later, so the two sets of cards never sit on top of each other
 * at half strength. A panel that is not chosen is `invisible` and `inert`: out of the tab order and
 * out of the accessibility tree, as `hidden` was.
 */
export function Tabs({ items, label, className = "" }: { items: TabItem[]; label: string; className?: string }) {
  const uid = useId();
  const [active, setActive] = useState(items[0]?.id ?? "");
  const current = items.some((i) => i.id === active) ? active : (items[0]?.id ?? "");
  const tabId = (id: string) => `${uid}-${id}-tab`;
  const panelId = (id: string) => `${uid}-${id}`;
  return (
    <div className={className}>
      <TabStrip label={label} tabs={items} current={current} onSelect={setActive} tabId={tabId} panelId={panelId} />
      <div className="grid">
        {items.map((item) => {
          const on = current === item.id;
          return (
            <div
              key={item.id}
              role="tabpanel"
              id={panelId(item.id)}
              aria-labelledby={tabId(item.id)}
              inert={!on}
              className={`[grid-area:1/1] transition-[opacity,translate,visibility] ease-out ${on ? "visible translate-y-0 opacity-100 delay-100 duration-300" : "pointer-events-none invisible translate-y-1.5 opacity-0 duration-150"}`}
            >
              {item.panel}
            </div>
          );
        })}
      </div>
    </div>
  );
}
