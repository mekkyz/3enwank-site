/** Shape shared by every locale's dictionary; a missing key is a type error. */
type Section = { title: string; body: string[] };
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
    /** The Menu sheet's own close button on phones (shell.tsx, S15). */
    closeMenu: string;
    /** The status page link in the footer and the Menu sheet, drawn only while STATUS_URL is set (S14). */
    status: string;
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
     * The ways to pay, named only when the store takes them (lib/payments.ts, owner 2026-09-15 D5).
     * The last fact's body and the FAQ answer on paying each carry one {methods}. Each method name
     * carries whatever the sentence needs in front of it (the Arabic ones their preposition), so the
     * list reads as a sentence once joined.
     */
    payments: {
      methods: { bankTransfer: string; instapay: string; vodafoneCash: string; card: string };
      /** Between list items, and before the last one (", " and " or " in English). */
      list: { separator: string; last: string };
    };
    /**
     * One facts section (S4, owner 2026-09-15): "Why 3enwank" and "Included on every account" merged
     * into six rows, a bold fact and one line each, in this order: servers we own in Germany, daily
     * off-server backups, renewal price shown and no setup fees, free migration, support in Arabic or
     * English, ways to pay. The title is a statement. The last row's body carries one {methods}.
     */
    factsTitle: string;
    facts: Fact[];
    /** The one section that carries every plan we sell, on three tabs. */
    plansTitle: string;
    /** Names the tab strip for a screen reader; not drawn on the page. */
    plansTabsLabel: string;
    /**
     * Under each family's three cards: the way to the page that still lists every tier. `domains` is
     * the same promise for the search section below them, whose page carries every ending we sell.
     */
    allPlans: { hosting: string; websites: string; care: string; domains: string };
    /**
     * The domain search's own section, under the plans. Two lines only: the widget names its own field,
     * so anything here that says "type a name" is a second copy of one sentence.
     */
    domainsTitle: string;
    domainsLede: string;
    /**
     * The moving section (S6): a statement, one line, three numbered steps and one button that opens
     * WhatsApp with `waText` (or the contact page's "Move my site" option when there is no number).
     * `formCta` is the quieter second way, to the form.
     */
    move: { title: string; lede: string; steps: Fact[]; cta: string; formCta: string; waText: string };
    /** Six questions and their answers, as a details/summary list near the foot of the page; also published as FAQPage JSON-LD. The answer on paying carries one {methods}. */
    faqTitle: string;
    faq: Array<{ q: string; a: string }>;
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
    /** Over the compare table on a phone, where it scrolls sideways inside its box. */
    scrollHint: string;
    /** Exactly one {price}; the hosting page renders the live price in its place. */
    empty: string;
    /** The one line under the plans that matches the home page's moving section; its button reuses home.move.cta. */
    moveLine: string;
    /**
     * "If you have this, pick that", above the cards (S11). Three rows in the order of the plans the
     * screen pairs them with (hosting.tsx GUIDE); `pick` goes before the plan's name.
     */
    guide: { title: string; rows: [string, string, string]; pick: string };
  };
  websites: {
    title: string;
    /** The h1 without a price, for metadata and a catalogue with no package; `h2Price` carries one {price}, the cheapest package (S13). */
    h2: string;
    h2Price: string;
    lede: string;
    /** One {price}: the catalogue's cheapest hosting, on every package in place of the old footnote (S12). */
    needsHosting: string;
    /** The secondary button beside Order that opens WhatsApp with the package written (S12). */
    talkFirst: string;
    /** "How a build works": a statement heading and four numbered steps (S12). */
    stepsTitle: string;
    steps: Fact[];
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
  /** `h2Price` carries one {price}, the cheapest care plan a year; `h2` is the same statement without it (S13). */
  care: { title: string; h2: string; h2Price: string; lede: string; notes: Array<{ title: string; body: string }>; empty: string };
  domains: {
    title: string;
    /** `h2Price` carries one {price}, the cheapest yearly domain; `h2` is the same statement without it (S13). */
    h2: string;
    h2Price: string;
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
  /**
   * The assistant in the corner of every page (S8). `launcher` is the word on the corner button, `open`
   * its fuller accessible name. `close` names the panel's own close button; `hide` names the launcher
   * while the panel is open. Both were "Close", so a screen reader offered two identical names.
   *
   * `handoff` is the way to a person under the conversation: the three buttons, and the words wrapped
   * around the visitor's own messages in the WhatsApp text and the ticket (lib/handoff.ts).
   */
  assistant: {
    launcher: string;
    open: string;
    close: string;
    hide: string;
    title: string;
    intro: string;
    placeholder: string;
    send: string;
    thinking: string;
    error: string;
    unavailable: string;
    note: string;
    stop: string;
    retry: string;
    clear: string;
    suggestions: readonly [string, string, string];
    handoff: { title: string; wa: string; ticket: string; form: string; waIntro: string; question: string; alsoAsked: string; assistantSaid: string; fromChat: string };
  };
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
    /** The nav label and the contact page's <title>. */
    title: string;
    /** The home page's contact section heading. */
    h2: string;
    /** The contact page's h1 and the line under it (S7). */
    pageTitle: string;
    pageLede: string;
    /**
     * The strip both contact blocks open with: "Already a customer? Log in. Site down? WhatsApp us".
     * `ticket` stands in for `wa` when there is no WhatsApp number.
     */
    strip: { customer: string; login: string; down: string; wa: string; ticket: string };
    /** The line on the contact page that links the status page, drawn only while STATUS_URL is set (S14). */
    status: string;
    /** `planText` carries one {plan}: the first WhatsApp line when the page was opened from a plan or package. */
    wa: { title: string; cta: string; defaultText: string; planText: string };
    /** The first WhatsApp line for a site that is down, and the subject of the email for the same. */
    urgent: { waText: string; emailSubject: string };
    email: string;
    emailBody: string;
    address: string;
    addressBody: string;
    /** The home contact section's link to the contact page, in place of the form on a phone (S1, verify). */
    formLink: string;
    form: {
      title: string;
      needLegend: string;
      need: { hosting: string; website: string; domains: string; care: string; move: string; other: string };
      /** One {plan}: the note the form starts with when opened from a plan or package page. */
      planNote: string;
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
  /** `elsewhere` introduces the row of links to the main pages under each language (site review justDo). */
  notFound: { title: string; body: string; home: string; elsewhere: string };
  /**
   * Translations for catalogue feature lines ("Storage: 1 GB NVMe") used while the catalogue's
   * Arabic copy still equals the English (the import seeded both with English text).
   */
  features: { labels: Record<string, string>; values: Record<string, string>; texts: Record<string, string>; summaries: Record<string, string> };
};
