import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { STATUS_SCENARIOS, statusFixture } from "../../scripts/status-fixture.mjs";
import { barSummary, dateWords, daySentence, problemDaysSentence, resolveStatus, startLabel, statusFeedSchema, statusHref, timeLine, uptimeLabel, type FetchLike, type StatusFeed } from "./status";

const URL = "http://127.0.0.1:3000/account/api/public/status";
const NOW = Date.parse("2026-09-23T10:12:05.114Z");

function feed(scenario = "check", now = NOW): StatusFeed {
  return statusFeedSchema.parse(statusFixture(scenario, now));
}
const answer = (body: unknown, status = 200): FetchLike => async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

describe("status feed contract", () => {
  it("accepts every fixture scenario the page is looked at with", () => {
    for (const s of STATUS_SCENARIOS.filter((x) => x !== "unavailable")) {
      const parsed = statusFeedSchema.safeParse(statusFixture(s, NOW));
      expect(parsed.success, `${s}: ${parsed.success ? "" : JSON.stringify(parsed.error.issues[0])}`).toBe(true);
    }
  });

  it("uses the feed when it validates and is fresh, and asks for it uncached", async () => {
    let init: RequestInit | undefined;
    const r = await resolveStatus({ url: URL, now: () => NOW, fetch: async (_u, i) => ((init = i), Response.json(statusFixture("check", NOW))) });
    expect(r.ok).toBe(true);
    expect(init?.cache).toBe("no-store");
  });

  it("refuses rather than shows anything when the feed cannot be trusted", async () => {
    const good = statusFixture("check", NOW) as StatusFeed;
    const withKey = structuredClone(good) as unknown as { services: Array<Record<string, unknown>> };
    withKey.services[0]!.monitorId = "2731190";
    const shortDays = structuredClone(good);
    shortDays.services[0]!.days.pop();
    const badPercent = structuredClone(good);
    badPercent.services[0]!.uptime.percent = "100";
    const cases: Array<[string, FetchLike]> = [
      ["a 503", answer({ version: 1, error: "unavailable" }, 503)],
      ["a 204", async () => new Response(null, { status: 204 })],
      ["not JSON", answer("<html>bad gateway</html>")],
      ["version 2", answer({ ...good, version: 2 })],
      ["an unknown key (strict, so a monitor id can never render)", answer(withKey)],
      ["89 days", answer(shortDays)],
      ["a percentage that is not two decimals", answer(badPercent)],
      ["a feed generated six minutes ago", answer(statusFixture("old", NOW))],
      ["a network error", async () => { throw new TypeError("fetch failed"); }],
    ];
    for (const [name, f] of cases) {
      const r = await resolveStatus({ url: URL, now: () => NOW, fetch: f });
      expect(r.ok, name).toBe(false);
    }
  });

  it("gives up after the timeout", async () => {
    const hang: FetchLike = (_u, init) => new Promise((_, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal!.reason)));
    const r = await resolveStatus({ url: URL, now: () => NOW, fetch: hang, timeoutMs: 20 });
    expect(r).toEqual({ ok: false, reason: `${URL}: timed out` });
  });
});

describe("status page links", () => {
  it("uses the status host once STATUS_URL is set, and the app's own paths before", () => {
    expect(statusHref("en", "https://status.3enwank.com")).toBe("https://status.3enwank.com/");
    expect(statusHref("ar", "https://status.3enwank.com/")).toBe("https://status.3enwank.com/ar/");
    expect(statusHref("en", "")).toBe("/status/");
    expect(statusHref("ar", "")).toBe("/ar/status/");
  });
});

describe("status sentences", () => {
  const en = messagesFor("en");
  const ar = messagesFor("ar");

  it("writes incident and maintenance times in Cairo, 24-hour, Latin digits, isolated in Arabic", () => {
    // 07:10Z is 10:10 in Cairo in September (daylight saving, UTC+3).
    expect(timeLine(en, "en", "2026-09-20T07:10:00Z", "2026-09-20T07:48:00Z")).toBe("20 September 2026, 10:10 to 10:48 Cairo time");
    expect(timeLine(en, "en", "2026-09-29T20:30:00Z", "2026-09-29T22:00:00Z")).toBe("29 September 2026, 23:30 to 30 September, 01:00 Cairo time");
    expect(timeLine(en, "en", "2026-09-20T07:10:00Z", null)).toBe("20 September 2026, since 10:10 Cairo time");
    expect(timeLine(en, "en", "2026-09-29T23:00:00Z", "2026-09-30T00:00:00Z", { weekday: true })).toMatch(/^Wednesday,? 30 September 2026, 02:00 to 03:00 Cairo time$/);
    expect(timeLine(ar, "ar", "2026-09-20T07:10:00Z", "2026-09-20T07:48:00Z")).toBe("20 سبتمبر 2026، من ⁦10:10⁩ لـ ⁦10:48⁩ بتوقيت القاهرة");
    expect(timeLine(ar, "ar", "2026-09-20T07:10:00Z", null)).not.toMatch(/[٠-٩]/);
  });

  it("describes a day's bar, today's as the day so far, and no data without a percentage", () => {
    const f = feed();
    const email = f.services.find((s) => s.key === "email")!;
    const last = email.days.length - 1;
    expect(daySentence(en, f, "en", email.days[last]!, true)).toBe("Today so far: Not working, 98.54%");
    expect(daySentence(ar, f, "ar", email.days[last]!, true)).toBe("النهارده لحد دلوقتي: واقفة، ⁧⁦98.54⁩٪⁩");
    expect(daySentence(en, f, "en", { date: "2026-09-20", state: "none", percent: null }, false)).toBe("20 September 2026: no data");
    expect(daySentence(en, f, "en", { date: "2026-09-20", state: "maintenance", percent: null }, false)).toBe("20 September 2026: Maintenance");
  });

  it("counts the 90 days for the row's accessible name and lists only the days with problems", () => {
    const f = feed();
    const ftp = f.services.find((s) => s.key === "ftp")!;
    expect(barSummary(en, ftp.days)).toBe("Last 90 days: 10 running normally, 0 with some issues, 0 not working, 0 with maintenance, 80 with no data.");
    expect(problemDaysSentence(en, f, "en", ftp.days)).toBeNull();
    const email = f.services.find((s) => s.key === "email")!;
    const sentence = problemDaysSentence(en, f, "en", email.days)!;
    expect(sentence).toMatch(/^Days with problems: .*Not working, 97\.33%; .*Today so far: Not working, 98\.54%\.$/);
    expect(sentence).not.toMatch(/Running normally|Maintenance/);
  });

  it("says when tracking started only when it started inside the 90 days", () => {
    const f = feed();
    const ftp = f.services.find((s) => s.key === "ftp")!;
    const websites = f.services.find((s) => s.key === "websites")!;
    expect(startLabel(en, "en", ftp)).toBe(`Tracking since ${dateWords(ftp.trackingSince, "en")}`);
    expect(startLabel(en, "en", websites)).toBe("90 days ago");
    expect(uptimeLabel(en, { ...websites, uptime: { percent: null, trackedDays: 0 } })).toBe("No data yet");
    expect(uptimeLabel(en, websites)).toMatch(/^\d{2,3}\.\d{2}% uptime$/);
  });

  it("never counts a day before tracking as up", () => {
    const f = feed("short");
    for (const s of f.services) for (const d of s.days) if (d.date < s.trackingSince) expect(d.state, `${s.key} ${d.date}`).toBe("none");
  });
});

describe("status chrome copy", () => {
  it("carries the same placeholders in both languages and follows the writing rules", () => {
    const en = messagesFor("en").status;
    const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      for (const locale of locales) {
        const s = messagesFor(locale).status[key];
        expect(names(s), `${locale} status.${key}`).toEqual(names(en[key]));
        expect(s, `${locale} status.${key}`).not.toMatch(/[—!]/);
      }
    }
  });
});
