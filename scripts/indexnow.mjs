#!/usr/bin/env node
// Notify IndexNow about the site's sitemap URLs after the public Pages build is
// verified. Submission is a notification, not a promise of indexing or traffic.
import fs from 'node:fs';

const KEY = 'b5596db0004c991658df8995a6df2da3';
const HOST = 'njohn931d-dotcom.github.io';
const BASE = `https://${HOST}/bbbh/`;
const keyLocation = `${BASE}${KEY}.txt`;
const xml = fs.readFileSync(process.argv[2] || 'dist/sitemap.xml', 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim());
if (!urlList.length || urlList.some(url => !url.startsWith(BASE))) {
  throw Error('Sitemap is empty or contains URLs outside the verified /bbbh/ project path.');
}

// A project site cannot write to the shared github.io host root. IndexNow
// allows a key within the project path when keyLocation is provided; that key
// then authorizes URLs in this path, not the whole github.io host.
const keyFile = await fetch(keyLocation, { signal: AbortSignal.timeout(15000) });
if (!keyFile.ok || (await keyFile.text()).trim() !== KEY) {
  throw Error(`IndexNow verification file is not available at ${keyLocation} (HTTP ${keyFile.status}).`);
}

// The shared endpoint distributes to participating engines; posting the same
// batch to several endpoints is unnecessary. A 200/202 is receipt only.
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation, urlList }),
  signal: AbortSignal.timeout(20000),
});
if (![200, 202].includes(response.status)) {
  throw Error(`IndexNow declined the submission (HTTP ${response.status}).`);
}
console.log(`IndexNow received ${urlList.length} URLs (HTTP ${response.status}); indexing is not guaranteed.`);
