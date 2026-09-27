#!/usr/bin/env node
/**
 * Ping IndexNow (Bing, Yandex, Seznam, Naver…) after the docs/ site is live.
 *
 *   node scripts/ping-indexnow.mjs              # ping the homepage
 *   node scripts/ping-indexnow.mjs --all        # ping every URL in sitemap.xml
 *   node scripts/ping-indexnow.mjs URL [URL…]   # ping specific URLs
 *
 * Requires SITE_URL and a deployed site (the key file must be reachable at
 * SITE_URL/<key>.txt — the builder writes it into docs/).
 */
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');
if (!SITE_URL) {
  console.error('Set SITE_URL first, e.g.\n  SITE_URL=https://you.github.io/repo node scripts/ping-indexnow.mjs');
  process.exit(1);
}

const { readdirSync, readFileSync } = await import('node:fs');
const { join, dirname, resolve } = await import('node:path');
const { fileURLToPath } = await import('node:url');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');

const keyFile = readdirSync(DOCS).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) { console.error('No IndexNow key file in docs/ — run npm run articles first.'); process.exit(1); }
const key = keyFile.replace(/\.txt$/, '');

const args = process.argv.slice(2);
let urlList;
if (args.includes('--all')) {
  const sm = readFileSync(join(DOCS, 'sitemap.xml'), 'utf8');
  urlList = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
} else if (args.length) {
  urlList = args;
} else {
  urlList = [`${SITE_URL}/`];
}

const payload = {
  host: new URL(SITE_URL).host,
  key,
  keyLocation: `${SITE_URL}/${keyFile}`,
  urlList,
};

try {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  console.log(`IndexNow response: ${res.status} ${res.statusText} (${urlList.length} URL(s) submitted)`);
  if (res.status !== 200 && res.status !== 202) process.exit(1);
} catch (e) {
  console.error(`Ping failed: ${e.message}`);
  process.exit(1);
}
