#!/usr/bin/env node
/**
 * Trend radar: finds topics in the news cycle that Worth can answer with its one
 * question, "what does this cost in hours of work?", and checks whether the
 * site's dated datasets have gone stale. It uses free sources that need no key
 * and it never publishes anything: a person picks a candidate, verifies the
 * facts against primary sources and adds a file to content/news/.
 *
 *   node scripts/trend-radar.mjs                 # fetch live sources, write seo-reports/trend-radar.md
 *   node scripts/trend-radar.mjs --out some/dir  # choose the output folder
 *
 * Sources: Google Trends daily RSS (US), Wikimedia most-read articles, Hacker
 * News top stories. Each source may fail independently; the report says which.
 * The scoring and parsing functions are pure and covered by tests/trend-radar.test.cjs.
 */
import fs from 'node:fs';
import path from 'node:path';

const UA = 'worth-trend-radar/1.0 (https://github.com/njohn931d-dotcom/bbbh)';

// ------------------------------------------------------------------ parsing

const decode = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').trim();

/** Google Trends daily RSS -> [{title, traffic, source}] */
export function parseTrendsRss(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const item = m[1];
    const title = decode((item.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    const traffic = decode((item.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/) || [])[1] || '');
    const news = decode((item.match(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/) || [])[1] || '');
    return { title, traffic: Number(traffic.replace(/[^\d]/g, '')) || 0, context: news, source: 'Google Trends' };
  }).filter(t => t.title);
}

const WIKI_META = /^(Main_Page|Special:|Wikipedia:|Portal:|Help:|File:|Category:|Talk:|-$)/;
/** Wikimedia top-pageviews JSON -> [{title, traffic, source}] */
export function parseWikipediaTop(json) {
  const articles = (json && json.items && json.items[0] && json.items[0].articles) || [];
  return articles.filter(a => !WIKI_META.test(a.article)).slice(0, 60)
    .map(a => ({ title: a.article.replaceAll('_', ' '), traffic: a.views || 0, context: '', source: 'Wikipedia most read' }));
}

/** Hacker News items -> [{title, traffic, source}] */
export function parseHackerNews(items) {
  return items.filter(i => i && i.title).map(i => ({ title: i.title, traffic: i.score || 0, context: '', source: 'Hacker News' }));
}

// ------------------------------------------------------------------ scoring

/** Words that signal a money question someone could answer in hours of work. */
const COST_WORDS = /\b(price|prices|pricing|cost|costs|fee|fees|tax|taxes|wage|wages|salary|pay|raise|hike|increase|subscription|subscriptions|ticket|tickets|launch|release|deal|sale|refund|rent|mortgage|rate|rates|inflation|tariff|tariffs|stimulus|cola|overtime|bonus|layoff|layoffs|strike|discount|cheaper|expensive)\b/i;
/** Consumer brands and products people convert into hours of work. */
const CONSUMER = /\b(iphone|ipad|apple|netflix|disney|hulu|spotify|youtube|hbo|peacock|paramount|amazon|walmart|costco|starbucks|mcdonald|target|tesla|ford|toyota|playstation|xbox|nintendo|switch|gta|steam|taylor swift|concert|super bowl|world cup|olympics|halloween|black friday|thanksgiving|christmas|student loan|social security|medicare|gas|rent)\b/i;
/** Topics that are news but not a fit: no purchase, wage or price to convert. */
const OFF_TOPIC = /\b(died|dies|death|killed|shooting|arrested|trial|verdict|earthquake|hurricane|war|attack|election results)\b/i;

export function scoreTopic(t) {
  const hay = `${t.title} ${t.context || ''}`;
  let score = 0; const why = [];
  if (COST_WORDS.test(hay)) { score += 3; why.push('mentions a price, wage, fee or cost'); }
  if (CONSUMER.test(hay)) { score += 2; why.push('names a product or brand people buy'); }
  if (/\$\s?\d/.test(hay)) { score += 2; why.push('contains a dollar figure'); }
  if (OFF_TOPIC.test(hay)) { score -= 4; why.push('looks like hard news with nothing to convert'); }
  if (t.traffic >= 100000) score += 2; else if (t.traffic >= 10000) score += 1;
  return { ...t, score, why };
}

/** Merge the same topic seen in several sources and keep the best-scored copy. */
export function rank(topics, { covered = [], limit = 15 } = {}) {
  const coveredText = covered.join(' ').toLowerCase();
  const seen = new Map();
  for (const t of topics.map(scoreTopic)) {
    const key = t.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const prior = seen.get(key);
    if (!prior || t.score > prior.score) seen.set(key, { ...t, sources: [...new Set([...(prior?.sources || []), t.source])] });
    else prior.sources = [...new Set([...prior.sources, t.source])];
  }
  const all = [...seen.values()];
  const isCovered = t => t.title.toLowerCase().split(/\s+/).filter(w => w.length > 3).some(w => coveredText.includes(w)) && coveredText.includes(t.title.toLowerCase().split(/\s+/)[0]);
  return {
    candidates: all.filter(t => t.score >= 3 && !isCovered(t)).sort((a, b) => b.score - a.score || b.traffic - a.traffic).slice(0, limit),
    skipped: all.filter(t => isCovered(t)).slice(0, 10),
  };
}

// ---------------------------------------------------------------- freshness

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

/** Are the dated datasets still current? `today` is an ISO date. */
export function freshness({ wage, movies, news, today }) {
  const out = [];
  const age = daysBetween(wage.asOf, today);
  out.push({ ok: age <= 90, text: `Minimum wage dataset is dated ${wage.asOf} (${age} days old)${age > 90 ? '. Re-check the Department of Labor table and update datasets/minimum-wage.json.' : '.'}` });
  const due = wage.jurisdictions.filter(j => j.next && j.next.date <= today && j.next.date > wage.asOf);
  if (due.length) out.push({ ok: false, text: `Scheduled wage changes have taken effect since the dataset date: ${due.map(j => `${j.name} (${j.next.date})`).join(', ')}. Update the dataset so pages stop calling them upcoming.` });
  const pending = wage.jurisdictions.filter(j => j.next && j.next.rate == null && j.next.date <= today);
  if (pending.length) out.push({ ok: false, text: `Announced rates are now due: ${pending.map(j => j.name).join(', ')}. Add the published amounts.` });
  const mage = daysBetween(movies.asOf, today);
  out.push({ ok: mage <= 45, text: `Movie data is dated ${movies.asOf} (${mage} days old)${mage > 45 ? '. Refresh release dates and trailer ids, and verify ids with YouTube oEmbed.' : '.'}` });
  const released = movies.movies.filter(m => m.release < today);
  if (released.length) out.push({ ok: false, text: `Already released, consider rewording or archiving: ${released.map(m => m.title).join(', ')}.` });
  const newest = news.reduce((m, a) => (a.published > m ? a.published : m), '0000-00-00');
  const nage = daysBetween(newest, today);
  out.push({ ok: nage <= 14, text: `Newest news explainer is from ${newest} (${nage} days ago)${nage > 14 ? '. A fresh piece keeps the news feed and hub current.' : '.'}` });
  return out;
}

// ------------------------------------------------------------------- report

export function renderReport({ candidates, skipped, status, fresh, generated }) {
  const rows = candidates.map((t, i) => `| ${i + 1} | **${t.title.replaceAll('|', '/')}** | ${t.why.join('; ') || '-'} | ${t.sources.join(', ')} | What does ${t.title.replaceAll('|', '/')} cost in hours of work? |`);
  return [
    '# Trend radar: explainer candidates', '',
    `_Generated ${generated}. Nothing here is published automatically. Pick a topic, verify every number against a primary source, then add a file to \`content/news/\` (see docs/GROWTH_ENGINE.md)._`, '',
    '## Top candidates', '',
    candidates.length ? '| # | Topic | Why it scored | Seen in | Suggested angle |\n| --- | --- | --- | --- | --- |\n' + rows.join('\n') : '_No topic cleared the bar today._', '',
    ...(skipped.length ? ['## Looks already covered', '', skipped.map(t => `- ${t.title}`).join('\n'), ''] : []),
    '## Data freshness', '', fresh.map(f => `- ${f.ok ? '✅' : '⚠️'} ${f.text}`).join('\n'), '',
    '## Source status', '', status.map(s => `- ${s.ok ? '✅' : '❌'} ${s.name}: ${s.detail}`).join('\n'), '',
    '## Turning a candidate into an article', '',
    '1. Find the primary source (company announcement, government table, official release).',
    '2. Copy an existing file in `content/news/`; keep at least two sources and two FAQ entries.',
    '3. Use `::hours <price> | <label>` for the hours-of-work table instead of typing the arithmetic.',
    '4. Run `npm test` and `npm run build:verify`. The build fails on a missing source or a broken link.', '',
  ].join('\n');
}

// -------------------------------------------------------------------- fetch

async function getText(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function collect() {
  const topics = []; const status = [];
  const add = async (name, fn) => {
    try { const got = await fn(); topics.push(...got); status.push({ name, ok: true, detail: `${got.length} items` }); }
    catch (e) { status.push({ name, ok: false, detail: e.message }); }
  };
  await add('Google Trends (US)', async () => {
    let xml;
    try { xml = await getText('https://trends.google.com/trending/rss?geo=US'); }
    catch { xml = await getText('https://trends.google.com/trends/trendingsearches/daily/rss?geo=US'); }
    return parseTrendsRss(xml);
  });
  await add('Wikipedia most read', async () => {
    const d = new Date(Date.now() - 2 * 864e5);
    const p = n => String(n).padStart(2, '0');
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}`;
    return parseWikipediaTop(JSON.parse(await getText(url)));
  });
  await add('Hacker News', async () => {
    const ids = JSON.parse(await getText('https://hacker-news.firebaseio.com/v0/topstories.json')).slice(0, 25);
    const items = await Promise.all(ids.map(id => getText(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(JSON.parse).catch(() => null)));
    return parseHackerNews(items);
  });
  return { topics, status };
}

async function main() {
  const args = process.argv.slice(2);
  const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'seo-reports';
  const { topics, status } = await collect();
  const { NEWS } = await import('./growth/news.mjs');
  const wage = JSON.parse(fs.readFileSync(new URL('../datasets/minimum-wage.json', import.meta.url), 'utf8'));
  const movies = JSON.parse(fs.readFileSync(new URL('../datasets/movies.json', import.meta.url), 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const covered = NEWS.flatMap(a => [a.title, ...a.keywords]);
  const { candidates, skipped } = rank(topics, { covered });
  const report = renderReport({ candidates, skipped, status, fresh: freshness({ wage, movies, news: NEWS, today }), generated: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC' });
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'trend-radar.md'), report);
  fs.writeFileSync(path.join(out, 'trend-radar.json'), JSON.stringify({ generated: today, candidates, skipped, status }, null, 2));
  console.log(report);
  if (status.every(s => !s.ok)) { console.error('All sources failed.'); process.exitCode = 1; }
}

if (process.argv[1]?.endsWith('trend-radar.mjs')) main();
