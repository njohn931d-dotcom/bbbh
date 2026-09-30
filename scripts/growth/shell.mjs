/**
 * Page shell for the growth surfaces: takes the site's own index.html as the
 * template (so header, footer, fonts, stylesheet and the Search Console
 * verification tag stay identical to every other page) and fills in the
 * per-page head and <main>.
 *
 * Differences from the older generators, on purpose:
 *  - the template's relative og:image / twitter:image are REPLACED with
 *    absolute URLs instead of being left in place next to an added absolute
 *    one (link unfurlers read the first one and ignore relative URLs);
 *  - exactly one og:type, one twitter:card and one JSON-LD graph per page.
 */
import fs from 'node:fs';
import { esc, prefixLinks } from './util.mjs';
import { jsonLdTag } from './jsonld.mjs';

let TEMPLATE = null;
const template = () => (TEMPLATE ??= fs.readFileSync('index.html', 'utf8'));
/** Tests rewrite index.html between runs; let them drop the cache. */
export const resetTemplateCache = () => { TEMPLATE = null; };

/**
 * @param {{siteUrl:string, basePath:string}} ctx
 * @param {object} p
 * @param {string} p.route
 * @param {string} p.title            <title>
 * @param {string} p.description      <meta name=description>
 * @param {string} p.main             inner HTML of <main>
 * @param {object} p.schema           JSON-LD graph object
 * @param {string} [p.lang]
 * @param {string} [p.dir]
 * @param {string} [p.socialTitle]    og:title / twitter:title (may carry an emoji)
 * @param {string} [p.socialDescription]
 * @param {'website'|'article'} [p.ogType]
 * @param {string} [p.published]
 * @param {string} [p.modified]
 * @param {string} [p.section]
 * @param {{lang:string, route:string}[]} [p.alternates]  includes self when set
 * @param {string} [p.xDefault]       route for hreflang x-default
 * @param {{href:string,title:string,type?:string}[]} [p.feeds]  <link rel=alternate> autodiscovery
 * @param {boolean} [p.widget]        page uses the converter widget
 * @param {string} [p.extraHead]
 */
export function renderPage(ctx, p) {
  const { siteUrl, basePath } = ctx;
  const lang = p.lang || 'en';
  const url = siteUrl ? `${siteUrl}/${p.route ? p.route + '/' : ''}` : '';
  const img = siteUrl ? `${siteUrl}/og-image.png` : '/og-image.png';
  const socialTitle = p.socialTitle || p.title;
  const socialDesc = p.socialDescription || p.description;

  let html = template()
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"${p.dir ? ` dir="${p.dir}"` : ''}`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(p.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${esc(p.description)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, () => `<meta property="og:title" content="${esc(socialTitle)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, () => `<meta property="og:description" content="${esc(socialDesc)}">`)
    .replace(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="${p.ogType || 'website'}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, () => `<meta property="og:image" content="${esc(img)}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/, () => `<meta name="twitter:image" content="${esc(img)}">`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => jsonLdTag(p.schema))
    .replace(/<main>[\s\S]*?<\/main>/, () => `<main>${p.main}</main>`)
    .replace(/href="#(calculator|learn|how)"/g, 'href="/#$1"')
    .replace('<script type="module" src="/app.js"></script>', p.widget ? '<script type="module" src="/widgets/converter.js"></script>' : '')
    .replace(/<button class="saved-button"[\s\S]*?<\/button>/, '<a class="saved-button" href="/calculators/cost-of-time/">Try the calculator ↗</a>');

  const head = [];
  head.push('<link rel="stylesheet" href="/widgets/growth.css">');
  if (siteUrl) {
    head.push(`<link rel="canonical" href="${esc(url)}">`);
    head.push(`<meta property="og:url" content="${esc(url)}">`);
    head.push('<meta name="robots" content="index, follow, max-image-preview:large">');
  } else {
    head.push('<meta name="robots" content="noindex, nofollow">');
  }
  head.push('<meta property="og:site_name" content="Worth">');
  head.push(`<meta property="og:locale" content="${lang === 'en' ? 'en_US' : lang}">`);
  head.push(`<meta name="twitter:title" content="${esc(socialTitle)}">`);
  head.push(`<meta name="twitter:description" content="${esc(socialDesc)}">`);
  if (p.ogType === 'article') {
    if (p.published) head.push(`<meta property="article:published_time" content="${esc(p.published)}">`);
    if (p.modified || p.published) head.push(`<meta property="article:modified_time" content="${esc(p.modified || p.published)}">`);
    if (p.section) head.push(`<meta property="article:section" content="${esc(p.section)}">`);
  }
  if (siteUrl && p.alternates && p.alternates.length) {
    for (const a of p.alternates) head.push(`<link rel="alternate" hreflang="${a.lang}" href="${esc(`${siteUrl}/${a.route}/`)}">`);
    if (p.xDefault) head.push(`<link rel="alternate" hreflang="x-default" href="${esc(`${siteUrl}/${p.xDefault}/`)}">`);
  }
  for (const f of p.feeds || []) {
    head.push(`<link rel="alternate" type="${f.type || 'application/atom+xml'}" title="${esc(f.title)}" href="${esc(f.href)}">`);
  }
  head.push('<link rel="manifest" href="/manifest.json">');
  head.push('<link rel="author" href="/humans.txt">');
  if (p.extraHead) head.push(p.extraHead);

  html = html.replace('</head>', () => head.join('') + '</head>');
  return prefixLinks(html, basePath);
}

/** Breadcrumb <nav> matching the markup the other generators emit. */
export function breadcrumbHtml(trail) {
  const items = [{ name: 'Home', href: '/' }, ...trail];
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${items.map((c, i) => (i === items.length - 1
    ? `<span>${esc(c.name)}</span>`
    : `<a href="${esc(c.href)}">${esc(c.name)}</a><span>/</span>`)).join('')}</nav>`;
}

/** Visible FAQ block. The same array feeds the FAQPage markup, so the two cannot drift. */
export function faqHtml(faqs, heading = 'Frequently asked questions') {
  if (!faqs || !faqs.length) return '';
  return `<section class="gx-faq" id="faq"><h2>${esc(heading)}</h2>${faqs.map(([q, a]) => `<h3>${esc(q)}</h3><p>${a}</p>`).join('')}</section>`;
}
