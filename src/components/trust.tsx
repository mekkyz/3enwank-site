import type { Messages } from "@/messages";

export type TrustInfo = {
  taxId: string | null;
  commercialRegistry: string | null;
  payments: { bankTransfer: boolean; instapay: boolean; vodafoneCash: boolean; card: boolean };
};

/**
 * Who this company is on paper, and how it can be paid.
 *
 * Both belong in the footer's first column, under the trading name and the address, because that
 * column is already the answer to "who am I buying from" — the registration numbers are the same
 * identity, and a reader looking for them looks there. They were a band of their own between the
 * links and the copyright for a day, which made three horizontal rules stacked at the foot of every
 * page and read as something bolted on afterwards.
 *
 * The numbers are the ones printed on every invoice this company issues, so publishing them puts
 * the identity where a customer can check it before buying instead of after. Nothing is drawn when
 * the store does not have them: a page that invents a registration number is worse than one without.
 *
 * Payment methods are names and never account details. A wallet number in a footer is an invitation
 * to copy the page and change one digit; the details belong on an invoice addressed to one person.
 * They are set in the same quiet type as the address rather than in bordered boxes, which looked
 * like buttons that could be pressed.
 */
export function Trust({ t, trust }: { t: Messages; trust: TrustInfo }) {
  const { taxId, commercialRegistry, payments: p } = trust;
  const methods = [
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
    <div className="mt-4 space-y-1 border-t border-line pt-4 text-xs text-faint">
      {ids.map(([label, value]) => (
        <p key={label}>
          {label}{" "}
          {/* The number reads left to right in Arabic too, and matches the one on the invoice. */}
          <bdi dir="ltr" className="tabular font-semibold text-muted">
            {value}
          </bdi>
        </p>
      ))}
      {methods.length ? (
        <p className="pt-1">
          {t.footer.payTitle} <span className="font-semibold text-muted">{methods.join(" · ")}</span>
        </p>
      ) : null}
    </div>
  );
}
