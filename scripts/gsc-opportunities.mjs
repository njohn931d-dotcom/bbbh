#!/usr/bin/env node
/**
 * Private Google Search Console opportunity report.
 *
 * This is an editorial/research aid, not a content publisher. It compares two
 * settled Search Console windows and surfaces rising queries, pages with
 * impressions around positions 4–20, declining queries, cannibalized URLs and
 * countries where real impressions may justify localization.
 *
 * No third-party package or browser tracking is used. Credentials are read
 * from GSC_SERVICE_ACCOUNT_JSON or --credentials=FILE and are never written.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DEFAULT_DAYS = 28;
const DEFAULT_LAG_DAYS = 3;
const MAX_ROWS = 25_000;
const DIMENSIONS = ['query', 'page', 'country'];
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_ROOT = 'https://searchconsole.googleapis.com/webmasters/v3/sites';

const iso = date => date.toISOString().slice(0, 10);
const dateAtUtc = (date, delta) => {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + delta);
  return out;
};

export function normalizeSiteProperty(value) {
  const property = String(value || '').trim();
  if (!property) throw new Error('A Search Console property is required');
  return property.startsWith('sc-domain:') ? property : property.replace(/\/+$/, '') + '/';
}

export function performanceWindows(now = new Date(), days = DEFAULT_DAYS, lagDays = DEFAULT_LAG_DAYS) {
  if (!Number.isInteger(days) || days < 7 || days > 90) throw new Error('days must be an integer from 7 to 90');
  if (!Number.isInteger(lagDays) || lagDays < 0 || lagDays > 7) throw new Error('lagDays must be an integer from 0 to 7');
  const end = dateAtUtc(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), -lagDays);
  const start = dateAtUtc(end, -(days - 1));
  const previousEnd = dateAtUtc(start, -1);
  const previousStart = dateAtUtc(previousEnd, -(days - 1));
  return {
    current: { startDate: iso(start), endDate: iso(end) },
    previous: { startDate: iso(previousStart), endDate: iso(previousEnd) },
  };
}

function numeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function aggregateRows(rows = []) {
  const grouped = new Map();
  for (const row of rows) {
    const [query = '', page = '', country = ''] = row.keys || [];
    const key = [query, page, country].join('\u001f');
    const item = grouped.get(key) || { query, page, country, clicks: 0, impressions: 0, positionTotal: 0 };
    const impressions = numeric(row.impressions);
    item.clicks += numeric(row.clicks);
    item.impressions += impressions;
    item.positionTotal += numeric(row.position) * impressions;
    grouped.set(key, item);
  }
  return [...grouped.values()].map(item => ({
    ...item,
    ctr: item.impressions ? item.clicks / item.impressions : 0,
    position: item.impressions ? item.positionTotal / item.impressions : 0,
  }));
}

const queryKey = row => `${row.query}\u001f${row.country}`;
const queryPageKey = row => `${row.query}\u001f${row.page}\u001f${row.country}`;
const sumMetrics = rows => rows.reduce((a, row) => ({
  clicks: a.clicks + row.clicks,
  impressions: a.impressions + row.impressions,
}), { clicks: 0, impressions: 0 });
const pct = value => `${(value * 100).toFixed(1)}%`;
const num = value => Math.round(value).toLocaleString('en-US');
const pos = value => value ? value.toFixed(1) : '—';
const cell = value => String(value ?? '').replace(/[|\r\n]/g, ' ').replace(/`/g, "'");
const markdownTable = (headers, rows) => rows.length
  ? `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map(row => `| ${row.map(cell).join(' | ')} |`).join('\n')}`
  : '_No rows met the signal threshold in this period._';

function topPage(rows) {
  return [...rows].sort((a, b) => b.impressions - a.impressions)[0]?.page || '';
}

export function buildOpportunityReport(currentRows, previousRows, {
  siteUrl = 'Search Console property',
  windows,
  generatedAt = new Date(),
  minImpressions = 20,
} = {}) {
  const current = aggregateRows(currentRows);
  const previous = aggregateRows(previousRows);
  const currentByKey = new Map(current.map(row => [queryPageKey(row), row]));
  const previousByKey = new Map(previous.map(row => [queryPageKey(row), row]));

  const currentQueries = new Map();
  const previousQueries = new Map();
  for (const row of current) {
    const key = queryKey(row);
    const group = currentQueries.get(key) || { query: row.query, country: row.country, rows: [] };
    group.rows.push(row);
    currentQueries.set(key, group);
  }
  for (const row of previous) {
    const key = queryKey(row);
    const group = previousQueries.get(key) || { query: row.query, country: row.country, rows: [] };
    group.rows.push(row);
    previousQueries.set(key, group);
  }

  const rankingOpportunities = current
    .filter(row => row.query && row.page && row.impressions >= minImpressions && row.position >= 4 && row.position <= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 30)
    .map(row => [row.query, row.country.toUpperCase(), num(row.impressions), pos(row.position), pct(row.ctr), row.page]);

  const rising = [];
  const declining = [];
  for (const [key, group] of currentQueries) {
    if (!group.query) continue;
    const now = sumMetrics(group.rows);
    const before = sumMetrics(previousQueries.get(key)?.rows || []);
    const delta = now.impressions - before.impressions;
    const rate = before.impressions ? delta / before.impressions : Infinity;
    if (now.impressions >= 10 && delta >= 8 && (before.impressions < 3 || rate >= 0.35)) {
      rising.push({ group, now, before, delta, rate });
    }
    if (before.impressions >= 20 && now.impressions <= before.impressions * 0.7) {
      declining.push({ group, now, before, delta });
    }
  }
  rising.sort((a, b) => b.delta - a.delta);
  declining.sort((a, b) => a.delta - b.delta);

  const cannibalized = [];
  for (const [key, group] of currentQueries) {
    const pages = [...new Map(group.rows.filter(row => row.page).map(row => [row.page, row])).values()];
    const metrics = sumMetrics(group.rows);
    if (pages.length > 1 && metrics.impressions >= 50) {
      cannibalized.push({ query: group.query, country: group.country, pages, metrics });
    }
  }
  cannibalized.sort((a, b) => b.metrics.impressions - a.metrics.impressions);

  const countries = new Map();
  for (const row of current) {
    if (!row.country) continue;
    const item = countries.get(row.country) || { country: row.country, clicks: 0, impressions: 0, pages: new Set() };
    item.clicks += row.clicks;
    item.impressions += row.impressions;
    if (row.page) item.pages.add(row.page);
    countries.set(row.country, item);
  }
  const countryRows = [...countries.values()]
    .filter(item => item.country !== 'usa' && item.impressions >= minImpressions)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15)
    .map(item => [item.country.toUpperCase(), num(item.impressions), num(item.clicks), String(item.pages.size)]);

  const totalCurrent = sumMetrics(current);
  const totalPrevious = sumMetrics(previous);
  const clickDelta = totalCurrent.clicks - totalPrevious.clicks;
  const impressionDelta = totalCurrent.impressions - totalPrevious.impressions;
  const windowsText = windows
    ? `${windows.current.startDate} to ${windows.current.endDate} vs ${windows.previous.startDate} to ${windows.previous.endDate}`
    : 'the selected periods';

  const risingRows = rising.slice(0, 20).map(({ group, now, before, delta }) => [
    group.query, group.country.toUpperCase(), num(before.impressions), num(now.impressions), `+${num(delta)}`, topPage(group.rows),
  ]);
  const decliningRows = declining.slice(0, 20).map(({ group, now, before, delta }) => [
    group.query, group.country.toUpperCase(), num(before.impressions), num(now.impressions), num(delta), topPage(group.rows),
  ]);
  const cannibalRows = cannibalized.slice(0, 15).map(item => [
    item.query, item.country.toUpperCase(), num(item.metrics.impressions), item.pages.map(row => `${row.page} (${num(row.impressions)})`).join('<br>'),
  ]);

  return `# Search Console opportunity report\n\n` +
    `- Property: ${siteUrl}\n- Compared windows: ${windowsText}\n- Generated: ${iso(generatedAt)}\n- Scope: Web search, query + landing page + country; at most ${MAX_ROWS.toLocaleString()} API rows per window.\n\n` +
    `## Returned query rows (not complete property totals)\n\n` +
    `Search Console can omit anonymized queries and this report caps returned rows; the snapshot compares API-returned rows, not complete site-wide traffic totals.\n\n` +
    `| Metric | Current | Previous | Change |\n| --- | ---: | ---: | ---: |\n` +
    `| Clicks | ${num(totalCurrent.clicks)} | ${num(totalPrevious.clicks)} | ${clickDelta >= 0 ? '+' : ''}${num(clickDelta)} |\n` +
    `| Impressions | ${num(totalCurrent.impressions)} | ${num(totalPrevious.impressions)} | ${impressionDelta >= 0 ? '+' : ''}${num(impressionDelta)} |\n\n` +
    `## Queries to review (positions 4–20)\n\n` +
    `These have meaningful impressions and are not yet consistently near the top. Inspect the actual page and search intent before changing copy; a position is an average, not a guarantee.\n\n` +
    markdownTable(['Query', 'Country', 'Impressions', 'Avg position', 'CTR', 'Landing page'], rankingOpportunities) + '\n\n' +
    `## Rising queries — possible timely demand\n\n` +
    `These are Search Console signals, not proof of a news trend. Verify any event, policy, release date, price or claim from a primary source before publishing. Never auto-publish a page from a query spike.\n\n` +
    markdownTable(['Query', 'Country', 'Previous imp.', 'Current imp.', 'Change', 'Best current page'], risingRows) + '\n\n' +
    `## Queries losing impressions\n\n` +
    markdownTable(['Query', 'Country', 'Previous imp.', 'Current imp.', 'Change', 'Best current page'], decliningRows) + '\n\n' +
    `## Possible query cannibalization\n\n` +
    `Review whether the listed URLs satisfy different intents. Consolidate or clarify only when the pages genuinely overlap; do not merge distinct localized or tool pages just to reduce URL count.\n\n` +
    markdownTable(['Query', 'Country', 'Combined impressions', 'Current landing pages'], cannibalRows) + '\n\n' +
    `## Countries with search demand\n\n` +
    `Treat this as a localization research signal. Translate only when the underlying tool, assumptions, currency and local rules can also be localized and reviewed by a fluent speaker.\n\n` +
    markdownTable(['Country', 'Impressions', 'Clicks', 'Pages seen'], countryRows) + '\n\n' +
    `## Next actions\n\n` +
    `1. Pick at most 3 query/page pairs above; compare the page with the live result and answer the same intent more clearly.\n` +
    `2. Check Search Console URL inspection and indexing after substantive edits; do not resubmit unchanged URLs repeatedly.\n` +
    `3. For a news or event angle, publish only when it naturally fits Worth (for example, a verified change to a streaming price or the cost of attending an event) and add original math, assumptions, sources and an update policy.\n` +
    `4. Movie-trailer searches are a different topic. Do not make unrelated trailer pages; a film/streaming cost analysis is in-scope only when it answers a real reader money question.\n` +
    `5. This report contains private Search Console performance data. Keep it in a restricted artifact; do not commit or publish it.\n`;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

async function fetchWithRetry(url, options, label, fetchImpl = fetch) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(30_000) });
    if (response.ok) return response;
    const text = await response.text();
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 30_000) : (500 * 2 ** attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    throw new Error(`${label} failed (${response.status}): ${text.slice(0, 500)}`);
  }
  throw new Error(`${label} failed after retries`);
}

async function accessToken(credentials) {
  if (!credentials.client_email || !credentials.private_key) throw new Error('Service account JSON needs client_email and private_key');
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), credentials.private_key).toString('base64url');
  const assertion = `${unsigned}.${signature}`;
  const response = await fetchWithRetry(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  }, 'Google OAuth token request');
  const token = await response.json();
  if (!token.access_token) throw new Error('Google OAuth response did not include an access token');
  return token.access_token;
}

export async function fetchSearchAnalytics({ siteUrl, token, window, fetchImpl = fetch }) {
  if (!siteUrl) throw new Error('A Search Console property is required');
  const endpoint = `${API_ROOT}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const rows = [];
  let startRow = 0;
  while (startRow < MAX_ROWS) {
    const response = await fetchWithRetry(endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        startDate: window.startDate,
        endDate: window.endDate,
        dimensions: DIMENSIONS,
        type: 'web',
        dataState: 'final',
        rowLimit: Math.min(25_000, MAX_ROWS - startRow),
        startRow,
      }),
    }, 'Search Console API request', fetchImpl);
    const payload = await response.json();
    const batch = payload.rows || [];
    rows.push(...batch);
    if (batch.length < 25_000) break;
    startRow += batch.length;
  }
  return rows;
}

function argValue(args, name, fallback) {
  const item = args.find(value => value.startsWith(`--${name}=`));
  return item ? item.slice(name.length + 3) : fallback;
}

async function main(args = process.argv.slice(2)) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const siteUrl = normalizeSiteProperty(argValue(args, 'site-url', process.env.GSC_SITE_URL || packageJson.homepage));
  const now = argValue(args, 'as-of', '');
  const windows = performanceWindows(now ? new Date(`${now}T00:00:00Z`) : new Date(),
    Number(argValue(args, 'days', DEFAULT_DAYS)), Number(argValue(args, 'lag-days', DEFAULT_LAG_DAYS)));
  let currentRows;
  let previousRows;

  const fixture = argValue(args, 'fixture', '');
  if (fixture) {
    const data = JSON.parse(fs.readFileSync(fixture, 'utf8'));
    currentRows = data.current;
    previousRows = data.previous;
    if (!Array.isArray(currentRows) || !Array.isArray(previousRows)) throw new Error('Fixture must contain current and previous row arrays');
  } else {
    const credentialFile = argValue(args, 'credentials', '');
    const rawCredentials = process.env.GSC_SERVICE_ACCOUNT_JSON || (credentialFile ? fs.readFileSync(credentialFile, 'utf8') : '');
    if (!rawCredentials) throw new Error('Set GSC_SERVICE_ACCOUNT_JSON or pass --credentials=service-account.json (keep the file private)');
    const credentials = JSON.parse(rawCredentials);
    const token = await accessToken(credentials);
    [currentRows, previousRows] = await Promise.all([
      fetchSearchAnalytics({ siteUrl, token, window: windows.current }),
      fetchSearchAnalytics({ siteUrl, token, window: windows.previous }),
    ]);
  }

  const report = buildOpportunityReport(currentRows, previousRows, { siteUrl, windows });
  const output = argValue(args, 'out', '');
  if (output) {
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(output, report);
    console.log(`Wrote private Search Console report: ${output}`);
  } else {
    process.stdout.write(report);
  }
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main().catch(error => {
    console.error(`Search Console report not generated: ${error.message}`);
    process.exitCode = 1;
  });
}
