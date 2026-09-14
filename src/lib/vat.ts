import type { Catalogue } from "./catalogue";
import { fill, type Messages } from "@/messages";

/**
 * Whether the pages say anything about VAT at all. The business is below Egypt's registration
 * threshold, so it is not VAT-registered and must not print, charge or imply a tax it does not
 * declare; the platform publishes vat.rateBp as 0 until the owner flips registration on, and 1400
 * after. The catalogue is the only source of that answer: a constant here would keep a line on the
 * page that the invoice contradicts, in whichever direction the flip last went.
 */
export function vatShown(catalogue: Catalogue): boolean {
  return catalogue.vat.rateBp > 0;
}

/** The one VAT sentence, shown once near every price list; nothing at all while unregistered. */
export function vatLine(t: Messages, catalogue: Catalogue): string | null {
  return vatShown(catalogue) ? fill(t.common.vatIncluded, { rate: catalogue.vat.rateBp / 100 }) : null;
}
