/**
 * Article pipeline for Worth.
 *
 * Source of truth:  content/articles/*.md  (tracked in Git)
 * Generated output: articles/<cluster>/<slug>/index.html, articles/index.html and the five
 *                   cluster hubs, articles/<cluster>/index.html. The site-wide sitemap, RSS
 *                   feed and llms.txt are written by scripts/generate-seo.mjs, which imports
 *                   the exported data below. The articles/*.md mirrors kept for GitHub
 *                   browsing are tracked files and are never removed by this pipeline.
 *
 * Generated HTML is ignored in Git (see .gitignore). Edit the Markdown, never the output.
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
/**
 * Append the site name only when it fits and does not stutter against the last
 * word of the title. Google truncates around 60 characters, so a brand suffix
 * that pushes the keyword half out of view costs more than it identifies.
 */
const withBrand = (title, brand) => {
  const words = title.toLowerCase().replace(/[^\p{L}\s\d]/gu, ' ').split(/\s+/).filter(Boolean);
  if (words[words.length - 1] === brand.toLowerCase()) return title;
  const suffixed = `${title} | ${brand}`;
  return suffixed.length <= 65 ? suffixed : title;
};

import path from 'node:path';

export const CONTENT_DIR = 'content/articles';
export const OUT_DIR = 'articles';

export const clusters = [
  { slug: 'work-hours', name: 'Money in hours', label: 'THE COST IN WORK TIME', blurb: 'Turn price tags into hours of work: the formula, the tables, and what each common purchase really costs you.', query: 'cost of things in hours of work' },
  { slug: 'subscriptions', name: 'Subscriptions', label: 'THE QUIET MONTHLY SPEND', blurb: 'What recurring charges add up to per year, how to audit them, and how to cancel cleanly when you decide to.', query: 'subscription cost per year' },
  { slug: 'saving-habits', name: 'Saving habits', label: 'SMALL AMOUNTS, REAL TOTALS', blurb: 'Challenges, buffers and sinking funds — what small amounts add to, and how to keep going past week three.', query: 'how to save money each month' },
  { slug: 'pay-and-rates', name: 'Pay & rates', label: 'HOURLY, ANNUAL, TAKE-HOME', blurb: 'Converting between hourly and annual pay, what actually comes off a salary, and how to price your own time.', query: 'hourly to salary conversion' },
  { slug: 'spending-decisions', name: 'Spending decisions', label: 'BIGGER BUYS, CLEARER MATH', blurb: 'Cost per use, total cost of ownership and the questions that make a large purchase easier to judge.', query: 'cost per use comparison' },
];

const CALCULATORS = {
  'cost-of-time': { route: 'calculators/cost-of-time', name: 'Cost of time calculator', cta: 'Turn any price into hours of work' },
  'subscription': { route: 'calculators/subscription-cost', name: 'Subscription calculator', cta: 'See the annual cost of a monthly charge' },
  'saving': { route: 'calculators/daily-savings', name: 'Daily savings calculator', cta: 'See what a daily amount adds up to' },
};

const escapeHtml = (s) => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

/**
 * Link prefix for GitHub Pages project sites: '' for a domain root, '/bbbh' for
 * https://owner.github.io/bbbh. Article routes stay site-root-relative everywhere else.
 */
let linkBase = '';
const pathFor = (route) => `/${route}/`;
const urlFor = (origin, route) => `${origin}${linkBase}/${route}/`;

const slugifyHeading = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Inline markdown: bold, italic, code, links. Input is already HTML-escaped text. */
function inline(text) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*((?:[^*]|\*(?!\*))+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
      const safe = /^(https?:\/\/|\/)/.test(href) ? href : '/';
      return `<a href="${safe}">${label}</a>`;
    });
}

/** Minimal, dependency-free markdown renderer for the article bodies in content/. */
export function renderMarkdown(md) {
  const lines = md.split('\n');
  const out = [];
  let list = null;
  let table = null;
  let code = null;

  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const closeTable = () => { if (table) { out.push('</tbody></table>'); table = null; } };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');

    if (/^```/.test(line)) {
      closeList(); closeTable();
      if (code === null) { code = []; out.push('<pre><code>'); } else { out.push(escapeHtml(code.join('\n')) + '</code></pre>'); code = null; }
      continue;
    }
    if (code !== null) { code.push(raw); continue; }

    if (!line.trim()) { closeList(); closeTable(); continue; }

    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    if (heading) {
      closeList(); closeTable();
      const level = heading[1].length;
      const text = escapeHtml(heading[2]);
      const id = slugifyHeading(heading[2]);
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      continue;
    }

    if (/^\|/.test(line) && /\|$/.test(line)) {
      closeList();
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (!table) {
        table = true;
        out.push('<table><thead><tr>' + cells.map((c) => `<th>${inline(escapeHtml(c))}</th>`).join('') + '</tr></thead><tbody>');
      } else if (/^\|[\s:|-]+\|$/.test(line)) {
        continue; // separator row
      } else {
        out.push('<tr>' + cells.map((c) => `<td>${inline(escapeHtml(c))}</td>`).join('') + '</tr>');
      }
      continue;
    }
    closeTable();

    if (/^>\s?/.test(line)) {
      closeList();
      out.push(`<blockquote><p>${inline(escapeHtml(line.replace(/^>\s?/, '')))}</p></blockquote>`);
      continue;
    }

    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (list !== 'ul') { closeList(); list = 'ul'; out.push('<ul>'); }
      out.push(`<li>${inline(escapeHtml(ul[1]))}</li>`);
      continue;
    }

    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (list !== 'ol') { closeList(); list = 'ol'; out.push('<ol>'); }
      out.push(`<li>${inline(escapeHtml(ol[1]))}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${inline(escapeHtml(line))}</p>`);
  }
  closeList(); closeTable();
  if (code !== null) out.push(escapeHtml(code.join('\n')) + '</code></pre>');
  return out.join('\n');
}

/** Parse `---` frontmatter plus the Markdown body. */
/**
 * When a guide first appeared, taken from the commit that added its Markdown.
 *
 * Google will only show an Article rich result with a credible datePublished,
 * and back-dating it to the build date would be a lie that shows in the result.
 * Falls back to the revision date when the repository history is not available
 * (a shallow checkout, or content generated outside a clone).
 */
const publishedCache = new Map();
function firstPublished(file) {
  if (publishedCache.has(file)) return publishedCache.get(file);
  let date = '';
  try {
    date = execFileSync('git', ['log', '--diff-filter=A', '--format=%as', '-1', '--', `content/articles/${file}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { date = ''; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = '';
  publishedCache.set(file, date);
  return date;
}

export function parseArticle(file) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  const meta = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  for (const key of ['title', 'description', 'slug', 'cluster', 'query', 'reading', 'updated']) {
    if (!meta[key]) throw new Error(`${file}: missing frontmatter field "${key}"`);
  }
  if (meta.description.length > 158) throw new Error(`${file}: description is ${meta.description.length} chars (max 158)`);
  if (!clusters.some((c) => c.slug === meta.cluster)) throw new Error(`${file}: unknown cluster "${meta.cluster}"`);
  // Only trust the commit date when it predates the content's own revision date;
  // a squashed or shallow history otherwise makes every guide look brand new.
  const fromGit = firstPublished(file);
  const published = fromGit && fromGit < meta.updated ? fromGit : meta.updated;
  return { ...meta, body: match[2].trim(), file, published };
}

export function loadArticles() {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md')).sort();
  const articles = files.map(parseArticle);
  const seen = new Set();
  for (const a of articles) {
    if (seen.has(a.slug)) throw new Error(`Duplicate slug: ${a.slug}`);
    seen.add(a.slug);
  }
  return articles;
}

export const articles = loadArticles();
export const byCluster = (slug) => articles.filter((a) => a.cluster === slug);
export const articleRoutes = [
  `${OUT_DIR}`,
  ...clusters.map((c) => `${OUT_DIR}/${c.slug}`),
  ...articles.map((a) => `${OUT_DIR}/${a.cluster}/${a.slug}`),
];
export const allRoutes = articleRoutes;

const SITE_NAME = 'Worth';

function pageShell({ template, origin, route, title, description, bodyClass, main, schema }) {
  let html = template;
  const url = route ? urlFor(origin, route) : origin + '/';
  html = html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(description)}">`)
    .replace(/<script type="application\/ld\+json">.*?<\/script>/s, `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`)
    .replace(/<main>[\s\S]*?<\/main>/, `<main>${main}</main>`)
    .replace('<body>', `<body${bodyClass ? ` class="${bodyClass}"` : ''}>`)
    .replace(/href="#(calculator|learn|how)"/g, 'href="/#$1"')
    .replace('<script type="module" src="/app.js"></script>', '')
    .replace('</head>', `${origin
      ? `<link rel="canonical" href="${escapeHtml(url)}"><meta property="og:url" content="${escapeHtml(url)}">` +
        // Absolute image URLs: several link unfurlers refuse to resolve a
        // relative og:image and fall back to a bare text card.
        `<meta property="og:image" content="${escapeHtml(origin + '/og-image.png')}">` +
        `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` +
        `<meta name="twitter:image" content="${escapeHtml(origin + '/og-image.png')}">`
      : '<meta name="robots" content="noindex, nofollow">'}<meta name="twitter:card" content="summary_large_image"></head>`);
  // Article pages are static: swap the saved-thoughts button and the in-page nav for site links.
  html = html
    .replace(/<button class="saved-button"[\s\S]*?<\/button>/, `<a class="saved-button" href="${pathFor(OUT_DIR)}">All guides <span>${articles.length}</span></a>`)
    .replace(/<nav aria-label="Main navigation">[\s\S]*?<\/nav>/, `<nav aria-label="Main navigation"><a href="/#calculator">Calculators</a><a class="active" href="${pathFor(OUT_DIR)}">Guides</a><a href="/#how">Our philosophy</a></nav>`);
  // Project-path deployments (https://owner.github.io/repo/) prefix root-relative anchors,
  // exactly like scripts/generate-seo.mjs does for the other routes. Asset URLs (style.css,
  // bundled JS) stay unprefixed so Vite can rewrite them with the deployment base.
  if (linkBase) html = html.replace(/(<a\b[^>]*\bhref=")\/(?!\/)/g, (_, attr) => attr + linkBase + '/');
  return html;
}

function breadcrumbHtml(origin, trail) {
  const items = [{ name: 'Home', url: origin ? origin + '/' : '' }, ...trail];
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${items.map((item, i) => {
    const last = i === items.length - 1;
    return (last || !item.url)
      ? `<span>${escapeHtml(item.name)}</span>`
      : `<a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a><span>/</span>`;
  }).join('')}</nav>`;
}

function schemaFor({ origin, route, type, name, description, trail, published, updated, image }) {
  const url = origin + '/' + (route ? route + '/' : '');
  const graph = [
    { '@type': 'WebSite', name: SITE_NAME, ...(origin ? { url: origin + '/' } : {}) },
    {
      '@type': type,
      name,
      description,
      ...(type === 'Article'
        ? {
            headline: name,
            inLanguage: 'en',
            isAccessibleForFree: true,
            ...(published ? { datePublished: published } : {}),
            ...(updated ? { dateModified: updated } : {}),
            ...(image ? { image: [image] } : {}),
            author: { '@type': 'Organization', name: SITE_NAME, ...(origin ? { url: origin + '/' } : {}) },
            publisher: { '@type': 'Organization', name: SITE_NAME, ...(origin ? { url: origin + '/' } : {}) },
          }
        : {}),
      ...(origin ? { url } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', ...(origin ? { item: origin + '/' } : {}) },
        ...trail.map((t, i) => ({ '@type': 'ListItem', position: i + 2, name: t.name, ...(origin && t.url ? { item: t.url } : {}) }))],
    },
  ];
  return { '@context': 'https://schema.org', '@graph': graph };
}

const cardGrid = (links) => `<div class="hub-grid">${links}</div>`;

const linkCard = (href, kicker, title, meta) => `<a class="hub-card" href="${escapeHtml(href)}"><span class="hub-kicker">${escapeHtml(kicker)}</span><h3>${escapeHtml(title)}</h3>${meta ? `<p>${escapeHtml(meta)}</p>` : ''}<span class="hub-more">Read <span>→</span></span></a>`;

const rowList = (items) => `<div class="article-list">${items.map((item, i) => `<a href="${escapeHtml(item.href)}"><span>${String(i + 1).padStart(2, '0')}</span><div><small>${escapeHtml(item.kicker)}</small><h3>${escapeHtml(item.title)}</h3></div><b>↗</b></a>`).join('')}</div>`;

function tocFor(bodyHtml) {
  const headings = [...bodyHtml.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map((m) => ({ id: m[1], text: m[2].replace(/<[^>]+>/g, '') }));
  if (headings.length < 3) return '';
  return `<nav class="toc" aria-label="On this page"><div class="section-label">ON THIS PAGE</div><ol>${headings.map((h) => `<li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('')}</ol></nav>`;
}

function relatedFor(article) {
  const siblings = byCluster(article.cluster).filter((a) => a.slug !== article.slug);
  const start = Math.max(0, siblings.findIndex((a) => a.slug === article.slug));
  const picked = [siblings[(start) % siblings.length], siblings[(start + 1) % siblings.length], siblings[(start + 2) % siblings.length]]
    .filter((a, i, arr) => a && arr.findIndex((b) => b.slug === a.slug) === i);
  const cross = articles.find((a) => a.cluster !== article.cluster && a.calc === article.calc);
  return [...picked, cross].filter(Boolean).slice(0, 4);
}


/*
 * Which calculator an article actually points at.
 *
 * Every one of the 40 articles used to send its single call to action to the
 * cost-of-time calculator, so the whole article collection handed its internal
 * links to one page and the other 52 tools received nothing from it. The
 * mapping below is per slug where the subject is specific and per cluster
 * otherwise, so a subscriptions article leads to a subscription calculator
 * rather than to a general one.
 */
const ARTICLE_CALC = {
  'coffee-cost-per-year-calculator': 'calculators/latte-factor',
  'how-many-hours-of-work-does-a-car-payment-cost': 'calculators/car-loan-calculator-2026',
  'how-many-hours-of-work-goes-to-rent': 'calculators/rent-affordability-calculator',
  'how-many-hours-of-work-is-1000-dollars': 'calculators/time-to-save',
  'how-much-is-a-new-phone-in-work-hours': 'calculators/cost-of-time',
  'price-to-hours-formula': 'calculators/cost-of-time',
  'vacation-cost-in-work-hours': 'calculators/cost-of-time',
  'what-is-an-hour-of-your-time-worth': 'calculators/cost-of-time',
  'annual-vs-monthly-subscription-plan': 'calculators/annual-vs-monthly-subscription',
  'average-monthly-subscription-spend': 'calculators/subscription-cost',
  'family-and-shared-plans-when-splitting-saves': 'calculators/subscription-audit',
  'free-trials-that-turn-into-subscriptions': 'calculators/subscription-audit',
  'how-to-audit-your-subscriptions': 'calculators/subscription-audit',
  'how-to-cancel-a-subscription-and-get-a-refund': 'calculators/subscription-cost',
  'streaming-service-price-comparison': 'calculators/streaming-cost',
  'subscription-price-increase-what-to-do': 'calculators/subscription-audit',
  '52-week-savings-challenge': 'calculators/daily-savings',
  'do-round-up-savings-apps-work': 'calculators/daily-savings',
  'five-dollars-a-day-savings-challenge': 'calculators/daily-savings',
  'how-big-should-my-emergency-fund-be': 'calculators/emergency-fund-calculator',
  'how-much-should-i-save-each-month': 'calculators/savings-goal-calculator-2026',
  'how-to-save-1000-dollars-fast': 'calculators/time-to-save',
  'no-spend-challenge-rules': 'calculators/daily-savings',
  'sinking-funds-explained': 'calculators/savings-goal-calculator-2026',
  '20-dollars-an-hour-is-how-much-a-year': 'calculators/salary-to-hourly',
  '60000-a-year-is-how-much-an-hour': 'calculators/hourly-to-salary',
  'budgeting-on-a-biweekly-paycheck': 'calculators/paycheck-calculator-2026',
  'gross-pay-vs-take-home-pay': 'calculators/after-tax-income',
  'how-many-working-hours-in-a-year': 'calculators/salary-to-hourly',
  'how-overtime-pay-is-calculated': 'calculators/overtime-pay',
  'how-to-set-a-freelance-day-rate': 'calculators/freelance-rate',
  'your-real-hourly-wage': 'calculators/salary-to-hourly',
  'buy-it-nice-or-buy-it-twice': 'calculators/unit-price-calculator',
  'cost-per-use-how-to-compare-purchases': 'calculators/cost-per-use',
  'lifestyle-creep-after-a-raise': 'calculators/wage-growth-calculator-2026',
  'seven-questions-before-a-big-purchase': 'calculators/cost-of-time',
  'should-you-rent-or-buy': 'calculators/rent-vs-buy-calculator-2026',
  'the-latte-factor-what-it-gets-right': 'calculators/latte-factor',
  'true-cost-of-car-ownership': 'calculators/car-ownership-cost',
  'why-you-impulse-spend-and-how-to-stop': 'calculators/cost-of-time',
};

const CLUSTER_CALCS = {
  'work-hours': ['calculators/cost-of-time', 'calculators/time-to-save', 'calculators/hourly-to-salary', 'calculators/latte-factor'],
  subscriptions: ['calculators/subscription-cost', 'calculators/subscription-audit', 'calculators/streaming-cost', 'calculators/annual-vs-monthly-subscription'],
  'saving-habits': ['calculators/daily-savings', 'calculators/emergency-fund-calculator', 'calculators/savings-goal-calculator-2026', 'calculators/compound-interest-calculator'],
  'pay-and-rates': ['calculators/salary-to-hourly', 'calculators/after-tax-income', 'calculators/overtime-pay', 'calculators/freelance-rate'],
  'spending-decisions': ['calculators/cost-per-use', 'calculators/unit-price-calculator', 'calculators/cost-per-wear', 'calculators/tip-calculator'],
};

const calcRouteFor = (article) => ARTICLE_CALC[article.slug] || (CLUSTER_CALCS[article.cluster] || ['calculators/cost-of-time'])[0];

/** The name a calculator page already prints as its heading, or a readable fallback. */
const calcLabel = (route) => {
  try {
    const html = fs.readFileSync(path.join(route, 'index.html'), 'utf8');
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1]?.replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
    if (h1) return h1;
  } catch { /* the page has not been written yet — fall back to the slug */ }
  return route.split('/').pop().replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
};

function relatedCalcsFor(article) {
  const primary = calcRouteFor(article);
  const seen = new Set([primary]);
  const list = (CLUSTER_CALCS[article.cluster] || []).filter((r) => !seen.has(r) && seen.add(r)).slice(0, 3);
  if (!list.length) return '';
  return `<section class="seo-related"><div class="section-label">RUN THE NUMBERS</div><h2>Calculators that go with this guide</h2><div>${list.map((r) => `<a href="${pathFor(r)}">${escapeHtml(calcLabel(r))} <span>↗</span></a>`).join('')}</div></section>`;
}

function ctaFor(article) {
  const route = calcRouteFor(article);
  const known = Object.values(CALCULATORS).find((c) => c.route === route);
  const name = known ? known.name : calcLabel(route);
  const cta = known ? known.cta : 'Try it with your own numbers';
  return `<aside class="cta-box"><div><div class="section-label">TRY IT WITH YOUR NUMBERS</div><h2>${escapeHtml(name)}</h2><p>${escapeHtml(cta)} — free, and your figures stay in your browser.</p></div><a class="cta-button" href="${pathFor(route)}">Open the calculator <span>↗</span></a></aside>`;
}

const METHODOLOGY = `<section class="methodology"><div class="section-label">HOW THESE NUMBERS ARE CALCULATED</div><p>Every figure on this page is arithmetic from stated assumptions: take-home pay, an 8-hour working day and 2,080 working hours a year (40 hours × 52 weeks), unless stated otherwise. Rates, taxes, fees and prices change, so treat the tables as a way to see the shape of a decision rather than a quote. Worth is a perspective tool, not financial advice.</p></section>`;

export function generateArticles({ template, origin, basePath = '' }) {
  linkBase = basePath === '/' ? '' : basePath;
  // Remove only the pages this pipeline owns; articles/*.md mirrors stay in place.
  // maxRetries covers the case where another generator run is writing at the same time.
  const rm = { recursive: true, force: true, maxRetries: 5, retryDelay: 50 };
  fs.rmSync(path.join(OUT_DIR, 'index.html'), { force: true, maxRetries: 5, retryDelay: 50 });
  for (const cluster of clusters) fs.rmSync(path.join(OUT_DIR, cluster.slug), rm);

  // ---- Article pages -------------------------------------------------------
  for (const article of articles) {
    const cluster = clusters.find((c) => c.slug === article.cluster);
    const route = `${OUT_DIR}/${article.cluster}/${article.slug}`;
    const trail = [
      { name: 'Guides', url: origin ? urlFor(origin, OUT_DIR) : '' },
      { name: cluster.name, url: origin ? urlFor(origin, `${OUT_DIR}/${cluster.slug}`) : '' },
      { name: article.title, url: origin ? urlFor(origin, route) : '' },
    ];
    const bodyHtml = renderMarkdown(article.body);
    const related = relatedFor(article);

    const main = [
      breadcrumbHtml(origin, trail),
      `<section class="seo-hero"><div class="eyebrow"><span></span> ${escapeHtml(cluster.label)}</div><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.description)}</p><div class="article-meta"><span>${escapeHtml(article.reading.replace(/ min read/, ' min read'))}</span><span>Updated <time datetime="${escapeHtml(article.updated)}">${escapeHtml(article.updated)}</time></span><span>By ${escapeHtml(SITE_NAME)}</span></div></section>`,
      `<article class="seo-article">${tocFor(bodyHtml)}${bodyHtml}${ctaFor(article)}${relatedCalcsFor(article)}${METHODOLOGY}</article>`,
      `<section class="seo-related"><div class="section-label">KEEP READING</div><h2>Related guides</h2>${cardGrid(related.map((r) => linkCard(pathFor(`${OUT_DIR}/${r.cluster}/${r.slug}`), clusters.find((c) => c.slug === r.cluster).name, r.title, r.description)).join(''))}</section>`,
      `<section class="seo-related cluster-link"><h2>More in ${escapeHtml(cluster.name)}</h2>${rowList(byCluster(cluster.slug).filter((a) => a.slug !== article.slug).map((a) => ({ href: pathFor(`${OUT_DIR}/${a.cluster}/${a.slug}`), kicker: a.reading.toUpperCase(), title: a.title })))}</section>`,
    ].join('\n');

    const html = pageShell({
      template,
      origin,
      route,
      title: withBrand(article.title, SITE_NAME),
      description: article.description,
      main,
      schema: schemaFor({
        origin, route, type: 'Article', name: article.title, description: article.description, trail,
        published: article.published, updated: article.updated,
        image: origin ? origin + (linkBase || '') + '/og-image.png' : '',
      }),
    });
    fs.mkdirSync(route, { recursive: true });
    fs.writeFileSync(path.join(route, 'index.html'), html);
  }

  // ---- Cluster hubs --------------------------------------------------------
  for (const cluster of clusters) {
    const route = `${OUT_DIR}/${cluster.slug}`;
    const list = byCluster(cluster.slug);
    const trail = [{ name: 'Guides', url: origin ? urlFor(origin, OUT_DIR) : '' }, { name: cluster.name, url: origin ? urlFor(origin, route) : '' }];
    const main = [
      breadcrumbHtml(origin, trail),
      `<section class="seo-hero"><div class="eyebrow"><span></span> ${escapeHtml(cluster.label)}</div><h1>${escapeHtml(cluster.name)}</h1><p>${escapeHtml(cluster.blurb)}</p><div class="article-meta"><span>${list.length} guides</span><span>Updated ${escapeHtml(list[0].updated)}</span></div></section>`,
      `<section class="seo-related cluster-link"><h2>Everything in ${escapeHtml(cluster.name)}</h2>${rowList(list.map((a) => ({ href: pathFor(`${OUT_DIR}/${a.cluster}/${a.slug}`), kicker: a.reading.toUpperCase(), title: a.title })))}</section>`,
      `<section class="seo-related"><div class="section-label">ELSEWHERE ON WORTH</div><h2>Other collections</h2>${cardGrid(clusters.filter((c) => c.slug !== cluster.slug).map((c) => linkCard(pathFor(`${OUT_DIR}/${c.slug}`), `${byCluster(c.slug).length} GUIDES`, c.name, c.blurb)).join(''))}</section>`,
    ].join('\n');
    const html = pageShell({
      template,
      origin,
      route,
      title: `${cluster.name}: ${list.length} Free Guides | ${SITE_NAME}`,
      description: cluster.blurb.slice(0, 158),
      main,
      schema: schemaFor({ origin, route, type: 'CollectionPage', name: cluster.name, description: cluster.blurb, trail }),
    });
    fs.mkdirSync(route, { recursive: true });
    fs.writeFileSync(path.join(route, 'index.html'), html);
  }

  // ---- Guides index --------------------------------------------------------
  const indexPath = OUT_DIR;
  const indexMain = [
    breadcrumbHtml(origin, [{ name: 'Guides', url: origin ? urlFor(origin, OUT_DIR) : '' }]),
    `<section class="seo-hero"><div class="eyebrow"><span></span> THE MONEY EDIT</div><h1>${articles.length} free guides to what things really cost</h1><p>Short, practical guides built around one question: what does this cost me in hours of work? Every guide includes the formula, worked tables and the assumptions behind the numbers.</p><div class="article-meta"><span>${articles.length} guides</span><span>${clusters.length} collections</span><span>No sign-up</span></div></section>`,
    ...clusters.map((c) => `<section class="seo-related cluster-link"><div class="section-label">${escapeHtml(c.label)}</div><h2>${escapeHtml(c.name)}</h2><p class="cluster-blurb">${escapeHtml(c.blurb)}</p>${rowList(byCluster(c.slug).map((a) => ({ href: pathFor(`${OUT_DIR}/${a.cluster}/${a.slug}`), kicker: a.reading.toUpperCase(), title: a.title })))}</section>`),
  ].join('\n');
  fs.mkdirSync(indexPath, { recursive: true });
  fs.writeFileSync(path.join(indexPath, 'index.html'), pageShell({
    template,
    origin,
    route: indexPath,
    title: `Money Guides: ${articles.length} Free Articles on Cost, Pay and Saving | ${SITE_NAME}`,
    description: `${articles.length} short guides that turn prices into hours of work: subscription costs, pay conversions, saving challenges and how to compare big purchases.`,
    main: indexMain,
    schema: schemaFor({ origin, route: indexPath, type: 'CollectionPage', name: 'Worth money guides', description: 'Free guides on the cost of things in hours of work, subscription spending, pay conversion and saving habits.', trail: [{ name: 'Guides', url: origin ? urlFor(origin, OUT_DIR) : '' }] }),
  }));

  return allRoutes;
}

if (process.argv[1]?.endsWith('articles.mjs')) {
  const raw = process.env.SITE_URL || '';
  const site = raw ? new URL(raw) : null;
  generateArticles({
    template: fs.readFileSync('index.html', 'utf8'),
    origin: site ? site.origin : '',
    basePath: site ? site.pathname.replace(/\/$/, '') : '',
  });
  console.log(`Generated ${allRoutes.length} article routes from ${articles.length} Markdown files.`);
}

/** RSS items for the guides — written to public/feed.xml by scripts/generate-seo.mjs. */
export function articleFeedItems(origin, basePath = '') {
  const abs = (route) => `${origin}${basePath === '/' ? '' : basePath}/${route}/`;
  return articles.map((a) => ({
    title: a.title,
    link: abs(`${OUT_DIR}/${a.cluster}/${a.slug}`),
    description: a.description,
    date: a.updated,
  }));
}

/** Markdown lines for the guide section of llms.txt, written by scripts/generate-seo.mjs. */
export function articleLlmsLines(origin, basePath = '') {
  const abs = (route) => `${origin}${basePath === '/' ? '' : basePath}/${route}/`;
  return [
    '## Guides by collection', '',
    ...clusters.map((c) => `- [${c.name}](${abs(`${OUT_DIR}/${c.slug}`)}): ${c.blurb}`),
    '', `## Money guides (${articles.length})`, '',
    ...articles.map((a) => `- [${a.title}](${abs(`${OUT_DIR}/${a.cluster}/${a.slug}`)}): ${a.description}`),
    '',
  ];
}
