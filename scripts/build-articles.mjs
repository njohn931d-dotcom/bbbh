#!/usr/bin/env node
/**
 * Worth SEO article hub builder — zero dependencies.
 *
 * Reads content/articles/*.md (front matter + markdown) and emits a fully
 * static, indexable site in docs/:
 *
 *   docs/index.html                 — hub, links every article + cluster
 *   docs/<slug>/index.html          — 40 article pages (directory URLs)
 *   docs/topic/<cluster>/index.html — 6 cluster (silo) pages
 *   docs/sitemap.xml                — absolute URLs, lastmod
 *   docs/robots.txt                 — allow all + sitemap pointer
 *   docs/feed.xml                   — RSS 2.0
 *   docs/llms.txt                   — GEO/AEO summary for AI crawlers
 *   docs/404.html                   — GitHub Pages 404
 *   docs/.nojekyll                  — bypass Jekyll
 *   docs/<32-hex>.txt               — IndexNow key file
 *   docs/assets/*                   — copied from site-assets/
 *
 * All in-site navigation is emitted with build-time relative paths, so the
 * output works unchanged on a project page (/repo/), a user page (/) or a
 * custom domain. Absolute URLs (canonical, OG, sitemap, feed) come from
 * SITE_URL, which you must set for production:
 *
 *   SITE_URL=https://njohn931d-dotcom.github.io/bbbh node scripts/build-articles.mjs
 *
 * Optional: MONEY_SITE_URL=... adds outbound links to the production
 * Worth calculator site once it exists.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'docs');
const SRC = join(ROOT, 'content', 'articles');
const ASSETS = join(ROOT, 'site-assets');

const SITE_URL = (process.env.SITE_URL || 'https://njohn931d-dotcom.github.io/bbbh').replace(/\/+$/, '');
const MONEY_SITE_URL = (process.env.MONEY_SITE_URL || '').replace(/\/+$/, '');
const SITE_NAME = 'Worth Guides';
const PUBLISHER = 'Worth';
const ORG = 'Worth Editorial';
const INDEXNOW_KEY = 'b7f3c2a91e4d48f0a6c5e8d1f9b2a743';

/** Cluster (silo) definitions — order matters for hub rendering. */
const CLUSTERS = {
  budgeting: {
    title: 'Budgeting',
    blurb: 'Simple frameworks that tell every dollar where to go — without spreadsheets taking over your life.',
  },
  psychology: {
    title: 'Spending Psychology',
    blurb: 'Why smart people overspend, and the mental models that quietly put you back in control.',
  },
  frugality: {
    title: 'Frugality & Challenges',
    blurb: 'Time-boxed challenges and lightweight habits that cut spending without feeling like punishment.',
  },
  truecost: {
    title: 'The True Cost of Everyday Life',
    blurb: 'Turn price tags into real numbers — hours worked, annual totals, and the math most people skip.',
  },
  systems: {
    title: 'Money Systems & Automation',
    blurb: 'Set-and-forget structures so good decisions happen whether you feel motivated or not.',
  },
  bills: {
    title: 'Bills & Everyday Savings',
    blurb: 'Practical cuts to the recurring charges and household costs that quietly drain your budget.',
  },
};

/* ------------------------------------------------------------------ */
/* Front matter                                                        */
/* ------------------------------------------------------------------ */

function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('missing front matter block');
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"') && v.length > 1) ||
        (v.startsWith("'") && v.endsWith("'") && v.length > 1)) v = v.slice(1, -1);
    meta[k] = v;
  }
  return { meta, body: m[2].replace(/^\r?\n/, '') };
}

/* ------------------------------------------------------------------ */
/* Minimal markdown -> HTML (headings, lists, tables, quotes, links)   */
/* ------------------------------------------------------------------ */

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?=[^*\w]|$)/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  const startsList = (l) => /^[-*] /.test(l) || /^\d+\. /.test(l);
  const isTableRow = (l) => l.trim().length > 2 && l.trim().startsWith('|');

  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();

    if (!t) { i++; continue; }

    if (t.startsWith('### ')) { out.push(`<h3>${inline(t.slice(4))}</h3>`); i++; continue; }
    if (t.startsWith('## ')) { const txt = t.slice(3); out.push(`<h2 id="${slugify(txt)}">${inline(txt)}</h2>`); i++; continue; }
    if (t.startsWith('# ')) { const txt = t.slice(2); out.push(`<h2 id="${slugify(txt)}">${inline(txt)}</h2>`); i++; continue; }

    if (/^[-*] /.test(t)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*] /, ''));
        i++;
      }
      out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+\. /.test(t)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\. /, ''));
        i++;
      }
      out.push(`<ol>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`);
      continue;
    }

    if (t.startsWith('> ')) {
      const parts = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        parts.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(`<blockquote><p>${inline(parts.join(' '))}</p></blockquote>`);
      continue;
    }

    if (isTableRow(raw) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const parseRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const header = parseRow(lines[i]);
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) { rows.push(parseRow(lines[i])); i++; }
      const thead = header.map((h) => `<th scope="col">${inline(h)}</th>`).join('');
      const tbody = rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
      out.push(`<div class="table-wrap"><table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`);
      continue;
    }

    if (t === '---' || t === '***') { out.push('<hr>'); i++; continue; }

    // paragraph: swallow consecutive non-blank, non-block lines
    const para = [t];
    i++;
    while (i < lines.length) {
      const nt = lines[i].trim();
      if (!nt || nt.startsWith('#') || startsList(nt) || nt.startsWith('> ') || isTableRow(lines[i])) break;
      para.push(nt);
      i++;
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

/** Split "## FAQ" section out so it can be rendered + schema-marked up. */
function extractFaq(body) {
  const m = body.match(/(?:^|\n)##\s+FAQ\s*\n([\s\S]*)$/);
  if (!m) return { body, faq: [] };
  const faq = [];
  const chunk = m[1];
  const parts = chunk.split(/\n(?=### )/).map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const qm = p.match(/^###\s+(.+?)\s*\n+([\s\S]+)$/);
    if (!qm) continue;
    const q = qm[1].replace(/\?*$/, '?');
    const a = qm[2].trim().replace(/\n+/g, ' ');
    if (q && a) faq.push({ q, a });
  }
  return { body: body.slice(0, m.index), faq };
}

/* ------------------------------------------------------------------ */
/* Page template                                                       */
/* ------------------------------------------------------------------ */

function jsonLd(obj) {
  return JSON.stringify(obj, null, 0).replace(/</g, '\\u003c');
}

function page({ title, desc, path, depth, body, ld = [], crumbs = '', extraHead = '' }) {
  const pre = depth === 0 ? '' : '../'.repeat(depth);
  const url = path === '' ? `${SITE_URL}/` : `${SITE_URL}/${path}`;
  const css = `${pre}assets/style.css`;
  const favicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23204f3c'/%3E%3Ctext x='13' y='46' font-size='44' fill='%23d9edb2' font-family='serif'%3Ew%3C/text%3E%3C/svg%3E";
  const ogImage = `${SITE_URL}/assets/og.png`;
  const ldTags = ld.map((o) => `<script type="application/ld+json">${jsonLd(o)}</script>`).join('');

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="${PUBLISHER}">
<meta name="robots" content="${path === '404.html' ? 'noindex,follow' : 'index,follow,max-image-preview:large'}">
<link rel="canonical" href="${url}">
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME}" href="${pre}feed.xml">
<link rel="icon" href="${favicon}">
<meta property="og:type" content="${path === '' ? 'website' : 'article'}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="stylesheet" href="${css}">
${extraHead}${ldTags}</head>
<body>
<header class="site-header">
  <a class="logo" href="${pre || './'}" aria-label="${SITE_NAME} home">worth<span class="dot">.</span> <span class="logo-sub">guides</span></a>
  <nav aria-label="Main navigation">
    <a href="${pre || './'}">All guides</a>
    ${MONEY_SITE_URL ? `<a href="${MONEY_SITE_URL}/">Calculators</a>` : ''}
  </nav>
</header>
<main>
${crumbs}
${body}
</main>
<footer class="site-footer">
  <p><a href="${pre || './'}">${SITE_NAME}</a> — practical money perspective from ${PUBLISHER}.</p>
  <p class="fine">For perspective, not financial advice. &copy; 2026 ${PUBLISHER}.</p>
</footer>
</body></html>`;
}

function crumbsHtml(items, depth) {
  const pre = depth === 0 ? '' : '../'.repeat(depth);
  const parts = items.map((it, idx) => {
    const last = idx === items.length - 1;
    if (last) return `<span aria-current="page">${esc(it.label)}</span>`;
    return `<a href="${pre}${it.href || ''}">${esc(it.label)}</a>`;
  }).join('<span class="sep" aria-hidden="true">›</span>');
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.label,
      ...(idx === items.length - 1 ? {} : { item: (it.href === '' ? `${SITE_URL}/` : `${SITE_URL}/${it.href}`) }),
    })),
  };
  return `<nav class="crumbs" aria-label="Breadcrumb">${parts}</nav><script type="application/ld+json">${jsonLd(ld)}</script>`;
}

/* ------------------------------------------------------------------ */
/* Load articles                                                       */
/* ------------------------------------------------------------------ */

function loadArticles() {
  if (!existsSync(SRC)) throw new Error(`missing ${SRC}`);
  const files = readdirSync(SRC).filter((f) => f.endsWith('.md')).sort();
  const articles = files.map((f) => {
    const slug = basename(f, '.md');
    const { meta, body } = parseFrontMatter(readFileSync(join(SRC, f), 'utf8'));
    if (!meta.title || !meta.description || !meta.cluster) {
      throw new Error(`${f}: title, description and cluster are required`);
    }
    if (!CLUSTERS[meta.cluster]) throw new Error(`${f}: unknown cluster "${meta.cluster}"`);
    const date = meta.date || '2026-09-27';
    const { body: bodyNoFaq, faq } = extractFaq(body);
    const words = bodyNoFaq.replace(/[#*|>`\-[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
    const faqWords = faq.reduce((n, x) => n + x.a.split(/\s+/).length, 0);
    return {
      slug,
      path: `${slug}/`,
      depth: 1,
      title: meta.title,
      desc: meta.description,
      keyword: meta.keyword || meta.title,
      cluster: meta.cluster,
      date,
      bodyMd: bodyNoFaq.trim(),
      faq,
      words: words + faqWords,
      readingMinutes: Math.max(2, Math.round((words + faqWords) / 220)),
    };
  });
  const seen = new Set();
  for (const a of articles) {
    if (seen.has(a.slug)) throw new Error(`duplicate slug ${a.slug}`);
    seen.add(a.slug);
    if (a.title.length > 70) console.warn(`WARN ${a.slug}: title ${a.title.length} chars (>70)`);
    if (a.desc.length > 165) console.warn(`WARN ${a.slug}: description ${a.desc.length} chars (>165)`);
    if (a.words < 400) console.warn(`WARN ${a.slug}: only ~${a.words} words`);
  }
  return articles;
}

/** Deterministic related links: 3 same-cluster siblings, rotating by index. */
function withRelated(articles) {
  const byCluster = {};
  for (const a of articles) (byCluster[a.cluster] ||= []).push(a);
  for (const list of Object.values(byCluster)) list.sort((x, y) => x.slug.localeCompare(y.slug));
  for (const a of articles) {
    const mates = byCluster[a.cluster].filter((x) => x.slug !== a.slug);
    const idx = byCluster[a.cluster].findIndex((x) => x.slug === a.slug);
    a.related = [];
    for (let k = 1; a.related.length < 3 && k <= mates.length; k++) {
      a.related.push(mates[(idx + k) % mates.length]);
    }
    a.clusterMates = byCluster[a.cluster];
  }
  return { articles, byCluster };
}

/* ------------------------------------------------------------------ */
/* Page builders                                                       */
/* ------------------------------------------------------------------ */

function articlePage(a) {
  const bodyMd = a.bodyMd + (a.related.length ? `\n\n## Keep reading\n\n${a.related.map((r) => `- [${r.title}](${r.slug}/)`).join('\n')}` : '');
  // Related links above are same-depth siblings → make them relative to depth 1
  const htmlBody = mdToHtml(bodyMd).replace(/href="([^"]+\/)"/g, (m, href) =>
    /^(https?:|mailto:|#|\.\.)/.test(href) ? m : `href="../${href}"`);

  const faqHtml = a.faq.length
    ? `<section class="faq" id="faq"><h2 id="frequently-asked-questions">Frequently asked questions</h2>` +
      a.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${inline(f.a)}</p>`).join('\n') +
      `</section>`
    : '';

  const body = `<article class="post">
<header class="post-head">
<p class="eyebrow"><a href="../topic/${a.cluster}/">${CLUSTERS[a.cluster].title}</a> · ${a.readingMinutes} min read</p>
<h1>${esc(a.title)}</h1>
<p class="lede">${esc(a.desc)}</p>
<time datetime="${a.date}">${new Date(`${a.date}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</time>
</header>
<div class="post-body">
${htmlBody}
${faqHtml}
</div>
</article>`;

  const ld = [{
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/${a.slug}/` },
    headline: a.title,
    description: a.desc,
    datePublished: a.date,
    dateModified: a.date,
    inLanguage: 'en',
    wordCount: a.words,
    keywords: a.keyword,
    author: { '@type': 'Organization', name: ORG, url: SITE_URL },
    publisher: { '@type': 'Organization', name: PUBLISHER },
    image: `${SITE_URL}/assets/og.png`,
  }];
  if (a.faq.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: a.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return page({
    title: `${a.title} | ${SITE_NAME}`,
    desc: a.desc,
    path: a.path,
    depth: 1,
    body,
    crumbs: crumbsHtml([
      { label: 'Home', href: '' },
      { label: CLUSTERS[a.cluster].title, href: `topic/${a.cluster}/` },
      { label: a.title },
    ], 1),
    ld,
  });
}

function clusterPage(key, members) {
  const c = CLUSTERS[key];
  const list = members.map((a) => `<li><a href="../../${a.slug}/"><strong>${esc(a.title)}</strong><span>${esc(a.desc)}</span></a></li>`).join('\n');
  const others = Object.keys(CLUSTERS).filter((k) => k !== key)
    .map((k) => `<a href="../${k}/">${CLUSTERS[k].title}</a>`).join('');

  const body = `<section class="cluster">
<p class="eyebrow">Topic cluster</p>
<h1>${esc(c.title)}</h1>
<p class="lede">${esc(c.blurb)}</p>
<ul class="article-list">${list}</ul>
<div class="cluster-links"><p>Explore other topics:</p><p class="chips">${others}</p></div>
</section>`;

  const ld = [{
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${c.title} — ${SITE_NAME}`,
    description: c.blurb,
    url: `${SITE_URL}/topic/${key}/`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: members.length,
      itemListElement: members.map((a, i) => ({
        '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/${a.slug}/`, name: a.title,
      })),
    },
  }];

  return page({
    title: `${c.title} Guides | ${SITE_NAME}`,
    desc: `${c.blurb}`.slice(0, 160),
    path: `topic/${key}/`,
    depth: 2,
    body,
    crumbs: crumbsHtml([
      { label: 'Home', href: '' },
      { label: c.title },
    ], 2),
    ld,
  });
}

function hubPage(articles, byCluster) {
  const sections = Object.entries(CLUSTERS).map(([key, c]) => {
    const items = byCluster[key].map((a) =>
      `<li><a href="${a.slug}/"><strong>${esc(a.title)}</strong><span>${esc(a.desc)}</span></a></li>`).join('\n');
    return `<section class="hub-cluster" id="${key}">
<h2><a href="topic/${key}/">${esc(c.title)}</a></h2>
<p>${esc(c.blurb)}</p>
<ul class="article-list">${items}</ul>
</section>`;
  }).join('\n');

  const moneyCta = MONEY_SITE_URL
    ? `<p class="cta">Prefer math to reading? Try the <a href="${MONEY_SITE_URL}/">Worth calculators</a> — turn any price into hours of your life.</p>`
    : '';

  const body = `<section class="hub-hero">
<p class="eyebrow">${articles.length} free guides · updated 2026</p>
<h1>Money guides, minus the jargon</h1>
<p class="lede">Evidence-based, no-fluff guides on budgeting, spending psychology, frugality and the true cost of everyday life — published freely by Worth, the perspective calculator.</p>
${moneyCta}
<nav class="topic-nav" aria-label="Topics">
${Object.entries(CLUSTERS).map(([k, c]) => `<a href="topic/${k}/">${esc(c.title)}</a>`).join('')}
</nav>
</section>
${sections}`;

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      inLanguage: 'en',
      description: 'Practical personal finance guides from Worth: budgeting, spending psychology, frugality and everyday savings.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${SITE_NAME} — all guides`,
      numberOfItems: articles.length,
      itemListElement: articles.map((a, i) => ({
        '@type': 'ListItem', position: i + 1, name: a.title, url: `${SITE_URL}/${a.slug}/`,
      })),
    },
  ];

  return page({
    title: `${SITE_NAME} — 40 Practical Guides to Budgeting, Saving & Spending Well`,
    desc: 'Free, no-fluff personal finance guides: budgeting methods, spending psychology, frugality challenges, true-cost math and everyday savings. 40 articles by Worth.',
    path: '',
    depth: 0,
    body,
    ld,
  });
}

function notFoundPage() {
  const body = `<section class="hub-hero">
<p class="eyebrow">404</p>
<h1>That page moved, vanished, or never existed</h1>
<p class="lede">Even good money habits get lost sometimes. Head back to the full list of guides.</p>
<p><a class="button" href="./">Browse all 40 guides</a></p>
</section>`;
  return page({ title: `Page not found | ${SITE_NAME}`, desc: 'Page not found.', path: '404.html', depth: 0, body, ld: [] });
}

/* ------------------------------------------------------------------ */
/* Feeds, sitemap, misc                                                */
/* ------------------------------------------------------------------ */

function buildSitemap(articles) {
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: articles[0].date },
    ...Object.keys(CLUSTERS).map((k) => ({
      loc: `${SITE_URL}/topic/${k}/`,
      lastmod: articles.filter((a) => a.cluster === k).map((a) => a.date).sort().at(-1),
    })),
    ...articles.map((a) => ({ loc: `${SITE_URL}/${a.slug}/`, lastmod: a.date })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>\n`;
}

function buildFeed(articles) {
  const items = [...articles].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map((a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${SITE_URL}/${a.slug}/</link>
      <guid isPermaLink="true">${SITE_URL}/${a.slug}/</guid>
      <pubDate>${new Date(`${a.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(a.desc)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}/</link>
    <description>Practical personal finance guides from Worth.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>\n`;
}

function buildLlms(articles, byCluster) {
  const lines = [
    `# ${SITE_NAME}`,
    ``,
    `> Practical, no-fluff personal finance guides from Worth: budgeting methods, spending psychology, frugality challenges, true-cost math, money systems and everyday savings. Each guide answers a specific question with concrete numbers and examples. Publisher of the Worth cost-of-time calculator.`,
    ``,
    `All guides: ${SITE_URL}/`,
    ``,
  ];
  for (const [key, c] of Object.entries(CLUSTERS)) {
    lines.push(`## ${c.title}`, ``);
    for (const a of byCluster[key]) lines.push(`- [${a.title}](${SITE_URL}/${a.slug}/): ${a.desc}`);
    lines.push(``);
  }
  if (MONEY_SITE_URL) lines.push(`## Calculators`, ``, `- [Worth calculators](${MONEY_SITE_URL}/): turn any price into hours of your life`, ``);
  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

function main() {
  const { articles, byCluster } = withRelated(loadArticles());
  if (articles.length !== 40) console.warn(`NOTE: ${articles.length} articles found (expected 40)`);

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const w = (rel, content) => {
    const p = join(OUT, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  };

  w('index.html', hubPage(articles, byCluster));
  for (const a of articles) w(`${a.slug}/index.html`, articlePage(a));
  for (const key of Object.keys(CLUSTERS)) w(`topic/${key}/index.html`, clusterPage(key, byCluster[key]));
  w('404.html', notFoundPage());
  w('sitemap.xml', buildSitemap(articles));
  w('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  w('feed.xml', buildFeed(articles));
  w('llms.txt', buildLlms(articles, byCluster));
  w('.nojekyll', '');
  w(`${INDEXNOW_KEY}.txt`, INDEXNOW_KEY);

  if (existsSync(ASSETS)) cpSync(ASSETS, join(OUT, 'assets'), { recursive: true });

  console.log(`Built ${articles.length} articles + ${Object.keys(CLUSTERS).length} clusters + hub → ${OUT}`);
  console.log(`SITE_URL = ${SITE_URL}`);
}

main();
