"use client";

import { useId, useState, type ReactNode } from "react";

export type TabItem = { id: string; label: string; panel: ReactNode };

/**
 * Pill tabs over panels that are rendered on the server. Every panel is in the HTML and only one is
 * shown, so the prices inside them come from the catalogue like any other part of the page and
 * switching a tab costs nothing. The pills match the domain search's, which are the other tabs on
 * the site.
 */
export function Tabs({ items, label, className = "" }: { items: TabItem[]; label: string; className?: string }) {
  const uid = useId();
  const [active, setActive] = useState(items[0]?.id ?? "");
  const current = items.some((i) => i.id === active) ? active : (items[0]?.id ?? "");
  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="mb-5 inline-flex rounded-full border border-line bg-surface p-1 text-sm font-bold">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${uid}-${item.id}-tab`}
            aria-selected={current === item.id}
            aria-controls={`${uid}-${item.id}`}
            onClick={() => setActive(item.id)}
            className={`min-h-9 rounded-full px-4 transition ${current === item.id ? "bg-panel text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div key={item.id} role="tabpanel" id={`${uid}-${item.id}`} aria-labelledby={`${uid}-${item.id}-tab`} hidden={current !== item.id}>
          {item.panel}
        </div>
      ))}
    </div>
  );
}
