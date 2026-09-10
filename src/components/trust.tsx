import type { Messages } from "@/messages";

export type TrustInfo = {
  taxId: string | null;
  commercialRegistry: string | null;
};

/**
 * Who this company is on paper, in the footer's first column.
 *
 * That column is the answer to "who am I buying from": the trading name, then the two numbers a
 * customer can check the company against. They are the numbers printed on every invoice this
 * company issues, so publishing them puts the identity where a buyer can check it before paying
 * instead of after. Nothing is drawn when the store does not have them — a page that invents a
 * registration number is worse than one without.
 *
 * Label over number, not label then number: "Commercial registration 10530 00002 01370" is wider
 * than any footer column at this type size, so on one line it wrapped in the middle of the number
 * itself. A registration number split across two lines is not a registration number. The pair is a
 * `dl` because that is what it is, and the number is held on one line whatever the column does.
 */
export function Trust({ t, trust }: { t: Messages; trust: TrustInfo }) {
  const pairs: Array<[string, string]> = [
    ...(trust.commercialRegistry ? [[t.footer.commercialRegistry, trust.commercialRegistry] as [string, string]] : []),
    ...(trust.taxId ? [[t.footer.taxId, trust.taxId] as [string, string]] : []),
  ];
  if (pairs.length === 0) return null;
  return (
    <dl className="mt-3 space-y-1.5">
      {pairs.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          {/* The number reads left to right in Arabic too, and matches the one on the invoice. */}
          <dd className="tabular whitespace-nowrap">
            <bdi dir="ltr">{value}</bdi>
          </dd>
        </div>
      ))}
    </dl>
  );
}
