/** Shape shared by every locale's dictionary; a missing key is a type error. */
type Teaser = { num: string; title: string; h2: string; body: string; link: string };
type Section = { title: string; body: string[] };

export type Messages = {
  meta: { siteName: string; slogan: string; titleSuffix: string; description: string };
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
    language: string;
    languageLabel: string;
    menu: string;
  };
  footer: { line: string; company: string; terms: string; privacy: string; contact: string; store: string; copyright: string };
  common: {
    perYear: string;
    oneTime: string;
    from: string;
    order: string;
    choose: string;
    orderNow: string;
    details: string;
    vatIncluded: string;
    vatNotApplied: string;
    currency: string;
    currencyHint: string;
    mostPopular: string;
    included: string;
    unlimited: string;
    getInTouch: string;
    emailUs: string;
    whatsapp: string;
    catalogueNote: string;
  };
  home: {
    kicker: string;
    h1: string;
    lede: string;
    ctaPlans: string;
    ctaBuild: string;
    micro: string;
    specTitle: string;
    spec: Array<[string, string]>;
    pillars: Array<{ title: string; body: string }>;
    hostingTeaser: Teaser;
    websitesTeaser: Teaser;
    careTeaser: Teaser;
    domainsTeaser: Teaser;
    contactTeaser: Teaser;
  };
  hosting: {
    title: string;
    num: string;
    h2: string;
    lede: string;
    compareTitle: string;
    compareCaption: string;
    plan: string;
    perYear: string;
    fine: string;
    addonTitle: string;
    /** Must contain exactly one {price}; the hosting page renders the live price in its place. */
    addonBody: string;
    runsOn: string;
    empty: string;
  };
  websites: {
    title: string;
    num: string;
    h2: string;
    lede: string;
    /** Template with {deposit} and {rest} percentages, filled from the catalogue's depositBp. */
    deposit: string;
    delivery: string;
    fine: string;
    customTitle: string;
    customBody: string;
    customMeta: string;
    customCta: string;
    empty: string;
  };
  care: { title: string; num: string; h2: string; lede: string; compareTitle: string; compareCaption: string; fine: string; empty: string };
  domains: {
    title: string;
    num: string;
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
    years: string;
    notYet: string;
    ask: string;
    fine: string;
  };
  about: {
    title: string;
    num: string;
    h2: string;
    lede: string;
    principlesTitle: string;
    principles: Array<{ title: string; body: string }>;
    stackTitle: string;
    companyTitle: string;
    address: string;
    email: string;
    ctaTitle: string;
    ctaBody: string;
  };
  contact: {
    title: string;
    num: string;
    h2: string;
    lede: string;
    email: string;
    emailBody: string;
    whatsapp: string;
    whatsappBody: string;
    whatsappCta: string;
    phone: string;
    address: string;
    addressBody: string;
    micro: string;
    existing: string;
    existingBody: string;
    existingCta: string;
  };
  terms: { title: string; intro: string; sections: Section[] };
  privacy: { title: string; intro: string; sections: Section[] };
  notFound: { title: string; body: string; home: string };
  /**
   * Translations for catalogue feature lines ("Storage: 1 GB NVMe") used only while the catalogue's
   * Arabic copy still equals the English (the WHMCS import seeded both with English text).
   */
  features: { labels: Record<string, string>; values: Record<string, string>; texts: Record<string, string>; summaries: Record<string, string> };
};
