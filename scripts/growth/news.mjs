/**
 * News explainers: short, dated, sourced pieces on new prices and events,
 * each answering the question this site exists for: what does it cost in hours
 * of work? Source of truth: content/news/*.md.
 *
 * Editorial rules enforced here (a build fails rather than publishes a piece
 * that breaks them): every article names its sources, carries a publication
 * date, and has a visible FAQ that is also its FAQPage markup. Numbers that
 * depend on the dataset or on tax rules are computed by directives, not typed.
 *
 * Markdown extras (one per line):
 *   ::hours 79.99 | GTA VI          hours-of-work table for a price
 *   ::wagestep 14 15                before/after table for a wage change
 *   ::overtime                      worked examples for the overtime deduction
 *   ::converter 15 hour             pay converter prefilled
 *   ::trailer <movie-slug>          click-to-load official trailer
 *   ::note text                     callout
 *   {{wages.at15States}}            dataset-derived numbers
 */
import fs from 'node:fs';
import { renderMarkdown } from '../articles.mjs';
import { esc, inlineMd, usd, longDate, emojiFor, writePage, rmGenerated, fileHref } from './util.mjs';
import { renderPage, breadcrumbHtml, faqHtml } from './shell.mjs';
import { buildGraph } from './jsonld.mjs';
import { converterHtml } from './widget.mjs';
import { hoursTableHtml, wageStepHtml, overtimeTableHtml, trailerHtml } from './blocks.mjs';
import { WAGE_FACTS } from './wages.mjs';
import { MOVIES } from './movies.mjs';

export const NEWS_HUB = 'news';
const DIR = new URL('../../content/news/', import.meta.url);

const FACTS = {
  'wages.atFloor': WAGE_FACTS.atFloor,
  'wages.at15States': WAGE_FACTS.at15 - 1, // at15 includes DC
  'wages.median': usd(WAGE_FACTS.median, 2),
  'wages.federal': usd(WAGE_FACTS.federal, 2),
  'wages.noLawCount': WAGE_FACTS.noLaw.length,
};
const substitute = text => text.replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
  if (!(k in FACTS)) throw new Error(`news: unknown fact {{${k}}}`);
  return String(FACTS[k]);
});

const DIRECTIVES = {
  hours: arg => { const [price, label] = arg.split('|').map(s => s.trim()); return hoursTableHtml(Number(price), label || 'This price'); },
  wagestep: arg => { const [a, b] = arg.split(/\s+/).map(Number); return wageStepHtml(a, b); },
  overtime: () => overtimeTableHtml(),
  converter: arg => { const [amount, period = 'hour'] = arg.split(/\s+/); return converterHtml({ amount: Number(amount), period, price: 100, heading: 'h2' }); },
  trailer: arg => { const m = MOVIES.find(x => x.slug === arg.trim()); if (!m) throw new Error(`news: unknown movie ${arg}`); return trailerHtml(m); },
  note: arg => `<div class="gx-note">${inlineMd(substitute(arg))}</div>`,
};

function renderBody(md) {
  const out = []; let buf = [];
  const flush = () => { if (buf.length) { out.push(renderMarkdown(substitute(buf.join('\n')))); buf = []; } };
  for (const line of md.split('\n')) {
    const m = /^::([\w-]+)(?:\s+(.*))?$/.exec(line.trim());
    if (!m) { buf.push(line); continue; }
    flush();
    const fn = DIRECTIVES[m[1]];
    if (!fn) throw new Error(`news: unknown directive ::${m[1]}`);
    out.push(fn(m[2] || ''));
  }
  flush();
  return out.join('\n');
}

function parse(file) {
  const raw = fs.readFileSync(new URL(file, DIR), 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  const meta = { source: [], faq: [] };
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, val] = kv;
    if (key === 'source') { const [name, url] = val.split(' | '); meta.source.push({ name: name.trim(), url: (url || '').trim() }); }
    else if (key === 'faq') { const i = val.indexOf(' | '); meta.faq.push([val.slice(0, i).trim(), val.slice(i + 3).trim()]); }
    else meta[key] = val.replace(/^["']|["']$/g, '').trim();
  }
  for (const k of ['title', 'slug', 'description', 'published', 'topic']) if (!meta[k]) throw new Error(`${file}: missing "${k}"`);
  if (!/^[a-z0-9-]+$/.test(meta.slug)) throw new Error(`${file}: bad slug`);
  if (meta.title.length > 62) throw new Error(`${file}: title is ${meta.title.length} chars (max 62)`);
  if (meta.description.length > 158 || meta.description.length < 60) throw new Error(`${file}: description length ${meta.description.length} not in 60-158`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.published)) throw new Error(`${file}: bad published date`);
  meta.updated = meta.updated || meta.published;
  if (meta.updated < meta.published) throw new Error(`${file}: updated before published`);
  if (!meta.source.length || meta.source.some(s => !/^https?:\/\//.test(s.url))) throw new Error(`${file}: every article needs sources with URLs`);
  if (meta.faq.length < 2) throw new Error(`${file}: needs at least 2 FAQ entries`);
  const body = match[2].trim();
  if (body.length < 1500) throw new Error(`${file}: body is too short for an explainer`);
  const words = body.split(/\s+/).length;
  return {
    ...meta, file, body, emoji: meta.emoji || emojiFor(meta.topic, meta.title), reading: Math.max(2, Math.ceil(words / 230)),
    keywords: (meta.keywords || '').split(',').map(s => s.trim()).filter(Boolean),
    related: (meta.related || '').split(',').map(s => s.trim()).filter(Boolean),
  };
}

export function loadNews() {
  const list = fs.readdirSync(DIR).filter(f => f.endsWith('.md')).sort().map(parse);
  const seen = new Set();
  for (const a of list) { if (seen.has(a.slug)) throw new Error(`duplicate news slug ${a.slug}`); seen.add(a.slug); }
  return list.sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug));
}

export const NEWS = loadNews();
export const NEWS_ROUTES = [NEWS_HUB, ...NEWS.map(a => `${NEWS_HUB}/${a.slug}`)];
export const NEWS_LABELS = { [NEWS_HUB]: 'News: what new prices cost in hours of work', ...Object.fromEntries(NEWS.map(a => [`${NEWS_HUB}/${a.slug}`, a.title])) };
const feedLink = ctx => (ctx.siteUrl ? [{ href: `${ctx.siteUrl}/${NEWS_HUB}/feed.xml`, title: 'Worth News' }] : []);

const correctionNote = `<div class="gx-note"><strong>How Worth covers the news.</strong> Each piece starts from a published source, shows the arithmetic, and says what it does not know. Hours of work use estimated take-home pay (2026 federal income tax and payroll tax, single filer, no state tax). Spotted a mistake? <a href="https://github.com/njohn931d-dotcom/bbbh/issues/new" rel="noopener">Tell us on GitHub</a> and we will correct the page and note the change. This is general information, not financial advice.</div>`;

function articlePage(ctx, a) {
  const route = `${NEWS_HUB}/${a.slug}`;
  const title = `${a.emoji} ${a.title}`;
  const others = NEWS.filter(x => x.slug !== a.slug).slice(0, 4);
  const body = renderBody(a.body);
  const faqs = a.faq;
  const main = [
    breadcrumbHtml([{ name: 'News', href: `/${NEWS_HUB}/` }, { name: a.title }]),
    `<section class="seo-hero"><div class="eyebrow"><span></span> ${esc(a.topic.toUpperCase())} · EXPLAINER</div><h1>${esc(a.title)}</h1><p class="gx-lead">${esc(a.description)}</p>` +
      `<div class="gx-meta"><span>Published <time datetime="${a.published}">${esc(longDate(a.published))}</time></span>${a.updated !== a.published ? `<span>Updated <time datetime="${a.updated}">${esc(longDate(a.updated))}</time></span>` : ''}${a.event ? `<span>Event date: ${esc(longDate(a.event))}</span>` : ''}<span>${a.reading} min read</span></div></section>`,
    `<article class="seo-article">${body}`,
    `<section class="gx-sources"><h2>Sources</h2><ul>${a.source.map(s => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.name)}</a></li>`).join('')}</ul></section>`,
    faqHtml(faqs),
    correctionNote,
    `</article>`,
    `<section class="seo-related"><h2>More from Worth News</h2><div>${others.map(o => `<a href="/${NEWS_HUB}/${o.slug}/">${esc(o.title)} <span>↗</span></a>`).join('')}<a href="/${NEWS_HUB}/">All news <span>↗</span></a></div></section>`,
    a.related.length ? `<section class="seo-related"><h2>Try the tools</h2><div>${a.related.map(r => `<a href="/${r}/">${esc(r.split('/').pop().replace(/-/g, ' '))} <span>↗</span></a>`).join('')}</div></section>` : '',
  ].join('');
  const schema = buildGraph(ctx, {
    route, name: a.title, description: a.description, kind: 'article', published: a.published, modified: a.updated,
    crumbs: [{ name: 'News', route: NEWS_HUB }, { name: a.title }], faqs, keywords: a.keywords, section: a.topic, citations: a.source,
  });
  return renderPage(ctx, {
    route, title, description: a.description, socialTitle: title, main, schema, ogType: 'article',
    published: a.published, modified: a.updated, section: a.topic, feeds: feedLink(ctx), widget: /data-worth-converter|gx-video/.test(body),
  });
}

function hubPage(ctx) {
  const title = 'Worth News: What New Prices and Events Cost in Hours of Work';
  const description = 'Short, sourced explainers on new prices and events, from streaming hikes and phones to minimum wage and taxes, shown as hours of work.';
  const topics = [...new Set(NEWS.map(a => a.topic))];
  const main = [
    breadcrumbHtml([{ name: 'News' }]),
    `<section class="seo-hero"><div class="eyebrow"><span></span> NEWS · UPDATED ${esc(longDate(NEWS[0].updated).toUpperCase())}</div><h1>News: what new prices and events cost in hours of work</h1><p class="gx-lead">When a price changes, the headline gives you a dollar figure. These explainers turn it into the thing you actually spend: hours of your life. Every piece names its sources and shows its arithmetic.</p>` +
      `<div class="gx-chips">${topics.map(t => `<span class="gx-tag">${esc(t)}</span>`).join('')}</div></section>`,
    `<article class="seo-article"><div class="gx-cards">${NEWS.map(a => `<a class="gx-card" href="/${NEWS_HUB}/${a.slug}/"><small>${esc(a.emoji)} ${esc(a.topic)} · ${esc(longDate(a.published))}</small><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p><span class="gx-more">Read the explainer →</span></a>`).join('')}</div>`,
    `<h2>Follow along</h2><p>New explainers are added as prices and events change. Subscribe with the <a href="${fileHref(ctx, `${NEWS_HUB}/feed.xml`)}">news feed</a>, or get the same data as <a href="${fileHref(ctx, 'api/v1/news.json')}">JSON</a>. See also the <a href="/minimum-wage/">minimum wage by state</a> data and the <a href="/movies/">fall movie trailers and ticket costs</a>.</p>`,
    correctionNote,
    `</article>`,
  ].join('');
  const schema = buildGraph(ctx, {
    route: NEWS_HUB, name: 'Worth News', description, kind: 'hub', published: NEWS[NEWS.length - 1].published, modified: NEWS[0].updated, crumbs: [{ name: 'News' }],
  });
  return renderPage(ctx, { route: NEWS_HUB, title: `📰 ${title}`, description, socialTitle: `📰 ${title}`, main, schema, feeds: feedLink(ctx) });
}

export function generateNews(ctx) {
  rmGenerated(NEWS_HUB);
  writePage(NEWS_HUB, hubPage(ctx));
  for (const a of NEWS) writePage(`${NEWS_HUB}/${a.slug}`, articlePage(ctx, a));
}

const xml = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** Atom feed and JSON index. Only for real origins: a preview never ships placeholder URLs. */
export function newsArtifacts(ctx) {
  if (!ctx.siteUrl) return {};
  const base = `${ctx.siteUrl}/${NEWS_HUB}/`;
  const stamp = d => `${d}T00:00:00Z`;
  const feed = `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n` +
    `<title>Worth News: what new prices and events cost in hours of work</title>\n<subtitle>Sourced explainers that turn a new price into hours of work.</subtitle>\n` +
    `<link rel="self" type="application/atom+xml" href="${xml(base + 'feed.xml')}"/>\n<link rel="alternate" type="text/html" href="${xml(base)}"/>\n<id>${xml(base)}</id>\n` +
    `<updated>${stamp(NEWS.reduce((m, a) => (a.updated > m ? a.updated : m), NEWS[0].updated))}</updated>\n<author><name>Worth</name></author>\n` +
    NEWS.map(a => `<entry>\n<title>${xml(`${a.emoji} ${a.title}`)}</title>\n<link rel="alternate" type="text/html" href="${xml(base + a.slug + '/')}"/>\n<id>${xml(base + a.slug + '/')}</id>\n<published>${stamp(a.published)}</published>\n<updated>${stamp(a.updated)}</updated>\n<category term="${xml(a.topic)}"/>\n<summary>${xml(a.description)}</summary>\n</entry>`).join('\n') +
    `\n</feed>\n`;
  const json = {
    dataset: 'worth-news', updated: NEWS[0].updated,
    items: NEWS.map(a => ({ title: a.title, url: `${base}${a.slug}/`, published: a.published, updated: a.updated, topic: a.topic, description: a.description, sources: a.source })),
  };
  return { 'news/feed.xml': feed, 'api/v1/news.json': JSON.stringify(json, null, 2) + '\n' };
}
