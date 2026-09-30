const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');

const ORIGIN = 'https://worth.example';

// One generation pass for the whole file; the generators are the unit under
// test, and running them once keeps the suite honest about what ships.
let pages;
test('setup: generate every page once', () => {
  execFileSync(process.execPath, ['scripts/generate-seo.mjs'], { env: { ...process.env, SITE_URL: ORIGIN } });
  execFileSync(process.execPath, ['scripts/generate-parasite.mjs'], { env: { ...process.env, SITE_URL: ORIGIN } });
  const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
  pages = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).map(url => {
    let pathname = new URL(url).pathname;
    try { pathname = decodeURIComponent(pathname); } catch { /* non-latin slugs */ }
    const file = pathname === '/' ? '.generated/home.html' : `.${pathname}index.html`;
    return { url, route: pathname, html: fs.readFileSync(file, 'utf8') };
  });
  assert.ok(pages.length >= 140, `expected the full site, got ${pages.length} URLs`);
});

const graphOf = html => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 1, 'exactly one JSON-LD block per page');
  return JSON.parse(blocks[0][1]);
};
const nodesOf = graph => (graph && Array.isArray(graph['@graph']) ? graph['@graph'] : [graph]);
const typesOf = node => [].concat(node['@type'] || []).map(String);
const find = (nodes, type) => nodes.find(n => typesOf(n).includes(type));
const textOf = html => (html.match(/<main>[\s\S]*?<\/main>/) || [html])[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('every page carries a structured-data graph that names the page, the site and the publisher', () => {
  for (const page of pages) {
    const graph = graphOf(page.html);
    assert.equal(graph['@context'], 'https://schema.org', `${page.route}: @context`);
    const nodes = nodesOf(graph);
    const types = nodes.flatMap(typesOf);
    assert.ok(types.includes('Organization'), `${page.route}: no Organization`);
    assert.ok(types.includes('WebSite'), `${page.route}: no WebSite`);
    assert.ok(
      ['WebApplication', 'Article', 'TechArticle', 'WebPage', 'CollectionPage'].some(t => types.includes(t)),
      `${page.route}: graph never describes the page itself (has ${types.join(',')})`
    );
    if (page.route !== '/') {
      assert.ok(types.includes('BreadcrumbList'), `${page.route}: no BreadcrumbList`);
      const crumb = find(nodes, 'BreadcrumbList');
      const items = crumb.itemListElement;
      items.forEach((item, i) => assert.equal(item.position, i + 1, `${page.route}: breadcrumb positions must run 1..n`));
      for (const item of items) {
        assert.match(item.item, /^https:\/\//, `${page.route}: breadcrumb item must be absolute`);
      }
      // Routes are compared decoded: several slugs are non-Latin and the
      // schema serialises them percent-encoded.
      const crumbPath = decodeURIComponent(new URL(items[items.length - 1].item).pathname);
      assert.equal(crumbPath, page.route, `${page.route}: breadcrumb must end on the page itself`);
    }
    for (const node of nodes) {
      for (const field of ['url', '@id']) {
        if (typeof node[field] === 'string') {
          assert.match(node[field], /^https:\/\//, `${page.route}: ${typesOf(node)[0]}.${field} is not absolute`);
        }
      }
    }
  }
});

test('the Organization node describes this project and nothing it does not own', () => {
  for (const page of pages) {
    const org = find(nodesOf(graphOf(page.html)), 'Organization');
    assert.equal(org.name, 'Worth', `${page.route}: publisher name`);
    assert.ok(Array.isArray(org.logo) || typeof org.logo === 'string', `${page.route}: Organization needs a logo for a knowledge panel`);
    assert.match(String(org.logo), /^https:\/\/worth\.example\/logo\.svg$/, `${page.route}: logo should be the site's own absolute logo`);
    for (const profile of org.sameAs) {
      assert.match(String(profile), /^https:\/\/github\.com\/njohn931d-dotcom\//, `${page.route}: sameAs may only claim profiles this project controls, got ${profile}`);
    }
  }
});

test('no FAQ is marked up unless the page actually shows it, and no answer is a reused description', () => {
  let marked = 0;
  for (const page of pages) {
    const nodes = nodesOf(graphOf(page.html));
    const faq = find(nodes, 'FAQPage');
    if (!faq) continue;
    marked++;
    const visible = textOf(page.html);
    const description = (page.html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    assert.ok(/<details|<h2|<h3/.test(page.html), `${page.route}: FAQPage markup with no FAQ visible`);
    const names = faq.mainEntity.map(q => q.name);
    assert.equal(new Set(names).size, names.length, `${page.route}: FAQPage repeats a question`);
    for (const question of faq.mainEntity) {
      assert.ok(visible.includes(question.name), `${page.route}: "${question.name}" is marked up but not shown`);
      const answer = question.acceptedAnswer.text;
      assert.ok(answer.length >= 40, `${page.route}: answer for "${question.name}" is ${answer.length} chars`);
      assert.notEqual(answer, description, `${page.route}: answer for "${question.name}" is the meta description`);
    }
    assert.ok(names.length >= 2, `${page.route}: a one-question FAQ is not worth the markup`);
  }
  // 57 of 142 pages have a real FAQ in the content model, and only those are
  // marked up. A lower floor means the generators stopped wiring faqs through;
  // the ceiling is the point: no page may invent one.
  assert.ok(marked >= 50, `expected every page with real FAQs to be marked up, got ${marked}`);
});

test('structured data never invents reputation', () => {
  for (const page of pages) {
    for (const banned of ['aggregateRating', 'reviewRating', '"@type":"Review"', 'wikipedia']) {
      assert.ok(!page.html.includes(banned), `${page.route}: markup contains ${banned}`);
    }
  }
});

test('articles carry author, publisher and dates; guides and tools agree with them', () => {
  for (const page of pages) {
    const nodes = nodesOf(graphOf(page.html));
    for (const type of ['Article', 'TechArticle']) {
      const node = find(nodes, type);
      if (!node) continue;
      for (const field of ['headline', 'datePublished', 'dateModified', 'author', 'publisher', 'inLanguage', 'isAccessibleForFree']) {
        assert.ok(node[field], `${page.route}: ${type} is missing ${field}`);
      }
      assert.ok(node.dateModified >= node.datePublished, `${page.route}: dateModified precedes datePublished`);
      assert.deepEqual(node.author, { '@id': ORIGIN + '/#organization' }, `${page.route}: author must resolve to the Organization node`);
      assert.match(node.license, /^https:\/\/opensource\.org\/licenses\/MIT$/);
    }
  }
});

test('translated pages describe language and point at the language they translate', () => {
  const nonEnglish = pages.filter(p => {
    const graph = graphOf(p.html);
    const page = find(nodesOf(graph), 'WebPage') || find(nodesOf(graph), 'WebApplication');
    return page && page.inLanguage && page.inLanguage !== 'en';
  });
  assert.ok(nonEnglish.length >= 9, `expected the ten translated pages to declare a language, found ${nonEnglish.length}`);
  for (const page of nonEnglish) {
    const nodes = nodesOf(graphOf(page.html));
    const htmlLang = (page.html.match(/<html lang="([^"]+)"/) || [])[1];
    const primary = find(nodes, 'WebApplication') || find(nodes, 'WebPage');
    assert.equal(primary.inLanguage, htmlLang, `${page.route}: inLanguage must match <html lang>`);
  }
});

test('widgets: a chromeless copy of every calculator, kept out of the index, pointing home', async () => {
  const { buildEmbedPages, widgetSnippet, iframeSnippet } = require('../scripts/build-embed.mjs');
  // Build a miniature dist from the generated pages: one tool, its assets.
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'worth-embed-'));
  fs.mkdirSync(path.join(tmp, 'calculators', 'cost-of-time'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'calculators', 'cost-of-time', 'index.html'), pages.find(p => p.route === '/calculators/cost-of-time/').html);
  const tools = buildEmbedPages(tmp, { siteUrl: 'https://worth.example', base: '/' });
  assert.equal(tools.length, 1);
  const widget = fs.readFileSync(path.join(tmp, 'embed', 'cost-of-time', 'index.html'), 'utf8');
  const dom = new JSDOM(widget);
  assert.match(widget, /content="noindex, follow"/, 'widget must stay out of the index');
  assert.equal(dom.window.document.querySelector('link[rel=canonical]').getAttribute('href'), 'https://worth.example/calculators/cost-of-time/', 'widget must canonicalise onto the tool');
  assert.ok(widget.includes('<section id="calculator"'), 'widget must contain the real calculator markup');
  assert.ok(!/<header>/.test(widget), 'widget must not carry the site header');
  assert.ok(!/<footer>/.test(widget), 'widget must not carry the site footer');
  assert.ok(widget.includes('worth-embed-resize'), 'widget must report its height to the host page');
  const back = [...widget.matchAll(/<a[^>]+href="([^"]+)"/g)].map(m => m[1]);
  assert.ok(back.includes('https://worth.example/calculators/cost-of-time/'), 'widget must link back to the full tool');
  // The double-prefix bug: siteUrl already contains the project path.
  const proj = widgetSnippet('cost-of-time', { siteUrl: 'https://host.dev/repo', base: '/repo/' });
  assert.ok(!proj.includes('/repo/repo'), `snippet double-prefixed the base path: ${proj}`);
  assert.ok(proj.includes('https://host.dev/repo/embed/widget.js'), proj);
  const frame = iframeSnippet('cost-of-time', { siteUrl: 'https://host.dev/repo', base: '/repo/' });
  assert.ok(!frame.includes('/repo/repo'), 'iframe snippet double-prefixed the base path');
  const gallery = fs.readFileSync(path.join(tmp, 'embed', 'index.html'), 'utf8');
  const galleryText = gallery.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  assert.ok(galleryText.includes('<div data-worth-embed="cost-of-time"></div>'), 'gallery must show the one-line paste form');
  assert.ok(galleryText.includes('<script async src="https://worth.example/embed/widget.js" data-tool="cost-of-time"></script>'), 'gallery must show the loader tag');
  assert.ok(gallery.includes('<iframe src="https://worth.example/embed/cost-of-time/"'), 'gallery must preview the widget live');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('the embed loader in public/ is the loader the generator ships', () => {
  const { WIDGET_JS } = require('../scripts/build-embed.mjs');
  const shipped = fs.readFileSync('public/embed/widget.js', 'utf8');
  assert.equal(shipped, WIDGET_JS, 'public/embed/widget.js is stale - run: npm run embed:sync');
  assert.match(WIDGET_JS, /addEventListener\('message'/, 'loader must listen for the widget height and resize the iframe');
  assert.match(WIDGET_JS, /data-worth-embed/, 'loader must mount on a data attribute');
});

test('the calculator UI offers the embed code, with the numbers on screen', () => {
  const app = fs.readFileSync('app.js', 'utf8');
  const html = fs.readFileSync('index.html', 'utf8');
  assert.ok(html.includes('id="embed-tool"'), 'no Embed button in the result panel');
  assert.match(app, /function widgetSlug\(\)/, 'app.js lost the slug resolver');
  assert.match(app, /embed\/\$\{widgetSlug\(\)\}\/#\$\{state\}/, 'embed snippet must carry the current inputs');
  assert.match(app, /navigator\.clipboard\.writeText\(code\)/, 'embed button must copy the snippet');
});
