const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { JSDOM } = require('jsdom');

const ORIGIN = 'https://worth.example';

const build = async () => {
  execFileSync(process.execPath, ['scripts/generate-seo.mjs'], { env: { ...process.env, SITE_URL: ORIGIN } });
  execFileSync(process.execPath, ['scripts/generate-parasite.mjs'], { env: { ...process.env, SITE_URL: ORIGIN } });
  execFileSync(process.execPath, ['scripts/generate-wages.mjs'], { env: { ...process.env, SITE_URL: ORIGIN } });
  const mod = await import(pathToFileURL(path.resolve('scripts/generate-wages.mjs')).href);
  return mod;
};
const clean = () => execFileSync(process.execPath, ['scripts/generate-seo.mjs'], { env: { ...process.env, SITE_URL: '' } });

test('wage cluster: merged sitemap, canonicals, single h1, unique metadata, real math, hreflang twins', async () => {
  try {
    const { wageRoutes } = await build();
    assert.ok(wageRoutes.length >= 230, `expected a serious cluster, got ${wageRoutes.length}`);

    // 1. Master sitemap includes everything without duplicates
    const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    assert.equal(new Set(urls).size, urls.length, 'duplicate URLs in merged sitemap');
    assert.ok(urls.length >= 360, `expected 360+ URLs in merged sitemap, got ${urls.length}`);
    for (const r of wageRoutes) assert.ok(urls.includes(`${ORIGIN}/${r}/`), `wage route missing from sitemap: ${r}`);
    assert.match(sitemap, /xhtml:link/, 'sitemap should carry hreflang annotations');

    // 2. Every wage page: one h1, canonical, indexable, substantive, valid JSON-LD
    const titles = new Set();
    const descs = new Set();
    for (const r of wageRoutes) {
      const html = fs.readFileSync(`${r}/index.html`, 'utf8');
      const dom = new JSDOM(html);
      const d = dom.window.document;
      assert.equal(d.querySelectorAll('h1').length, 1, `h1 count ${r}`);
      let canonHref = d.querySelector('link[rel=canonical]').href;
      try { canonHref = decodeURIComponent(canonHref); } catch {}
      assert.equal(canonHref, `${ORIGIN}/${r}/`, `canonical ${r}`);
      const robots = d.querySelector('meta[name=robots]');
      assert.ok(robots && robots.content.includes('index') && !robots.content.includes('noindex'), `robots ${r}`);
      assert.ok(d.querySelector('main').textContent.length > 1000, `thin main ${r}`);
      const ld = JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent);
      assert.ok(ld['@graph'].length >= 2, `json-ld ${r}`);
      for (const a of d.querySelectorAll('a[href^="/"]')) {
        const href = a.getAttribute('href');
        let target = new URL(href, ORIGIN).pathname;
        try { target = decodeURIComponent(target); } catch {}
        assert.ok(target === '/' || fs.existsSync(`.${target}index.html`) || fs.existsSync(`.${target}`), `broken link ${href} on ${r}`);
      }
      titles.add(d.title);
      descs.add(d.querySelector('meta[name=description]').content);
      dom.window.close();
    }
    assert.equal(titles.size, wageRoutes.length, 'wage titles must be unique');
    assert.equal(descs.size, wageRoutes.length, 'wage descriptions must be unique');

    // 3. The math is honest (spot checks across locales)
    const p25 = fs.readFileSync('wages/25-an-hour-is-how-much-a-year/index.html', 'utf8');
    assert.match(p25, /\$52,000/, '25/h must say 52,000');
    assert.match(p25, /\$1,000/, '25/h must show weekly 1,000');
    const s52 = fs.readFileSync('wages/52000-a-year-is-how-much-an-hour/index.html', 'utf8');
    assert.match(s52, /\$25/, '52k must say 25/h');
    const s100 = fs.readFileSync('wages/100000-a-year-is-how-much-an-hour/index.html', 'utf8');
    assert.match(s100, /\$48/, '100k must say ~48.08/h');
    const fr13 = fs.readFileSync(fs.readdirSync('fr/salaires').includes('13-euros-de-lheure') ? 'fr/salaires/13-euros-de-lheure/index.html' : 'fr/salaires/index.html', 'utf8');
    assert.match(fr13, /35 heures|151,67|151.67/, 'FR page must use the 35-hour week');
    const ko10 = fs.readFileSync('ko/급여/시급-10030원/index.html', 'utf8');
    assert.match(ko10, /209/, 'KR page must use the 209-hour month');
    const tr22 = fs.readFileSync('tr/maaslar/aylik-22104-tl-maas-saat-basi/index.html', 'utf8');
    assert.match(tr22, /225/, 'TR page must use the 45-hour week');

    // 4. Prefilled calculator on EN pages
    assert.match(p25, /value="25"/, 'calculator income prefilled with 25');
    assert.match(p25, /id="hours">40<\/span>/, 'static result shows 40h');

    // 5. hreflang twins (es ↔ en, same USD value)
    const es15 = fs.readFileSync('es/salarios/15-dolares-la-hora-al-ano/index.html', 'utf8');
    assert.match(es15, /hreflang="en" href="https:\/\/worth\.example\/wages\/15-an-hour-is-how-much-a-year\/"/);
    const en15 = fs.readFileSync('wages/15-an-hour-is-how-much-a-year/index.html', 'utf8');
    assert.match(en15, /hreflang="es" href="https:\/\/worth\.example\/es\/salarios\/15-dolares-la-hora-al-ano\/"/);

    // 6. Discovery files extended
    assert.match(fs.readFileSync('public/llms.txt', 'utf8'), /Wage & salary conversion tables/);
    const feed = fs.readFileSync('public/feed.xml', 'utf8');
    assert.ok((feed.match(/<item>/g) || []).length >= 300, 'feed should include wage items');

    // 7. Google verification tag survives on wage pages too
    const TOKEN = 'sEQ7B0Jr4_LTKoRdaLwvcSx25iX5ZvZ-LMwB1EZODnY';
    assert.ok(p25.includes(TOKEN), 'verification tag on wage page');
  } finally {
    clean();
  }
});

test('wage cluster: preview mode is noindex and emits no discovery files', async () => {
  try {
    execFileSync(process.execPath, ['scripts/generate-wages.mjs'], { env: { ...process.env, SITE_URL: '' } });
    const html = fs.readFileSync('wages/25-an-hour-is-how-much-a-year/index.html', 'utf8');
    assert.match(html, /noindex, nofollow/);
    assert.equal(fs.existsSync('public/sitemap.xml'), false);
  } finally {
    clean();
  }
});
