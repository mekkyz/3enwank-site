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
 */
export function Trust({ t, trust }: { t: Messages; trust: TrustInfo }) {
  const { taxId, commercialRegistry } = trust;
  const ids: string[] = [
    ...(commercialRegistry ? [`${t.footer.commercialRegistry} ${commercialRegistry}`] : []),
    ...(taxId ? [`${t.footer.taxId} ${taxId}`] : []),
  ];
  return (
    <>
      {ids.map((line) => (
        // The number reads left to right in Arabic too, and matches the one on the invoice.
        <p key={line} className="mt-1 tabular">
          <bdi dir="ltr">{line}</bdi>
        </p>
      ))}
    </>
  );
}
