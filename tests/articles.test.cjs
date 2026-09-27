const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { JSDOM } = require('jsdom');

const ORIGIN = 'https://worth.example';
const pipeline = () => import(pathToFileURL(path.resolve('scripts/articles.mjs')).href);
const build = () => execFileSync(process.execPath, ['scripts/generate-seo.mjs'], { env: { ...process.env, SITE_URL: ORIGIN } });
const clean = () => execFileSync(process.execPath, ['scripts/generate-seo.mjs'], { env: { ...process.env, SITE_URL: '' } });

test('content sources are valid, complete and internally consistent', async () => {
  const { articles, clusters, articleRoutes } = await pipeline();
  assert.equal(articles.length, 40, 'expected 40 articles');
  assert.equal(clusters.length, 5);
  assert.equal(articleRoutes.length, 46); // index + 5 hubs + 40 articles
  const titles = new Set();
  for (const a of articles) {
    assert.ok(a.title.length <= 70, `title too long: ${a.slug}`);
    assert.ok(a.description.length <= 158, `description too long: ${a.slug}`);
    assert.ok(!titles.has(a.title), `duplicate title: ${a.slug}`);
    titles.add(a.title);
    assert.match(a.updated, /^\d{4}-\d{2}-\d{2}$/, `bad date: ${a.slug}`);
    assert.match(a.reading, /^\d+ min read$/, `bad reading time: ${a.slug}`);
    assert.ok(a.body.length > 1200, `too short: ${a.slug}`);
    assert.ok(a.body.includes('|'), `no table: ${a.slug}`);
    assert.ok(/\[[^\]]+\]\(\/[^)]+\)/.test(a.body), `no internal link: ${a.slug}`);
  }
  for (const c of clusters) assert.equal(articles.filter((a) => a.cluster === c.slug).length, 8, `cluster ${c.slug} is not 8 articles`);
});

test('markdown renderer produces valid, escaped HTML', async () => {
  const { renderMarkdown } = await pipeline();
  const flat = (md) => renderMarkdown(md).replace(/\n+/g, '');
  const html = flat('## Heading two\n\nA **bold** and [link](/x/) and `code`.\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n- one\n- two\n\n1. first\n\n> quoted\n\n```\nprice / hours\n```\n');
  assert.match(html, /<h2 id="heading-two">Heading two<\/h2>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<a href="\/x\/">link<\/a>/);
  assert.match(html, /<table><thead><tr><th>A<\/th><th>B<\/th><\/tr><\/thead><tbody><tr><td>1<\/td><td>2<\/td><\/tr><\/tbody><\/table>/);
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(html, /<ol><li>first<\/li><\/ol>/);
  assert.match(html, /<blockquote><p>quoted<\/p><\/blockquote>/);
  assert.match(html, /<pre><code>price \/ hours<\/code><\/pre>/);
  assert.equal(flat('<script>alert(1)</script>').includes('<script>'), false, 'HTML was not escaped');
  assert.equal(flat('[x](javascript:alert(1))').includes('javascript:'), false, 'unsafe link scheme was not stripped');
});

test('generated pages carry canonical URLs, unique metadata and no orphan articles', async () => {
  const { articles, clusters, articleRoutes } = await pipeline();
  try {
    build();
    for (const route of articleRoutes) {
      const html = fs.readFileSync(`${route}/index.html`, 'utf8');
      const dom = new JSDOM(html);
      const d = dom.window.document;
      assert.equal(d.querySelector('link[rel=canonical]').href, `${ORIGIN}/${route}/`);
      assert.equal(d.querySelector('meta[name=robots]'), null);
      assert.equal(d.querySelectorAll('h1').length, 1);
      assert.ok(d.querySelector('meta[name=description]').content.length > 40, `thin description: ${route}`);
      dom.window.close();
    }
    const otherPages = ['.generated/home.html', 'calculators/cost-of-time/index.html', 'calculators/subscription-cost/index.html', 'calculators/daily-savings/index.html', 'guides/hourly-pay/index.html', 'guides/small-purchases/index.html', 'guides/24-hour-rule/index.html'];
    const inbound = [...articleRoutes.map((r) => `${r}/index.html`), ...otherPages]
      .filter((f) => fs.existsSync(f))
      .map((f) => ({ file: f, html: fs.readFileSync(f, 'utf8') }));
    for (const a of articles) {
      const route = `articles/${a.cluster}/${a.slug}`;
      const found = inbound.filter((p) => p.file !== `${route}/index.html` && p.html.includes(`/${route}/`));
      assert.ok(found.length >= 2, `orphan article: ${route} (${found.length} inbound links)`);
    }
    for (const c of clusters) {
      const html = fs.readFileSync(`articles/${c.slug}/index.html`, 'utf8');
      for (const a of articles.filter((x) => x.cluster === c.slug)) {
        assert.ok(html.includes(`/articles/${c.slug}/${a.slug}/`), `hub ${c.slug} missing ${a.slug}`);
      }
    }
    const feed = fs.readFileSync('public/feed.xml', 'utf8');
    assert.equal((feed.match(/<item>/g) || []).length, 40);
    assert.equal((fs.readFileSync('public/llms.txt', 'utf8').match(/^- \[/gm) || []).length, 48); // 5 collections + 40 guides + 3 tools
  } finally {
    clean();
  }
});

test('previews stay noindex and drop discovery files', () => {
  try {
    clean();
    assert.match(fs.readFileSync('.generated/home.html', 'utf8'), /noindex, nofollow/);
    assert.equal(fs.existsSync('public/sitemap.xml'), false);
    assert.equal(fs.existsSync('public/feed.xml'), false);
    assert.equal(fs.existsSync('public/llms.txt'), false);
    const article = fs.readFileSync('articles/work-hours/price-to-hours-formula/index.html', 'utf8');
    assert.match(article, /noindex, nofollow/);
    assert.equal(article.includes('rel="canonical"'), false);
  } finally {
    clean();
  }
});
