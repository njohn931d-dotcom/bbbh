const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('every dev.to post passes the publish contract', async () => {
  const { loadPosts, SITE_URL, extractLinks } = await import(path.join(root, 'scripts/devto/posts.mjs'));
  const posts = loadPosts();

  assert.ok(posts.length >= 1, 'expected at least one post in scripts/devto/posts/');

  for (const post of posts) {
    // loadPosts() already validates; these assertions document the contract.
    assert.ok(post.title.length <= 128, `${post.key}: title too long for dev.to`);
    assert.ok(post.tags.length <= 4, `${post.key}: dev.to allows at most 4 tags`);
    assert.ok(post.body.length >= 400, `${post.key}: body is thin enough to read as spam`);

    const { siteLinks, urls } = extractLinks(post.body);
    assert.ok(siteLinks.length >= 2, `${post.key}: needs at least 2 links back to ${SITE_URL}`);
    for (const url of urls) assert.ok(url.startsWith('https://'), `${post.key}: insecure link ${url}`);
  }
});

test('cover images referenced by posts exist in public/ and are web-sized', async () => {
  const { loadPosts } = await import(path.join(root, 'scripts/devto/posts.mjs'));
  const posts = loadPosts();

  for (const post of posts) {
    if (!post.coverPath) continue;
    const file = path.join(root, 'public', post.coverPath);
    assert.ok(fs.existsSync(file), `${post.key}: cover ${post.coverPath} is missing from public/`);
    const { size } = fs.statSync(file);
    assert.ok(size < 250 * 1024, `${post.key}: cover ${post.coverPath} is ${Math.round(size / 1024)} KB, keep dev.to covers under 250 KB`);
  }
});

test('post keys and titles are unique and titles do not collide with the site articles', async () => {
  const { loadPosts } = await import(path.join(root, 'scripts/devto/posts.mjs'));
  const posts = loadPosts();
  const keys = posts.map((p) => p.key);
  const titles = posts.map((p) => p.title.toLowerCase());

  assert.equal(new Set(keys).size, keys.length, 'duplicate post key');
  assert.equal(new Set(titles).size, titles.length, 'duplicate post title');
});

test('canonical URLs point at real generated routes', async () => {
  const { loadPosts, SITE_URL } = await import(path.join(root, 'scripts/devto/posts.mjs'));
  const { execFileSync } = require('node:child_process');

  // The generator writes .generated/ and public/sitemap.xml; run it the same way
  // the SEO test does so this check works from a clean checkout.
  execFileSync(process.execPath, ['scripts/generate-seo.mjs'], { cwd: root, env: { ...process.env, SITE_URL } });
  execFileSync(process.execPath, ['scripts/generate-parasite.mjs'], { cwd: root, env: { ...process.env, SITE_URL } });

  const sitemap = fs.readFileSync(path.join(root, 'public/sitemap.xml'), 'utf8');
  const urls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]));

  for (const post of loadPosts()) {
    if (!post.canonicalUrl) continue;
    assert.ok(
      urls.has(post.canonicalUrl) || urls.has(post.canonicalUrl.replace(/\/$/, '')),
      `${post.key}: canonical ${post.canonicalUrl} is not a route the build produces`,
    );
  }
});

test('publisher builds a dev.to payload and dedupes on canonical + title', async () => {
  const { buildPayload, dedupeKeys, normalizeTitle, parseArgs } = await import(path.join(root, 'scripts/devto-publish.mjs'));
  const { loadPosts } = await import(path.join(root, 'scripts/devto/posts.mjs'));
  const post = loadPosts()[0];

  const live = buildPayload(post, 'published', post.coverUrl).article;
  assert.equal(live.published, true);
  assert.deepEqual(live.tags, post.tags);
  assert.equal(live.main_image, post.coverUrl);
  assert.ok(live.body_markdown.includes('https://njohn931d-dotcom.github.io/bbbh'));

  const draft = buildPayload(post, 'draft', null).article;
  assert.equal(draft.published, false);
  assert.equal('main_image' in draft, false);

  // Re-running must not create a second copy: an existing article with the same
  // canonical URL or the same title (after normalization) blocks the post.
  const sameCanonical = { title: 'Something else entirely', canonical_url: live.canonical_url || 'https://example.com/x' };
  const existing = new Set(dedupeKeys(sameCanonical));
  const candidate = dedupeKeys({ title: post.title, canonical_url: post.canonicalUrl });
  assert.ok(candidate.some((key) => existing.has(key)) || !post.canonicalUrl);

  assert.equal(normalizeTitle('Hello, World!  2026'), 'hello world 2026');
  assert.equal(normalizeTitle('Hello, World! 2026'), normalizeTitle('hello world 2026'));

  assert.throws(() => parseArgs(['--state', 'publish']), /--state must be/);
  assert.throws(() => parseArgs(['--nope']), /Unknown argument/);
  assert.equal(parseArgs([]).state, 'published', 'default is a live publish');
  assert.equal(parseArgs(['--dry-run']).dryRun, true);
  assert.equal(parseArgs(['--offline']).dryRun, true, '--offline implies --dry-run');
});

test('publisher refuses to run without a key but renders offline', async () => {
  const { execFileSync } = require('node:child_process');
  const script = path.join(root, 'scripts/devto-publish.mjs');

  const offline = execFileSync(process.execPath, [script, '--offline'], { cwd: root, encoding: 'utf8' });
  assert.match(offline, /Offline render check/);
  assert.match(offline, /link\(s\) to https:\/\/njohn931d-dotcom\.github\.io\/bbbh/);

  assert.throws(
    () => execFileSync(process.execPath, [script, '--limit', '1'], { cwd: root, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, DEVTO_API_KEY: '' } }),
    /no dev\.to API key/,
  );
});

test('backlink audit counts site links in an article body, ignoring code blocks', async () => {
  const { auditArticle } = await import(path.join(root, 'scripts/devto-publish.mjs'));
  const site = 'https://njohn931d-dotcom.github.io/bbbh';
  const article = {
    title: 'A post',
    url: 'https://dev.to/someone/a-post',
    published: true,
    canonical_url: `${site}/calculators/cost-of-time/`,
    body_markdown: [
      `Markdown link: [cost of time](${site}/calculators/cost-of-time/)`,
      `Bare link: ${site}/guides/`,
      'Third party: https://example.com/should-not-count',
      '```',
      `${site}/inside-a-code-block-is-not-a-link`,
      '```',
    ].join('\n\n'),
  };

  const row = auditArticle(article, site);
  assert.equal(row.siteLinkCount, 2, 'only prose links count');
  assert.equal(row.linkCount, 3);
  assert.equal(row.canonicalPointsAtSite, true);
  assert.equal(row.published, true);

  const noBody = auditArticle({ title: 'draft', published: false }, site);
  assert.equal(noBody.bodyAvailable, false);
  assert.equal(noBody.siteLinkCount, 0);
});
