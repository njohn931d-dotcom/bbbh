/**
 * One source of truth for JSON-LD on every page of the site.
 *
 * Why this file exists: structured data used to be assembled inline in each
 * generator, so the homepage, the 46 hand-written routes and the ~96 cluster
 * routes each carried a *different* (and differently incomplete) graph, and
 * nobody could tell from a source file whether a page had schema at all. Now a
 * page asks for a graph and this module builds it, and `scripts/seo-audit.mjs`
 * fails the deploy when the result disagrees with what is visible on the page.
 *
 * Rules this module enforces:
 *  - Only markup that is true. `aggregateRating`, `review`, and `sameAs` to a
 *    profile we do not own are refused outright, because fabricated markup is a
 *    manual-action risk, not a shortcut.
 *  - `FAQPage` is emitted only when the caller passes FAQs that the template
 *    actually renders inside the page. Google requires the marked-up Q&A to be
 *    visible to the reader; a schema-only FAQ is the classic way a small site
 *    gets classified as spammy structured markup.
 *  - Relative URLs are refused in anything that leaves the page (JSON-LD is
 *    read by crawlers and by unfurlers that do not know our base path), so
 *    every identity field is absolute, derived from `siteUrl`.
 */

export const SITE_NAME = 'Worth';
export const SITE_TAGLINE = 'Free money calculators and guides that run in your browser.';
export const REPO_URL = 'https://github.com/njohn931d-dotcom/bbbh';
export const LICENSE_URL = 'https://opensource.org/licenses/MIT';

/** Language tags the site genuinely serves, for `inLanguage` on WebSite. */
export const SERVED_LANGUAGES = ['en', 'es', 'de', 'fr', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

/** ISO date the content model was last revised for real. */
export const CONTENT_UPDATED = '2026-09-27';
export const CONTENT_PUBLISHED = '2026-01-15';

const strip = value => String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** JSON-LD must not contain a literal `<` or `>`: they can break out of the script element. */
const safe = text => strip(text).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

const isAbsolute = url => /^https?:\/\/[^/]/.test(String(url || ''));

/**
 * @typedef {object} GraphInput
 * @property {string} [siteUrl]    Absolute origin + base path, no trailing slash. Omit to build a preview graph.
 * @property {string} route        Site-relative route without slashes, e.g. `calculators/cost-of-time`. `''` is home.
 * @property {string} name         Page name (H1-quality, not the branded title tag).
 * @property {string} description  One-sentence summary, same facts as the meta description.
 * @property {'home'|'tool'|'guide'|'hub'|'embed'} kind
 * @property {string} [lang]       BCP-47 tag of THIS page, e.g. `de`.
 * @property {[string,string][]} [faqs]   Questions and answers that the template also renders visibly.
 * @property {{name:string,route:string}[]} [crumbs]  Breadcrumb trail, home first, current page last.
 * @property {string} [section]     Human label of the collection this page belongs to (for hubs).
 * @property {{published?:string,modified?:string}} [dates]
 * @property {string[]} [keywords]
 * @property {string[]} [features]  Real capabilities of a tool page, for `featureList`.
 * @property {{lang:string,route:string}[]} [translations] Sibling language versions of the same content.
 * @property {string} [translationOf] Route of the English original, on a translated page.
 * @property {string} [formula]     Plain-language formula, shown on the page.
 * @property {boolean} [production] When false, non-production graphs skip absolute URLs.
 */

/**
 * Build the `@graph` object for one page.
 *
 * @param {GraphInput} input
 * @returns {{'@context':string,'@graph':object[]}}
 */
export function buildGraph(input) {
  const {
    siteUrl = '', route = '', name, description, kind = 'guide', lang = 'en',
    faqs = [], crumbs = [], dates = {}, keywords = [], features = [],
    translations = [], translationOf = '', section, formula,
  } = input;

  if (!name) throw new Error('buildGraph: name is required');
  if (!strip(description)) throw new Error(`buildGraph: description is required for ${route || 'home'}`);
  if (siteUrl && !isAbsolute(siteUrl)) throw new Error(`buildGraph: siteUrl must be absolute, got "${siteUrl}"`);

  const origin = siteUrl ? siteUrl.replace(/\/$/, '') : '';
  const path = '/' + String(route).split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const url = origin ? origin + (route ? path : '/') : '';
  const abs = rel => (origin && String(rel).startsWith('/') ? origin + rel : rel);
  const id = suffix => (url ? url + suffix : undefined);

  /** @type {object[]} */
  const graph = [];

  // ---- publisher entity -------------------------------------------------
  // Google wants the publisher resolvable on every page, not invented on one.
  graph.push({
    '@type': 'Organization',
    '@id': abs('/') + '#organization',
    name: SITE_NAME,
    url: abs('/'),
    description: SITE_TAGLINE,
    logo: abs('/logo.svg'),
    // Only identities this repository controls. No Wikipedia, no Crunchbase.
    sameAs: [REPO_URL],
    license: LICENSE_URL,
  });

  // ---- the site itself --------------------------------------------------
  const webSite = {
    '@type': 'WebSite',
    '@id': abs('/') + '#website',
    name: SITE_NAME,
    url: abs('/'),
    description: SITE_TAGLINE,
    inLanguage: SERVED_LANGUAGES,
    publisher: { '@id': abs('/') + '#organization' },
  };
  graph.push(webSite);

  // ---- breadcrumb trail -------------------------------------------------
  let trail = crumbs.length ? crumbs.slice() : [];
  if (!trail.length) trail = [{ name: 'Home', route: '' }];
  // Google wants the trail to end on the page itself. Append it unless the
  // caller already did, and drop a crumb that points at the page we are on.
  if (route && trail[trail.length - 1]?.route !== route) trail.push({ name, route });
  if (!route) trail = [{ name: 'Home', route: '' }];
  if (trail.length === 1 && !route) trail = [];
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': url ? id('#breadcrumb') : undefined,
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: safe(item.name),
      ...(abs(item.route === '' ? '/' : '/' + item.route + '/') ? { item: abs(item.route === '' ? '/' : '/' + item.route + '/') } : {}),
    })),
  };
  if (breadcrumb.itemListElement.length > 1) graph.push(breadcrumb);

  // ---- primary entity ---------------------------------------------------
  const primaryIsApp = kind === 'tool';
  const primaryIsHub = kind === 'hub';
  const primary = {
    '@type': primaryIsApp ? 'WebApplication' : primaryIsHub ? ['WebPage', 'CollectionPage'] : 'WebPage',
    '@id': url ? id('#primary') : undefined,
    name: safe(name),
    description: safe(description),
    url: url || undefined,
    inLanguage: lang,
    isPartOf: { '@id': abs('/') + '#website' },
    ...(breadcrumb['@id'] ? { breadcrumb: { '@id': breadcrumb['@id'] } } : {}),
    datePublished: dates.published || CONTENT_PUBLISHED,
    dateModified: dates.modified || dates.published || CONTENT_UPDATED,
    primaryImageOfPage: { '@type': 'ImageObject', url: abs('/og-image.png'), width: 1200, height: 630 },
  };
  if (keywords.length) primary.keywords = keywords.join(', ');
  if (kind === 'embed') primary.mainEntityOfPage = { '@type': 'WebPage', '@id': abs('/' + route + '/') };
  if (primaryIsApp) {
    primary.applicationCategory = 'FinanceApplication';
    primary.applicationSubCategory = 'Calculator';
    primary.operatingSystem = 'Any (runs in the browser)';
    primary.browserRequirements = 'Any modern browser with JavaScript enabled';
    primary.isAccessibleForFree = true;
    primary.offers = { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' };
    primary.codeRepository = REPO_URL;
    primary.programmingLanguage = 'JavaScript';
    primary.license = LICENSE_URL;
    if (formula) primary.additionalProperty = { '@type': 'PropertyValue', name: 'Formula', value: safe(formula) };
    if (features.length) primary.featureList = features.map(safe);
  }
  graph.push(primary);

  // ---- article node, for anything that is read rather than used ---------
  // A hub is a list of pages, not an article, so it gets no Article node - an
  // Article without an article body is exactly the kind of markup that gets a
  // whole domain treated as suspect.
  if (kind === 'guide' || kind === 'embed' || primaryIsApp) {
    const article = {
      '@type': primaryIsApp ? 'TechArticle' : 'Article',
      '@id': url ? id('#article') : undefined,
      headline: safe(name),
      description: safe(description),
      inLanguage: lang,
      datePublished: dates.published || CONTENT_PUBLISHED,
      dateModified: dates.modified || dates.published || CONTENT_UPDATED,
      author: { '@id': abs('/') + '#organization' },
      publisher: { '@id': abs('/') + '#organization' },
      isAccessibleForFree: true,
      mainEntityOfPage: url ? { '@type': 'WebPage', '@id': id('#primary') } : undefined,
      ...(section ? { isPartOf: { '@type': 'CreativeWorkSeries', name: safe(section) } } : {}),
      license: LICENSE_URL,
      url: url || undefined,
    };
    if (keywords.length) article.keywords = keywords.join(', ');
    if (translations.length) {
      article.workTranslation = translations
        .filter(t => t.route !== route)
        .map(t => ({ '@type': 'CreativeWork', name: safe(t.name || name), inLanguage: t.lang, url: abs('/' + t.route + '/') }));
    }
    if (translationOf) {
      article.translationOfWork = { '@type': 'CreativeWork', url: abs('/' + translationOf + '/'), inLanguage: 'en' };
    }
    graph.push(article);
  }

  // ---- FAQ: only when the page shows the answers ------------------------
  const visible = faqs.filter(([q, a]) => strip(q) && strip(a));
  if (visible.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': url ? id('#faq') : undefined,
      mainEntity: visible.map(([q, a]) => ({
        '@type': 'Question',
        name: safe(q),
        acceptedAnswer: { '@type': 'Answer', text: safe(a) },
      })),
    });
  }

  // Refuse to ship markup that claims something we have not earned.
  const json = JSON.stringify(graph);
  for (const banned of ['aggregateRating', 'reviewRating', '"Review"', 'wikipedia.org']) {
    if (json.includes(banned)) {
      throw new Error(`buildGraph: fabricated or unowned markup ("${banned}") on ${route || 'home'}`);
    }
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Render the graph for embedding in a page. Escaped so it can never break out. */
export function jsonLdTag(graph) {
  const json = JSON.stringify(graph)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
  return '<script type="application/ld+json">' + json + '</script>';
}

/**
 * Breadcrumb trail for a route, from the route itself. Keeps the trail honest:
 * a guide under `/articles/subscriptions/` cannot claim it sits under home.
 */
export function crumbsFor(route, { labels = {}, known = null } = {}) {
  const parts = String(route || '').split('/').filter(Boolean);
  const trail = [{ name: 'Home', route: '' }];
  for (let i = 1; i < parts.length; i++) {
    const parent = parts.slice(0, i).join('/');
    if (known && !known.has(parent)) continue;
    trail.push({ name: labels[parent] || labels[parts[i - 1]] || parts[i - 1].replace(/-/g, ' '), route: parent });
  }
  return trail;
}

/** The FAQ section markup, matching the graph exactly, one source, two uses. */
export function faqSectionHtml(faqs) {
  if (!faqs || !faqs.length) return '';
  const items = faqs
    .filter(([q, a]) => strip(q) && strip(a))
    .map(([q, a]) => `<details><summary>${safe(q)}</summary><p>${safe(a)}</p></details>`)
    .join('');
  if (!items) return '';
  return `<section class="faq" id="faq"><div class="section-label">GOOD QUESTIONS</div><h2>Answers, written down.</h2>${items}</section>`;
}

/**
 * Read the `<details><summary>…</summary><p>…</p></details>` FAQ block out of
 * a template, so a page can mark up exactly the questions it shows the reader
 * instead of inventing a second set for the crawlers.
 */
export function faqsFromHtml(html) {
  const out = [];
  for (const m of String(html).matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)) {
    out.push([strip(m[1]), strip(m[2])]);
  }
  return out.filter(([q, a]) => q && a);
}

/**
 * Pull the questions a page actually renders, so the audit can compare the
 * visible FAQ with the marked-up FAQ without parsing the generators.
 */
export function visibleFaqQuestions(html) {
  return [...String(html).matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>/g)]
    .map(m => strip(m[1].replace(/<[^>]+>/g, '')))
    .filter(Boolean);
}
