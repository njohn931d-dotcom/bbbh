/* =============================================================================
 * RevenueKit — site metadata, structured data and page registry
 * -----------------------------------------------------------------------------
 * Single source of truth. The generator (build-site.js) renders both the
 * visible HTML (FAQ accordions, product cards) AND the JSON-LD from these
 * objects, so schema and on-page content can never disagree.
 *
 * Change the domain here (or run scripts/set-domain.sh) and rebuild.
 * ========================================================================== */
"use strict";

const SITE = {
  name: "RevenueKit",
  tagline: "Software · Scripts · SaaS",
  description:
    "RevenueKit publishes data-backed guides on ways to generate income online and sells the software, scripts and SaaS kits that put those methods into practice.",
  footerBlurb:
    "Independent research on digital-product income: what actually earns, what it costs to start, and the tools that remove the busywork.",
  origin: "https://njohn931d-dotcom.github.io",
  base: "/bbbh",
  email: "hello@revenuekit.dev",
  twitter: "@revenuekit",
  ogImage: "assets/img/og-home.png",
  author: {
    name: "Nathan Johnson",
    initials: "NJ",
    role: "Founder & principal researcher, RevenueKit",
    bio: "Nathan Johnson has shipped and sold eleven digital products — six scripts, three plugins and two micro-SaaS tools — since 2019. He writes RevenueKit's income guides from first-hand revenue data rather than affiliate roundups.",
  },
  sameAs: [
    "https://github.com/njohn931d-dotcom",
    "https://x.com/revenuekit",
  ],
};

/* --------------------------------------------------------------- schema -- */
const ORG = {
  "@type": "Organization",
  "@id": SITE.origin + SITE.base + "/#organization",
  name: SITE.name,
  url: SITE.origin + SITE.base + "/",
  logo: {
    "@type": "ImageObject",
    url: SITE.origin + SITE.base + "/assets/img/icon-512.png",
    width: 512,
    height: 512,
  },
  email: SITE.email,
  description: SITE.description,
  sameAs: SITE.sameAs,
  founder: { "@id": SITE.origin + SITE.base + "/about/#person" },
};

const PERSON = {
  "@type": "Person",
  "@id": SITE.origin + SITE.base + "/about/#person",
  name: SITE.author.name,
  jobTitle: SITE.author.role,
  description: SITE.author.bio,
  url: SITE.origin + SITE.base + "/about/",
  worksFor: { "@id": SITE.origin + SITE.base + "/#organization" },
  sameAs: SITE.sameAs,
};

const WEBSITE = {
  "@type": "WebSite",
  "@id": SITE.origin + SITE.base + "/#website",
  url: SITE.origin + SITE.base + "/",
  name: SITE.name,
  description: SITE.description,
  inLanguage: "en",
  publisher: { "@id": SITE.origin + SITE.base + "/#organization" },
};

function breadcrumbList(slug, crumbs) {
  const base = SITE.origin + SITE.base;
  const items = [{ name: "Home", url: base + "/" }, ...crumbs];
  return {
    "@type": "BreadcrumbList",
    "@id": base + (slug ? "/" + slug + "/" : "/") + "#breadcrumb",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

function articleSchema(p) {
  const base = SITE.origin + SITE.base;
  return {
    "@type": ["Article", "TechArticle"],
    "@id": base + "/" + p.slug + "/#article",
    mainEntityOfPage: { "@type": "WebPage", "@id": base + "/" + p.slug + "/" },
    headline: p.h1 || p.title,
    description: p.description,
    image: [base + "/" + (p.ogImage || SITE.ogImage)],
    datePublished: p.published,
    dateModified: p.modified,
    inLanguage: "en",
    articleSection: p.section,
    keywords: (p.tags || []).join(", "),
    wordCount: p._words,
    timeRequired: "PT" + (p._read || 10) + "M",
    author: { "@id": base + "/about/#person" },
    publisher: { "@id": base + "/#organization" },
    isPartOf: { "@id": base + "/#website" },
    about: (p.about || []).map((a) => ({ "@type": "Thing", name: a })),
  };
}

function faqSchema(items) {
  return {
    "@type": "FAQPage",
    "@id": SITE.origin + SITE.base + "/#faq-" + Math.random().toString(36).slice(2, 7),
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/* -------------------------------------------------------------- products -- */
const PRODUCTS = [
  {
    id: "launch-kit",
    name: "Launch Kit",
    category: "Free starter",
    desc: "A production landing-page template, an SEO pre-flight checklist and a 21-method income worksheet. The exact starting point every RevenueKit guide assumes.",
    price: 0,
    priceNote: "free",
    appCategory: "DeveloperApplication",
    os: "Any (static HTML)",
    ribbon: null,
  },
  {
    id: "saas-starter",
    name: "SaaS Starter",
    category: "Micro-SaaS boilerplate",
    desc: "Auth, billing, license keys, email and a marketing site — wired together and deployable in an afternoon. Ship a paid micro-SaaS without rebuilding the plumbing.",
    price: 149,
    compareAt: 199,
    priceNote: "one-time",
    appCategory: "DeveloperApplication",
    os: "Node.js 18+",
    ribbon: "Best seller",
  },
  {
    id: "checkout-kit",
    name: "Checkout Kit",
    category: "Self-hosted checkout script",
    desc: "A single-file checkout + license-key issuer you drop on any static host. Keep 100% of margin minus processing fees; no monthly platform cut.",
    price: 79,
    priceNote: "one-time",
    appCategory: "BusinessApplication",
    os: "Any (PHP/Node/static)",
    ribbon: null,
  },
  {
    id: "pricing-engine",
    name: "Pricing Engine",
    category: "Pricing calculator + playbook",
    desc: "Value-based pricing spreadsheet with 40 benchmark tiers, a willingness-to-pay survey script and a price-test decision tree.",
    price: 49,
    priceNote: "one-time",
    appCategory: "BusinessApplication",
    os: "Sheets / Excel",
    ribbon: null,
  },
  {
    id: "seo-forge",
    name: "SEO Forge",
    category: "Static-site SEO audit CLI",
    desc: "Crawls any static site and reports missing titles, thin meta, broken canonicals, absent schema, slow LCP assets and orphan pages — the audit this very site passes.",
    price: 39,
    priceNote: "one-time",
    appCategory: "DeveloperApplication",
    os: "Node.js 18+",
    ribbon: "New",
  },
  {
    id: "prompt-vault",
    name: "Prompt Vault",
    category: "Prompt library",
    desc: "412 field-tested prompts for niche research, launch copy, onboarding emails and support macros — organised by funnel stage.",
    price: 29,
    priceNote: "one-time",
    appCategory: "BusinessApplication",
    os: "Any LLM",
    ribbon: null,
  },
];

function productListSchema() {
  const base = SITE.origin + SITE.base;
  return {
    "@type": "ItemList",
    "@id": base + "/tools/#itemlist",
    name: "RevenueKit tools & kits",
    numberOfItems: PRODUCTS.length,
    itemListElement: PRODUCTS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@id": base + "/tools/#" + p.id },
    })),
  };
}

function softwareSchemas() {
  const base = SITE.origin + SITE.base;
  return PRODUCTS.map((p) => ({
    "@type": "SoftwareApplication",
    "@id": base + "/tools/#" + p.id,
    name: p.name,
    applicationCategory: p.appCategory,
    operatingSystem: p.os,
    description: p.desc,
    url: base + "/tools/#" + p.id,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: base + "/tools/#" + p.id,
      ...(p.compareAt ? { priceSpecification: { "@type": "UnitPriceSpecification", price: p.price, priceCurrency: "USD" } } : {}),
    },
    publisher: { "@id": base + "/#organization" },
  }));
}

/* ------------------------------------------------------------------ FAQ -- */
const FAQ = {
  pillar: [
    {
      q: "What is the fastest way to generate income online?",
      a: "Selling a digital product to an existing demand channel is the fastest route to a first dollar: freelancers and creators report first sales within one to two weeks when they package a skill they already have as a template, script or guide. Pure-passive routes (content sites, SaaS) pay later but compound longer.",
    },
    {
      q: "How much money can you realistically make selling digital products?",
      a: "The honest distribution: the median active creator earns about $1,200 per year from digital products, but creators who publish at least three products and stay active for twelve months see a median near $8,400 per year. Top-decile sellers earn $20,000–$50,000. Consistency, not talent, is the dividing line.",
    },
    {
      q: "Do I need an audience to sell digital products?",
      a: "No. Marketplaces (Gumroad Discover, Etsy, app stores, WordPress.org) and search traffic can supply buyers from day one. An audience raises conversion rates dramatically, but roughly a third of first-time sellers close their first sale through a marketplace or a search-ranked page, not a follower list.",
    },
    {
      q: "Are digital products really passive income?",
      a: "Semi-passive, honestly. Creation is fully active; distribution, delivery and payment are fully automated; support and updates are recurring but small. Budget roughly 2–5 hours per month per product for support and refreshes once it is live.",
    },
    {
      q: "What digital product sells best in 2026?",
      a: "By revenue: software and micro-SaaS (recurring $19–$99/month licences) and courses. By unit volume: templates, printables and low-priced ebooks. The highest margin-per-hour for a solo technical seller is narrow-utility software: scripts, plugins and API access.",
    },
    {
      q: "How do I get my first 10 customers without paid ads?",
      a: "Rank one long-tail search page, post the build in two communities where your buyers already ask the question, and offer the product free to three people in exchange for a testimonial and a case-study quote. Ten customers usually come from those three channels, in that order.",
    },
    {
      q: "Is selling digital products legal, and do I need a business licence?",
      a: "Selling digital goods is legal everywhere we operate, but obligations vary: most jurisdictions require registering a business name once you trade regularly, collecting sales tax/VAT above thresholds, and issuing receipts. Merchant-of-record platforms (Lemon Squeezy, Paddle, Gumroad) handle global sales tax for you, which is why most solo sellers start there.",
    },
    {
      q: "What is the difference between active, passive and portfolio income?",
      a: "Active income trades time for money (salary, freelance). Passive income keeps paying after the work is done (royalties, licences, digital products, rent). Portfolio income is money your money makes (dividends, interest, gains). A resilient personal economy stacks all three; this guide focuses on building the passive layer from digital products.",
    },
  ],
  sell: [
    {
      q: "What is the cheapest way to start selling digital products?",
      a: "Under $50 total: a free marketplace account (Gumroad, Payhip or Etsy), a free design tool, and a domain only once you validate demand. Most first products launch for $0–$20 in out-of-pocket cost.",
    },
    {
      q: "Which platform takes the smallest cut?",
      a: "Self-hosted checkout (Stripe Payment Links or a script like our Checkout Kit) costs only processing fees, roughly 2.9% + 30¢. Marketplaces range from 5% (Payhip, Lemon Squeezy) to 10%+ (Gumroad direct) plus listing fees on Etsy.",
    },
    {
      q: "How long before a digital product makes money?",
      a: "First sales often arrive in 1–4 weeks if you launch into existing demand. Meaningful monthly revenue typically takes 3–6 months of compounding search traffic and product iteration.",
    },
  ],
  passive: [
    {
      q: "Is any income truly 100% passive?",
      a: "No. Every stream needs setup capital (time or money) and periodic maintenance. The useful question is hours-per-dollar after launch: digital products and index-fund dividends sit at the low end; dropshipping and content channels sit much higher than advertised.",
    },
    {
      q: "How many income streams should I have?",
      a: "Three to five that share one audience or skill stack. Diversification across unrelated streams multiplies workload; related streams reuse the same content, list and reputation.",
    },
    {
      q: "What passive income works with no money to start?",
      a: "Digital products, affiliate content and licensing existing work all start at $0. Anything promising passive income that requires buying inventory or a course first is selling you the income stream, not giving you one.",
    },
  ],
  saas: [
    {
      q: "What makes a micro-SaaS idea worth building?",
      a: "A narrow, repetitive, painful problem for a professional buyer who already pays for tools, reachable in one channel, and solvable in a weekend-scale MVP. Price $19–$99/month and you need only 20–100 customers for a real side income.",
    },
    {
      q: "How do I validate a SaaS idea before writing code?",
      a: "Sell the outcome first: a landing page with a price, a waitlist or pre-order, and ten conversations with people who hit the problem weekly. Pre-orders beat surveys; surveys beat opinions.",
    },
    {
      q: "Can a solo founder still compete in SaaS in 2026?",
      a: "Yes, in niches too small for venture-backed teams. The documented indie pattern is a single founder, a narrow professional niche, $19–$79/month pricing, and distribution through SEO content plus community outreach.",
    },
  ],
  home: [
    {
      q: "What is RevenueKit?",
      a: "An independent publisher and software studio focused on one question: which ways of generating income online actually pay, at what cost, and how fast. We rank methods on real numbers and sell the scripts, plugins and SaaS kits that remove the busywork from executing them.",
    },
    {
      q: "Is the Launch Kit really free?",
      a: "Yes. It contains a production landing-page template, the SEO pre-flight checklist we run on every page of this site, and a worksheet version of our 21-method income guide. It is the starting point every guide assumes; we earn only if you later choose a paid kit.",
    },
    {
      q: "Do your guides push your own tools?",
      a: "We disclose it when they do. Guides are written and ranked before any product is mentioned, and every table includes alternatives — including free ones and competitors. If a recommendation ever earns us a commission, it is labelled in-line.",
    },
    {
      q: "How often are the guides updated?",
      a: "Every guide carries a published date and a last-verified date, and each is re-checked at least quarterly against current platform fees, market research and payout data. Material corrections are logged publicly on the About page.",
    },
  ],
  pricing: [
    {
      q: "How much should I charge for a digital product?",
      a: "Price the outcome, not the file: printables $3–$15, templates $15–$79, ebooks $10–$30, courses $100–$2,000, software licences $49–$849 or $19–$99/month. If nobody complains about the price, you are too cheap.",
    },
    {
      q: "Should I offer discounts at launch?",
      a: "Launch pricing yes, permanent discounts no. A time-boxed founding-member price creates urgency and honest scarcity; routine discounting trains buyers to wait and anchors your value low.",
    },
    {
      q: "One-time price or subscription?",
      a: "Subscription whenever you deliver ongoing value (updates, data, hosting, community). One-time for static assets. Annual pre-pay plans usually convert best and fix churn and cash flow at once.",
    },
  ],
};

/* ----------------------------------------------------------------- pages -- */
const B = SITE.origin + SITE.base;

const PAGES = [
  /* ------------------------------------------------------------ HOME ---- */
  {
    slug: "",
    type: "page",
    bodyFile: "home.html",
    title: "RevenueKit — Software & SaaS Kits to Generate Income Online",
    description:
      "Data-backed guides on ways to generate income online, plus the scripts, plugins and micro-SaaS kits that turn those methods into revenue. Free Launch Kit.",
    ogTitle: "RevenueKit — Sell software. Stack income.",
    ogDescription:
      "Independent research on digital-product income, and the tools that put it into practice. Scripts, plugins and micro-SaaS kits built to be sold.",
    ogImage: "assets/img/og-home.png",
    ogAlt: "RevenueKit brand card: sell software, stack income",
    breadcrumbs: [],
    faq: FAQ.home,
    schema: [
      WEBSITE,
      ORG,
      PERSON,
      {
        "@type": "WebPage",
        "@id": B + "/#webpage",
        url: B + "/",
        name: SITE.name,
        isPartOf: { "@id": B + "/#website" },
        about: { "@type": "Thing", name: "Digital product income" },
        primaryImageOfPage: { "@type": "ImageObject", url: B + "/assets/img/og-home.png" },
      },
      faqSchema(FAQ.home),
    ],
  },

  /* ---------------------------------------------------------- PILLAR ---- */
  {
    slug: "ways-to-generate-income",
    type: "article",
    pillar: true,
    bodyFile: "ways-to-generate-income.html",
    h1: "Ways to Generate Income: 21 Proven Methods, Ranked by Real Numbers (2026)",
    title: "Ways to Generate Income: 21 Proven Methods Ranked (2026 Guide)",
    shortTitle: "Ways to Generate Income (2026)",
    description:
      "21 ways to generate income compared on startup cost, time to first dollar and realistic monthly earnings — plus a framework for choosing yours.",
    ogTitle: "Ways to Generate Income Online — 21 Methods Ranked (2026)",
    ogDescription:
      "Startup cost, time to first dollar and realistic earnings for 21 income methods, compared in one table. Plus the framework for choosing yours.",
    ogImage: "assets/img/og-ways-to-generate-income.png",
    ogAlt: "Ways to Generate Income Online: 21 methods ranked, 2026 guide",
    eyebrow: "The complete 2026 guide",
    lede: "Every method below is scored on the three numbers that actually decide whether you get paid: what it costs to start, how long until the first dollar, and what a realistic month looks like a year in. No lifestyle screenshots — just ranges, sources and a way to choose.",
    keywords:
      "ways to generate income, how to make money online, income streams, digital products income, passive income methods, make money 2026",
    section: "Income strategy",
    tags: ["income", "digital products", "passive income", "micro-SaaS", "side income"],
    about: ["Income generation", "Digital products", "Passive income", "Online business"],
    published: "2026-01-12",
    publishedPretty: "January 12, 2026",
    modified: "2026-09-26",
    modifiedPretty: "September 26, 2026",
    author: SITE.author.name,
    breadcrumbs: [{ name: "Ways to Generate Income", url: B + "/ways-to-generate-income/" }],
    faq: FAQ.pillar,
    schema: [],
  },

  /* --------------------------------------------------------- CLUSTER ---- */
  {
    slug: "sell-digital-products",
    type: "article",
    bodyFile: "sell-digital-products.html",
    h1: "How to Sell Digital Products: A 9-Stage Playbook (2026)",
    title: "How to Sell Digital Products: 9-Stage Playbook for 2026",
    shortTitle: "How to Sell Digital Products",
    description:
      "A nine-stage playbook for selling digital products: niche research, shaping, pricing, storefronts, launch, delivery automation and the compounding loop.",
    ogTitle: "How to Sell Digital Products — 9-Stage Playbook",
    ogDescription:
      "From niche research to automated delivery: the exact nine stages, with platform fees, pricing rules and a launch checklist.",
    ogImage: "assets/img/og-sell-digital-products.png",
    ogAlt: "How to sell digital products: nine stages from research to repeat revenue",
    eyebrow: "Playbook",
    lede: "Selling a digital product is nine decisions in a row. Get the order right and a solo seller can go from idea to automated revenue in a weekend-scale sprint; get it wrong and you build a beautiful file nobody buys.",
    keywords: "how to sell digital products, sell digital downloads, digital product business, where to sell digital products",
    section: "Selling",
    tags: ["digital products", "ecommerce", "launch"],
    about: ["Digital product sales", "E-commerce"],
    published: "2026-02-03",
    publishedPretty: "February 3, 2026",
    modified: "2026-09-26",
    modifiedPretty: "September 26, 2026",
    breadcrumbs: [{ name: "Sell Digital Products", url: B + "/sell-digital-products/" }],
    faq: FAQ.sell,
    schema: [],
  },
  {
    slug: "passive-income-ideas",
    type: "article",
    bodyFile: "passive-income-ideas.html",
    h1: "Passive Income Ideas That Actually Work in 2026 (14, Ranked by Reality)",
    title: "14 Passive Income Ideas That Actually Work in 2026, Ranked",
    shortTitle: "Passive Income Ideas",
    description:
      "14 passive income ideas scored on true maintenance hours, startup capital and payback — including which 'passive' streams are really unpaid overtime.",
    ogTitle: "Passive Income Ideas That Work — 14 Ranked by Reality",
    ogDescription:
      "What is genuinely passive in 2026 and what is unpaid overtime. 14 ideas scored on maintenance hours, capital and payback.",
    ogImage: "assets/img/og-passive-income-ideas.png",
    ogAlt: "Passive income ideas that work in 2026, ranked by reality",
    eyebrow: "Reality-checked list",
    lede: "'Passive' is a spectrum, not a switch. We score 14 popular ideas on the only metrics that survive contact with reality: hours per month after launch, cash to start, and months to payback.",
    keywords: "passive income ideas, passive income 2026, make money while you sleep, semi-passive income",
    section: "Passive income",
    tags: ["passive income", "investing", "digital products"],
    about: ["Passive income"],
    published: "2026-02-24",
    publishedPretty: "February 24, 2026",
    modified: "2026-09-26",
    modifiedPretty: "September 26, 2026",
    breadcrumbs: [{ name: "Passive Income Ideas", url: B + "/passive-income-ideas/" }],
    faq: FAQ.passive,
    schema: [],
  },
  {
    slug: "micro-saas-ideas",
    type: "article",
    bodyFile: "micro-saas-ideas.html",
    h1: "23 Micro-SaaS Ideas Worth Building in 2026 (+ Validation Playbook)",
    title: "23 Micro-SaaS Ideas Worth Building in 2026 (+ Validation)",
    shortTitle: "Micro-SaaS Ideas",
    description:
      "23 narrow, buyer-validated micro-SaaS ideas with target customer, price point and fastest MVP path — plus our five-question validation gate.",
    ogTitle: "23 Micro-SaaS Ideas Worth Building in 2026",
    ogDescription:
      "Narrow problems, professional buyers, $19–$99/month. 23 ideas with pricing and MVP path, plus a validation gate.",
    ogImage: "assets/img/og-micro-saas-ideas.png",
    ogAlt: "Micro-SaaS ideas worth building in 2026 with validation playbook",
    eyebrow: "Idea vault",
    lede: "The indie pattern that keeps working in 2026: one founder, one narrow professional pain, $19–$99 per month. Here are 23 pains worth solving, and the gate we run before building any of them.",
    keywords: "micro saas ideas, saas ideas 2026, indie hacker ideas, small software business ideas",
    section: "Micro-SaaS",
    tags: ["micro-SaaS", "startups", "software"],
    about: ["Micro-SaaS", "Software businesses"],
    published: "2026-03-17",
    publishedPretty: "March 17, 2026",
    modified: "2026-09-26",
    modifiedPretty: "September 26, 2026",
    breadcrumbs: [{ name: "Micro-SaaS Ideas", url: B + "/micro-saas-ideas/" }],
    faq: FAQ.saas,
    schema: [],
  },
  {
    slug: "digital-product-pricing",
    type: "article",
    bodyFile: "digital-product-pricing.html",
    h1: "How to Price Digital Products: Value-Based Framework + 2026 Benchmarks",
    title: "How to Price Digital Products: Framework + 2026 Benchmarks",
    shortTitle: "Pricing Digital Products",
    description:
      "A value-based pricing framework for digital products with 2026 benchmark tables, three small-traffic price tests and levers that lift order value.",
    ogTitle: "How to Price Digital Products — Framework + Benchmarks",
    ogDescription:
      "Value-based tiers, 40 benchmark price points by category, and price tests that raise revenue without discounting.",
    ogImage: "assets/img/og-digital-product-pricing.png",
    ogAlt: "How to price digital products: value-based framework and benchmarks",
    eyebrow: "Pricing",
    lede: "Your marginal cost is zero, so cost-plus pricing is meaningless. The only defensible anchor is the value of the outcome — here is how to estimate it, benchmark it and test it.",
    keywords: "how to price digital products, digital product pricing, pricing strategy, value based pricing",
    section: "Pricing",
    tags: ["pricing", "digital products", "strategy"],
    about: ["Pricing strategy"],
    published: "2026-04-08",
    publishedPretty: "April 8, 2026",
    modified: "2026-09-26",
    modifiedPretty: "September 26, 2026",
    breadcrumbs: [{ name: "Pricing Digital Products", url: B + "/digital-product-pricing/" }],
    faq: FAQ.pricing,
    schema: [],
  },

  /* ------------------------------------------------------- LAUNCH KIT ---- */
  {
    slug: "launch-kit",
    type: "page",
    bodyFile: "launch-kit.html",
    title: "Free Launch Kit — Template, SEO Checklist & Worksheet",
    description:
      "Download the free RevenueKit Launch Kit: a production landing-page template, the SEO pre-flight checklist we run on every page, and the 21-method income worksheet.",
    ogTitle: "The free Launch Kit — template, checklist & worksheet",
    ogDescription:
      "A production landing template, our SEO pre-flight checklist and the 21-method income worksheet. Free, no card required.",
    ogImage: "assets/img/og-home.png",
    ogAlt: "RevenueKit free Launch Kit contents",
    breadcrumbs: [{ name: "Launch Kit", url: B + "/launch-kit/" }],
    schema: [
      {
        "@type": "WebPage",
        "@id": B + "/launch-kit/#webpage",
        url: B + "/launch-kit/",
        name: "Free Launch Kit",
        isPartOf: { "@id": B + "/#website" },
        about: { "@type": "Thing", name: "Digital product launch assets" },
      },
      {
        "@type": "CreativeWork",
        "@id": B + "/launch-kit/#work",
        name: "RevenueKit Launch Kit",
        description: "Landing-page template, SEO pre-flight checklist and 21-method income worksheet.",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: 0, priceCurrency: "USD", availability: "https://schema.org/InStock" },
        publisher: { "@id": B + "/#organization" },
      },
    ],
  },

  /* ------------------------------------------------------------ TOOLS ---- */
  {
    slug: "tools",
    type: "page",
    bodyFile: "tools.html",
    title: "Tools & Kits for Digital Product Sellers | RevenueKit",
    description:
      "RevenueKit's digital products: SaaS Starter, Checkout Kit, Pricing Engine, SEO Forge, Prompt Vault and the free Launch Kit. Built by sellers, for sellers.",
    ogTitle: "RevenueKit Tools & Kits — built by sellers, for sellers",
    ogDescription:
      "The software behind the guides: SaaS boilerplate, checkout scripts, pricing benchmarks and an SEO audit CLI. Free Launch Kit included.",
    ogImage: "assets/img/og-home.png",
    ogAlt: "RevenueKit tools and kits catalogue",
    breadcrumbs: [{ name: "Tools & Kits", url: B + "/tools/" }],
    schema: [productListSchema(), ...softwareSchemas()],
  },

  /* ----------------------------------------------------------- ABOUT ---- */
  {
    slug: "about",
    type: "page",
    bodyFile: "about.html",
    title: "About RevenueKit — Who Writes These Guides & How We Test",
    description:
      "Who writes RevenueKit, how methods are tested and scored, plus our affiliate disclosure, privacy practice and public corrections log.",
    ogTitle: "About RevenueKit — editorial policy & testing method",
    ogDescription:
      "How we research, score and update income guides. Independent publisher, first-hand testing, transparent corrections.",
    ogImage: "assets/img/og-home.png",
    ogAlt: "About RevenueKit",
    breadcrumbs: [{ name: "About", url: B + "/about/" }],
    schema: [
      ORG,
      PERSON,
      {
        "@type": "AboutPage",
        "@id": B + "/about/#webpage",
        url: B + "/about/",
        name: "About RevenueKit",
        isPartOf: { "@id": B + "/#website" },
        mainEntity: { "@id": B + "/#organization" },
      },
    ],
  },

  /* ------------------------------------------------------------- 404 ----- */
  {
    slug: "404",
    type: "page",
    bodyFile: "404.html",
    title: "Page not found (404) — RevenueKit",
    description: "The page you requested does not exist. Browse RevenueKit's income guides and tools instead.",
    noindex: true,
    breadcrumbs: [{ name: "Not found", url: B + "/404/" }],
    schema: [],
  },
];

/* Attach article schema once the generator knows real word counts. */
function attachArticleSchema(p) {
  if (p.type !== "article") return;
  const art = articleSchema(p);
  const faq = p.faq ? faqSchema(p.faq) : null;
  const bc = breadcrumbList(p.slug, p.breadcrumbs || []);
  p.schema = [art, bc, ...(faq ? [faq] : []), ORG, PERSON];
}

module.exports = { SITE, PAGES, FAQ, PRODUCTS, ORG, PERSON, WEBSITE, attachArticleSchema };
