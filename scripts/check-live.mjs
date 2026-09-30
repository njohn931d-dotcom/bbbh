#!/usr/bin/env node
/*
 * Verify the publicly DEPLOYED Pages site, not just dist/. The previous deploy
 * considered any HTTP response a success, even a 404 or an old cached page.
 * Run with SITE_URL=https://owner.github.io/repo node scripts/check-live.mjs
 */
const raw = process.env.SITE_URL;
if (!raw) throw Error('Set SITE_URL to the public URL (including project path).');
const site = raw.replace(/\/+$/, '');
const canonical = path => `${site}${path}`;
const attempts = Number(process.env.LIVE_CHECK_ATTEMPTS || 6);
const pause = Number(process.env.LIVE_CHECK_WAIT_MS || 8000);

const get = async path => {
  const url = new URL(canonical(path));
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok) throw Error(`${url}: HTTP ${response.status}`);
  return response;
};
const requireMatch = (text, regex, page) => {
  if (!regex.test(text)) throw Error(`${page}: missing ${regex}`);
};

async function check() {
  const [home, mortgage, guide, sitemap, manifest, image] = await Promise.all([
    get('/').then(r => r.text()),
    get('/calculators/mortgage-calculator-2026/').then(r => r.text()),
    get('/articles/work-hours/price-to-hours-formula/').then(r => r.text()),
    get('/sitemap.xml').then(r => r.text()),
    get('/manifest.json').then(r => r.json()),
    get('/og-image.png').then(async r => ({ type: r.headers.get('content-type'), bytes: (await r.arrayBuffer()).byteLength })),
  ]);
  for (const [path, html] of [['/', home], ['/calculators/mortgage-calculator-2026/', mortgage], ['/articles/work-hours/price-to-hours-formula/', guide]]) {
    const page = canonical(path);
    requireMatch(html, new RegExp(`<link rel="canonical" href="${page.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`), page);
    if (/<meta name="robots" content="[^"]*noindex/.test(html)) throw Error(`${page}: production page is noindex`);
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    if (!scripts.length || !scripts.some(s => s['@graph']?.some(e => e.url === page))) throw Error(`${page}: structured data is missing the canonical entity`);
    const images = [...html.matchAll(/<meta property="og:image" content="([^"]*)"/g)];
    if (images.length !== 1 || images[0][1] !== canonical('/og-image.png')) throw Error(`${page}: broken or duplicate social image`);
  }
  requireMatch(mortgage, /data-calculator="calculators\/mortgage-calculator-2026"/, 'mortgage');
  for (const input of ['principal', 'apr', 'years']) requireMatch(mortgage, new RegExp(`name="${input}"`), 'mortgage');
  if (/id="calc-form"/.test(mortgage)) throw Error('Mortgage still shows unrelated purchase-price form');
  const script = mortgage.match(/<script[^>]+src="([^"]*route-calculator[^\"]*\.js)"/);
  if (!script) throw Error('Mortgage has no browser-side calculator script');
  const bundle = await fetch(new URL(script[1], site + '/'), { signal: AbortSignal.timeout(15000) });
  if (!bundle.ok) throw Error(`Calculator JavaScript is unavailable: HTTP ${bundle.status}`);
  if (!(await bundle.text()).length) throw Error('Calculator JavaScript is empty');
  if (!sitemap.includes(`<loc>${canonical('/calculators/mortgage-calculator-2026/')}</loc>`) || !sitemap.includes(`<loc>${canonical('/articles/work-hours/price-to-hours-formula/')}</loc>`)) {
    throw Error('Live sitemap is missing critical tools or guides');
  }
  if (manifest.start_url !== new URL(site + '/').pathname) throw Error('Manifest start URL escapes the project path');
  if (!image.type?.startsWith('image/') || image.bytes < 1000) throw Error('Open Graph image is unavailable or too small');
  console.log('✓ Live homepage, calculator, guide, schema, social image, sitemap, JS and manifest verified:', site + '/');
}

for (let i = 1; i <= attempts; i++) {
  try { await check(); process.exit(0); }
  catch (error) {
    console.error(`Live check ${i}/${attempts}: ${error.message}`);
    if (i === attempts) process.exit(1);
    await new Promise(resolve => setTimeout(resolve, pause));
  }
}
