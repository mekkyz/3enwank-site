/** English copy. The other dictionaries share this shape (src/messages/types.ts), so a missing key is a type error. */
import type { Messages } from "./types";

export const en: Messages = {
  meta: {
    siteName: "3enwank",
    titleSuffix: "3enwank",
    /*
     * The home page's description, and only the home page's: every other screen builds its own from
     * that page's heading and lede. It no longer names Germany. home.metaTitle carries that claim, and
     * a search result that says "servers we own and run in Germany" in the title and again in the
     * description spends its two lines on one sentence; "run in Germany, backups kept in Europe" also
     * reads as two places when Germany is one of them.
     */
    description: "Web hosting, websites, care plans and domains. Daily backups, SSL and a firewall on every account. Free migration, no setup fees, prices in EGP and USD.",
  },
  nav: {
    skip: "Skip to content",
    home: "Home",
    hosting: "Hosting",
    websites: "Websites",
    care: "Care plans",
    domains: "Domains",
    about: "About",
    contact: "Contact",
    login: "Log in",
    cart: "Cart",
    language: "Language",
    menu: "Menu",
  },
  footer: {
    products: "Products",
    account: "Account",
    company: "Company",
    legal: "Legal",
    login: "Log in",
    invoices: "Invoices",
    tickets: "Support tickets",
    theme: "Theme",
    themeDark: "Dark",
    themeLight: "Light",
    operatedBy: "Operated by",
    copyright: "All rights reserved.",
    commercialRegistry: "Commercial registration",
    taxId: "Tax registration",
  },
  common: {
    perYear: "per year",
    oneTime: "one payment",
    from: "From",
    order: "Order",
    choose: "Choose",
    details: "Details",
    vatIncluded: "All prices include {rate}% VAT.",
    renewsAt: "First year. Renews at {price} a year.",
    currency: "Currency",
    mostChosen: "Most chosen",
    included: "Included",
    unlimited: "Unlimited",
    notAvailable: "Not available",
    emailUs: "Email us",
    whatsapp: "WhatsApp",
    learnMore: "Details",
  },
  home: {
    h1: "Hosting, websites and domains, on servers we own and run in\u00a0Germany.",
    /*
     * "One place", not "one invoice": a website build is invoiced in two parts (see terms) and the
     * websites page says so, so one invoice for all four was a promise the billing contradicts. The
     * line also no longer repeats the h1's "we own and run the servers" back at the reader.
     */
    lede: "One place for the hosting, the website build, the care plan and the domain. Support in English or Arabic.",
    /*
     * The home <title>, which is not the h1. pageMetadata prefixes "3enwank: ", and Google stops
     * drawing a title around sixty characters, so the h1 at 68 was cut mid-clause ("on servers we own
     * and..."), losing the country it exists to say. This says the country inside the budget; the page
     * still greets the reader with the longer h1.
     */
    metaTitle: "Hosting, websites and domains, servers in Germany",
    ctaPlans: "See hosting plans",
    ctaBuild: "Build me a website",
    facts: ["Free migration", "No setup fees"],
    factVat: "VAT included",
    factNoVat: "Prices in EGP and USD",
    productsTitle: "What we do",
    products: {
      /*
       * No tier count and no disk range: the catalogue owns both, the store edits it, and the page
       * shows three of the plans now. "A plan for each size" stays true whatever the store carries,
       * and the sizes themselves are on the cards and in the comparison table.
       */
      hosting: { title: "Hosting", body: "A plan for each size of site, billed once a year. Email, databases, and SSL.", link: "Compare plans" },
      websites: { title: "Websites", body: "From a one-page site to an online store. Fixed scope, fixed price, fixed date.", link: "See packages" },
      care: { title: "Care plans", body: "Updates, malware scans, content changes, and fast replies.", link: "Choose a plan" },
      /*
       * "Search a name", not "Domain prices": /domains/ dropped its price table on purpose, so a label
       * promising prices sent the reader to a page that has none. The card still carries a number, the
       * cheapest ending's "From ...", which is where a price belongs.
       */
      domains: { title: "Domains", body: "Register or transfer your domain and manage it alongside your hosting.", link: "Search a name" },
    },
    whyTitle: "Included on every account",
    why: [
      { title: "Daily backups", body: "A copy of your account every day, kept for three months." },
      { title: "SSL on every domain", body: "Issued when your domain points to us and renewed automatically." },
      { title: "Firewall", body: "Attacks are blocked and malware is caught, from the first day." },
      { title: "A real person answers", body: "Not a ticket robot. We read it, we reply in English or Arabic." },
    ],
    plansTitle: "Plans and prices",
    plansLede: "Hosting by size, website packages by scope, and yearly care plans.",
    plansTabsLabel: "What we sell",
    /*
     * The fourth entry is the domain search section's link, in the same shape as the three families: it
     * says what /domains/ has that the section does not, which is every ending we sell. Without it the
     * section borrowed the product card's label and the same words appeared twice on one page.
     */
    allPlans: { hosting: "All hosting plans", websites: "All website packages", care: "All care plans", domains: "All domain endings" },
    /*
     * Two lines of chrome over the search instead of three. The kicker already says "Domains" and the
     * widget labels its own field, so a heading reading "A domain name for your site" over a lede
     * reading "Type a name" was one sentence said three times. The heading asks the reader's own
     * question; the lede carries the two things the widget does not say, transfers and the renewal.
     */
    domainsTitle: "Is the name you want free?",
    domainsLede: "Register a new name, or move the one you own. Every result shows the price for the year and what it renews at.",
    moveTitle: "Hosted somewhere else?",
    moveBody: "Free website & email migration. Your site stays online.",
    moveCta: "See plans",
  },
  hosting: {
    title: "Web hosting",
    /* No tier count: the catalogue owns it, and this page prints whatever the store carries. */
    h2: "Pick a size. Billed once a year.",
    lede: "Every plan runs on the same servers with the same protection.",
    compareTitle: "Compare the plans",
    compareCaption: "Hosting plans compared feature by feature",
    plan: "Plan",
    perYear: "Per year",
    firstYear: "First year",
    renewsAt: "Renews at",
    scrollHint: "Swipe the table sideways to see every plan.",
    empty: "Hosting plans are being updated. Check the customer area or contact us.",
  },
  websites: {
    title: "Websites",
    h2: "Fixed scope. Fixed price. Fixed date.",
    lede: "A deposit to start, the rest when you approve the work.",
    deposit: "{deposit}% to start, {rest}% on approval",
    delivery: "Delivery",
    customTitle: "Something custom",
    customBody: "A web app, an integration with software you already use, or something we have not built before. Tell us what it has to do; we scope it and quote it before anyone commits.",
    customMeta: "Quoted per project",
    customCta: "Describe your project",
    notes: [
      "Delivery time starts when we have your text, images and logo.",
      "Time spent waiting on a payment provider, a domain transfer or Google is not counted.",
      "Hosting and Care plans are separate.",
    ],
    empty: "Website packages are being updated. Contact us for a quote.",
  },
  care: {
    title: "Care plans",
    h2: "The part most people skip.",
    lede: "Launch isn’t the finish line. Keep your website secure and running.",
    notes: [
      { title: "Updates", body: "The software your site runs on and everything it depends on, kept current so known holes are closed." },
      { title: "Content changes", body: "One edit of half an hour or less. New pages and features are quoted separately." },
      { title: "Reports", body: "A written note of what was updated, what the scan found and what we fixed, so you can see the work." },
    ],
    empty: "Care plans are being updated. Contact us.",
  },
  domains: {
    title: "Domains",
    h2: "Register it, or bring it with you.",
    lede: "We connect your domain. Ready from day one.",
    renewsAt: "renews at",
    renewsSame: "same price every year",
    cartTotal: "{count} in your cart",
    tabRegister: "Register",
    tabTransfer: "Transfer",
    tabIdeas: "Suggest names",
    transferLabel: "A domain you already own",
    transferPlaceholder: "myshop.com",
    transferButton: "Transfer to us",
    allExtensions: "Every ending we sell",
    nameFirst: "Type a name first, then choose an ending.",
    cartErrors: {
      noAuthCode: "Add the authorisation code for this domain.",
      unavailable: "We could not find that domain registered anywhere, so there is nothing to transfer. To register it instead, search for it.",
      disabled: "Domains are not on sale at the moment. Write to us and we will sort it out.",
      full: "Your cart is full. Check out first, then add more.",
      invalid: "That does not look like a domain name.",
      generic: "That did not work. Try again, or write to us.",
    },
    authCodeLabel: "Authorisation code",
    authCodePlaceholder: "Authorisation code",
    transferThis: "Is it yours? Move it here",
    transferHint: "Remove the transfer lock at your current registrar and copy its authorisation code. Both take a minute there.",
    searchLabel: "Find a domain name",
    searchPlaceholder: "example.com",
    searchButton: "Search",
    searchHint: "With or without the extension. We check the extensions we sell.",
    tableCaption: "Domain prices per year",
    extension: "Extension",
    register: "Register",
    renew: "Renew",
    transfer: "Transfer",
    perYear: "Prices per year.",
    privacy: "WHOIS privacy included where the extension allows it.",
    notYet: "Online domain registration is not open yet. Tell us the name you want and we register it for you, or transfer the one you have.",
    ask: "Ask about a domain",
    available: "Available",
    taken: "Taken",
    unknown: "Could not check right now",
    premium: "Premium name, not sold online",
    notOffered: "Extension we do not sell",
    registerCta: "Register",
    addedCta: "In your cart",
    askUs: "Ask us",
    checking: "Checking",
    error: "The check did not go through. Try again, or search from the customer area.",
    rateLimited: "Too many searches. Wait a few minutes.",
    otherExtensions: "Other extensions",
    moreExtensions: "Show more endings",
    ideasTitle: "No name yet?",
    ideasHint: "Describe the business in a few words. Our AI assistant proposes names and we check which are free.",
    ideasPlaceholder: "A bakery in Maadi that delivers",
    ideasButton: "Suggest names",
    ideasWorking: "Thinking of names",
    ideasEmpty: "No free names came up. Try a different description.",
    ideasUnavailable: "Name suggestions are not switched on yet.",
  },
  assistant: {
    open: "Ask a question",
    close: "Close",
    title: "3enwank assistant",
    intro: "Ask about plans, domains, moving your site or billing. For anything about your own account, email us.",
    placeholder: "Write your question",
    send: "Send",
    thinking: "Writing",
    error: "The assistant did not answer. Try again, or email us.",
    unavailable: "The assistant is not switched on yet. Email us and a real person answers.",
    note: "Answers come from an AI assistant and can be wrong. Prices come from our price list.",
    stop: "Stop",
    retry: "Try again",
    clear: "Start over",
    suggestions: ["What hosting plans do you have?", "Can you move my site from another host?", "Is a domain name still free?"],
  },
  about: {
    title: "About 3enwank",
    /*
     * The heading claims the servers and says where they are, because the home page now names the
     * country out loud and a bare "runs its own servers" reads thinner beside it.
     */
    h2: "A small hosting company with its own servers in Germany.",
    /*
     * Two places, said as two sentences. "{legalName}, Cairo" next to a home page about servers in
     * Germany invited the reader to put the servers in Cairo. An Egyptian company whose machines stand
     * in a German data centre is the truth, and it reads as a decision when each gets a clause of its own.
     */
    lede: "3enwank is the hosting and web brand of {legalName}, a company registered in Cairo. The servers are ours, and they are in Germany. We host and build websites for businesses in Egypt and abroad, and we answer our own email.",
    principlesTitle: "How we work",
    principles: [
      /*
       * The machines are placed, not just owned: "a data centre in Europe" was the only location on this
       * page and it named the backup's home rather than the servers', which left the reader guessing
       * where their site actually runs now that the home page names a country.
       */
      { title: "We manage the servers ourselves", body: "No reselling. The machines your account runs on are ours, in a data centre in Germany. We patch them, and every account is copied off the server daily." },
      /* "The whole amount you pay", not "with VAT included": true whether or not the business is VAT-registered, which the catalogue decides, not this file. */
      { title: "Prices are the whole price", body: "Every price is the whole amount you pay, billed once a year. No setup fees. Renewals are at the price on the invoice." },
      { title: "Moving in is free", body: "We move your site and your email, and check that everything works before your domain is switched over." },
      { title: "Straight answers", body: "You write in English or Arabic and get a reply from a real person who can fix the problem." },
    ],
    companyTitle: "Company",
    address: "Address",
    email: "Email",
    ctaTitle: "Want to talk first?",
    ctaBody: "Tell us what you need. We reply with what it costs and how long it takes.",
  },
  contact: {
    title: "Contact",
    h2: "A real person answers, not a call centre.",
    wa: {
      title: "Message us on WhatsApp",
      cta: "Open WhatsApp",
      defaultText: "Hello 3enwank. I came from your website and I have a question.",
    },
    urgent: {
      label: "Site down, or email not arriving?",
      wa: "WhatsApp",
      waText: "URGENT. My site is down. My domain is:",
      ticket: "Open a ticket",
      emailSubject: "Site down:",
    },
    email: "Email",
    emailBody: "Quotes and new projects.",
    address: "Visit",
    addressBody: "By appointment.",
    existing: "Already a customer?",
    existingCta: "Open the customer area",
    form: {
      title: "Prefer to write?",
      needLegend: "What do you need?",
      need: { hosting: "Hosting", website: "A new website", domains: "Domains", care: "A care plan", other: "Something else" },
      name: "Your name",
      reach: "WhatsApp number or email",
      note: "Anything we should know?",
      notePlaceholder: "Your domain, or who hosts you now.",
      submit: "Send message",
      sending: "Sending",
      errorTitle: "Nothing was sent yet. Please fix these:",
      errors: {
        need: "Choose what you need.",
        name: "Add your name.",
        reach: "Add a WhatsApp number or an email address.",
        reachFormat: "That is not a phone number or an email address.",
      },
      sentTitle: "Got it.",
      sentBody: "We will answer {reach} the same working day.",
      sentWa: "In a hurry? WhatsApp is faster.",
      sentAgain: "Send another message",
      failed: "That did not send. Try again, or use WhatsApp.",
      limited: "Too many messages from one connection. Wait a minute, or use WhatsApp.",
      blocked: "Our spam check could not run in this browser. Reach us on WhatsApp or by email instead.",
    },
  },
  terms: {
    title: "Terms of service",
    intro: "These terms apply to every hosting plan, website build, care plan and domain name bought from {legalName} (\"3enwank\"). Version {version}. By placing an order in the customer area you accept them.",
    sections: [
      /*
       * "Where value added tax applies" rather than "with VAT included": the business is below the
       * registration threshold and charges no VAT until the owner flips registration on, and a term
       * that says VAT is charged would be false until then. This sentence is true in both states.
       */
      { title: "Prices and billing", body: ["Prices are shown in Egyptian pounds and US dollars and are the full amount payable. Where value added tax applies, it is included in the price shown and stated on the invoice. Invoices are paid by bank transfer, using the account details printed on the invoice. Hosting, care plans and domains are billed once a year in advance. Where a plan advertises a price below its normal price, that lower price buys the first year only and the plan renews at the normal price, which is shown on the plan and on your first invoice. The renewal invoice is issued before the due date.", "Website builds are invoiced in two parts: a deposit to start and the rest when you approve the work. Work starts when the deposit is paid."] },
      { title: "Hosting", body: ["A hosting plan gives you one cPanel account with the storage, bandwidth, email and database limits of the plan. Accounts are for lawful content only. Spam, phishing, malware and anything that harms other customers on the server leads to suspension without refund.", "An unpaid hosting renewal is suspended five days after the due date and can be reactivated by paying the invoice. Care plans and website builds are never suspended for late payment; upkeep stops. We do not delete accounts automatically. A cancelled account is removed after you tell us, or after the cancellation grace period on your invoice."] },
      { title: "Backups", body: ["Every account is copied off the server daily and kept for three months. Backups are a safety net, not a substitute for your own copy. Keep one of anything you cannot afford to lose."] },
      { title: "Care plans", body: ["A care plan covers updates, malware scanning, the number of content changes on the plan and a first-response time for requests. A content change is one clear edit that takes half an hour or less with the existing design and content. New pages, new features and design work are quoted separately."] },
      { title: "Domains", body: ["Domain names are registered in your name through our registrar and are subject to the registry’s rules for the extension. A name that is not renewed by its expiry date expires at the registry. Recovering an expired name may be impossible or cost extra. Transfer codes are sent to your account email on request."] },
      { title: "Cancellation and refunds", body: ["Write to us to cancel a service. It stays active until the end of the paid period and is not renewed. A period you have already paid for is not refunded, except when we cannot deliver what you bought. The refund and cancellation policy has the detail."] },
      { title: "Liability", body: ["We keep the servers running and patched, but no host can promise zero downtime. Our liability for any failure is limited to the amount you paid for the affected service in the current period. We are not liable for loss of business or data beyond the backups described above."] },
      { title: "Changes", body: ["We may update these terms. The version you accepted is recorded with your order, and the current version is always published here."] },
    ],
  },
  privacy: {
    title: "Privacy policy",
    intro: "How {legalName} (\"3enwank\") handles personal data on this website and in the customer area. Version {version}.",
    sections: [
      { title: "This website", body: ["These pages run no analytics and load nothing from third parties. The only requests your browser makes are to this site itself. They set no cookies of their own, but the customer area at 3enwank.com/account is part of the same address, so if you are signed in your session cookie and your cart cookie travel with every request here too. Your session and the contents of your cart are read only by the customer area. These pages read one thing: how many items are in your cart, which the customer area publishes separately for the basket in the menu bar. Your choice of currency and of light or dark is kept in your browser and is never sent anywhere."] },
      { title: "The customer area", body: ["When you open an account at 3enwank.com/account we store your name, email address, phone or WhatsApp number, address and, for businesses, the company name and tax registration number, because invoices reported to the tax authority require them. The customer area uses one session cookie to keep you signed in and nothing else."] },
      /*
       * Where the data lives, which this policy never said. It is worth a section of its own now that
       * the site names a country in public: the servers and the backups on one side, and Egypt on the
       * other, because the people who administer both work from Cairo and the tax authority is Egyptian.
       */
      { title: "Where your data is held", body: ["Customer websites, their databases and their email run on servers we own in a data centre in Germany. The daily copy of each account is kept off those servers and inside Europe. The company itself is registered in Cairo, and the people who administer the servers and answer support requests work from Egypt, so your data is read from there as well. Invoice data also reaches the Egyptian Tax Authority, as described below."] },
      { title: "Invoices and the tax authority", body: ["Invoices are reported to the Egyptian Tax Authority’s e-invoicing system, which receives the invoice details and the receiver’s name, address and tax number or national ID where the law requires it."] },
      { title: "Payments", body: ["Invoices are paid by bank transfer and matched by invoice number, so we hold no card details of any kind. If we add card payment later, it will be handled by a payment provider that receives your card details directly, and this policy will say so before that happens."] },
      { title: "Email", body: ["We send transactional email only: order confirmations, invoices, renewal reminders, service notices and replies to your support requests. Support mail is read by a real person."] },
      { title: "Your rights", body: ["You can see and correct your details in the customer area at any time. You can ask us to close your account and delete what the law does not oblige us to keep; invoices are kept for the legal retention period. Write to the support address below."] },
    ],
  },
  delivery: {
    title: "Delivery policy",
    intro: "Everything {legalName} (\"3enwank\") sells is delivered online. Nothing is posted or shipped, and there is no delivery charge. Version {version}.",
    sections: [
      { title: "Nothing is shipped", body: ["Hosting plans, website builds, care plans and domain names are digital services. They are delivered to the customer area at 3enwank.com/account and to your email address. There is no physical product, no courier and no shipping cost. The address you give us is the address on your invoice, not a delivery address."] },
      { title: "Hosting and care plans", body: ["A hosting plan is set up as soon as the invoice is paid, and the login details go to your account email. A care plan starts the same day and runs for the year on the invoice.", "An invoice paid by bank transfer is activated as soon as the transfer is confirmed, usually the same business day."] },
      { title: "Domain names", body: ["A domain is sent to the registrar as soon as the invoice is paid. Most names are live within minutes, and some extensions take longer at the registry. You get an email as soon as the name is live. If the registry refuses the name, that line is refunded in full."] },
      { title: "Website builds", body: ["Every package states its own delivery time on its page, from a few working days for a landing page to several weeks for a store. The time starts when the deposit is paid and the text and images we asked for are with us.", "A build is delivered on your own hosting or on a plan you buy from us. You see the work and approve it before it goes live."] },
      { title: "Where we deliver", body: ["We deliver anywhere. The services travel over the internet, so there is no country we cannot reach and no customs or import step in the way."] },
      { title: "If something is late", body: ["Write to the support address below with your invoice number and we will tell you where the order stands. If we cannot deliver what you bought, the refund and cancellation policy says what happens next."] },
    ],
  },
  refunds: {
    title: "Refund policy",
    intro: "How to cancel a service bought from {legalName} (\"3enwank\"), and when money is returned. Version {version}.",
    sections: [
      { title: "Cancelling", body: ["Write to the support address below, or open a ticket in the customer area, and say which service you want to cancel. It stays active until the end of the period you have paid for and is not renewed after that. Nothing is deleted on the day you cancel."] },
      { title: "Refunds", body: ["A period you have already paid for is not refunded. If we cannot deliver what you bought, you get the unused amount back, either to the way you paid or as credit on your account, whichever you prefer.", "Invoices are reported to the tax authority and cannot be altered after they are issued, so a correction is made with a credit note."] },
      { title: "Domain names", body: ["A domain is registered in your name at the registry on the day you pay, and the registry does not take it back, so a registered name is not refunded. If the registration fails, that line is refunded in full."] },
      { title: "Website builds", body: ["The deposit pays for the work that starts when you pay it. If you stop a build after work has started, the deposit stays with us, and anything invoiced but not yet started is refunded."] },
      { title: "How to ask", body: ["Write to the support address below with the invoice number and what you want refunded. We answer within one working day. Money goes back the way it came, and your bank sets how long it takes to appear."] },
    ],
  },
  notFound: {
    title: "Page not found",
    body: "The page you are looking for does not exist or has moved.",
    home: "Go to the home page",
  },
  features: { labels: {}, values: {}, texts: {}, summaries: {} },
};
