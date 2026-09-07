import type { Tld } from "@/lib/catalogue";
import type { Locale } from "@/lib/i18n";
import { fill, messagesFor } from "@/messages";
import { Price } from "./currency";

/** Plain GET form: the store's search page reads ?q= and does the availability check. No JavaScript needed. */
export function DomainSearchForm({ action, locale }: { action: string; locale: Locale }) {
  const t = messagesFor(locale);
  return (
    <form action={action} method="get" className="max-w-xl">
      <label htmlFor="domain-q" className="mb-2 block text-sm font-medium text-ink">
        {t.domains.searchLabel}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="domain-q"
          name="q"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={253}
          required
          placeholder={t.domains.searchPlaceholder}
          dir="ltr"
          className="block w-full rounded-md border border-line bg-panel px-3 py-2.5 text-base text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
        />
        <button type="submit" className="inline-flex shrink-0 items-center justify-center rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
          {t.domains.searchButton}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">{t.domains.searchHint}</p>
    </form>
  );
}

export function TldTable({ tlds, locale }: { tlds: Tld[]; locale: Locale }) {
  const t = messagesFor(locale);
  const hasTransfer = tlds.some((x) => x.prices.EGP?.transfer || x.prices.USD?.transfer);
  const pick = (x: Tld, kind: "register" | "renew" | "transfer") => ({ EGP: x.prices.EGP?.[kind] ?? undefined, USD: x.prices.USD?.[kind] ?? undefined });
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full min-w-[28rem] text-sm">
        <caption className="sr-only">{t.domains.tableCaption}</caption>
        <thead>
          <tr className="border-b border-line text-muted">
            <th scope="col" className="px-4 py-3 text-start font-medium">
              {t.domains.extension}
            </th>
            <th scope="col" className="px-4 py-3 text-end font-medium">
              {t.domains.register}
            </th>
            <th scope="col" className="px-4 py-3 text-end font-medium">
              {t.domains.renew}
            </th>
            {hasTransfer ? (
              <th scope="col" className="px-4 py-3 text-end font-medium">
                {t.domains.transfer}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {tlds.map((x) => (
            <tr key={x.tld} className="border-b border-line last:border-0">
              <th scope="row" className="px-4 py-2.5 text-start font-semibold text-ink" dir="ltr">
                .{x.tld}
              </th>
              <td className="px-4 py-2.5 text-end">
                <Price prices={pick(x, "register")} locale={locale} />
              </td>
              <td className="px-4 py-2.5 text-end">
                <Price prices={pick(x, "renew")} locale={locale} />
              </td>
              {hasTransfer ? (
                <td className="px-4 py-2.5 text-end">
                  <Price prices={pick(x, "transfer")} locale={locale} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-3 text-xs text-muted">
        {t.domains.perYear} · {t.domains.privacy}{" "}
        {tlds.length ? fill(t.domains.years, { min: Math.min(...tlds.map((x) => x.minYears)), max: Math.max(...tlds.map((x) => x.maxYears)) }) : null}
      </p>
    </div>
  );
}
