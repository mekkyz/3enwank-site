/** Shape shared by every locale's dictionary; a missing key is a type error. */
type Section = { title: string; body: string[] };
type ProductTeaser = { title: string; body: string; link: string };
type Fact = { title: string; body: string };

export type Messages = {
  meta: {
    siteName: string;
    titleSuffix: string;
    /** The home page's <meta description>, and only that page's; every other screen builds one from its own heading and lede. */
    description: string;
  };
  nav: {
    skip: string;
    home: string;
    hosting: string;
    websites: string;
    care: string;
    domains: string;
    about: string;
    contact: string;
    login: string;
    cart: string;
    language: string;
    menu: string;
  };
  footer: {
    products: string;
    account: string;
    company: string;
    legal: string;
    login: string;
    invoices: string;
    tickets: string;
    theme: string;
    themeDark: string;
    themeLight: string;
    operatedBy: string;
    copyright: string;
    commercialRegistry: string;
    taxId: string;
  };
  common: {
    perYear: string;
    oneTime: string;
    from: string;
    order: string;
    choose: string;
    details: string;
    /** Exactly one {rate}. Shown once near every price list, and only while vat.rateBp is above zero (lib/vat.ts). */
    vatIncluded: string;
    renewsAt: string;
    currency: string;
    mostChosen: string;
    included: string;
    unlimited: string;
    notAvailable: string;
    emailUs: string;
    whatsapp: string;
    learnMore: string;
  };
  home: {
    h1: string;
    lede: string;
    /**
     * The home page's <title>, which the h1 used to supply. A title is prefixed with "3enwank: " and
     * cut by a search engine around sixty characters, and the h1 is a hero line written for a reader
     * who can see all of it, so the two are separate strings with separate budgets.
     */
    metaTitle: string;
    ctaPlans: string;
    ctaBuild: string;
    /**
     * The proof line under the hero buttons: three short facts joined by middots; it has to stay one
     * line on a laptop. `facts` carries the two that hold whatever the catalogue says; the third is
     * factVat while the catalogue's vat.rateBp is above zero and factNoVat otherwise, because the
     * business is only VAT-registered once the owner flips it on, and "VAT included" before that
     * would be a claim the invoice contradicts. Both are short, so the line keeps its shape.
     */
    facts: string[];
    factVat: string;
    factNoVat: string;
    /** What every account runs on; the hosting page prints it as one line. */
    productsTitle: string;
    products: { hosting: ProductTeaser; websites: ProductTeaser; care: ProductTeaser; domains: ProductTeaser };
    whyTitle: string;
    why: Fact[];
    /** The one section that carries every plan we sell, on three tabs. */
    plansTitle: string;
    plansLede: string;
    /** Names the tab strip for a screen reader; not drawn on the page. */
    plansTabsLabel: string;
    /**
     * Under each family's three cards: the way to the page that still lists every tier. `domains` is
     * the same promise for the search section below them, whose page carries every ending we sell.
     */
    allPlans: { hosting: string; websites: string; care: string; domains: string };
    /**
     * The domain search's own section, under the plans. Two lines only: the widget names its own field
     * and the section header already carries a kicker, so anything here that says "type a name" is the
     * third copy of one sentence.
     */
    domainsTitle: string;
    domainsLede: string;
    moveTitle: string;
    moveBody: string;
    moveCta: string;
  };
  hosting: {
    title: string;
    h2: string;
    lede: string;
    compareTitle: string;
    compareCaption: string;
    plan: string;
    perYear: string;
    /** Row labels for the compare table once a plan carries a renewal price. */
    firstYear: string;
    renewsAt: string;
    /** Exactly one {price}; the hosting page renders the live price in its place. */
    empty: string;
  };
  websites: {
    title: string;
    h2: string;
    lede: string;
    /** {deposit} and {rest} once each, filled from the catalogue's depositBp. */
    deposit: string;
    delivery: string;
    customTitle: string;
    customBody: string;
    customMeta: string;
    customCta: string;
    notes: string[];
    empty: string;
  };
  care: { title: string; h2: string; lede: string; notes: Array<{ title: string; body: string }>; empty: string };
  domains: {
    title: string;
    h2: string;
    lede: string;
    renewsAt: string;
    renewsSame: string;
    cartTotal: string;
    tabRegister: string;
    tabTransfer: string;
    tabIdeas: string;
    transferLabel: string;
    transferPlaceholder: string;
    transferButton: string;
    allExtensions: string;
    nameFirst: string;
    cartErrors: Record<string, string>;
    authCodeLabel: string;
    authCodePlaceholder: string;
    transferThis: string;
    transferHint: string;
    searchLabel: string;
    searchPlaceholder: string;
    searchButton: string;
    searchHint: string;
    tableCaption: string;
    extension: string;
    register: string;
    renew: string;
    transfer: string;
    perYear: string;
    privacy: string;
    /** {min} and {max}. */
    notYet: string;
    ask: string;
    /** Inline availability results. */
    available: string;
    taken: string;
    unknown: string;
    premium: string;
    notOffered: string;
    registerCta: string;
    addedCta: string;
    askUs: string;
    checking: string;
    error: string;
    rateLimited: string;
    otherExtensions: string;
    moreExtensions: string;
    /** Name suggestions from the assistant. */
    ideasTitle: string;
    ideasHint: string;
    ideasPlaceholder: string;
    ideasButton: string;
    ideasWorking: string;
    ideasEmpty: string;
    ideasUnavailable: string;
  };
  /** The chat widget in the corner of every page. */
  assistant: { open: string; close: string; title: string; intro: string; placeholder: string; send: string; thinking: string; error: string; unavailable: string; note: string; stop: string; retry: string; clear: string; suggestions: readonly [string, string, string] };
  about: {
    title: string;
    h2: string;
    /** {legalName}. */
    lede: string;
    principlesTitle: string;
    principles: Fact[];
    companyTitle: string;
    address: string;
    email: string;
    ctaTitle: string;
    ctaBody: string;
  };
  contact: {
    title: string;
    h2: string;
    wa: { title: string; cta: string; defaultText: string };
    urgent: { label: string; wa: string; waText: string; ticket: string; emailSubject: string };
    email: string;
    emailBody: string;
    address: string;
    addressBody: string;
    existing: string;
    existingCta: string;
    form: {
      title: string;
      needLegend: string;
      need: { hosting: string; website: string; domains: string; care: string; other: string };
      name: string;
      reach: string;
      note: string;
      notePlaceholder: string;
      submit: string;
      sending: string;
      errorTitle: string;
      errors: { need: string; name: string; reach: string; reachFormat: string };
      sentTitle: string;
      sentBody: string;
      sentWa: string;
      sentAgain: string;
      failed: string;
      limited: string;
      blocked: string;
    };
  };
  /** {legalName} and {version} in intro. */
  terms: { title: string; intro: string; sections: Section[] };
  privacy: { title: string; intro: string; sections: Section[] };
  delivery: { title: string; intro: string; sections: Section[] };
  refunds: { title: string; intro: string; sections: Section[] };
  notFound: { title: string; body: string; home: string };
  /**
   * Translations for catalogue feature lines ("Storage: 1 GB NVMe") used while the catalogue's
   * Arabic copy still equals the English (the import seeded both with English text).
   */
  features: { labels: Record<string, string>; values: Record<string, string>; texts: Record<string, string>; summaries: Record<string, string> };
};
