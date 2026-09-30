// Pushes every sitemap URL to IndexNow (Bing, Yandex, Seznam, Naver, Yep).
// Bing's index also feeds DuckDuckGo, Yahoo, Ecosia and ChatGPT search.
import fs from 'node:fs';
const KEY = 'b5596db0004c991658df8995a6df2da3';
const HOST = 'njohn931d-dotcom.github.io';
const BASE = 'https://' + HOST + '/bbbh/';
const xml = fs.readFileSync(process.argv[2] || 'dist/sitemap.xml', 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()).filter(u => u.startsWith(BASE));
if (!urlList.length) { console.error('No URLs found'); process.exit(1); }
const body = { host: HOST, key: KEY, keyLocation: BASE + KEY + '.txt', urlList };
for (const ep of ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow', 'https://yandex.com/indexnow']) {
  try {
    const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
    console.log(ep, r.status, '(' + urlList.length + ' URLs)');
  } catch (e) { console.log(ep, 'failed:', e.message); }
}
