const { test } = require('node:test');
const assert = require('node:assert/strict');

let api;
test('Search Console date windows exclude the reporting-lag days and are adjacent', async () => {
  api = await import('../scripts/gsc-opportunities.mjs');
  assert.equal(api.normalizeSiteProperty('https://example.test/blog///'), 'https://example.test/blog/');
  assert.equal(api.normalizeSiteProperty('sc-domain:example.test'), 'sc-domain:example.test');
  assert.throws(() => api.normalizeSiteProperty(''), /property/);
  const windows = api.performanceWindows(new Date('2026-08-31T12:30:00Z'), 28, 3);
  assert.deepEqual(windows, {
    current: { startDate: '2026-08-01', endDate: '2026-08-28' },
    previous: { startDate: '2026-07-04', endDate: '2026-07-31' },
  });
  assert.throws(() => api.performanceWindows(new Date(), 2, 3), /days/);
  assert.throws(() => api.performanceWindows(new Date(), 28, 8), /lagDays/);
});

test('Search Analytics requests the intended property, final web data and dimensions', async () => {
  let requested;
  const rows = [{ keys: ['salary calculator', 'https://example.test/salary/', 'usa'], clicks: 3, impressions: 20, ctr: 0.15, position: 7 }];
  const result = await api.fetchSearchAnalytics({
    siteUrl: 'https://example.test/',
    token: 'test-token',
    window: { startDate: '2026-08-01', endDate: '2026-08-28' },
    fetchImpl: async (url, options) => {
      requested = { url, options };
      return { ok: true, json: async () => ({ rows }), text: async () => '' };
    },
  });
  assert.equal(requested.url, 'https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.test%2F/searchAnalytics/query');
  assert.equal(requested.options.headers.authorization, 'Bearer test-token');
  const body = JSON.parse(requested.options.body);
  assert.deepEqual(body.dimensions, ['query', 'page', 'country']);
  assert.equal(body.type, 'web');
  assert.equal(body.dataState, 'final');
  assert.equal(body.startDate, '2026-08-01');
  assert.equal(body.endDate, '2026-08-28');
  assert.deepEqual(result, rows);
});

test('Search Console report ranks actionable pages, trend candidates, cannibalization and countries', () => {
  const current = [
    { keys: ['salary to hourly calculator', 'https://example.test/calculators/salary-to-hourly/', 'usa'], clicks: 10, impressions: 300, ctr: 0.033, position: 8 },
    { keys: ['salary to hourly calculator', 'https://example.test/calculators/hourly-to-salary/', 'usa'], clicks: 2, impressions: 80, ctr: 0.025, position: 13 },
    { keys: ['new streaming price', 'https://example.test/calculators/streaming-cost/', 'gbr'], clicks: 4, impressions: 40, ctr: 0.1, position: 6 },
    { keys: ['salary to hourly calculator', 'https://example.test/calculators/salary-to-hourly/', 'esp'], clicks: 1, impressions: 25, ctr: 0.04, position: 12 },
    { keys: ['brand new query', 'https://example.test/guides/hourly-pay/', 'usa'], clicks: 1, impressions: 12, ctr: 0.08, position: 18 },
  ];
  const previous = [
    { keys: ['salary to hourly calculator', 'https://example.test/calculators/salary-to-hourly/', 'usa'], clicks: 7, impressions: 200, ctr: 0.035, position: 10 },
    { keys: ['salary to hourly calculator', 'https://example.test/calculators/hourly-to-salary/', 'usa'], clicks: 4, impressions: 100, ctr: 0.04, position: 11 },
    { keys: ['new streaming price', 'https://example.test/calculators/streaming-cost/', 'gbr'], clicks: 0, impressions: 1, ctr: 0, position: 40 },
  ];
  const report = api.buildOpportunityReport(current, previous, {
    siteUrl: 'https://example.test/',
    windows: {
      current: { startDate: '2026-08-01', endDate: '2026-08-28' },
      previous: { startDate: '2026-07-04', endDate: '2026-07-31' },
    },
    generatedAt: new Date('2026-08-31T00:00:00Z'),
  });
  assert.match(report, /salary to hourly calculator.*USA.*300.*3\.3%/);
  assert.match(report, /new streaming price.*GBR.*1.*40.*\+39/);
  assert.match(report, /salary to hourly calculator.*USA.*380.*https:\/\/example\.test\/calculators\/hourly-to-salary/);
  assert.match(report, /GBR.*40.*4/);
  assert.match(report, /Never auto-publish a page/);
  assert.match(report, /Movie-trailer searches are a different topic/);
  assert.match(report, /do not commit or publish it/);
  assert.match(report, /not complete property totals/);
});

test('Search Console row aggregation weights position by impressions', async () => {
  const rows = api.aggregateRows([
    { keys: ['query', 'page', 'usa'], clicks: 1, impressions: 10, ctr: 0.1, position: 2 },
    { keys: ['query', 'page', 'usa'], clicks: 2, impressions: 30, ctr: 0.066, position: 6 },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].clicks, 3);
  assert.equal(rows[0].impressions, 40);
  assert.equal(rows[0].ctr, 0.075);
  assert.equal(rows[0].position, 5);
});
