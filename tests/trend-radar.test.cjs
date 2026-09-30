const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const radar = () => import(path.join(ROOT, 'scripts/trend-radar.mjs'));

const RSS = `<?xml version="1.0"?><rss xmlns:ht="https://trends.google.com/trending/rss"><channel>
<item><title>Disney Plus price increase</title><ht:approx_traffic>200,000+</ht:approx_traffic><ht:news_item_title><![CDATA[Disney hikes prices again &amp; again]]></ht:news_item_title></item>
<item><title>Some actor dies</title><ht:approx_traffic>500,000+</ht:approx_traffic></item>
<item><title>Costco membership fee</title><ht:approx_traffic>50,000+</ht:approx_traffic></item>
<item><title>Local weather</title><ht:approx_traffic>2,000+</ht:approx_traffic></item>
</channel></rss>`;

test('parses Google Trends RSS including CDATA, entities and traffic', async () => {
  const { parseTrendsRss } = await radar();
  const t = parseTrendsRss(RSS);
  assert.equal(t.length, 4);
  assert.equal(t[0].title, 'Disney Plus price increase');
  assert.equal(t[0].traffic, 200000);
  assert.equal(t[0].context, 'Disney hikes prices again & again');
});

test('parses Wikipedia most-read and drops meta pages', async () => {
  const { parseWikipediaTop } = await radar();
  const t = parseWikipediaTop({ items: [{ articles: [
    { article: 'Main_Page', views: 9e6 }, { article: 'Special:Search', views: 8e6 },
    { article: 'Netflix', views: 123456 }, { article: 'GTA_VI', views: 99999 },
  ] }] });
  assert.deepEqual(t.map((x) => x.title), ['Netflix', 'GTA VI']);
  assert.equal(parseWikipediaTop({}).length, 0, 'an unexpected payload yields no topics instead of throwing');
});

test('scores money topics above hard news and skips what is already covered', async () => {
  const { parseTrendsRss, rank, scoreTopic } = await radar();
  const topics = parseTrendsRss(RSS);
  const disney = scoreTopic(topics[0]);
  const death = scoreTopic(topics[1]);
  assert.ok(disney.score > death.score);
  assert.ok(death.score < 3, 'an obituary is not an explainer candidate');
  const fresh = rank(topics, { covered: [] });
  assert.deepEqual(fresh.candidates.map((t) => t.title).slice(0, 2), ['Disney Plus price increase', 'Costco membership fee']);
  const covered = rank(topics, { covered: ['Disney+ and Hulu prices went up', 'disney plus price increase'] });
  assert.ok(!covered.candidates.some((t) => /Disney/.test(t.title)), 'a topic the site already covers is not suggested again');
  assert.ok(covered.skipped.some((t) => /Disney/.test(t.title)));
});

test('the same topic from two sources is merged', async () => {
  const { rank } = await radar();
  const { candidates } = rank([
    { title: 'iPhone 18 price', traffic: 1000, source: 'Google Trends' },
    { title: 'iPhone 18 Price', traffic: 50, source: 'Hacker News' },
  ]);
  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0].sources.sort(), ['Google Trends', 'Hacker News']);
});

test('freshness flags a stale dataset, a change that took effect and past releases', async () => {
  const { freshness } = await radar();
  const wage = JSON.parse(fs.readFileSync(path.join(ROOT, 'datasets/minimum-wage.json'), 'utf8'));
  const movies = JSON.parse(fs.readFileSync(path.join(ROOT, 'datasets/movies.json'), 'utf8'));
  const news = [{ published: '2026-09-30' }];
  const today = freshness({ wage, movies, news, today: '2026-10-01' });
  assert.ok(today.every((f) => f.ok), 'everything is current the day after the data was checked');
  const later = freshness({ wage, movies, news, today: '2027-01-02' });
  assert.ok(later.some((f) => !f.ok && /took effect|Announced rates are now due/.test(f.text)), 'January 1 increases must be flagged');
  assert.ok(later.some((f) => !f.ok && /Already released/.test(f.text)) || later.some((f) => !f.ok && /Movie data/.test(f.text)));
});

test('the report says nothing is published automatically and lists each source status', async () => {
  const { renderReport } = await radar();
  const md = renderReport({
    candidates: [{ title: 'Costco membership fee', why: ['mentions a price, wage, fee or cost'], sources: ['Google Trends'], score: 5, traffic: 1 }],
    skipped: [], status: [{ name: 'Google Trends (US)', ok: true, detail: '4 items' }, { name: 'Hacker News', ok: false, detail: 'HTTP 503' }],
    fresh: [{ ok: true, text: 'fine' }], generated: '2026-10-01 06:23 UTC',
  });
  assert.match(md, /Nothing here is published automatically/);
  assert.match(md, /What does Costco membership fee cost in hours of work\?/);
  assert.match(md, /❌ Hacker News: HTTP 503/);
});

test('the radar workflow opens an issue and never commits or pushes', () => {
  const y = fs.readFileSync(path.join(ROOT, '.github/workflows/trend-radar.yml'), 'utf8');
  assert.match(y, /schedule:/);
  assert.match(y, /issues: write/);
  assert.match(y, /contents: read/);
  assert.doesNotMatch(y, /git push|git commit|contents: write/);
});
