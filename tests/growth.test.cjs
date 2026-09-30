const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { JSDOM } = require('jsdom');

/**
 * Guards for scripts/growth/*: the tax maths behind every "hours of work" table,
 * the converter, the minimum wage dataset, the news/movie content rules, the
 * generated pages and the post-build head clean-up. Generation runs in a temp
 * directory so this file never touches the repo's generated output.
 */
const ROOT = path.join(__dirname, '..');
const load = (p) => import(path.join(ROOT, p));

/** Run fn with the cwd set to a scratch copy of the template, restoring afterwards. */
async function inScratch(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'worth-growth-'));
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(dir, 'index.html'));
  const prev = process.cwd();
  process.chdir(dir);
  try { return await fn(dir); } finally { process.chdir(prev); fs.rmSync(dir, { recursive: true, force: true }); }
}

const dom = (html) => new JSDOM(html).window.document;
/** JSDOM fires DOMContentLoaded asynchronously; wait for it so the script's listeners are attached. */
const loaded = (d) => (d.window.document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => d.window.addEventListener('load', r)));

test('tax estimator matches hand-worked 2026 figures', async () => {
  const t = await load('scripts/growth/tax.mjs');
  // $40,000 single: taxable 23,900 = 12,400 x 10% + 11,500 x 12% = 2,620; FICA 7.65% = 3,060.
  assert.equal(t.bracketTax(23900), 2620);
  const e = t.estimateTakeHome(40000);
  assert.equal(e.federal, 2620);
  assert.equal(e.fica, 3060);
  assert.equal(e.net, 34320);
  assert.equal(t.marginalRate(40000), 0.12);
  assert.equal(t.estimateTakeHome(10000).federal, 0, 'income under the standard deduction owes no federal income tax');
  // Social Security stops at the wage base; Medicare does not.
  assert.equal(t.fica(300000), t.round2(184500 * 0.062 + 300000 * 0.0145 + 100000 * 0.009));
});

test('overtime deduction counts only the premium half, honours the cap and phases out', async () => {
  const t = await load('scripts/growth/tax.mjs');
  const a = t.overtimeDeduction({ regularRate: 25, overtimeHours: 500, otherWages: 52000 });
  assert.equal(a.premium, 6250);
  assert.equal(a.deduction, 6250);
  assert.equal(a.taxSaved, 1175);
  const capped = t.overtimeDeduction({ regularRate: 40, overtimeHours: 1000, otherWages: 0 });
  assert.equal(capped.deduction, 12500, 'deduction is capped at $12,500 for a single filer');
  const phased = t.overtimeDeduction({ regularRate: 40, overtimeHours: 1000, otherWages: 140000 });
  assert.equal(phased.phasedOut, true);
  assert.equal(phased.deduction, 7500, '$100 less for every $1,000 of income above $150,000');
});

test('converter maths agree between the server and the browser script', async () => {
  const w = await load('scripts/growth/widget.mjs');
  assert.equal(w.toHourly(52000, 'year'), 25);
  assert.equal(w.toHourly(1000, 'week', 40), 25);
  assert.equal(w.fromHourly(25).annual, 52000);

  const html = `<!doctype html><body>${w.converterHtml({ amount: 25, period: 'hour', price: 100 })}</body>`;
  const d = new JSDOM(html, { runScripts: 'outside-only' });
  d.window.eval(fs.readFileSync(path.join(ROOT, 'widgets/converter.js'), 'utf8'));
  await loaded(d);
  const doc = d.window.document;
  assert.equal(doc.querySelector('[data-out="annual"]').textContent, '$52,000.00', 'server-rendered result');
  const form = doc.querySelector('.gx-conv-form');
  form.elements.amount.value = '30';
  form.dispatchEvent(new d.window.Event('input', { bubbles: true }));
  assert.equal(doc.querySelector('[data-out="annual"]').textContent, '$62,400.00');
  assert.equal(doc.querySelector('[data-out="hourly"]').textContent, '$30.00');
  form.elements.period.value = 'year';
  form.elements.amount.value = '41600';
  form.dispatchEvent(new d.window.Event('input', { bubbles: true }));
  assert.equal(doc.querySelector('[data-out="hourly"]').textContent, '$20.00');
  d.window.close();
});

test('basket calculator totals rows and converts to hours of work', async () => {
  const w = await load('scripts/growth/widget.mjs');
  const html = `<!doctype html><body>${w.basketHtml({ title: 'T', rows: [{ label: 'A', qty: 2, price: 10 }, { label: 'B', qty: 1, price: 5 }], hourly: 25 })}</body>`;
  const d = new JSDOM(html, { runScripts: 'outside-only' });
  d.window.eval(fs.readFileSync(path.join(ROOT, 'widgets/converter.js'), 'utf8'));
  await loaded(d);
  const doc = d.window.document;
  assert.equal(doc.querySelector('[data-out="total"]').textContent, '$25.00');
  const form = doc.querySelector('.gx-basket-form');
  form.elements['qty-0'].value = '5';
  form.dispatchEvent(new d.window.Event('input', { bubbles: true }));
  assert.equal(doc.querySelector('[data-out="total"]').textContent, '$55.00');
  assert.match(doc.querySelector('[data-out="hours"]').textContent, /2\.2 hours/);
  d.window.close();
});

test('minimum wage dataset is complete, consistent and current as of its date', async () => {
  const m = await load('scripts/growth/wages.mjs');
  assert.equal(m.ROWS.length, 51, '50 states and DC');
  assert.equal(new Set(m.ROWS.map((r) => r.code)).size, 51);
  assert.equal(new Set(m.ROWS.map((r) => r.slug)).size, 51);
  for (const r of m.ROWS) {
    assert.ok(r.effective >= m.WAGE_DATA.federal, `${r.name} effective rate is below the federal minimum`);
    assert.equal(r.annual, Math.round(r.effective * 2080 * 100) / 100);
  }
  assert.equal(m.WAGE_FACTS.atFloor, 20, 'DOL table: 20 states at the federal $7.25');
  assert.deepEqual(m.WAGE_FACTS.noLaw, ['Alabama', 'Louisiana', 'Mississippi', 'South Carolina', 'Tennessee']);
  assert.equal(m.WAGE_FACTS.highest.code, 'DC');
  assert.equal(m.WAGE_FACTS.highestState.code, 'WA');
  // A step dated on or before the as-of date is already in force (Florida, September 30, 2026).
  const fl = m.ROWS.find((r) => r.code === 'FL');
  assert.equal(fl.effective, 15);
  assert.equal(fl.previousRate, 14);
  // Anything still upcoming is dated after the as-of date.
  for (const r of m.ROWS) if (r.upcoming) assert.ok(r.upcoming.date > m.WAGE_DATA.asOf, `${r.name} upcoming change is not in the future`);
  assert.equal(m.WAGE_ROUTES.length, 52);
});

test('minimum wage data files are valid, attributed and carry no placeholder origin', async () => {
  const m = await load('scripts/growth/wages.mjs');
  const files = m.wageArtifacts({ siteUrl: 'https://njohn931d-dotcom.github.io/bbbh' });
  const json = JSON.parse(files['api/v1/minimum-wage.json']);
  assert.equal(json.jurisdictions.length, 51);
  assert.equal(json.license, 'https://creativecommons.org/licenses/by/4.0/');
  assert.ok(json.jurisdictions.every((j) => j.page.startsWith('https://njohn931d-dotcom.github.io/bbbh/minimum-wage/')));
  const csv = files['api/v1/minimum-wage.csv'].trim().split('\n');
  assert.equal(csv.length, 52, 'header plus 51 rows');
  assert.ok(!/worth\.example/.test(JSON.stringify(files)));
});

test('movie data: every trailer id is well formed and unique, dates are real', async () => {
  const mv = await load('scripts/growth/movies.mjs');
  const ids = mv.MOVIES.map((m) => m.trailer.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const m of mv.MOVIES) {
    assert.match(m.trailer.id, /^[\w-]{11}$/, `${m.title} trailer id`);
    assert.match(m.release, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(m.trailer.channel && m.trailer.title, `${m.title} needs the verified channel and title`);
    assert.ok(m.sources.length >= 1);
  }
  const b = await load('scripts/growth/blocks.mjs');
  const html = b.trailerHtml(mv.MOVIES[0]);
  assert.ok(!/<iframe|ytimg|youtube\.com\/embed/.test(html), 'nothing may load from YouTube before the visitor presses play');
  assert.match(html, /data-video-id="[\w-]{11}"/);
});

test('money emoji table: every code point matches its character', async () => {
  const e = await load('scripts/growth/emoji.mjs');
  assert.ok(e.ALL_EMOJI.length >= 25);
  const seen = new Set();
  for (const [ch, name, code, shortcode] of e.ALL_EMOJI) {
    assert.equal([...ch][0].codePointAt(0).toString(16).toUpperCase(), code, `${name}: code point`);
    assert.match(shortcode, /^:[a-z0-9_]+:$/);
    assert.ok(!seen.has(ch), `duplicate ${name}`);
    seen.add(ch);
  }
});

test('news articles meet the editorial rules and every link resolves', async () => {
  const n = await load('scripts/growth/news.mjs');
  const g = await load('scripts/growth/index.mjs');
  const s = await load('scripts/generate-seo.mjs');
  const c = await load('scripts/cluster-content.mjs');
  assert.ok(n.NEWS.length >= 7);
  const known = new Set([...s.routes, ...s.articleRoutes, ...c.CLUSTER_ROUTES, ...g.GROWTH_ROUTES]);
  const slugs = new Set();
  for (const a of n.NEWS) {
    assert.ok(!slugs.has(a.slug)); slugs.add(a.slug);
    assert.ok(a.source.length >= 2, `${a.slug}: cite at least two sources`);
    assert.ok(a.faq.length >= 2);
    for (const r of a.related) assert.ok(known.has(r), `${a.slug}: related route ${r} does not exist`);
    // Every root-relative markdown link must be a real page.
    for (const m of a.body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
      const route = m[1].replace(/^\/|\/$/g, '');
      assert.ok(known.has(route), `${a.slug}: link ${m[1]} does not exist`);
    }
    assert.ok(a.published <= a.updated);
  }
});

test('growth pages render valid, unique, correctly linked HTML', async () => {
  const g = await load('scripts/growth/index.mjs');
  const { resetTemplateCache } = await load('scripts/growth/shell.mjs');
  await inScratch(async () => {
    resetTemplateCache();
    for (const basePath of ['', '/bbbh']) {
      const ctx = { siteUrl: `https://worth.example${basePath}`, origin: 'https://worth.example', basePath };
      g.generateGrowth(ctx);
      const titles = new Set(); const descs = new Set();
      for (const route of g.GROWTH_ROUTES) {
        const file = `${route}/index.html`;
        assert.ok(fs.existsSync(file), `missing ${file}`);
        const d = dom(fs.readFileSync(file, 'utf8'));
        assert.equal(d.querySelectorAll('h1').length, 1, `${route}: exactly one h1`);
        assert.equal(d.querySelector('link[rel=canonical]').href, `${ctx.siteUrl}/${route}/`);
        assert.equal(d.querySelector('link[type="application/rss+xml"]').href, `${ctx.siteUrl}/feed.xml`);
        const ld = d.querySelectorAll('script[type="application/ld+json"]');
        assert.equal(ld.length, 1, `${route}: one JSON-LD block`);
        const graph = JSON.parse(ld[0].textContent)['@graph'];
        assert.ok(graph.length >= 3 && graph.some((x) => x['@type'] === 'Organization'));
        assert.ok(d.querySelector('main').textContent.length > 1000, `${route}: main is too short`);
        assert.equal(d.querySelectorAll('meta[property="og:image"]').length, 1);
        assert.match(d.querySelector('meta[property="og:image"]').content, /^https:\/\/worth\.example/);
        assert.equal(d.querySelectorAll('meta[property="og:type"]').length, 1);
        const title = d.title; const desc = d.querySelector('meta[name=description]').content;
        assert.ok(!titles.has(title), `duplicate title ${title}`); titles.add(title);
        assert.ok(!descs.has(desc), `duplicate description on ${route}`); descs.add(desc);
        assert.ok([...title].length <= 66, `${route}: title is ${[...title].length} chars`);
        assert.ok(desc.length >= 60 && desc.length <= 160, `${route}: description is ${desc.length} chars`);
        for (const a of d.querySelectorAll('a[href^="/"]')) {
          const href = a.getAttribute('href');
          if (basePath) assert.ok(href.startsWith(`${basePath}/`), `${route}: link is not project-scoped: ${href}`);
        }
        // A FAQ block on the page is exactly what the FAQPage markup describes.
        const faq = graph.find((x) => x['@type'] === 'FAQPage');
        if (faq) assert.equal(d.querySelectorAll('.gx-faq h3').length, faq.mainEntity.length, `${route}: FAQ markup must match the visible questions`);
      }
    }
  });
});

test('every article-level number that comes from the dataset is computed, not typed', async () => {
  // The Florida piece quotes counts through {{wages.*}} placeholders; if the dataset changes the page follows.
  const n = await load('scripts/growth/news.mjs');
  const w = await load('scripts/growth/wages.mjs');
  const fl = n.NEWS.find((a) => a.slug.startsWith('florida-minimum-wage'));
  assert.match(fl.body, /\{\{wages\.at15States\}\}/);
  assert.equal(w.WAGE_FACTS.at15 - 1, 18);
});

test('atom feed and JSON index list every article with absolute URLs', async () => {
  const n = await load('scripts/growth/news.mjs');
  const files = n.newsArtifacts({ siteUrl: 'https://njohn931d-dotcom.github.io/bbbh' });
  const feed = files['news/feed.xml'];
  assert.match(feed, /^<\?xml/);
  assert.equal((feed.match(/<entry>/g) || []).length, n.NEWS.length);
  for (const a of n.NEWS) assert.ok(feed.includes(`https://njohn931d-dotcom.github.io/bbbh/news/${a.slug}/`));
  const json = JSON.parse(files['api/v1/news.json']);
  assert.equal(json.items.length, n.NEWS.length);
  assert.deepEqual(n.newsArtifacts({ siteUrl: '' }), {}, 'previews ship no discovery files');
});

test('post-build clean-up dedupes head tags, absolutises images, adds emoji and is idempotent', async () => {
  const p = await load('scripts/growth/postprocess.mjs');
  const site = 'https://njohn931d-dotcom.github.io/bbbh';
  const page = `<!doctype html><html lang="en"><head><title>Salary to Hourly Calculator</title>` +
    `<meta name="description" content="Convert salary to hourly pay."><meta property="og:title" content="Salary to Hourly Calculator">` +
    `<meta property="og:description" content="Convert."><meta property="og:type" content="website"><meta property="og:image" content="/og-image.png">` +
    `<meta name="twitter:image" content="/og-image.png"><meta name="twitter:card" content="summary_large_image">` +
    `<link href="https://fonts.googleapis.com/css2?family=DM+Sans&display=swap" rel="stylesheet">` +
    `<meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">` +
    `<meta property="og:image" content="${site}/og-image.png"><meta name="twitter:image" content="${site}/og-image.png"></head><body></body></html>`;
  const once = p.processHtml(page, { siteUrl: site, route: 'calculators/salary-to-hourly', isHome: false });
  const d = dom(once);
  for (const sel of ['meta[property="og:type"]', 'meta[name="twitter:card"]', 'meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    assert.equal(d.querySelectorAll(sel).length, 1, sel);
  }
  assert.equal(d.querySelector('meta[property="og:image"]').content, `${site}/og-image.png`);
  assert.match(d.querySelector('meta[property="og:title"]').content, /^💵 /);
  assert.match(d.querySelector('meta[name="description"]').content, /^💵 /);
  assert.equal(d.title, 'Salary to Hourly Calculator', 'legacy <title> elements are left alone');
  assert.ok(d.querySelector('meta[name="twitter:title"]'));
  assert.match(once, /media="print" onload="this\.media='all'"/);
  assert.equal(p.processHtml(once, { siteUrl: site, route: 'calculators/salary-to-hourly', isHome: false }), once, 'second pass changes nothing');
  const noindex = page.replace('<title>', '<meta name="robots" content="noindex, follow"><title>');
  assert.equal(p.processHtml(noindex, { siteUrl: site, route: 'embed/x', isHome: false }), noindex, 'noindex pages are skipped');
  const home = p.processHtml(page, { siteUrl: site, route: '', isHome: true });
  assert.match(home, /type="application\/atom\+xml"[^>]*news\/feed\.xml/);
});
