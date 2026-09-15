import type { Locale } from "@/lib/i18n";
import { barSummary, daySentence, problemDaysSentence, startLabel, uptimeLabel, type StatusFeed, type StatusService } from "@/lib/status";
import type { Messages } from "@/messages";
import { BarDetail } from "./bar-detail";
import { StateLabel } from "./state";

/**
 * One service: its name and state, the line the platform wrote about it, the 90 bars and what they
 * add up to. Every sentence is built here on the server; the island only moves between them.
 */
export function ServiceRow({ service, feed, locale, t }: { service: StatusService; feed: StatusFeed; locale: Locale; t: Messages }) {
  const last = service.days.length - 1;
  const days = service.days.map((d, i) => ({ state: d.state, sentence: daySentence(t, feed, locale, d, i === last) }));
  const problems = problemDaysSentence(t, feed, locale, service.days);
  const uptime = uptimeLabel(t, service);
  return (
    <li className="pt-5 pb-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-bold text-ink">{service.name[locale]}</h3>
        <StateLabel state={service.state} feed={feed} locale={locale} />
      </div>
      {service.text ? <p className="mt-1 text-sm text-muted">{service.text[locale]}</p> : null}
      <BarDetail days={days} label={barSummary(t, service.days)}>
        {problems ? <p className="sr-only">{problems}</p> : null}
        {/*
         * Start and end under the two ends of the row. The percentage sits between them on a desktop and
         * on its own line on a phone, where the three together would wrap into each other.
         */}
        <div className="mt-2 flex items-start justify-between gap-3 text-xs text-muted">
          <span>{startLabel(t, locale, service)}</span>
          <span className="tabular hidden font-semibold text-ink sm:inline">{uptime}</span>
          <span className="shrink-0">{t.status.today}</span>
        </div>
        <p className="tabular mt-1 text-xs font-semibold text-ink sm:hidden">{uptime}</p>
      </BarDetail>
    </li>
  );
}
