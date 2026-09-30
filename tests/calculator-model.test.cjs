const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

const models = () => import('../scripts/calculator-model.mjs');
const render = () => import('../scripts/render-calculator.mjs');
const content = () => import('../scripts/cluster-content.mjs');
const values = (route, overrides = {}, getCalculator) => Object.fromEntries(
  getCalculator(route).fields.map(f => [f.key, overrides[f.key] ?? f.value]),
);
const near = (a, b, epsilon = 0.02) => assert.ok(Math.abs(a - b) <= epsilon, `Expected ${a} to be near ${b}`);

test('every advertised cluster tool has a working, route-specific form', async () => {
  const { calculatorRoutes, getCalculator, calculateRoute } = await models();
  const { renderCalculator } = await render();
  const { CLUSTER_CONTENT, LOCALE_CONTENT } = await content();
  const tools = [...CLUSTER_CONTENT, ...LOCALE_CONTENT].filter(c => c.intent === 'tool');
  assert.ok(tools.length >= 40);
  for (const c of tools) {
    const m = getCalculator(c.route);
    assert.ok(m, `No model for ${c.route}`);
    assert.ok(m.fields.length >= 2, `${c.route}: needs inputs`);
    const outputs = calculateRoute(c.route, values(c.route, {}, getCalculator));
    assert.ok(outputs.length, `${c.route}: no results`);
    const html = renderCalculator(c.route, c.lang || 'en');
    assert.ok(html.includes(`data-calculator="${c.route}"`));
    assert.equal((html.match(/<input type="number"/g) || []).length, m.fields.length);
    assert.ok(!html.includes('id="price"'), `${c.route}: unrelated purchase-price form`);
    assert.ok(html.includes('aria-live="polite"'));
    for (const o of outputs) {
      assert.ok(o.format === 'text' || Number.isFinite(o.value), `${c.route}: non-finite default result`);
    }
  }
  const guide = CLUSTER_CONTENT.find(c => c.route === 'calculators/income-percentile-calculator-2026');
  assert.equal(guide.intent, 'guide', 'Do not claim an income percentile from a dataset we do not have');
  assert.equal(getCalculator(guide.route), null);
  assert.ok(calculatorRoutes.includes('calculators/salary-to-hourly'));
  assert.ok(calculatorRoutes.includes('calculators/buy-vs-rent-hourly'));
});

test('loan, growth, revenue and cancellation math matches worked cases', async () => {
  const { calculateRoute, getCalculator, loanPayment, formatResult } = await models();
  const run = (route, changes) => calculateRoute(route, values(route, changes, getCalculator));
  near(loanPayment(400000, 6.5, 360), 2528.27);
  near(loanPayment(1200, 0, 12), 100);
  const mortgage = run('calculators/mortgage-calculator-2026');
  near(mortgage[0].value, 2528.27);
  near(mortgage[1].value, 510177.95);
  const compound = run('calculators/compound-interest-calculator', { monthly: 0, starting: 10000, rate: 7, years: 10 });
  near(compound[0].value, 10000 * (1 + 0.07 / 12) ** 120);
  near(run('calculators/compound-interest-calculator', { rate: 0, starting: 0, monthly: 100, years: 1 })[0].value, 1200);
  near(run('calculators/car-loan-calculator-2026', { price: 1200, down: 0, apr: 0, months: 12 })[0].value, 100);
  const credit = run('calculators/credit-card-payoff-calculator-2026', { balance: 6000, apr: 0, payment: 500 });
  assert.equal(credit[0].value, 12);
  near(credit[1].value, 0);
  assert.equal(run('calculators/credit-card-payoff-calculator-2026', { balance: 6000, apr: 24, payment: 100 })[0].format, 'text');
  near(run('calculators/youtube-earnings-calculator-2026', { views: 1000000, rpm: 3, sponsors: 0 })[0].value, 3000);
  near(run('calculators/tiktok-money-calculator-2026', { views: 1000000, rpm: 0.02, sponsors: 0 })[0].value, 20);
  const plan = run('calculators/annual-vs-monthly-subscription');
  assert.equal(plan[2].value, 10);
  near(plan[3].value, 38.38);
  near(run('calculators/wage-growth-calculator-2026', { raise: 3, inflation: 3 })[0].value, 0);
  near(run('calculators/lottery-tax-calculator-2026', { payout: 1000, federal: 25, state: 5 })[0].value, 700);
  assert.match(formatResult({ value: 0.00005, format: 'small-money' }), /0\.00005/);
});

test('bad values do not silently produce false answers', async () => {
  const { calculateRoute, getCalculator } = await models();
  const run = (route, changes) => calculateRoute(route, values(route, changes, getCalculator));
  assert.throws(() => run('calculators/mortgage-calculator-2026', { years: 0 }), RangeError);
  assert.throws(() => run('calculators/mortgage-calculator-2026', { apr: Infinity }), RangeError);
  assert.throws(() => run('calculators/mortgage-calculator-2026', { principal: '' }), RangeError);
  assert.throws(() => run('calculators/car-loan-calculator-2026', { price: 100, down: 100 }), /less than/);
  assert.throws(() => run('calculators/rent-vs-buy-calculator-2026', { down: 900000 }), RangeError);
  assert.throws(() => run('calculators/wedding-budget-calculator-2026', { venue: 90, photo: 20 }), /100%/);
  assert.throws(() => run('calculators/lottery-tax-calculator-2026', { federal: 80, state: 25 }), /100%/);
  assert.equal(run('calculators/subscription-audit', { uses: 0 })[1].value, 'No uses this month');
});

test('browser input recalculates the right page without transmitting user data', async () => {
  const { calculateRoute, formatResult } = await models();
  const { renderCalculator } = await render();
  const html = renderCalculator('calculators/mortgage-calculator-2026');
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`, { runScripts: 'outside-only' });
  try {
    dom.window.__calc = { calculateRoute, formatResult };
    const script = fs.readFileSync('route-calculator.js', 'utf8').replace(
      "import { calculateRoute, formatResult } from './scripts/calculator-model.mjs';",
      'const { calculateRoute, formatResult } = window.__calc;',
    );
    dom.window.eval(script);
    const document = dom.window.document;
    const amount = document.querySelector('input[name=principal]');
    amount.value = '1200';
    document.querySelector('input[name=apr]').value = '0';
    document.querySelector('input[name=years]').value = '1';
    amount.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    assert.match(document.querySelector('.route-calc-result dd').textContent, /\$100/);
    assert.ok(document.querySelector('.route-calc-error').hidden);
    amount.value = 'not-a-number';
    amount.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    assert.equal(document.querySelectorAll('.route-calc-result dd').length, 0, 'stale result must be hidden');
    assert.equal(document.querySelector('.route-calc-error').hidden, false);
    assert.equal(script.includes('fetch('), false);
  } finally { dom.window.close(); }
});
