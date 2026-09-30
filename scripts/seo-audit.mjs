#!/usr/bin/env node
/**
 * SEO auditor for the built site (dist/).
 *
 * Dependency-free on purpose: it runs in CI with `node scripts/seo-audit.mjs`
 * and needs no install step.
 *
 *   node scripts/seo-audit.mjs                    # audit ./dist
 *   node scripts/seo-audit.mjs --dist=build       # audit another folder
 *   node scripts/seo-audit.mjs --json             # machine-readable report
 *   node scripts/seo-audit.mjs --warnings-as-errors
 *
 * Exit code is non-zero when any ERROR-level finding is present, so it can
 * gate a deploy. Findings are reported per-rule with the routes affected.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d) => {
  const hit = args.find(a => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};

const DIST = path.resolve(opt('dist', 'dist'));
const AS_JSON = flag('--json');
const STRICT = flag('--warnings-as-errors');

/** @typedef {{level:'error'|'warn'|'info', rule:string, msg:string, routes:string[]}} Finding */

const findings = [];
/** @type {Map<string, Finding>} */
const byRule = new Map();

function report(level, rule, msg, routes = []) {
  if (!byRule.has(rule)) {
    const f = { level, rule, msg, routes: [] };
    byRule.set(rule, f);
    findings.push(f);
  }
  const f = byRule.get(rule);
  // A rule keeps its worst level, and accumulates every route it fired on.
  if (level === 'error') f.level = 'error';
  else if (level === 'warn' && f.level !== 'error') f.level = 'warn';
  for (const r of routes) if (!f.routes.includes(r)) f.routes.push(r);
}

if (!fs.existsSync(DIST)) {
  console.error(`✗ dist folder not found: ${DIST}\n  Run a build first: SITE_URL=https://njohn931d-dotcom.github.io/bbbh npm run build:production`);
  process.exit(2);
}

// ---------------------------------------------------------------- discovery

/** Recursively collect every built HTML file, keyed by its clean site route. */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** `dist/calculators/foo/index.html` -> `/calculators/foo/` (`/` stays `/`). */
const routeOf = file => {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (!rel.endsWith('index.html')) return '/' + rel;
  return '/' + rel.replace(/index\.html$/, '');
};

const files = walk(DIST);
const pages = new Map();
for (const file of files) {
  pages.set(routeOf(file), { file, route: routeOf(file), html: fs.readFileSync(file, 'utf8') });
}

// 404.html is an error-document fallback, not a ranking target.
// /embed/* are the copy-paste widget pages. They are deliberately noindex with
// a canonical onto the tool they mirror, so they must not be held to the rules
// that apply to indexable pages - and they must not be missing the two tags
// that keep them from competing with the original. Checked separately.
const isEmbed = route => route === '/embed/' || route.startsWith('/embed/');
const indexable = new Map([...pages].filter(([r]) => r !== '/404.html' && !isEmbed(r)));

const all = (attr, html) => [...html.matchAll(new RegExp(attr, 'gi'))].map(m => m[1] ?? m[0]);
const one = (re, html) => (html.match(re) || [])[1];
const stripTags = value => String(value).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

/**
 * GitHub Pages project sites are served under a path prefix (`/repo/`), so
 * every URL we compare against has to be reduced to a site-relative route
 * before it can be matched against another URL.
 */
const SITE_BASE = (() => {
  const sm = path.join(DIST, 'sitemap.xml');
  if (!fs.existsSync(sm)) return '';
  const first = (fs.readFileSync(sm, 'utf8').match(/<loc>([^<]+)<\/loc>/) || [])[1];
  if (!first) return '';
  try { return new URL(first).pathname.replace(/\/[^/]*$/, ''); } catch { return ''; }
})();

/** Strip scheme+host and the project path prefix from any absolute URL. */
function toRoute(url) {
  if (!url) return '';
  let p = url;
  try { p = new URL(url).pathname; } catch { /* already a path */ }
  // Several routes are non-Latin slugs; URL.pathname percent-encodes them, so
  // compare against the decoded form the filesystem actually uses.
  try { p = decodeURIComponent(p); } catch { /* leave encoded if malformed */ }
  if (SITE_BASE && (p === SITE_BASE || p.startsWith(SITE_BASE + '/'))) {
    p = p.slice(SITE_BASE.length) || '/';
  }
  return p || '/';
}

// ---------------------------------------------------------------- per-page

const titleMap = new Map();
const descMap = new Map();
const h1Map = new Map();
const bodyMap = new Map();

/**
 * Reduce a page to a "fingerprint": its visible article text with digits and
 * punctuation stripped. Two pages with the same fingerprint are the same page
 * as far as a search engine is concerned, no matter what their titles say.
 */
function fingerprint(html) {
  const m = mainContent(html);
  let text = m || html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<nav[\s\S]*?<\/nav>/g, '');
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\d+/g, '')
    .replace(/[^\p{L}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return text;
}

/**
 * Approximate rendered width in Latin characters. CJK, Hangul and Arabic
 * characters are full-width and occupy roughly two Latin columns, so a
 * 60-character Japanese description renders like a 120-character English one
 * and must not be flagged as "too short".
 */
function displayWidth(s) {
  let w = 0;
  for (const ch of s) {
    w += /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(ch) ? 2 : 1;
  }
  return w;
}

/**
 * The page's main content. Prefers <main>, then <article>. Both tags are
 * checked for a closing tag rather than trusted blindly, so an unclosed
 * <article> cannot silently make the whole audit skip the page.
 */
function mainContent(html) {
  for (const tag of ['main', 'article']) {
    const open = new RegExp(`<${tag}\\b[^>]*>`, 'i').exec(html);
    if (!open) continue;
    const start = open.index + open[0].length;
    const end = html.indexOf(`</${tag}>`, start);
    if (end === -1) continue; // unclosed tag — do not trust this as a boundary
    return html.slice(start, end);
  }
  return null;
}

/** Rough count of the words a crawler sees as the page's main content. */
function wordCount(html) {
  const scope = mainContent(html) || html;
  return scope
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

const addRoute = (map, key, route) => {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(route);
};

/**
 * Language of each page, and the hreflang annotations it emits. Collected in
 * the per-page pass, then checked for reciprocity in the cross-page pass.
 */
const LANG_BY_ROUTE = new Map();
const HREFLANG_BY_ROUTE = new Map([...indexable.keys()].map(r => [r, new Map()]));

for (const [route, { html }] of indexable) {
  const title = one(/<title>([\s\S]*?)<\/title>/, html)?.trim() || '';
  const desc = one(/<meta name="description" content="([^"]*)"/, html)?.trim() || '';
  const lang = one(/<html lang="([^"]*)"/, html)?.trim() || '';
  const canonical = one(/<link rel="canonical" href="([^"]*)"/, html)?.trim() || '';
  const h1s = all(/<h1[^>]*>([\s\S]*?)<\/h1>/, html).map(h => h.replace(/<[^>]+>/g, '').trim());
  const robots = one(/<meta name="robots" content="([^"]*)"/, html)?.trim() || '';
  const words = wordCount(html);

  // --- title -------------------------------------------------------------
  if (!title) report('error', 'title-missing', 'Page has no <title>', [route]);
  else {
    addRoute(titleMap, title.toLowerCase(), route);
    const titleW = displayWidth(title);
    if (titleW > 65) report('warn', 'title-too-long', `Title renders at ~${titleW} columns (>65 will be truncated in SERPs)`, [route]);
    if (titleW < 25) report('warn', 'title-too-short', `Title renders at only ~${titleW} columns`, [route]);
    // A repeated year or word is the signature of a title assembled by
    // concatenating a slug that already contained it.
    const years = [...title.matchAll(/\b(20\d\d)\b/g)].map(m => m[1]);
    if (new Set(years).size < years.length) {
      report('error', 'title-duplicate-token', `Title repeats a year: "${title}"`, [route]);
    }
    // Adjacency must be tested on the real token sequence. Filtering short words
    // out first would pull distant words next to each other and invent repeats.
    const toks = title.toLowerCase().replace(/[^\p{L}\s\d]/gu, ' ').split(/\s+/).filter(Boolean);
    const adj = toks.find((w, i) => i > 0 && w === toks[i - 1] && w.length > 3);
    if (adj) report('error', 'title-stutter', `Title repeats "${adj}" back to back: "${title}"`, [route]);
  }

  // --- description -------------------------------------------------------
  if (!desc) report('error', 'desc-missing', 'Page has no meta description', [route]);
  else {
    addRoute(descMap, desc.toLowerCase(), route);
    const descW = displayWidth(desc);
    if (descW > 165) report('warn', 'desc-too-long', `Description renders at ~${descW} columns (>165 truncated)`, [route]);
    if (descW < 70) report('warn', 'desc-too-short', `Description renders at only ~${descW} columns`, [route]);
  }

  // --- headings ----------------------------------------------------------
  if (h1s.length === 0) report('error', 'h1-missing', 'Page has no <h1>', [route]);
  if (h1s.length > 1) report('error', 'h1-multiple', `Page has ${h1s.length} <h1> tags`, [route]);
  for (const h of h1s) {
    addRoute(h1Map, h.toLowerCase(), route);
    const ys = [...h.matchAll(/\b(20\d\d)\b/g)].map(m => m[1]);
    if (new Set(ys).size < ys.length) report('error', 'h1-duplicate-token', `H1 repeats a year: "${h}"`, [route]);
    // "Mortgage Calculator 2026 Calculator 2026" — the generator appended the
    // type to a slug that already ended in it.
    if (/\b([a-z]+)\b[\s\S]*\b\1\b/i.test(h) && h.split(/\s+/).length > 2) {
      // Only flag *adjacent* repeats, so legitimate alliteration
      // ("Buy It Nice or Buy It Twice") is not mistaken for a template bug.
      const toks = h.toLowerCase().replace(/[^\p{L}\s\d]/gu, ' ').split(/\s+/).filter(Boolean);
      const hit = toks.some((t, i) => i > 0 && t === toks[i - 1] && t.length > 2);
      if (hit) report('error', 'h1-stutter', `H1 repeats a word back to back: "${h}"`, [route]);
    }
  }

  // --- canonical ---------------------------------------------------------
  if (!canonical) report('error', 'canonical-missing', 'Page has no rel=canonical', [route]);
  else {
    const path_ = toRoute(canonical);
    if (!canonical.startsWith('http')) report('error', 'canonical-malformed', `Canonical is not an absolute URL: ${canonical}`, [route]);
    if (path_ !== route) {
      report('error', 'canonical-not-self', `Canonical points at ${path_} but page is ${route}`, [route]);
    }
    if (/github\.io/.test(canonical)) {
      report('info', 'canonical-host', `Canonical host is ${new URL(canonical).host} — a github.io subdomain, not a real domain`, [route]);
    }
  }

  // --- language ----------------------------------------------------------
  LANG_BY_ROUTE.set(route, lang);
  if (!lang) report('error', 'lang-missing', 'Page has no <html lang>', [route]);
  if (lang && lang !== 'en') {
    // A page that claims a language but is written in another one is worse
    // than no translation at all: it tells Google the page is untrustworthy.
    const body = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const nonAscii = (body.match(/[Ѐ-ӿ一-鿿぀-ヿ가-힣؀-ۿ]/g) || []).length;
    if (nonAscii < 20) {
      report('error', 'lang-content-mismatch', `Declares lang="${lang}" but body has almost no ${lang} script characters`, [route]);
    }
  }

  // --- hreflang ----------------------------------------------------------
  const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]*)"/g)].map(m => ({ code: m[1], href: m[2] }));
  for (const h of hreflangs) HREFLANG_BY_ROUTE.get(route)?.set(h.code, toRoute(h.href));
  if (hreflangs.length) {
    const self = hreflangs.find(h => h.code === lang);
    if (!self) report('error', 'hreflang-no-self', 'Has hreflang tags but no self-referencing alternate', [route]);
    // hreflang must be reciprocal and point at real pages. Pointing every page
    // at the same 10 foreign URLs creates a cluster of invalid annotations
    // that Google discards wholesale.
    for (const h of hreflangs) {
      if (!/^https?:\/\//.test(h.href)) { report('error', 'hreflang-malformed', `hreflang href is not absolute: ${h.href}`, [route]); continue; }
      const target = toRoute(h.href);
      if (target !== route && !indexable.has(target)) {
        report('error', 'hreflang-broken-target', `hreflang="${h.code}" points at ${target}, which is not a built page`, [route]);
      }
    }
    const codes = hreflangs.map(h => h.code);
    const langs = new Set(codes.filter(c => c !== 'x-default'));
    if (langs.size !== codes.filter(c => c !== 'x-default').length) {
      report('error', 'hreflang-duplicate-code', 'Duplicate hreflang codes on one page', [route]);
    }
    if (langs.size > 1) {
      // Foreign alternates are fine as long as they are real, reciprocated
      // translations — which the hreflang-not-reciprocal rule verifies. Only
      // flag the case where a page declares a language it does not itself use.
      const declared = [...langs].filter(c => c !== lang);
      if (declared.length && !declared.includes(lang)) {
        // nothing wrong here; the self-reference check above already covers it
      }
    }
  }

  // --- structured data ---------------------------------------------------
  //
  // A page is only "schema tagged" if the markup says something true about it.
  // These rules exist because the generators used to invent a two-question FAQ
  // for every page, answer one of them with the meta description, and repeat
  // the homepage FAQ block under ~96 tools. Each rule below failed on real
  // pages of this site.
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!ld.length) report('error', 'jsonld-missing', 'Page has no JSON-LD', [route]);
  if (ld.length > 1) report('error', 'jsonld-multiple', `${ld.length} JSON-LD blocks on one page; keep a single @graph`, [route]);

  /** @type {object[]} */
  const schemaNodes = [];
  for (const block of ld) {
    let parsed;
    try { parsed = JSON.parse(block); } catch (e) {
      report('error', 'jsonld-invalid', `JSON-LD does not parse: ${e.message}`, [route]);
      continue;
    }
    if (Array.isArray(parsed)) schemaNodes.push(...parsed);
    else if (parsed && Array.isArray(parsed['@graph'])) schemaNodes.push(...parsed['@graph']);
    else if (parsed && parsed['@type']) schemaNodes.push(parsed);
    else report('error', 'jsonld-shape', 'JSON-LD is neither a node nor an @graph array', [route]);
  }

  if (ld.length === 1 && schemaNodes.length) {
    const typesOf = node => [].concat(node['@type'] || []).map(String);
    const has = type => schemaNodes.some(n => typesOf(n).includes(type));
    const firstOfType = type => schemaNodes.find(n => typesOf(n).includes(type));
    const visibleText = ((html.match(/<main>[\s\S]*?<\/main>/) || [html])[0])
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    if (!has('Organization')) report('error', 'schema-org-missing', 'No Organization node: the publisher is unnamed', [route]);
    if (!has('WebSite')) report('error', 'schema-website-missing', 'No WebSite node: the page never says which site it belongs to', [route]);
    if (route !== '/' && !has('BreadcrumbList')) report('error', 'schema-breadcrumb-missing', 'No BreadcrumbList on a non-home page', [route]);
    if (!has('WebApplication') && !has('Article') && !has('TechArticle') && !has('WebPage') && !has('CollectionPage')) {
      report('error', 'schema-no-primary', 'The graph describes the brand and the site but not the page itself', [route]);
    }

    const org = firstOfType('Organization');
    if (org) {
      if (!Array.isArray(org.sameAs) || !org.sameAs.length) {
        report('error', 'schema-org-sameas', 'Organization has no sameAs list of profiles this project controls', [route]);
      } else {
        // sameAs is an identity claim: "this org IS that profile". Only pages
        // under our own GitHub account qualify. Wikipedia included.
        const unowned = org.sameAs.filter(u => !/^https:\/\/github\.com\/njohn931d-dotcom\//.test(String(u)));
        if (unowned.length) report('error', 'schema-false-sameas', `Organization.sameAs claims profiles this project does not own: ${unowned.join(', ')}`, [route]);
      }
      if (org.url && !/^https?:\/\//.test(org.url)) report('error', 'schema-relative-url', `Organization.url is not absolute: ${org.url}`, [route]);
      if (!org.logo) report('warn', 'schema-org-logo', 'Organization has no logo, so there is nothing for a knowledge panel to use', [route]);
      else if (!/^https?:\/\//.test(String(org.logo).replace(/^\{/, '')) && !String(org.logo).startsWith('http')) {
        report('error', 'schema-relative-url', `Organization.logo is root-relative (${org.logo}); absolute required`, [route]);
      }
    }

    const crumb = firstOfType('BreadcrumbList');
    if (crumb) {
      const items = crumb.itemListElement || [];
      for (const item of items) {
        if (item.item && !/^https?:\/\//.test(item.item)) {
          report('error', 'schema-relative-url', `Breadcrumb "${item.name}" item is not an absolute URL`, [route]);
          break;
        }
      }
      const positions = items.map(i => i.position);
      if (positions.some((position, i) => position !== i + 1)) {
        report('error', 'schema-breadcrumb-order', `BreadcrumbList positions are [${positions.join(', ')}], expected 1..${positions.length}`, [route]);
      }
      const last = items[items.length - 1];
      if (last && last.item && SITE_BASE && toRoute(last.item) !== route) {
        report('error', 'schema-breadcrumb-self', `Breadcrumb ends at ${toRoute(last.item)} but the page is ${route}`, [route]);
      }
    }

    for (const type of ['Article', 'TechArticle']) {
      const node = firstOfType(type);
      if (!node) continue;
      for (const field of ['headline', 'datePublished', 'dateModified', 'author', 'publisher', 'inLanguage']) {
        if (!node[field]) report('error', 'schema-article-fields', `${type} is missing "${field}"`, [route]);
      }
      if (node.datePublished && node.dateModified && node.dateModified < node.datePublished) {
        report('error', 'schema-date-order', `${type}: dateModified ${node.dateModified} precedes datePublished ${node.datePublished}`, [route]);
      }
    }

    const faq = firstOfType('FAQPage');
    const shown = [...html.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)]
      .map(m => [stripTags(m[1]), stripTags(m[2])]);
    // Guides render their answers as <h3>Q</h3><p>A</p>, so a details element
    // is not the only honest shape a FAQ can take.
    const headings = [...html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)].map(m => stripTags(m[1]));
    if (faq && !shown.length && !headings.length) {
      report('error', 'schema-faq-invisible', 'FAQPage markup with nothing resembling a FAQ on the page: markup must describe visible content', [route]);
    }
    if (faq) {
      const seen = new Set();
      for (const question of faq.mainEntity || []) {
        const name = stripTags((question && question.name) || '');
        if (!name) { report('error', 'schema-faq-empty', 'FAQPage contains a Question with no name', [route]); continue; }
        if (seen.has(name)) { report('error', 'schema-faq-duplicate', `FAQPage repeats "${name}"`, [route]); continue; }
        seen.add(name);
        const onPage = visibleText.includes(name) || headings.includes(name);
        if (!onPage) report('error', 'schema-faq-offpage', `FAQPage question is not on the page: "${name}"`, [route]);
        const answer = stripTags(((question.acceptedAnswer || {}).text) || '');
        if (!answer) report('error', 'schema-faq-empty', `Question "${name}" has no acceptedAnswer text`, [route]);
        else if (desc && answer === desc) {
          report('error', 'schema-faq-reused-description', `Answer for "${name}" is the meta description, which is not an answer`, [route]);
        } else if (answer.length < 40) {
          report('warn', 'schema-faq-thin', `Answer for "${name}" is ${answer.length} chars; one-liners do not earn a rich result`, [route]);
        }
      }
    }
    if (shown.length && !faq) {
      report('warn', 'schema-faq-unmarked', `${shown.length} question${shown.length > 1 ? 's are' : ' is'} shown to the reader but not marked up`, [route]);
    }

    // Fabricated endorsements are the fastest route to a manual action, and a
    // site with no reviews has nothing honest to write here.
    const raw = ld.join('');
    for (const banned of ['aggregateRating', 'reviewRating', '"@type":"Review"', '"@type":"Product"']) {
      if (raw.includes(banned)) report('error', 'schema-fabricated', `Markup contains ${banned}, which this page has no data to support`, [route]);
    }
    if (SITE_BASE) {
      for (const node of schemaNodes) {
        for (const field of ['url', '@id']) {
          const value = node[field];
          if (typeof value === 'string' && value.startsWith('/')) {
            report('error', 'schema-relative-url', `${typesOf(node)[0]}.${field} is root-relative (${value}); crawlers and unfurlers need an absolute URL`, [route]);
          }
        }
      }
    }
  }

  // --- content -----------------------------------------------------------
  addRoute(bodyMap, fingerprint(html), route);
  if (words < 150) report('warn', 'thin-content', `Only ~${words} words of article content`, [route]);
  for (const tag of ['main', 'article', 'section', 'div']) {
    const opens = (html.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
    const closes = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (opens > closes) {
      report('error', 'html-unclosed-tag', `<${tag}> is opened ${opens} time(s) but closed only ${closes} — invalid HTML`, [route]);
    }
  }

  // --- open graph --------------------------------------------------------
  for (const [rule, re] of [
    ['og-title-missing', /<meta property="og:title"/],
    ['og-description-missing', /<meta property="og:description"/],
    ['og-image-missing', /<meta property="og:image"/],
  ]) {
    if (!re.test(html)) report('warn', rule, 'Missing Open Graph tag', [route]);
  }

  // --- social verification meta belongs on one page, not all of them ------
  if (/<meta name="google-site-verification"/.test(html) && route !== '/') {
    report('info', 'verification-meta-everywhere', 'Site-verification meta tag is on every page; it only needs to be on the homepage', [route]);
  }
}

// ------------------------------------------------------- cross-page checks

for (const [title, routes] of titleMap) {
  if (routes.length > 1) report('error', 'title-duplicate', `${routes.length} pages share the title "${title.slice(0, 60)}..."`, routes);
}
for (const [desc, routes] of descMap) {
  if (routes.length > 1) report('error', 'desc-duplicate', `${routes.length} pages share one meta description`, routes);
}
for (const [h1, routes] of h1Map) {
  if (routes.length > 1) report('error', 'h1-duplicate', `${routes.length} pages share the H1 "${h1.slice(0, 60)}"`, routes);
}
for (const [fp, routes] of bodyMap) {
  // Hub/index pages legitimately repeat the home body; content pages do not.
  const hubs = routes.filter(r => r === '/' || /^\/(articles|guides|calculators)\/$/.test(r));
  const content = routes.filter(r => !hubs.includes(r));
  if (content.length > 1) {
    report('error', 'body-duplicate', `${content.length} content pages share byte-identical body copy`, content);
  }
}

// --- hreflang reciprocity --------------------------------------------------
//
// Google's rule: if A declares hreflang="X" -> B, then B must declare
// hreflang="<A's own language>" -> A. A one-way annotation is discarded, and
// when a cluster is mostly one-way, the whole set is discarded with it.
{
  const bad = [];
  for (const [route, anns] of HREFLANG_BY_ROUTE) {
    const lang = LANG_BY_ROUTE.get(route);
    for (const [code, target] of anns) {
      if (code === 'x-default') continue;
      const back = HREFLANG_BY_ROUTE.get(target);
      if (!back) continue; // already reported as a broken target
      if (back.get(lang) !== route) bad.push(`${route} [${code}] -> ${target} (no matching return to ${route})`);
    }
  }
  if (bad.length) {
    report('error', 'hreflang-not-reciprocal', `${bad.length} hreflang annotations are not reciprocated`, bad);
  }
}

// --- internal link graph ---------------------------------------------------

/** Which built pages link to this route? Used to find orphans. */
const inbound = new Map([...indexable.keys()].map(r => [r, new Set()]));
let brokenLinks = 0;
const brokenDetail = [];

for (const [route, { html }] of indexable) {
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('#') || href.startsWith('data:')) continue;
    const target = toRoute(href.split('#')[0].split('?')[0]);
    if (!target.startsWith('/')) continue;
    if (!indexable.has(target) && fs.existsSync(path.join(DIST, target))) continue;
    if (!indexable.has(target)) {
      brokenLinks++;
      if (brokenDetail.length < 25) brokenDetail.push(`${route} -> ${target}`);
      continue;
    }
    if (target !== route) inbound.get(target).add(route);
  }
}
if (brokenLinks) {
  report('error', 'broken-internal-links', `${brokenLinks} internal links point at URLs that were not built`, brokenDetail);
}
for (const [route, srcs] of inbound) {
  if (srcs.size === 0 && route !== '/') {
    report('error', 'orphan-page', 'No internal page links here, so crawlers can only find it via the sitemap', [route]);
  }
}

// --- embed widgets -----------------------------------------------------------
//
// A widget page must stay out of the index and must point at the page it
// mirrors. Drop either tag and /embed/* turns into ~53 duplicates of the
// calculators, which is a duplicate-content problem handed over for free.
{
  const widgetRoutes = [...pages.keys()].filter(r => r.startsWith('/embed/') && r !== '/embed/');
  for (const widgetRoute of widgetRoutes) {
    const widgetHtml = pages.get(widgetRoute).html;
    const robots = one(/<meta name="robots" content="([^"]*)"/i, widgetHtml);
    if (!/noindex/.test(robots)) report('error', 'embed-not-noindex', `${widgetRoute} is indexable and duplicates the tool it mirrors`, [widgetRoute]);
    const canonical = one(/rel="canonical" href="([^"]+)"/i, widgetHtml);
    if (!canonical) report('error', 'embed-no-canonical', `${widgetRoute} has no rel=canonical`, [widgetRoute]);
    else if (!indexable.has(toRoute(canonical))) report('error', 'embed-canonical-target', `${widgetRoute} canonicalises to ${toRoute(canonical)}, which is not an indexable page`, [widgetRoute]);
    if (!/worth-embed-resize/.test(widgetHtml)) report('warn', 'embed-no-resize', `${widgetRoute} never tells its host its height, so hosts must guess a pixel value`, [widgetRoute]);
  }
  if (!pages.has('/embed/')) {
    report('error', 'embed-gallery-missing', 'No /embed/ page, so nothing shows a host how to paste a widget');
  }
  if (widgetRoutes.length && !fs.existsSync(path.join(DIST, 'embed', 'widget.js'))) {
    report('error', 'embed-loader-missing', 'dist/embed/widget.js is absent, so the one-line embed snippet 404s');
  }
}

// --- sitemap ---------------------------------------------------------------

const sitemapPath = path.join(DIST, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  report('error', 'sitemap-missing', 'No sitemap.xml in dist');
} else {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (!locs.length) report('error', 'sitemap-empty', 'sitemap.xml has no URLs');
  for (const loc of locs) {
    if (!/^https?:\/\//.test(loc)) { report('error', 'sitemap-malformed-url', `Bad URL in sitemap: ${loc}`); continue; }
    const p = toRoute(loc);
    if (!indexable.has(p)) report('error', 'sitemap-broken-url', `sitemap lists ${p} which was not built`);
  }
  for (const route of indexable.keys()) {
    if (route === '/404.html') continue;
    if (!locs.some(l => toRoute(l) === route)) {
      report('error', 'sitemap-missing-url', `Built page is absent from sitemap.xml: ${route}`, [route]);
    }
  }
  if (/changefreq>daily/.test(xml)) {
    const dailies = (xml.match(/<changefreq>daily<\/changefreq>/g) || []).length;
    report('warn', 'sitemap-changefreq-daily', `${dailies} URLs declare <changefreq>daily</changefreq>; a site updated on a slower cadence should say weekly or monthly`, []);
  }
  if (/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/.test(xml)) {
    const dates = [...new Set([...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m => m[1]))];
    if (dates.length > 1) {
      report('warn', 'sitemap-inconsistent-lastmod', `sitemap has ${dates.length} different lastmod values`, []);
    }
  }
}

// --- robots ----------------------------------------------------------------

const robotsPath = path.join(DIST, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  report('error', 'robots-missing', 'No robots.txt in dist');
} else {
  const txt = fs.readFileSync(robotsPath, 'utf8');
  if (/Crawl-delay/i.test(txt)) {
    report('warn', 'robots-crawl-delay', 'robots.txt sets Crawl-delay, which Google has never supported; it is ignored', []);
  }
  if (!/Sitemap:/i.test(txt)) report('warn', 'robots-no-sitemap', 'robots.txt does not advertise the sitemap', []);
}

// --- duplicate-URL bait ----------------------------------------------------

// Emitting index.txt / index.json twins of every page creates near-duplicate
// URLs that compete with the canonical page in the index.
const dupBait = files.filter(f => /index\.(txt|json)$/.test(f) && fs.existsSync(f.replace(/index\.(txt|json)$/, 'index.html')));
if (dupBait.length) {
  report('warn', 'duplicate-url-twin', `${dupBait.length} routes emit index.txt/index.json twins of the same page`, dupBait.map(f => routeOf(f).replace(/\/$/, '')));
}
const extraSitemap = path.join(DIST, 'sitemap-extra.xml');
if (fs.existsSync(extraSitemap) && /index\.(txt|json)/.test(fs.readFileSync(extraSitemap, 'utf8'))) {
  report('warn', 'duplicate-url-in-sitemap', 'sitemap-extra.xml advertises .txt/.json duplicate twins as indexable URLs', []);
}

// ---------------------------------------------------------------- report

const order = { error: 0, warn: 1, info: 2 };
findings.sort((a, b) => order[a.level] - order[b.level] || a.rule.localeCompare(b.rule));

const errors = findings.filter(f => f.level === 'error');
const warns = findings.filter(f => f.level === 'warn');
const infos = findings.filter(f => f.level === 'info');

if (AS_JSON) {
  console.log(JSON.stringify({
    dist: DIST,
    pages: indexable.size,
    counts: { error: errors.length, warn: warns.length, info: infos.length },
    findings,
  }, null, 2));
} else {
  const mark = { error: '✗', warn: '!', info: '·' };
  console.log(`\n  SEO audit — ${indexable.size} indexable pages in ${path.relative(process.cwd(), DIST) || DIST}\n`);
  if (!findings.length) {
    console.log('  ✓ No findings.\n');
  } else {
    for (const f of findings) {
      console.log(`  ${mark[f.level]} ${f.level.toUpperCase().padEnd(5)} ${f.rule}`);
      console.log(`      ${f.msg}`);
      if (f.routes.length > 1) {
        const shown = f.routes.slice(0, 8);
        for (const r of shown) console.log(`        · ${r}`);
        if (f.routes.length > shown.length) console.log(`        · …and ${f.routes.length - shown.length} more`);
      } else if (f.routes.length === 1) {
        console.log(`        · ${f.routes[0]}`);
      }
      console.log('');
    }
    console.log(`  ${errors.length} error(s), ${warns.length} warning(s), ${infos.length} note(s)\n`);
  }
}

process.exit(errors.length || (STRICT && warns.length) ? 1 : 0);
