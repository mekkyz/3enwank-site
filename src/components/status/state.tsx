import type { Locale } from "@/lib/i18n";
import type { LiveState, StatusFeed } from "@/lib/status";

/**
 * The state marks of the status page: a small flat square in the state's colour, not a pill and not
 * an icon circle (the site's plain look). "Status not available" is a hollow ring, because it is the
 * page declining to state a colour, not a fourth colour (design 4.2).
 */
const SWATCH: Record<LiveState, string> = {
  running: "rounded-[2px] bg-ok",
  issues: "rounded-[2px] bg-warn",
  down: "rounded-[2px] bg-danger",
  maintenance: "rounded-[2px] bg-accent",
  unknown: "rounded-full border-2 border-line-strong",
};

export function Swatch({ state, className = "size-2.5" }: { state: LiveState; className?: string }) {
  return <span aria-hidden="true" className={`inline-block shrink-0 ${SWATCH[state]} ${className}`} />;
}

/** "■ Running normally", the label text from the feed so the platform's wording is the only copy. */
export function StateLabel({ state, feed, locale }: { state: LiveState; feed: StatusFeed; locale: Locale }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-semibold ${state === "unknown" ? "text-muted" : "text-ink"}`}>
      <Swatch state={state} />
      {feed.labels[state][locale]}
    </span>
  );
}

/** What the bar colours mean, including the no-data stub, which is a shape rather than a colour. */
export function Legend({ feed, locale }: { feed: StatusFeed; locale: Locale }) {
  const states = ["running", "issues", "down", "maintenance"] as const;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {states.map((s) => (
        <li key={s} className="inline-flex items-center gap-1.5">
          <Swatch state={s} />
          {feed.labels[s][locale]}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0">
          <span className="mt-[7px] block h-[3px] w-full bg-line-strong" />
        </span>
        {feed.labels.none[locale]}
      </li>
    </ul>
  );
}
