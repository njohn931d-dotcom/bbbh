/**
 * Post-build pass over dist/**.html. It exists because several generators each
 * add their own head tags on top of the shared template, which left pages with:
 *   - two og:image / twitter:image tags, the first one a relative URL that link
 *     unfurlers ignore;
 *   - duplicate og:type, twitter:card and theme-color tags;
 *   - a render-blocking Google Fonts stylesheet on every page;
 *   - no twitter:title / twitter:description;
 *   - no feed autodiscovery link.
 * Running once on the finished HTML means the fix does not depend on which
 * generator produced a page. Legacy <title> elements are left untouched, so
 * existing rankings are not disturbed; emoji go into the social titles and the
 * meta description, where they can lift click-through without changing the
 * page title search engines have already indexed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { emojiFor, esc } from './util.mjs';

/** Sub-sites and widgets that own their own markup are not rewritten here. */
export const SKIP_PREFIXES = ['embed/', 'affiliate-marketing/'];

const startsWithEmoji = s => /^\p{Extended_Pictographic}/u.test(s.trim());
const FONTS = /<link href="(https:\/\/fonts\.googleapis\.com\/css2[^"]*)" rel="stylesheet">/;

/** Keep one tag of a kind: the last one, preferring an absolute URL for image tags. */
function dedupe(html, re, preferAbsolute = false) {
  const matches = [...html.matchAll(new RegExp(re.source, 'g'))];
  if (matches.length < 2) return html;
  let keep = matches[matches.length - 1][0];
  if (preferAbsolute) {
    const abs = [...matches].reverse().find(m => /content="https?:\/\//.test(m[0]));
    if (abs) keep = abs[0];
  }
  let seen = false;
  return html.replace(new RegExp(re.source, 'g'), tag => {
    if (tag === keep && !seen) { seen = true; return tag; }
    return '';
  });
}

/**
 * @param {string} html
 * @param {{siteUrl:string, route:string, isHome:boolean}} o
 */
export function processHtml(html, { siteUrl, route, isHome }) {
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) return html;

  // 1. one of each singleton tag
  html = dedupe(html, /<meta property="og:type" content="[^"]*">/);
  html = dedupe(html, /<meta name="twitter:card" content="[^"]*">/);
  html = dedupe(html, /<meta name="theme-color" content="[^"]*">/);
  html = dedupe(html, /<meta property="og:image" content="[^"]*">/, true);
  html = dedupe(html, /<meta name="twitter:image" content="[^"]*">/, true);

  // 2. absolute image URLs
  const img = `${siteUrl}/og-image.png`;
  html = html.replace(/<meta (property="og:image"|name="twitter:image") content="(\/[^"]*)">/g, (m, attr) => `<meta ${attr} content="${esc(img)}">`);

  // 3. emoji in the social titles and the meta description
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  const emoji = emojiFor(route, title);
  html = html.replace(/<meta property="og:title" content="([^"]*)">/, (m, t) => `<meta property="og:title" content="${startsWithEmoji(t) ? t : `${emoji} ${t}`}">`);
  html = html.replace(/<meta name="description" content="([^"]*)">/, (m, d) => `<meta name="description" content="${startsWithEmoji(d) ? d : `${emoji} ${d}`}">`);
  const ogTitle = (html.match(/<meta property="og:title" content="([^"]*)">/) || [])[1];
  const ogDesc = (html.match(/<meta property="og:description" content="([^"]*)">/) || [])[1];
  if (ogTitle && !/<meta name="twitter:title"/.test(html)) html = html.replace('</head>', `<meta name="twitter:title" content="${ogTitle}"></head>`);
  if (ogDesc && !/<meta name="twitter:description"/.test(html)) html = html.replace('</head>', `<meta name="twitter:description" content="${ogDesc}"></head>`);

  // 4. fonts without blocking first paint
  html = html.replace(FONTS, (m, href) => `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${href}"></noscript>`);

  // 5. feed autodiscovery on the homepage
  if (isHome && !/type="application\/atom\+xml"/.test(html)) {
    html = html.replace('</head>', `<link rel="alternate" type="application/atom+xml" title="Worth News" href="${esc(siteUrl)}/news/feed.xml"></head>`);
  }
  return html;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Rewrite every eligible page in dist. Returns the number of pages changed. */
export function postprocessDist(dist, ctx) {
  let changed = 0;
  for (const file of walk(dist)) {
    const rel = path.relative(dist, file).split(path.sep).join('/');
    if (rel === '404.html' || SKIP_PREFIXES.some(p => rel.startsWith(p))) continue;
    const route = rel === 'index.html' ? '' : rel.replace(/\/?index\.html$/, '');
    const before = fs.readFileSync(file, 'utf8');
    const after = processHtml(before, { siteUrl: ctx.siteUrl, route, isHome: rel === 'index.html' });
    if (after !== before) { fs.writeFileSync(file, after); changed += 1; }
  }
  return changed;
}

/** Append a block to llms.txt once, so assistants that read it can find the new surfaces. */
export function augmentLlms(dist, ctx) {
  const file = path.join(dist, 'llms.txt');
  if (!fs.existsSync(file)) return false;
  const marker = '## News, data and movies';
  const txt = fs.readFileSync(file, 'utf8');
  if (txt.includes(marker)) return false;
  const u = p => `${ctx.siteUrl}/${p}`;
  const block = `\n${marker}\n` +
    `- ${u('news/')}: dated, sourced explainers that turn new prices and events into hours of work\n` +
    `- ${u('minimum-wage/')}: minimum wage in every U.S. state and DC, with overtime rules and scheduled changes (source: U.S. Department of Labor)\n` +
    `- ${u('movies/')}: fall 2026 movie trailers, release dates and what a night out costs\n` +
    `- ${u('open-data/')}: free JSON and CSV datasets, CC BY 4.0: ${u('api/v1/minimum-wage.json')}, ${u('api/v1/news.json')}, ${u('api/v1/movies.json')}\n`;
  fs.writeFileSync(file, txt.replace(/\s*$/, '\n') + block);
  return true;
}
