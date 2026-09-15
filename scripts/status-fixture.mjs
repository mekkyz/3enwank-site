// Invented status feeds for looking at the status page without the platform (and without Better
// Stack, which this repo never calls). Shaped exactly like the platform's feed, version 1
// (platform repo, docs/design/status-page.md 5.1), with its wording copied from section 4, and
// stamped at request time so the site's five-minute age check accepts them.
//
//   node scripts/status-fixture.mjs [port]      serves http://127.0.0.1:<port>/<scenario>
//   STATUS_FEED_URL=http://127.0.0.1:<port>/check pnpm exec next start ...
//
// scripts/visual-check.mjs starts the server in-process on the "check" scenario, and
// src/lib/status.test.ts validates every scenario against the site's schema, so a fixture that drifts
// from the contract fails the tests before it misleads a screenshot.
//
// SAMPLE DATA. NOTHING HERE IS A REAL READING.
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const TZ = "Africa/Cairo";

const LABELS = {
  running: { en: "Running normally", ar: "شغالة عادي" },
  issues: { en: "Some issues", ar: "فيها مشاكل" },
  down: { en: "Not working", ar: "واقفة" },
  maintenance: { en: "Maintenance", ar: "صيانة" },
  unknown: { en: "Status not available", ar: "الحالة مش متاحة" },
  none: { en: "No data", ar: "مفيش بيانات" },
};

const NAMES = {
  websites: { en: "Websites", ar: "المواقع" },
  email: { en: "Email", ar: "الإيميل" },
  control_panel: { en: "Control panel", ar: "لوحة التحكم" },
  ftp: { en: "FTP", ar: "⁦FTP⁩" },
  portal: { en: "Customer portal", ar: "منطقة العملاء" },
};

const LINES = {
  websites: { issues: { en: "Some websites may be slow or not load.", ar: "بعض المواقع ممكن تكون بطيئة أو ماتفتحش." }, down: { en: "Websites on our servers are not loading.", ar: "المواقع اللي على سيرفراتنا مش بتفتح." } },
  email: { issues: { en: "Some customers may have trouble sending or receiving email.", ar: "بعض العملاء ممكن يلاقوا مشكلة في إرسال أو استلام الإيميل." }, down: { en: "Email is not working.", ar: "الإيميل واقف." } },
  control_panel: { issues: { en: "Some customers may have trouble logging in to the control panel.", ar: "بعض العملاء ممكن يلاقوا مشكلة في الدخول على لوحة التحكم." }, down: { en: "The control panel is not opening.", ar: "لوحة التحكم مش بتفتح." } },
  ftp: { issues: { en: "Some file uploads may fail.", ar: "رفع الملفات ممكن يفشل أحيانًا." }, down: { en: "File uploads are not working.", ar: "رفع الملفات واقف." } },
  portal: { issues: { en: "Some pages of the customer area may not open.", ar: "بعض صفحات منطقة العملاء ممكن ماتفتحش." }, down: { en: "The customer area is not opening.", ar: "منطقة العملاء مش بتفتح." } },
};
const FOLLOW = { en: "We are looking into it.", ar: "بنشوف المشكلة دلوقتي." };

const followed = (line) => ({ en: `${line.en} ${FOLLOW.en}`, ar: `${line.ar} ${FOLLOW.ar}` });

function cairoDay(ms) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}
function addDays(date, n) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
/** A Cairo wall-clock time as an ISO instant, through Intl so daylight saving is whatever the tz data says. */
function cairoAt(date, time) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wanted = Date.UTC(y, m - 1, d, hh, mm);
  let guess = wanted - 2 * 3600_000;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
    guess += wanted - Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  }
  return new Date(guess).toISOString();
}
const bp = (n) => `${Math.floor(n / 100)}.${String(n % 100).padStart(2, "0")}`;

/**
 * One service: 90 days ending today, "none" before tracking started, and `marks` keyed by days ago
 * ({ 6: ["down", 9733] }). Uptime is the floored mean of the measured days, close enough to the
 * platform's sum for a picture.
 */
function service(key, today, { state = "running", text = null, since, marks = {} }) {
  const days = [];
  for (let ago = 89; ago >= 0; ago--) {
    const date = addDays(today, -ago);
    const mark = marks[ago];
    if (date < since || (mark && mark[0] === "none")) days.push({ date, state: "none", percent: null });
    else if (mark) days.push({ date, state: mark[0], percent: mark[1] === null ? null : bp(mark[1]) });
    else days.push({ date, state: "running", percent: "100.00" });
  }
  const measured = days.filter((d) => d.percent !== null);
  const sum = measured.reduce((a, d) => a + Math.round(Number(d.percent) * 100), 0);
  return {
    key,
    name: NAMES[key],
    state,
    text,
    trackingSince: since,
    uptime: { percent: measured.length ? bp(Math.floor(sum / measured.length)) : null, trackedDays: days.filter((d) => d.state !== "none").length },
    days,
  };
}

export const STATUS_SCENARIOS = ["running", "issues", "incident", "maintenance", "upcoming", "short", "hidden", "allHidden", "check", "unavailable", "old"];

/** The feed for one scenario at `now`, or null for "unavailable" (the platform's 503). */
export function statusFixture(scenario, now = Date.now()) {
  if (scenario === "unavailable") return null;
  const today = cairoDay(now);
  const long = addDays(today, -200);
  const iso = (ms) => new Date(ms).toISOString();
  const history = {
    websites: { 23: ["issues", 9986] },
    email: { 6: ["down", 9733], 12: ["issues", 9951], 40: ["issues", 9990] },
    control_panel: {},
    ftp: { 55: ["none"] },
    portal: { 18: ["maintenance", 10000] },
  };
  const base = (key, extra = {}) => service(key, today, { since: long, ...extra, marks: { ...history[key], ...(extra.marks ?? {}) } });

  const resolved = {
    id: "01926f3a-0000-7000-8000-000000000001",
    title: { en: "Incoming email was delayed", ar: "تأخر وصول البريد الوارد" },
    body: { en: "Incoming mail was held for about 40 minutes.\nAll of it was delivered.", ar: "احتُجز البريد الوارد نحو 40 دقيقة.\nوتم تسليمه كله." },
    severity: "down",
    services: ["email"],
    startedAt: cairoAt(addDays(today, -6), "09:10"),
    resolvedAt: cairoAt(addDays(today, -6), "09:48"),
    updatedAt: cairoAt(addDays(today, -6), "10:02"),
  };
  const open = {
    id: "01926f3a-0000-7000-8000-000000000002",
    title: { en: "Incoming email is not arriving", ar: "البريد الوارد لا يصل" },
    body: { en: "Incoming email is not reaching mailboxes. Sending still works.\nNo mail is lost: it will arrive once this is fixed.", ar: "لا يصل البريد الوارد إلى صناديق البريد، والإرسال يعمل.\nلن تُفقد أي رسالة، وستصل كلها بعد الإصلاح." },
    severity: "down",
    services: ["email"],
    startedAt: iso(now - 35 * 60_000),
    resolvedAt: null,
    updatedAt: iso(now - 10 * 60_000),
  };
  const portalWindow = {
    id: "01926f3a-0000-7000-8000-000000000003",
    title: { en: "Customer area update", ar: "تحديث منطقة العملاء" },
    body: { en: "The customer area may not open for up to 30 minutes. Websites and email are not affected.", ar: "قد لا تفتح منطقة العملاء لمدة تصل إلى 30 دقيقة. المواقع والبريد لا يتأثران." },
    services: ["portal"],
    startsAt: iso(now - 20 * 60_000),
    endsAt: iso(now + 40 * 60_000),
    inProgress: true,
  };
  const mailWindow = {
    id: "01926f3a-0000-7000-8000-000000000004",
    title: { en: "Mail server update", ar: "تحديث خادم البريد" },
    body: { en: "Sending and receiving may pause for a few minutes. No mail is lost.", ar: "قد يتوقف الإرسال والاستقبال لبضع دقائق. لن تفقد أي رسائل." },
    services: ["email"],
    startsAt: cairoAt(addDays(today, 3), "02:00"),
    endsAt: cairoAt(addDays(today, 3), "03:00"),
    inProgress: false,
  };
  const nightWindow = {
    id: "01926f3a-0000-7000-8000-000000000005",
    title: { en: "Hosting server restart", ar: "إعادة تشغيل خادم الاستضافة" },
    body: { en: "Websites and FTP may be unreachable for up to 15 minutes during the window.", ar: "قد لا تعمل المواقع و⁦FTP⁩ لمدة تصل إلى 15 دقيقة خلال هذه الفترة." },
    services: ["websites", "ftp"],
    startsAt: cairoAt(addDays(today, 8), "23:30"),
    endsAt: cairoAt(addDays(today, 9), "01:00"),
    inProgress: false,
  };

  const running = { state: "running", text: { en: "All services are running normally.", ar: "كل الخدمات شغالة عادي." } };
  let overall = running;
  let services = ["websites", "email", "control_panel", "ftp", "portal"].map((k) => base(k));
  let incidents = [resolved];
  let maintenance = [];
  let updatedAt = iso(now - 40_000);

  if (scenario === "running") incidents = [];
  if (scenario === "issues") {
    const text = followed(LINES.email.issues);
    services[1] = base("email", { state: "issues", text, marks: { 0: ["issues", 9958] } });
    overall = { state: "issues", text };
  }
  if (scenario === "incident") {
    services[1] = base("email", { state: "down", text: open.title, marks: { 0: ["down", 9854] } });
    incidents = [open, resolved];
    overall = { state: "down", text: open.title };
  }
  if (scenario === "maintenance") {
    services[4] = base("portal", { state: "maintenance", text: portalWindow.title, marks: { 0: ["maintenance", 10000] } });
    maintenance = [portalWindow, mailWindow];
    overall = { state: "maintenance", text: { en: "Planned maintenance is in progress for Customer portal.", ar: "في صيانة مخططة شغالة دلوقتي على منطقة العملاء." } };
  }
  if (scenario === "upcoming") maintenance = [mailWindow, nightWindow];
  if (scenario === "short") {
    // Control panel has no monitor yet, so it is not in the feed at all; FTP and the portal started recently.
    services = [base("websites"), base("email"), service("ftp", today, { since: addDays(today, -4) }), service("portal", today, { since: addDays(today, -19), marks: { 7: ["issues", 9972] } })];
    incidents = [];
  }
  if (scenario === "hidden") {
    // FTP has no fresh reading, so the platform leaves its row out and the top line speaks for the rest.
    services = services.filter((s) => s.key !== "ftp");
    overall = { state: "running", text: { en: "The services below are running normally.", ar: "الخدمات اللي تحت شغالة عادي." } };
  }
  if (scenario === "allHidden") {
    // No service has a fresh reading (a lost token, say): the platform sends no rows and the unavailable line.
    services = [];
    incidents = [];
    overall = { state: "unknown", text: { en: "Status is temporarily unavailable. Please check again in a few minutes.", ar: "الحالة مش متاحة دلوقتي. جرّب تاني بعد شوية." } };
    updatedAt = null;
  }
  if (scenario === "check") {
    // Everything at once for the render check: an issue without an incident, an open incident, maintenance in progress and ahead, a short history.
    services = [
      base("websites", { state: "issues", text: followed(LINES.websites.issues), marks: { 0: ["issues", 9931] } }),
      base("email", { state: "down", text: open.title, marks: { 0: ["down", 9854] } }),
      base("control_panel"),
      service("ftp", today, { since: addDays(today, -9) }),
      base("portal", { state: "maintenance", text: portalWindow.title, marks: { 0: ["maintenance", 10000] } }),
    ];
    incidents = [open, resolved];
    maintenance = [portalWindow, mailWindow];
    overall = { state: "down", text: { en: "We are working on problems with Websites and Email. Details are below.", ar: "بنشتغل على مشاكل في المواقع والإيميل. التفاصيل تحت." } };
  }

  // "old": a feed generated six minutes ago, which the site must refuse.
  const generatedAt = iso(scenario === "old" ? now - 6 * 60_000 : now);
  return { version: 1, generatedAt, updatedAt, timeZone: TZ, labels: LABELS, overall, services, incidents, maintenance };
}

/** Serves every scenario at /<scenario>; resolves once listening. */
export function serveStatusFixtures({ port = 0, host = "127.0.0.1" } = {}) {
  const server = createServer((req, res) => {
    const scenario = (req.url ?? "/").split("?")[0].replace(/^\/+|\/+$/g, "") || "check";
    if (!STATUS_SCENARIOS.includes(scenario)) {
      res.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ error: "unknown scenario", scenarios: STATUS_SCENARIOS }));
      return;
    }
    const feed = statusFixture(scenario);
    if (!feed) {
      res.writeHead(503, { "content-type": "application/json", "cache-control": "no-store" }).end(JSON.stringify({ version: 1, error: "unavailable" }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=30" }).end(JSON.stringify(feed));
  });
  return new Promise((resolve) => server.listen(port, host, () => resolve({ server, url: `http://${host}:${server.address().port}` })));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { url } = await serveStatusFixtures({ port: Number(process.argv[2] ?? 3450) });
  console.log(`status fixtures (SAMPLE DATA) on ${url}/<scenario>: ${STATUS_SCENARIOS.join(", ")}`);
}
