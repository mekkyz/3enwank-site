/** Shape shared by every locale's dictionary; a missing key is a type error. */
type Section = { title: string; body: string[] };
type ProductTeaser = { title: string; body: string; link: string };
type Fact = { title: string; body: string };

export type Messages = {
  meta: { siteName: string; titleSuffix: string; description: string };
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
    payTitle: string;
    payInstapay: string;
    payVodafoneCash: string;
    payTransfer: string;
    payCard: string;
  };
  common: {
    perYear: string;
    oneTime: string;
    from: string;
    order: string;
    choose: string;
    details: string;
    /** Exactly one {rate}. Shown once near every price list. */
    vatIncluded: string;
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
    ctaPlans: string;
    ctaBuild: string;
    facts: string[];
    /** What every account runs on; the hosting page prints it as one line. */
    stack: string[];
    productsTitle: string;
    products: { hosting: ProductTeaser; websites: ProductTeaser; care: ProductTeaser; domains: ProductTeaser };
    whyTitle: string;
    why: Fact[];
    pricingTitle: string;
    pricingLede: string;
    compareLink: string;
    /** Websites and care plans at a glance, between the hosting plans and the domain search. */
    glanceTitle: string;
    glanceLede: string;
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
    fine: string;
    addonTitle: string;
    /** Exactly one {price}; the hosting page renders the live price in its place. */
    addonBody: string;
    runsOn: string;
    empty: string;
  };
  websites: {
    title: string;
    h2: string;
    lede: string;
    /** {deposit} and {rest} once each, filled from the catalogue's depositBp. */
    deposit: string;
    delivery: string;
    fine: string;
    customTitle: string;
    customBody: string;
    customMeta: string;
    customCta: string;
    empty: string;
  };
  care: { title: string; h2: string; lede: string; compareTitle: string; compareCaption: string; fine: string; empty: string };
  domains: {
    title: string;
    h2: string;
    lede: string;
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
    moreTlds: string;
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
    lede: string;
    wa: {
      kicker: string;
      title: string;
      cta: string;
      call: string;
      voice: string;
      hours: string;
      defaultText: string;
      openersTitle: string;
      openers: Array<{ chip: string; text: string }>;
      open: string;
      closedToday: string;
      closedTomorrow: string;
      closedWeekend: string;
    };
    languages: { first: string; second: string };
    urgent: { label: string; body: string; wa: string; waText: string; ticket: string; email: string; emailSubject: string; after: string };
    email: string;
    emailBody: string;
    address: string;
    addressBody: string;
    existing: string;
    existingBody: string;
    existingCta: string;
    form: {
      title: string;
      lede: string;
      needLegend: string;
      need: { hosting: string; website: string; move: string; care: string; other: string };
      name: string;
      reach: string;
      reachHint: string;
      note: string;
      noteHint: string;
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
      privacy: string;
    };
  };
  /** {legalName} and {version} in intro. */
  terms: { title: string; intro: string; sections: Section[] };
  privacy: { title: string; intro: string; sections: Section[] };
  notFound: { title: string; body: string; home: string };
  /**
   * Translations for catalogue feature lines ("Storage: 1 GB NVMe") used while the catalogue's
   * Arabic copy still equals the English (the import seeded both with English text).
   */
  features: { labels: Record<string, string>; values: Record<string, string>; texts: Record<string, string>; summaries: Record<string, string> };
};
