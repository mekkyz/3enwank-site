import type { Catalogue } from "./catalogue";
import type { Messages } from "@/messages";

/**
 * The ways to pay, as the store publishes them right now (catalogue.payments), turned into the three
 * places the home page names them: the line under "Why 3enwank", the "Prices in Egyptian pounds"
 * card and the FAQ answer on paying (owner, 2026-09-15, D5).
 *
 * They were typed into the dictionaries and named Vodafone Cash and card while the store took
 * neither. The platform publishes card, and any wallet, as true only once Paymob and its wallet
 * integration are configured, and bank transfer and InstaPay as the settings say, so the day Paymob
 * goes live both appear here on the next publish with no copy change.
 */
export type PaymentMethod = keyof Catalogue["payments"];

/** The order they are named in, cheapest to take first, the same in both languages. */
const ORDER: readonly PaymentMethod[] = ["bankTransfer", "instapay", "vodafoneCash", "card"];

/**
 * The methods switched on. A store with every method off is a settings mistake, not a store that
 * takes no money: invoices are always payable by bank transfer (terms, "Prices and billing"), so the
 * copy falls back to that one rather than printing "Pay by ." on the home page.
 */
export function paymentMethods(payments: Catalogue["payments"]): PaymentMethod[] {
  const on = ORDER.filter((m) => payments[m]);
  return on.length ? on : ["bankTransfer"];
}

/** "a, b or c" in English, "أ أو ب أو ج" in Arabic: the separators come from the dictionary. */
function joinList(items: readonly string[], list: Messages["home"]["payments"]["list"]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(list.separator)}${list.last}${items[items.length - 1]}`;
}

/**
 * The kinds for the card, which is shorter than the line: bank transfer and InstaPay are both a
 * transfer, Vodafone Cash is a wallet.
 */
function kindsOf(methods: readonly PaymentMethod[]): Array<keyof Messages["home"]["payments"]["kinds"]> {
  const kinds: Array<keyof Messages["home"]["payments"]["kinds"]> = [];
  if (methods.includes("bankTransfer") || methods.includes("instapay")) kinds.push("transfer");
  if (methods.includes("vodafoneCash")) kinds.push("wallet");
  if (methods.includes("card")) kinds.push("card");
  return kinds;
}

/**
 * Plain replacement, not fill(): fill() isolates a value left to right inside an Arabic sentence, and
 * these values are Arabic words ("بتحويل بنكي"), which must never be forced LTR (lib/bidi.ts).
 */
function put(template: string, key: "methods" | "kinds", value: string): string {
  return template.replace(`{${key}}`, value);
}

export type HomePaymentsCopy = {
  /** The line under the four "Why 3enwank" cards. */
  line: string;
  /** home.reasons with {kinds} filled in. */
  reasons: Messages["home"]["reasons"];
  /** home.faq with {methods} filled in; the FAQPage JSON-LD takes the same answers. */
  faq: Messages["home"]["faq"];
};

export function homePaymentsCopy(t: Messages, catalogue: Pick<Catalogue, "payments">): HomePaymentsCopy {
  const methods = paymentMethods(catalogue.payments);
  const p = t.home.payments;
  const methodList = joinList(
    methods.map((m) => p.methods[m]),
    p.list,
  );
  const kindList = joinList(
    kindsOf(methods).map((k) => p.kinds[k]),
    p.list,
  );
  return {
    line: put(p.line, "methods", methodList),
    reasons: t.home.reasons.map((r) => ({ ...r, body: put(r.body, "kinds", kindList) })),
    faq: t.home.faq.map((f) => ({ ...f, a: put(f.a, "methods", methodList) })),
  };
}
