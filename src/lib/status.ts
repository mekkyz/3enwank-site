import { z } from "zod";
import { fill, type Messages } from "@/messages";
import type { Locale } from "./i18n";
import { STATUS_FEED_URL, STATUS_URL } from "./site";

/**
 * The public status page's data (status.3enwank.com). The platform builds the feed from Better Stack
 * readings and the incidents the owner writes (platform repo, docs/design/status-page.md, sections 5
 * and 6); this module fetches it, validates it and turns it into the sentences the page prints.
 *
 * The one rule that shapes everything here: when the feed cannot be trusted, the page says so and
 * shows nothing else. There is no fallback file and no last good copy. The catalogue keeps old
 * prices on screen when the store is away; a status page that kept an old green on screen would be
 * lying at exactly the moment someone opens it.
 */

const localized = z.object({ en: z.string(), ar: z.string() }).strict();
export const STATUS_SERVICE_KEYS = ["websites", "email", "control_panel", "ftp", "portal"] as const;
const serviceKey = z.enum(STATUS_SERVICE_KEYS);
const liveState = z.enum(["running", "issues", "down", "maintenance", "unknown"]);
const dayState = z.enum(["running", "issues", "down", "maintenance", "none"]);
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const instant = z.iso.datetime({ offset: true });
// Floored basis points printed with two decimals ("99.98"), never a number: "100" and "100.00" must not both be possible.
const percent = z.string().regex(/^\d{1,3}\.\d{2}$/);

/** A strict copy of the feed's version 1 (design section 5.1): an unknown key anywhere fails, so a leak cannot render. */
export const statusFeedSchema = z
  .object({
    version: z.literal(1),
    generatedAt: instant,
    updatedAt: instant.nullable(),
    timeZone: z.literal("Africa/Cairo"),
    labels: z.object({ running: localized, issues: localized, down: localized, maintenance: localized, unknown: localized, none: localized }).strict(),
    overall: z.object({ state: liveState, text: localized }).strict(),
    services: z.array(
      z
        .object({
          key: serviceKey,
          name: localized,
          state: liveState,
          text: localized.nullable(),
          trackingSince: calendarDate,
          uptime: z.object({ percent: percent.nullable(), trackedDays: z.number().int().min(0).max(90) }).strict(),
          days: z.array(z.object({ date: calendarDate, state: dayState, percent: percent.nullable() }).strict()).length(90),
        })
        .strict(),
    ),
    incidents: z.array(
      z
        .object({
          id: z.string(),
          title: localized,
          body: localized,
          severity: z.enum(["issues", "down"]),
          services: z.array(serviceKey),
          startedAt: instant,
          resolvedAt: instant.nullable(),
          updatedAt: instant,
        })
        .strict(),
    ),
    maintenance: z.array(
      z
        .object({ id: z.string(), title: localized, body: localized, services: z.array(serviceKey), startsAt: instant, endsAt: instant, inProgress: z.boolean() })
        .strict(),
    ),
  })
  .strict();

export type StatusFeed = z.infer<typeof statusFeedSchema>;
export type StatusService = StatusFeed["services"][number];
export type StatusDay = StatusService["days"][number];
export type LiveState = StatusFeed["overall"]["state"];
export type DayState = StatusDay["state"];
export type StatusResult = { ok: true; feed: StatusFeed } | { ok: false; reason: string };
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export const STATUS_TIME_ZONE = "Africa/Cairo";
/** How long one request may take. Loopback answers in milliseconds; five seconds is an outage. */
export const FEED_TIMEOUT_MS = 5_000;
/** A feed older than this by the site's clock is refused: the platform stamps generatedAt per response, so old means a cache or a stuck clock. */
export const FEED_MAX_AGE_MS = 5 * 60_000;
/** The browser side (the page's inline script): a page older than this hides its states. */
export const PAGE_STALE_MS = 10 * 60_000;
/** The browser side: reload a visible tab this often. */
export const PAGE_RELOAD_MS = 2 * 60_000;
const OK_MEMO_MS = 20_000;
const FAIL_MEMO_MS = 5_000;

/**
 * Fetch and validate the feed. Pure with respect to configuration, so every refusal can be tested;
 * the page calls it through loadStatus. `reason` is for the server log only, never for the page.
 */
export async function resolveStatus(opts: { url: string; fetch?: FetchLike; now?: () => number; timeoutMs?: number }): Promise<StatusResult> {
  const doFetch = opts.fetch ?? ((url, init) => fetch(url, init));
  const now = opts.now ?? Date.now;
  try {
    // no-store: Next's fetch cache is stale-while-revalidate, which would serve an old green first (design 6.3).
    const res = await doFetch(opts.url, { headers: { accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(opts.timeoutMs ?? FEED_TIMEOUT_MS) });
    if (res.status !== 200) return { ok: false, reason: `${opts.url} answered HTTP ${res.status}` };
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return { ok: false, reason: `${opts.url} did not answer JSON` };
    }
    // Asked before the schema, so a version 2 feed is reported as that and not as a pile of key errors.
    if (!body || typeof body !== "object" || (body as { version?: unknown }).version !== 1) return { ok: false, reason: `${opts.url} is not feed version 1` };
    const parsed = statusFeedSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { ok: false, reason: `${opts.url} did not match the status feed contract (${issue ? `${issue.path.join(".")}: ${issue.message}` : "unknown"})` };
    }
    const age = now() - Date.parse(parsed.data.generatedAt);
    if (age > FEED_MAX_AGE_MS) return { ok: false, reason: `${opts.url} answered a feed generated ${Math.round(age / 1000)} s ago` };
    return { ok: true, feed: parsed.data };
  } catch (err) {
    const message = err instanceof Error ? (err.name === "TimeoutError" ? "timed out" : err.message) : String(err);
    return { ok: false, reason: `${opts.url}: ${message}` };
  }
}

/** The one cache: a good answer for 20 s, a refusal for 5 s, and one request at a time however many visitors arrive. */
let memo: { at: number; ttl: number; result: Promise<StatusResult> } | undefined;

/** The feed behind the status page, from STATUS_FEED_URL. Never throws: a failure is a result the page renders. */
export function loadStatus(): Promise<StatusResult> {
  const now = Date.now();
  if (memo && now - memo.at < memo.ttl) return memo.result;
  const result = resolveStatus({ url: STATUS_FEED_URL }).then((r) => {
    if (!r.ok) console.warn(`[status] feed refused: ${r.reason}`);
    // The ttl is settled once the answer is known; until then concurrent renders share the pending request.
    if (current === memo) current.ttl = r.ok ? OK_MEMO_MS : FAIL_MEMO_MS;
    return r;
  });
  const current = { at: now, ttl: FEED_TIMEOUT_MS + 1_000, result };
  memo = current;
  return result;
}

/**
 * Where each language of the page lives. With STATUS_URL set (status.3enwank.com has DNS and a
 * certificate) that host's / and /ar/; before that, the paths this app serves on any instance. Plain
 * <a> links only: on the status host nginx maps / and /ar/ to these routes, and a client-side Next
 * navigation would ask for the wrong path (design 6.1).
 */
export function statusHref(locale: Locale, statusUrl: string = STATUS_URL): string {
  const root = statusUrl.replace(/\/+$/, "");
  if (root) return `${root}${locale === "ar" ? "/ar/" : "/"}`;
  return locale === "ar" ? "/ar/status/" : "/status/";
}

/* ------------------------------------------------------------------------------------------------ */
/* Dates and sentences. Everything in Cairo time, 24-hour, Latin digits in both languages (6.6).     */
/* ------------------------------------------------------------------------------------------------ */

function intlLocale(locale: Locale): string {
  // en-GB for "20 September 2026"; Egyptian Arabic month names with Latin digits, as the site writes every number.
  return locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
}

/** The Cairo calendar date of an instant, as YYYY-MM-DD. */
export function cairoDay(at: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: STATUS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(at));
}

/** "09:10", Cairo. */
export function cairoTime(at: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: STATUS_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(at));
}

/**
 * A calendar date the feed already gives in Cairo ("2026-09-20") as words. Formatted in UTC from noon
 * of that date, so no time zone can move it to the day before or after.
 */
export function dateWords(date: string, locale: Locale, opts: { year?: boolean; weekday?: boolean } = {}): string {
  const at = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    ...(opts.year === false ? {} : { year: "numeric" }),
    ...(opts.weekday ? { weekday: "long" } : {}),
  }).format(at);
}

/**
 * "20 September 2026, 09:10 to 09:48 Cairo time", across midnight "29 September 2026, 23:30 to
 * 30 September, 01:00 Cairo time", still open "20 September 2026, since 09:10 Cairo time".
 * Maintenance names the weekday too, because it is announced for a day people plan around.
 */
export function timeLine(t: Messages, locale: Locale, start: string, end: string | null, opts: { weekday?: boolean } = {}): string {
  const startDay = cairoDay(start);
  const date = dateWords(startDay, locale, { weekday: opts.weekday });
  const from = cairoTime(start, locale);
  if (!end) return fill(t.status.since, { date, from });
  const endDay = cairoDay(end);
  const to = cairoTime(end, locale);
  if (endDay === startDay) return fill(t.status.sameDay, { date, from, to });
  return fill(t.status.acrossDays, { date, from, toDate: dateWords(endDay, locale, { year: false }), to });
}

/** The words a day's bar is described with: its title, the detail line, and the problem list. */
export function daySentence(t: Messages, feed: StatusFeed, locale: Locale, day: StatusDay, isToday: boolean): string {
  const date = isToday ? t.status.todaySoFar : dateWords(day.date, locale);
  if (day.state === "none") return fill(t.status.barNoData, { date });
  const state = feed.labels[day.state][locale];
  return day.percent === null ? fill(t.status.barState, { date, state }) : fill(t.status.barDay, { date, state, percent: day.percent });
}

/** The row's accessible name: how many of the 90 days were in each state. */
export function barSummary(t: Messages, days: StatusDay[]): string {
  const count = { running: 0, issues: 0, down: 0, maintenance: 0, none: 0 } satisfies Record<DayState, number>;
  for (const d of days) count[d.state]++;
  return fill(t.status.barSummary, count);
}

/** "Days with problems: 20 September 2026: Not working, 97.33%." or null when there were none. */
export function problemDaysSentence(t: Messages, feed: StatusFeed, locale: Locale, days: StatusDay[]): string | null {
  const last = days.length - 1;
  const bad = days.flatMap((d, i) => (d.state === "issues" || d.state === "down" ? [daySentence(t, feed, locale, d, i === last)] : []));
  if (!bad.length) return null;
  return fill(t.status.problemDays, { days: bad.join(locale === "ar" ? "؛ " : "; ") });
}

/** "Tracking since 16 September 2026" when tracking began inside the 90 days, otherwise "90 days ago". */
export function startLabel(t: Messages, locale: Locale, service: StatusService): string {
  const first = service.days[0]?.date ?? service.trackingSince;
  return service.trackingSince > first ? fill(t.status.trackingSince, { date: dateWords(service.trackingSince, locale) }) : t.status.daysAgo;
}

export function uptimeLabel(t: Messages, service: StatusService): string {
  return service.uptime.percent === null ? t.status.noUptime : fill(t.status.uptime, { percent: service.uptime.percent });
}
