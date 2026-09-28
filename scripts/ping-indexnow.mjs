#!/usr/bin/env node
// IndexNow ping: submit every URL in the sitemap to Bing / Yandex / Seznam /
// Naver in one shot (api.indexnow.org is the shared multi-engine endpoint).
//
// Usage:
//   node scripts/ping-indexnow.mjs                          # reads dist/sitemap.xml
//   node scripts/ping-indexnow.mjs https://site/sitemap.xml # fetches live sitemap
//
// Designed for the deploy workflow: run right after the Pages deployment so
// new URLs are discovered the moment they are live, not weeks later.

import fs from 'node:fs';
import path from 'node:path';

const KEY = '2233bac88003a4bee490d8f4080e7d7b';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const CHUNK = 500;

const argUrl = process.argv[2];
const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');

async function readUrls() {
  if (argUrl) {
    const res = await fetch(argUrl, { headers: { 'user-agent': 'worth-indexnow/1.0' } });
    if (!res.ok) throw new Error(`sitemap fetch ${res.status}`);
    return [...(await res.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
  }
  const file = path.resolve(process.env.SITEMAP || 'dist/sitemap.xml');
  return [...fs.readFileSync(file, 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
}

const urls = await readUrls().catch((err) => {
  console.warn(`IndexNow: could not read sitemap (${err.message}) — skipping ping. This is non-fatal.`);
  return null;
});
if (!urls) process.exit(0);
if (!urls.length) {
  console.error('IndexNow: no URLs found in sitemap — nothing to do.');
  process.exit(0);
}
const host = new URL(urls[0]).host;
const keyLocation = `${siteUrl || new URL(urls[0]).origin}/${KEY}.txt`;
console.log(`IndexNow: submitting ${urls.length} URLs for host ${host}`);

let sent = 0;
for (let i = 0; i < urls.length; i += CHUNK) {
  const urlList = urls.slice(i, i + CHUNK);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: KEY, keyLocation, urlList }),
    });
    // 200/202 = accepted. 429 = rate limited: back off once and continue.
    if (res.status === 429) {
      console.warn('IndexNow: rate limited, waiting 30s before next chunk');
      await new Promise((r) => setTimeout(r, 30000));
      i -= CHUNK; // retry this chunk
      continue;
    }
    console.log(`IndexNow: chunk ${Math.floor(i / CHUNK) + 1} (${urlList.length} URLs) → ${res.status}`);
    sent += urlList.length;
  } catch (err) {
    console.warn(`IndexNow: chunk failed (${err.message}) — continuing`);
  }
}
console.log(`IndexNow: done, ${sent}/${urls.length} URLs accepted for indexing`);
