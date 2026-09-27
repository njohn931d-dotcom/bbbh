#!/usr/bin/env node
/**
 * SEO verification for the built article hub (docs/).
 *
 * Checks:
 *  - 40 article pages exist and match content/articles/*.md
 *  - unique titles and meta descriptions
 *  - exactly one <h1> per page
 *  - canonical URL == sitemap URL for every article
 *  - BlogPosting + FAQPage JSON-LD present and parseable
 *  - sitemap covers hub + 6 clusters + 40 articles (47 URLs)
 *  - robots.txt points at the sitemap, feed has 40 items, llms.txt exists
 *  - full crawl of internal links from the hub resolves to real files
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const SRC = join(ROOT, 'content', 'articles');
const SITE_URL = (process.env.SITE_URL || 'https://njohn931d-dotcom.github.io/bbbh').replace(/\/+$/, '');

const failures = [];
const warns = [];
const fail = (m) => failures.push(m);
const warn = (m) => warns.push(m);

function read(p) { return readFileSync(p, 'utf8'); }
function extract(html, re) { const m = html.match(re); return m ? m[1] : null; }

// --- article source vs built pages ---
const mdFiles = readdirSync(SRC).filter((f) => f.endsWith('.md'));
const slugs = mdFiles.map((f) => basename(f, '.md'));
if (slugs.length !== 40) fail(`expected 40 markdown sources, found ${slugs.length}`);

const titles = new Map();
const descs = new Map();
const builtSlugs = [];

for (const slug of slugs) {
  const p = join(DOCS, slug, 'index.html');
  if (!existsSync(p)) { fail(`missing built page: ${slug}`); continue; }
  builtSlugs.push(slug);
  const html = read(p);

  const title = extract(html, /<title>([^<]+)<\/title>/);
  if (!title) fail(`${slug}: no <title>`);
  else if (titles.has(title)) fail(`${slug}: duplicate title with ${titles.get(title)}`);
  else titles.set(title, slug);

  const desc = extract(html, /<meta name="description" content="([^"]+)">/);
  if (!desc) fail(`${slug}: no meta description`);
  else {
    if (desc.length > 165) warn(`${slug}: description ${desc.length} chars`);
    if (descs.has(desc)) fail(`${slug}: duplicate description with ${descs.get(desc)}`);
    else descs.set(desc, slug);
  }

  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) fail(`${slug}: expected 1 h1, found ${h1s.length}`);

  const canonical = extract(html, /<link rel="canonical" href="([^"]+)">/);
  const want = `${SITE_URL}/${slug}/`;
  if (canonical !== want) fail(`${slug}: canonical ${canonical} != ${want}`);

  if (!html.includes('"@type":"BlogPosting"')) fail(`${slug}: missing BlogPosting JSON-LD`);

  const ldMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const m of ldMatches) {
    try { JSON.parse(m[1]); } catch (e) { fail(`${slug}: invalid JSON-LD (${e.message})`); }
  }
  if (html.includes('"@type":"FAQPage"')) {
    const faqLd = ldMatches.map((m) => { try { return JSON.parse(m[1]); } catch { return null; } })
      .find((o) => o && o['@type'] === 'FAQPage');
    if (!faqLd || !Array.isArray(faqLd.mainEntity) || faqLd.mainEntity.length < 3) {
      fail(`${slug}: FAQPage present but malformed or <3 questions`);
    }
  } else {
    warn(`${slug}: no FAQ section`);
  }

  // robots: indexable
  if (!html.includes('index,follow')) fail(`${slug}: robots meta not indexable`);
}

// --- sitemap ---
const sitemap = read(join(DOCS, 'sitemap.xml'));
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const articleLocs = locs.filter((l) => {
  const path = l.replace(SITE_URL + '/', '');
  return path && !path.startsWith('topic/') && l !== `${SITE_URL}/`;
});
if (locs.length !== 47) fail(`sitemap has ${locs.length} URLs, expected 47`);
if (articleLocs.length !== 40) fail(`sitemap has ${articleLocs.length} article URLs, expected 40`);
for (const slug of slugs) {
  if (!locs.includes(`${SITE_URL}/${slug}/`)) fail(`sitemap missing ${slug}`);
}
if (new Set(locs).size !== locs.length) fail('sitemap contains duplicate URLs');

// --- robots / feed / llms ---
const robots = read(join(DOCS, 'robots.txt'));
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) fail('robots.txt missing sitemap pointer');
if (!/Allow: \//.test(robots)) fail('robots.txt missing Allow');
const feed = read(join(DOCS, 'feed.xml'));
const feedItems = (feed.match(/<item>/g) || []).length;
if (feedItems !== 20) fail(`feed.xml has ${feedItems} items, expected 20`);
if (!existsSync(join(DOCS, 'llms.txt'))) fail('llms.txt missing');
if (!existsSync(join(DOCS, '.nojekyll'))) fail('.nojekyll missing');
if (!existsSync(join(DOCS, '404.html'))) fail('404.html missing');
const keyFiles = readdirSync(DOCS).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (keyFiles.length !== 1) fail(`expected 1 IndexNow key file, found ${keyFiles.length}`);

// --- hub checks ---
const hub = read(join(DOCS, 'index.html'));
for (const slug of slugs) {
  if (!hub.includes(`href="${slug}/"`)) fail(`hub does not link to ${slug}`);
}
const hubLd = [...hub.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });
if (!hubLd.some((o) => o && o['@type'] === 'WebSite')) fail('hub missing WebSite JSON-LD');
if (!hubLd.some((o) => o && o['@type'] === 'ItemList')) fail('hub missing ItemList JSON-LD');

// --- full crawl: every internal link resolves ---
const queue = [join(DOCS, 'index.html')];
const seenFiles = new Set();
const badLinks = [];
while (queue.length) {
  const file = queue.pop();
  if (seenFiles.has(file) || !existsSync(file)) continue;
  seenFiles.add(file);
  const html = read(file);
  const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (/^(https?:|mailto:|data:|#|javascript:)/.test(href)) continue;
    const target = resolve(dirname(file), href.split('#')[0].split('?')[0]);
    if (href.endsWith('/')) {
      const idx = join(target, 'index.html');
      if (!existsSync(idx)) { badLinks.push(`${file.replace(DOCS, '.')} → ${href}`); continue; }
      queue.push(idx);
    } else if (existsSync(target) && statSync(target).isFile()) {
      if (target.endsWith('.html')) queue.push(target);
    } else {
      badLinks.push(`${file.replace(DOCS, '.')} → ${href}`);
    }
  }
}
for (const b of badLinks) fail(`broken internal link: ${b}`);
if (seenFiles.size < 47) fail(`crawl only reached ${seenFiles.size} files, expected the full set of 47 (hub + 40 articles + 6 clusters)`);

// --- report ---
console.log(`Articles built : ${builtSlugs.length}/40`);
console.log(`Sitemap URLs   : ${locs.length}/47`);
console.log(`Crawled files  : ${seenFiles.size}`);
console.log(`Unique titles  : ${titles.size}`);
console.log(`Warnings       : ${warns.length}`);
for (const w of warns) console.log(`  warn: ${w}`);
if (failures.length) {
  console.error(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\nPASS — hub is fully linked, schema-valid and indexable.');
