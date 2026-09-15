"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

/**
 * One service's 90 daily bars and the detail line that names the day under the pointer, the finger
 * or the keyboard (status page, design 6.5).
 *
 * Plain data in, no zod and no feed types: this ships to the browser, and the sentences were already
 * written on the server in the page's language. Without JavaScript every bar keeps its title.
 *
 * The row is one tab stop, not ninety. Arrow keys move along it the way it reads: in Arabic the row
 * runs right to left like the text, so today is on the left and the left arrow goes towards it.
 */
export type BarDay = { state: "running" | "issues" | "down" | "maintenance" | "none"; sentence: string };

// Full class names, so Tailwind sees each one. No data is a stub at the baseline: a different shape as well as a colour, never read as up.
const FILL: Record<BarDay["state"], string> = {
  running: "h-full bg-ok",
  issues: "h-full bg-warn",
  down: "h-full bg-danger",
  maintenance: "h-full bg-accent",
  none: "h-[3px] bg-line-strong",
};

export function BarDetail({ days, label, children }: { days: BarDay[]; label: string; children?: ReactNode }) {
  const [active, setActive] = useState<number | null>(null);
  const focused = useRef(false);
  // A tapped bar stays named after the finger lifts; a hovered one only while the mouse is over the row.
  const pinned = useRef(false);
  const last = days.length - 1;

  // The page reloads itself every two minutes; the inline script skips a reload within 10 s of this stamp.
  function touch(el: Element) {
    const root = el.closest<HTMLElement>("[data-status-root]");
    if (root) root.dataset.touchedAt = String(Date.now());
  }
  function indexAt(target: EventTarget | null): number | null {
    const li = target instanceof Element ? target.closest("li[data-i]") : null;
    return li ? Number(li.getAttribute("data-i")) : null;
  }

  function onPointerMove(e: PointerEvent<HTMLOListElement>) {
    if (e.pointerType !== "mouse") return;
    const i = indexAt(e.target);
    if (i !== null && i !== active) {
      setActive(i);
      touch(e.currentTarget);
    }
  }
  function onPointerDown(e: PointerEvent<HTMLOListElement>) {
    const i = indexAt(e.target);
    if (i === null) return;
    pinned.current = e.pointerType !== "mouse";
    setActive(i);
    touch(e.currentTarget);
  }
  function onPointerLeave(e: PointerEvent<HTMLOListElement>) {
    if (e.pointerType === "mouse" && !focused.current && !pinned.current) setActive(null);
  }
  function onKeyDown(e: KeyboardEvent<HTMLOListElement>) {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const from = active ?? last;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = from + (rtl ? -1 : 1);
    else if (e.key === "ArrowLeft") next = from + (rtl ? 1 : -1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(Math.min(last, Math.max(0, next)));
    touch(e.currentTarget);
  }

  return (
    <>
      <ol
        tabIndex={0}
        aria-label={label}
        data-bars=""
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerLeave={onPointerLeave}
        onKeyDown={onKeyDown}
        onFocus={() => {
          focused.current = true;
          // Focus starts on today, the day a visitor came to ask about.
          setActive((a) => a ?? last);
        }}
        onBlur={() => {
          focused.current = false;
          if (!pinned.current) setActive(null);
        }}
        // 1px gaps under 480px so 90 bars still fit a phone at 3px each; 28px tall from sm, 24px below (design 6.5).
        className="mt-3 flex h-6 touch-manipulation items-stretch gap-px rounded-[2px] min-[480px]:gap-0.5 sm:h-7"
      >
        {days.map((d, i) => (
          <li key={i} data-i={i} aria-hidden="true" title={d.sentence} className="flex min-w-0 flex-1 items-end">
            {/* The named bar gets an outline, which draws outside its box and moves nothing. */}
            <span className={`block w-full rounded-[1px] ${FILL[d.state]} ${i === active ? "outline-2 outline-offset-1 outline-ink" : ""}`} />
          </li>
        ))}
      </ol>
      {children}
      {/* One line always reserved, so naming a day never pushes the next service down. */}
      <p aria-live="polite" className="mt-1 min-h-lh text-xs font-semibold text-ink">
        {active === null ? "" : days[active]?.sentence}
      </p>
    </>
  );
}
