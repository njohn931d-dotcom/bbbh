const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');

const SITE = 'https://njohn931d-dotcom.github.io/bbbh';
const generate = site => {
  const env = { ...process.env, SITE_URL: site };
  execFileSync(process.execPath, ['scripts/generate-seo.mjs'], { env, stdio: 'pipe' });
  execFileSync(process.execPath, ['scripts/generate-parasite.mjs'], { env, stdio: 'pipe' });
};
const page = url => {
  const route = decodeURIComponent(new URL(url).pathname.slice('/bbbh/'.length));
  return fs.readFileSync(route ? `${route}index.html` : '.generated/home.html', 'utf8');
};

test('every discoverable page has honest schema, scoped OG images and canonical breadcrumbs', async () => {
  const { getCalculator } = await import('../scripts/calculator-model.mjs');
  try {
    generate(SITE);
    const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
    const entries = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)];
    // Derived from the route model, so adding pages cannot silently desynchronise this check.
    const { extraRoutes } = await import('../scripts/generate-parasite.mjs');
    const seo = await import('../scripts/generate-seo.mjs');
    const expected = new Set(['', ...seo.routes, ...extraRoutes, ...seo.articleRoutes]).size;
    assert.equal(entries.length, expected, 'every sitemap URL carries a real lastmod and every route is listed');
    for (const [, url, modified] of entries) {
      const html = page(url);
      const document = new JSDOM(html, { url }).window.document;
      assert.equal(document.querySelector('link[rel=canonical]')?.getAttribute('href'), url);
      for (const key of ['og:image', 'twitter:image']) {
        const tag = key.startsWith('og:') ? `meta[property="${key}"]` : `meta[name="${key}"]`;
        assert.equal(document.querySelectorAll(tag).length, 1, `${url}: duplicate ${key}`);
        assert.equal(document.querySelector(tag).content, SITE + '/og-image.png', `${url}: ${key} not project-scoped`);
      }
      const manifest = document.querySelector('link[rel=manifest]');
      if (manifest) assert.equal(manifest.getAttribute('href'), '/bbbh/manifest.json');
      const structured = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
      assert.equal(structured['@context'], 'https://schema.org');
      const graph = structured['@graph'];
      assert.ok(graph.some(node => node['@type'] === 'WebSite' && node.url === SITE + '/'), `${url}: wrong WebSite URL`);
      assert.ok(graph.some(node => ['WebPage','WebApplication','Article','CollectionPage'].includes(node['@type']) && node.url === url), `${url}: wrong page URL in schema`);
      if (url !== SITE + '/') {
        const crumbs = graph.find(node => node['@type'] === 'BreadcrumbList')?.itemListElement;
        assert.equal(crumbs?.[0].item, SITE + '/', `${url}: schema home goes to wrong host path`);
        assert.equal(crumbs.at(-1).item, url, `${url}: schema last crumb differs from canonical`);
        const visibleHome = document.querySelector('.breadcrumbs a')?.href;
        assert.equal(visibleHome, SITE + '/', `${url}: visible breadcrumb home goes to wrong host path`);
      }
      const route = decodeURIComponent(new URL(url).pathname.slice('/bbbh/'.length)).replace(/\/$/, '');
      if (getCalculator(route)) {
        assert.equal(document.querySelector('[data-calculator]')?.getAttribute('data-calculator'), route);
        assert.ok(document.querySelector('script[src*="route-calculator.js"]'), `${url}: no browser calculator`);
        assert.ok(graph.some(node => node['@type'] === 'WebApplication'), `${url}: missing app schema`);
        assert.equal(document.querySelector('#calc-form'), null, `${url}: leftover cost-of-time form`);
      }
      if (route === 'calculators/income-percentile-calculator-2026') {
        assert.ok(!graph.some(node => node['@type'] === 'WebApplication'), 'Do not call an unsupported ranking page an app');
        assert.equal(document.querySelector('form'), null);
      }
      if (route.startsWith('articles/')) {
        assert.equal(modified, '2026-09-27', `${url}: article edit date must be real, not build date`);
        const article = graph.find(node => node['@type'] === 'Article');
        if (article) assert.equal(article.dateModified, modified);
      }
      if (route.startsWith('calculators/') && route !== 'calculators/income-percentile-calculator-2026') {
        assert.ok(document.querySelector('form'), `${url}: claims calculator but has no input form`);
      }
      if (!url.includes('/articles/') && !url.includes('/calculadora-') && route !== '' && route.startsWith('guides/')) {
        // A guide must not assert the same made-up FAQ as unrelated pages.
        for (const FAQ of graph.filter(n => n['@type'] === 'FAQPage')) {
          for (const question of FAQ.mainEntity || []) assert.ok(document.querySelector('main').textContent.includes(question.name), question.name);
        }
      }
    }
  } finally {
    generate('');
  }
});

test('preview pages have one noindex directive, including interactive tools', () => {
  generate('');
  for (const file of ['.generated/home.html', 'calculators/mortgage-calculator-2026/index.html']) {
    const document = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
    const metas = document.querySelectorAll('meta[name=robots]');
    assert.equal(metas.length, 1, `${file}: index/noindex conflict`);
    assert.equal(metas[0].content, 'noindex, nofollow');
    assert.equal(document.querySelector('link[rel=canonical]'), null);
  }
  assert.equal(fs.existsSync('public/sitemap.xml'), false);
});

test('IndexNow checks the project-path key and sends one scoped batch (receipt is not indexing)', () => {
  const { spawnSync } = require('node:child_process');
  const os = require('node:os');
  const path = require('node:path');
  const key = 'b5596db0004c991658df8995a6df2da3';
  assert.equal(fs.readFileSync(`public/${key}.txt`, 'utf8').trim(), key);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'worth-indexnow-'));
  const file = path.join(dir, 'sitemap.xml');
  fs.writeFileSync(file, `<urlset><url><loc>${SITE}/</loc></url></urlset>`);
  try {
    const probe = response => `
      process.argv[2] = ${JSON.stringify(file)};
      let posts = 0;
      globalThis.fetch = async (url, options) => {
        if (!options?.method) {
          if (url !== ${JSON.stringify(`${SITE}/${key}.txt`)}) throw Error('Wrong verification URL: ' + url);
          return { ok: true, status: 200, text: async () => ${JSON.stringify(response)} };
        }
        if (url !== 'https://api.indexnow.org/indexnow' || ++posts !== 1) throw Error('Duplicate or wrong endpoint');
        const body = JSON.parse(options.body);
        if (body.host !== 'njohn931d-dotcom.github.io' || body.key !== ${JSON.stringify(key)} ||
            body.keyLocation !== ${JSON.stringify(`${SITE}/${key}.txt`)} ||
            JSON.stringify(body.urlList) !== JSON.stringify([${JSON.stringify(`${SITE}/`)}])) throw Error('Incorrect URL scope');
        return { status: 202 };
      };
      await import('./scripts/indexnow.mjs');
      if (posts !== 1) throw Error('No URL notification sent');`;
    const run = response => spawnSync(process.execPath, ['--input-type=module', '-e', probe(response)], { encoding: 'utf8' });
    const good = run(key);
    assert.equal(good.status, 0, good.stderr);
    assert.match(good.stdout, /received 1 URLs .* indexing is not guaranteed/);
    const wrong = run('different key');
    assert.notEqual(wrong.status, 0, 'Wrong key must not trigger a submission');
    assert.match(wrong.stderr, /verification file is not available/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
