import type { Metadata } from "next";
import { ServiceRow } from "@/components/status/service-row";
import { STATUS_COLUMN, StatusShell } from "@/components/status/status-shell";
import { Legend, Swatch } from "@/components/status/state";
import { langTag, type Locale } from "@/lib/i18n";
import { SITE_URL, STATUS_URL } from "@/lib/site";
import { cairoTime, loadStatus, statusHref, timeLine, type StatusFeed } from "@/lib/status";
import { fill, messagesFor, type Messages } from "@/messages";

/**
 * status.3enwank.com in one language (platform repo, docs/design/status-page.md section 6). Not a
 * PageKey and not in the sitemap: it lives on its own host, with its own small shell.
 *
 * Order, following the owner's brief: the overall line, the services with their bars, recent
 * incidents, planned maintenance. When the feed is refused only the unavailable line is rendered:
 * no bars, no old incidents, nothing that could be read as a state. A feed without service rows (no
 * service has a fresh reading, or tracking has not started) is shown the same way, with its own top line.
 */
export const status = {
  metadata(locale: Locale): Metadata {
    const t = messagesFor(locale);
    const title = fill(t.status.metaTitle, { brand: t.meta.siteName });
    const description = fill(t.status.description, {}, { isolate: false });
    // Before STATUS_URL is set the page is reachable on the apex as /status/, unlinked; absolute from SITE_URL there.
    const abs = (l: Locale) => {
      const href = statusHref(l);
      return href.startsWith("/") ? `${SITE_URL}${href}` : href;
    };
    return {
      title,
      description,
      alternates: { canonical: abs(locale), languages: { en: abs("en"), ar: abs("ar"), "x-default": abs("en") } },
      // noindex until it has its own address: indexing /status/ on the apex would give it two.
      robots: STATUS_URL ? { index: true, follow: true } : { index: false, follow: true },
      icons: {
        icon: [
          { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
          { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: "/apple-icon-180.png",
      },
      other: { "content-language": langTag(locale) },
    };
  },

  async render(locale: Locale) {
    const t = messagesFor(locale);
    // Never loadCatalogue() here: it throws when the store is down, which is exactly when this page is needed (6.3).
    const result = await loadStatus();
    const feed = result.ok ? result.feed : null;
    return (
      <StatusShell locale={locale} generatedAt={feed?.generatedAt ?? null}>
        <section className="border-b border-line">
          <div className={`${STATUS_COLUMN} py-8 sm:py-12`}>
            <h1 className="sr-only">{t.status.heading}</h1>
            {feed ? (
              <div data-status-live="">
                <p className="flex items-start gap-3 text-xl leading-snug font-bold text-ink sm:text-2xl">
                  {/* Centred on the first line of the sentence: (line height 1.375 - 0.5em square) / 2. */}
                  <Swatch state={feed.overall.state} className="mt-[0.44em] size-[0.5em]" />
                  <span>{feed.overall.text[locale]}</span>
                </p>
                {feed.updatedAt ? <p className="mt-2 ps-[calc(0.5em+0.75rem)] text-sm text-muted sm:ps-[calc(0.5*1.5rem+0.75rem)]">{fill(t.status.updated, { time: cairoTime(feed.updatedAt, locale) })}</p> : null}
              </div>
            ) : null}
            <p data-status-unavailable="" hidden={feed !== null} className="text-xl leading-snug font-bold text-ink sm:text-2xl">
              {t.status.unavailable}
            </p>
          </div>
        </section>
        {feed?.services.length ? <FeedSections feed={feed} locale={locale} t={t} /> : null}
      </StatusShell>
    );
  },
};

function FeedSections({ feed, locale, t }: { feed: StatusFeed; locale: Locale; t: Messages }) {
  const names = new Map(feed.services.map((s) => [s.key, s.name[locale]]));
  // Only shown services have names; the feed already filters, this keeps a stray key from printing as "email".
  const serviceNames = (keys: string[]) =>
    keys
      .map((k) => names.get(k as StatusFeed["services"][number]["key"]))
      .filter(Boolean)
      .join(" · ");
  return (
    <>
      {feed.services.length ? (
        <section data-status-live="" aria-labelledby="status-services" className="border-b border-line">
          <div className={`${STATUS_COLUMN} py-8 sm:py-10`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
              <h2 id="status-services" className="text-xl font-extrabold text-ink">
                {t.status.services}
              </h2>
              <Legend feed={feed} locale={locale} />
            </div>
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {feed.services.map((s) => (
                <ServiceRow key={s.key} service={s} feed={feed} locale={locale} t={t} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      <section data-status-live="" aria-labelledby="status-incidents" className="border-b border-line">
        <div className={`${STATUS_COLUMN} py-8 sm:py-10`}>
          <h2 id="status-incidents" className="text-xl font-extrabold text-ink">
            {t.status.incidents}
          </h2>
          {feed.incidents.length ? (
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {feed.incidents.map((i) => (
                <li key={i.id} className="py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-base font-bold text-ink">{i.title[locale]}</h3>
                    <p className="inline-flex flex-wrap items-center gap-x-2 text-sm text-muted">
                      <span>{serviceNames(i.services)}</span>
                      <span aria-hidden="true">·</span>
                      {i.resolvedAt ? (
                        <span>{t.status.resolved}</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 font-semibold text-ink">
                          <Swatch state={i.severity} />
                          {t.status.ongoing}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="tabular mt-1 text-sm text-muted">
                    <time dateTime={i.startedAt}>{timeLine(t, locale, i.startedAt, i.resolvedAt)}</time>
                  </p>
                  {/* Operator text as plain text, its line breaks kept; never HTML. */}
                  <p className="mt-2 text-sm whitespace-pre-line text-ink">{i.body[locale]}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">{t.status.noIncidents}</p>
          )}
        </div>
      </section>
      {feed.maintenance.length ? (
        <section data-status-live="" aria-labelledby="status-maintenance" className="border-b border-line">
          <div className={`${STATUS_COLUMN} py-8 sm:py-10`}>
            <h2 id="status-maintenance" className="text-xl font-extrabold text-ink">
              {t.status.maintenance}
            </h2>
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {feed.maintenance.map((m) => (
                <li key={m.id} className="py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-base font-bold text-ink">{m.title[locale]}</h3>
                    <p className="inline-flex flex-wrap items-center gap-x-2 text-sm text-muted">
                      <span>{serviceNames(m.services)}</span>
                      {m.inProgress ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-2 font-semibold text-ink">
                            <Swatch state="maintenance" />
                            {t.status.inProgress}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <p className="tabular mt-1 text-sm text-muted">
                    <time dateTime={m.startsAt}>{timeLine(t, locale, m.startsAt, m.endsAt, { weekday: true })}</time>
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-line text-ink">{m.body[locale]}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
