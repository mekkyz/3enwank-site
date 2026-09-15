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
    /*
     * No country in the h1 (owner, 2026-09-14): "servers we own and run in Germany" made the first
     * line a statement about where the machines are, when the reader wants to know what they get.
     * Germany is a reason to trust, and it has its own card under "Why 3enwank"; the <title> still
     * carries it for search. No country either way: "made for Egypt" was offered and declined, as
     * "in Egypt" was in the store taglines, because the site also sells in dollars to customers
     * abroad. "One place" is the promise the four cards below then itemise; "one
     * invoice" it is not, because a website build is invoiced in two parts (see terms).
     */
    h1: "Everything you need to get online, in one\u00a0place.",
    lede: "Hosting, websites, domains and ongoing care. We handle it all, with support in English or Arabic.",
    /*
     * The home <title>, which is not the h1. pageMetadata prefixes "3enwank: ", and Google stops
     * drawing a title around sixty characters, so the h1 at 68 was cut mid-clause ("on servers we own
     * and..."), losing the country it exists to say. This says the country inside the budget; the page
     * still greets the reader with the longer h1.
     */
    metaTitle: "Hosting, websites and domains, servers in Germany",
    ctaPlans: "See hosting plans",
    ctaBuild: "Build me a website",
    reasonsTitle: "Why 3enwank",
    reasons: [
      { title: "Servers in Germany", body: "Hardware we own and run ourselves, in a German data centre. No reseller between you and the machine." },
      { title: "Support in Arabic and English", body: "A person who can see your server reads your ticket and replies in the language you wrote in." },
      /* {kinds} is filled from catalogue.payments (lib/payments.ts): a wallet and card are named only while the store takes them. */
      { title: "Prices in Egyptian pounds", body: "Pay in EGP by {kinds}. Customers outside Egypt pay in dollars." },
      { title: "Free migration", body: "We move your site and email from your current host, and the site stays online while we do it." },
    ],
    /*
     * Built from catalogue.payments (owner, 2026-09-15, D5): the line named Vodafone Cash and card
     * while the store took neither. The platform publishes card and wallets as true once Paymob is
     * configured, and they appear here by themselves on the next publish.
     */
    payments: {
      methods: { bankTransfer: "bank transfer", instapay: "InstaPay", vodafoneCash: "Vodafone Cash", card: "card" },
      kinds: { transfer: "transfer", wallet: "wallet", card: "card" },
      list: { separator: ", ", last: " or " },
      line: "Pay by {methods}.",
    },
    tiles: { hosting: "Simple yearly plans", websites: "Fixed price", domains: "Register or transfer", care: "Updates and fixes" },
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
    faqTitle: "Questions we get asked",
    /*
     * Six, each answered in the words the terms use for the same thing, so the FAQ never promises
     * more than the contract does: the renewal price is "the normal price", VAT is "where it applies",
     * a domain leaves "after the first 60 days" because every registrar locks a new name that long, and
     * leaving promises the terms' own "active until the end of the paid period", with the copy taken by
     * the customer (the terms call backups "not a substitute for your own copy").
     */
    faq: [
      { q: "Can you move my site from my current host?", a: "Yes, free. Send us the login to your current hosting and we copy the site, the email and the database, then switch the domain once everything checks out. The site stays online the whole time." },
      { q: "Where are the servers?", a: "In a data centre in Germany, on hardware we own and run ourselves. Nobody sits between you and the machine your site runs on." },
      { q: "What do I pay from the second year?", a: "The normal price of the plan. It is printed on the plan next to the first-year price and on your first invoice, and the renewal invoice reaches you before the due date." },
      { q: "How do I pay, and is VAT included?", a: "By {methods}, in Egyptian pounds; customers outside Egypt pay in dollars by transfer. The price you see is the full amount. Where value added tax applies, it is included in it and stated on the invoice." },
      { q: "Do you answer in Arabic?", a: "Yes. Write in Arabic or English and the reply comes in the same language, from a person who can see your account and your server." },
      { q: "What if I want to leave?", a: "Cancel from the service's page in your account or by writing to us, and withdraw the request any time before the period ends. The service stays active until the end of the period you paid for, so there is time to take your own copy of the site and email from cPanel. A domain registered with us can be transferred out after its first 60 days, as with every registrar." },
    ],
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
    hide: "Close assistant",
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
      { title: "Hosting", body: ["A hosting plan gives you one cPanel account with the storage, bandwidth, email and database limits of the plan. Accounts are for lawful content only. Spam, phishing, malware and anything that harms other customers on the server leads to suspension without refund.", "An unpaid hosting renewal is suspended five days after the due date and can be reactivated by paying the invoice. Care plans and website builds are never suspended for late payment; upkeep stops. We do not delete accounts automatically. A cancelled account is parked with its files kept until we terminate it; tell us if you want it removed."] },
      { title: "Backups", body: ["Every account is copied off the server daily and kept for three months. Backups are a safety net, not a substitute for your own copy. Keep one of anything you cannot afford to lose."] },
      { title: "Care plans", body: ["A care plan covers updates, malware scanning, the number of content changes on the plan and a first-response time for requests. A content change is one clear edit that takes half an hour or less with the existing design and content. New pages, new features and design work are quoted separately."] },
      { title: "Domains", body: ["Domain names are registered in your name through our registrar and are subject to the registry’s rules for the extension. A name that is not renewed by its expiry date expires at the registry. Recovering an expired name may be impossible or cost extra. Transfer codes are sent to your account email on request."] },
      /*
       * The Cancel button on the service page (platform e911683) and the owner's 2026-09-15 decisions:
       * withdrawable until the period ends, an open renewal invoice closed with the request (D2), and
       * the hosting account parked rather than deleted until it is terminated (D8). The button names are
       * the customer area's own (platform messages services.detail.cancelTitle and cancelSubmit).
       */
      { title: "Cancellation and refunds", body: ["A hosting plan or a care plan is cancelled from the customer area: open the service and press Request cancellation under Cancel at the end of the period. You can also write to us. The service stays active until the end of the paid period and is not renewed. Until that day the request can be withdrawn on the same page, and the service then renews as usual.", "If a renewal invoice for the service is open when you cancel, it is closed with the request: an unpaid invoice is cancelled, and a partly paid invoice is closed with a credit note and the amount already paid becomes credit on your account. When the paid period ends the service is closed. A hosting account is then parked, not deleted: the site and its email stop, and the files are kept on the server until the account is terminated.", "A period you have already paid for is not refunded, except when we cannot deliver what you bought. The refund and cancellation policy has the detail."] },
      { title: "Liability", body: ["We keep the servers running and patched, but no host can promise zero downtime. Our liability for any failure is limited to the amount you paid for the affected service in the current period. We are not liable for loss of business or data beyond the backups described above."] },
      { title: "Changes", body: ["We may update these terms. The version you accepted is recorded with your order, and the current version is always published here."] },
    ],
  },
  privacy: {
    title: "Privacy policy",
    intro: "How {legalName} (\"3enwank\") handles personal data on this website and in the customer area. Version {version}.",
    sections: [
      /*
       * Rewritten on 2026-09-15 (owner decision D6). The old text said these pages load nothing from
       * third parties and the customer area uses one cookie; neither was true. Providers are named by
       * what they do, not by brand, and every sentence says only what the code does: the spam check is
       * loaded by lib/turnstile.ts on a send, not on page load; the chat keeps its conversation in
       * sessionStorage; the cookies are the customer area's own (session, cart, cart_count, locale,
       * currency, totp-setup for 15 minutes); the page keeps the theme and the currency in localStorage.
       */
      { title: "This website", body: ["These pages run no analytics and set no cookies of their own. Almost everything your browser fetches here comes from this site itself. The exceptions are tools you choose to use: when you send the contact form, send a message to the chat assistant or ask for name ideas, your browser loads a spam check from a separate provider, which tells people from automated traffic and receives your IP address and technical details of your browser to do so. Nothing is loaded from that provider before you send.", "What you type to the chat assistant or into name ideas is sent to an AI provider, which writes the reply, so do not put passwords or payment details in it. The conversation is kept in this browser tab only and is gone when the tab is closed. What you send through the contact form becomes a support request that our staff read."] },
      { title: "Cookies and your browser", body: ["The customer area at 3enwank.com/account is part of the same address, so its cookies are sent with requests to these pages too. It sets a session cookie that keeps you signed in, a cart cookie that holds what you have put in your cart, a cart count cookie with the number of items in it, a language cookie with the language you chose, a currency cookie with the currency you chose in the store, and, only while you set up two-step sign-in, a cookie that holds that setup for fifteen minutes. These pages read one of them, the cart count, to show the basket in the menu bar; the others are read only by the customer area.", "These pages keep two choices in your browser's own storage, light or dark and the currency, and never send them anywhere."] },
      { title: "The customer area", body: ["When you open an account at 3enwank.com/account we store your name, email address, phone or WhatsApp number, address and, for businesses, the company name and tax registration number, because invoices reported to the tax authority require them; a national ID is stored where an invoice requires one. We also keep your orders, invoices and payments, your support tickets and their attachments, copies of the emails we sent you for a limited time, and a record of sign-ins and of changes made to your account."] },
      /*
       * Where the data lives, which this policy never said. It is worth a section of its own now that
       * the site names a country in public: the servers and the backups on one side, and Egypt on the
       * other, because the people who administer both work from Cairo and the tax authority is Egyptian.
       */
      { title: "Where your data is held", body: ["Customer websites, their databases and their email run on servers we own in a data centre in Germany. The daily copy of each account is kept off those servers and inside Europe. The company itself is registered in Cairo, and the people who administer the servers and answer support requests work from Egypt, so your data is read from there as well. Invoice data also reaches the Egyptian Tax Authority, as described below."] },
      { title: "Service providers", body: ["We use a few outside providers, each for one job, and each receives only what that job needs.", "A spam-check provider, loaded only when you send a form, a chat message or a request for name ideas, as described above.", "An AI provider, which receives the text of assistant chats and name-idea requests.", "Our email provider, which receives the mail sent to our support address.", "The domain registrar we work with and the registry of each extension, which receive the name, organisation, address, email address and phone number that every domain registration requires for its WHOIS record. Where the extension allows WHOIS privacy and it is switched on, those details are hidden from the public record.", "The data centre in Germany where our servers stand.", "A storage provider in Europe that holds our backups, encrypted with a key it does not have."] },
      { title: "Invoices and the tax authority", body: ["Invoices are reported to the Egyptian Tax Authority’s e-invoicing system, which receives the invoice details and the receiver’s name, address and tax number or national ID where the law requires it."] },
      { title: "Payments", body: ["Bank transfers and InstaPay payments are matched to the invoice by its number, so they involve no card details. Where checkout offers card or wallet payment, it is handled by a payment provider: your card details go straight to that provider and never pass through our servers, and we receive the result of the payment. If you choose to save a card for later payments, we keep the provider's reference to it, encrypted, with the card brand, the masked card number and the expiry date, so that you can recognise the card and remove it."] },
      { title: "Email", body: ["We send transactional email only: order confirmations, invoices, renewal reminders, service notices and replies to your support requests. Support mail is read by a real person."] },
      /* Account deletion as the platform carries it out (owner decision D7): only for a closed account, irreversible, invoices kept. */
      /* The blockers are closedBlockers() in the platform's anonymise.ts: domains and leftover credit refuse it too. It edits rows and files, */
      /* never a backup or the support mailbox, so the policy says how those copies go (dumps age out; the mailbox is cleared by hand). */
      { title: "Your rights", body: ["You can see and correct your details in the customer area at any time.", "To have your account deleted, write to the support address below. We carry it out once nothing is running or owed on the account: no active, suspended or pending services, no open invoices, no domain still registered with us or in transfer, and no account credit left (we refund it first). We then erase your name, company name, phone and WhatsApp numbers, address, tax registration number and national ID; replace the email address you sign in with by an address that receives no mail; switch off the login and end every session; and erase the text of your support tickets, delete their attachments and erase the content of the emails we sent you. Invoices and credit notes, with the name and address printed on them, are kept for the period the law requires, and so is our internal record of the actions taken on the account. Our backups are not edited: the copies of your details inside them are deleted as those backups expire, within about three months, and the messages you emailed to our support address are deleted from our mailbox by hand. Deletion cannot be undone."] },
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
      /* Same facts as the terms' "Cancellation and refunds" (D2, D8), told as the steps a customer takes. */
      { title: "Cancelling", body: ["Open the service in the customer area and press Request cancellation under Cancel at the end of the period. You can also write to the support address below, or open a ticket, and say which service you want to cancel. The service stays active until the end of the period you have paid for and is not renewed after that.", "You can withdraw the request on the same page at any time before the period ends, and the service then renews as usual. A renewal invoice that is open for the service when you cancel is closed with the request: if nothing has been paid on it, it is cancelled; if part of it has been paid, it is closed with a credit note and the amount paid becomes credit on your account.", "Nothing is deleted on the day you cancel. When the period ends, a hosting account is parked with its files kept until it is terminated, and your account itself stays open."] },
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
