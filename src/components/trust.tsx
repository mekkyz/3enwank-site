import type { Messages } from "@/messages";

export type TrustInfo = {
  taxId: string | null;
  commercialRegistry: string | null;
  payments: { bankTransfer: boolean; instapay: boolean; vodafoneCash: boolean; card: boolean };
};

/**
 * The strip above the copyright: who this company is on paper, and how it can be paid.
 *
 * Both halves are checkable claims, which is the point of them. The registration and tax numbers are
 * the ones printed on every invoice 3enwank issues, so publishing them puts the same identity where
 * a customer can check it *before* buying instead of after. They are drawn only when the store has
 * them: a page that invents a registration number is worse than a page without one.
 *
 * Payment methods are names, never account details. A wallet number in a footer is an invitation to
 * copy the page and change one digit; the details belong on an invoice addressed to one customer.
 * And the list is what the store says it can take — card stays off until the gateway is configured,
 * so this cannot promise a card payment nobody can accept.
 */
export function Trust({ t, trust }: { t: Messages; trust: TrustInfo }) {
  const { taxId, commercialRegistry, payments: p } = trust;
  const methods: string[] = [
    ...(p.instapay ? [t.footer.payInstapay] : []),
    ...(p.vodafoneCash ? [t.footer.payVodafoneCash] : []),
    ...(p.bankTransfer ? [t.footer.payTransfer] : []),
    ...(p.card ? [t.footer.payCard] : []),
  ];
  const ids: Array<[string, string]> = [
    ...(commercialRegistry ? ([[t.footer.commercialRegistry, commercialRegistry]] as Array<[string, string]>) : []),
    ...(taxId ? ([[t.footer.taxId, taxId]] as Array<[string, string]>) : []),
  ];
  if (ids.length === 0 && methods.length === 0) return null;
  return (
    <div className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 text-xs sm:px-8 md:flex-row md:items-center md:justify-between">
        {ids.length ? (
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
            {ids.map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <dt className="text-faint">{label}</dt>
                {/* The number reads left to right in Arabic too, and lines up with the ones on the invoice. */}
                <dd className="tabular font-semibold text-muted">
                  <bdi dir="ltr">{value}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {methods.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-faint">{t.footer.payTitle}</span>
            <ul className="flex flex-wrap items-center gap-1.5">
              {methods.map((m) => (
                <li key={m} className="rounded-md border border-line px-2 py-1 font-semibold text-muted">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
