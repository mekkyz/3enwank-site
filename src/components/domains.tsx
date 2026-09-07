import type { Tld } from "@/lib/catalogue";
import type { Locale } from "@/lib/i18n";
import { fill, messagesFor } from "@/messages";
import { Ltr } from "./bidi";
import { Price } from "./currency";

export function TldTable({ tlds, locale }: { tlds: Tld[]; locale: Locale }) {
  const t = messagesFor(locale);
  const hasTransfer = tlds.some((x) => x.prices.EGP?.transfer || x.prices.USD?.transfer);
  const pick = (x: Tld, kind: "register" | "renew" | "transfer") => ({ EGP: x.prices.EGP?.[kind] ?? undefined, USD: x.prices.USD?.[kind] ?? undefined });
  return (
    <div data-reveal className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full min-w-[28rem] text-sm">
        <caption className="sr-only">{t.domains.tableCaption}</caption>
        <thead>
          <tr className="border-b border-line text-muted">
            <th scope="col" className="nowrap px-4 py-3 text-start font-semibold">
              {t.domains.extension}
            </th>
            <th scope="col" className="nowrap px-4 py-3 text-end font-semibold">
              {t.domains.register}
            </th>
            <th scope="col" className="nowrap px-4 py-3 text-end font-semibold">
              {t.domains.renew}
            </th>
            {hasTransfer ? (
              <th scope="col" className="nowrap px-4 py-3 text-end font-semibold">
                {t.domains.transfer}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {tlds.map((x) => (
            <tr key={x.tld} className="border-b border-line last:border-0">
              <th scope="row" className="nowrap px-4 py-2.5 text-start font-bold text-ink">
                <Ltr>.{x.tld}</Ltr>
              </th>
              <td className="nowrap px-4 py-2.5 text-end">
                <Price prices={pick(x, "register")} locale={locale} fallback={t.common.notAvailable} />
              </td>
              <td className="nowrap px-4 py-2.5 text-end">
                <Price prices={pick(x, "renew")} locale={locale} fallback={t.common.notAvailable} />
              </td>
              {hasTransfer ? (
                <td className="nowrap px-4 py-2.5 text-end">
                  <Price prices={pick(x, "transfer")} locale={locale} fallback={t.common.notAvailable} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-3 text-xs text-muted">
        {t.domains.perYear} {t.domains.privacy} {tlds.length ? fill(t.domains.years, { min: Math.min(...tlds.map((x) => x.minYears)), max: Math.max(...tlds.map((x) => x.maxYears)) }) : null}
      </p>
    </div>
  );
}
