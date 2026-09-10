import type { Messages } from "@/messages";

export type TrustInfo = {
  taxId: string | null;
  commercialRegistry: string | null;
};

/**
 * Who this company is on paper, on the last line of the footer's upper part.
 *
 * The numbers are the ones printed on every invoice this company issues, so publishing them puts
 * the identity where a customer can check it before buying instead of after. They sit under the
 * links rather than beside the copyright: that row is the site's own small print, and a
 * registration number is the company's. Nothing is drawn when the store does not have them — a page
 * that invents a registration number is worse than one without.
 */
export function Trust({ t, trust }: { t: Messages; trust: TrustInfo }) {
  const { taxId, commercialRegistry } = trust;
  const ids: string[] = [
    ...(commercialRegistry ? [`${t.footer.commercialRegistry} ${commercialRegistry}`] : []),
    ...(taxId ? [`${t.footer.taxId} ${taxId}`] : []),
  ];
  if (ids.length === 0) return null;
  return (
    <>
      {ids.map((line) => (
        // The number reads left to right in Arabic too, and matches the one on the invoice.
        <span key={line} className="tabular">
          <bdi dir="ltr">{line}</bdi>
        </span>
      ))}
    </>
  );
}
