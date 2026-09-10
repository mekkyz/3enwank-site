"use client";

import { useSyncExternalStore } from "react";

/**
 * Open or closed, right now, in Cairo.
 *
 * A client island because it cannot be anything else: every page of this site is statically
 * rendered and revalidated from the catalogue, so a badge decided on the server would be baked in
 * and could sit there saying "open now" at three in the morning.
 *
 * The hours are read in Africa/Cairo through Intl rather than by adding two hours to UTC. Egypt has
 * observed summer time again since 2023, so a fixed offset is wrong for about half the year, and it
 * would be wrong in the direction that matters: an hour either side of opening is exactly when
 * someone looks at this.
 */
export type Hours = { open: string; closedToday: string; closedTomorrow: string; closedWeekend: string };

/** Sunday to Thursday, 09:00 up to 18:00. Egypt's working week; Friday and Saturday are the weekend. */
const FIRST_HOUR = 9;
const LAST_HOUR = 18;
const WORKING = new Set(["Sun", "Mon", "Tue", "Wed", "Thu"]);

type Now = { day: string; hour: number };

function cairoNow(): Now | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date());
    const day = parts.find((p) => p.type === "weekday")?.value ?? "";
    const hour = Number.parseInt(parts.find((p) => p.type === "hour")?.value ?? "", 10);
    return day && Number.isFinite(hour) ? { day, hour: hour === 24 ? 0 : hour } : null;
  } catch {
    // A browser without the time zone database says nothing rather than guessing.
    return null;
  }
}

export function statusOf(now: Now | null, t: Hours): { open: boolean; text: string } | null {
  if (!now) return null;
  const working = WORKING.has(now.day);
  if (working && now.hour >= FIRST_HOUR && now.hour < LAST_HOUR) return { open: true, text: t.open };
  if (working && now.hour < FIRST_HOUR) return { open: false, text: t.closedToday };
  // Thursday evening through Saturday: the next working morning is Sunday.
  if (now.day === "Fri" || now.day === "Sat" || (now.day === "Thu" && now.hour >= LAST_HOUR)) return { open: false, text: t.closedWeekend };
  return { open: false, text: t.closedTomorrow };
}

/** Re-read when the tab comes back, so a page left open overnight is not still claiming to be open. */
function subscribe(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("pageshow", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("pageshow", onChange);
  };
}

export function OfficeStatus({ t, className = "" }: { t: Hours; className?: string }) {
  const now = useSyncExternalStore(
    subscribe,
    () => {
      const n = cairoNow();
      return n ? `${n.day}:${n.hour}` : "";
    },
    () => "",
  );
  const parsed = now ? { day: now.split(":")[0]!, hour: Number(now.split(":")[1]) } : null;
  const status = statusOf(parsed, t);
  // Nothing at all until the browser has answered: an empty badge is better than a wrong one.
  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${status.open ? "bg-ok-soft text-ok" : "bg-surface-alt text-muted"} ${className}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${status.open ? "bg-ok" : "bg-faint"}`} />
      {status.text}
    </span>
  );
}
