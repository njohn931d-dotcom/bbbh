const { test } = require('node:test');
const assert = require('node:assert/strict');

const route = entries => name => {
  const entry = entries.find(c => c.route === name);
  assert.ok(entry, `Missing content for ${name}`);
  return entry;
};
const amount = text => Number(text.replace(/[$,]/g, ''));
const matches = (text, actual, context) => {
  const expected = amount(text);
  assert.ok(Number.isFinite(expected), `${context}: ${text} is not a currency amount`);
  const tolerance = /\.\d\d$/.test(text) ? 0.011 : 0.51;
  assert.ok(Math.abs(actual - expected) < tolerance, `${context}: worked example says ${text}; model says $${actual.toFixed(2)}`);
};

test('financial worked examples stay aligned with the route calculators', async () => {
  const { CLUSTER_CONTENT } = await import('../scripts/cluster-content.mjs');
  const { getCalculator, calculateRoute } = await import('../scripts/calculator-model.mjs');
  const content = route(CLUSTER_CONTENT);
  const calculate = (name, changed) => {
    const defaults = Object.fromEntries(getCalculator(name).fields.map(f => [f.key, f.value]));
    return calculateRoute(name, { ...defaults, ...changed }).map(x => x.value);
  };

  const mortgage = 'calculators/mortgage-calculator-2026';
  for (const [term, , monthly, interest] of content(mortgage).table.rows) {
    const [m, i] = calculate(mortgage, { years: Number.parseInt(term, 10) });
    matches(monthly, m, `mortgage ${term} payment`);
    matches(interest, i, `mortgage ${term} interest`);
  }

  const housing = content('guides/how-much-house-can-i-afford-2026');
  for (const [price, , principal, monthly, withEscrow] of housing.table.rows) {
    const [m] = calculate(mortgage, { principal: amount(principal) });
    matches(monthly, m, `${price} house payment`);
    matches(withEscrow, m + amount(price) * 0.015 / 12, `${price} house with 1.5% escrow`);
  }

  const buy = 'calculators/rent-vs-buy-calculator-2026';
  for (const [rent, rented, owned, breakEven] of content(buy).table.rows) {
    const [ownerCost, rentTotal, year] = calculate(buy, { rent: amount(rent), years: 5 });
    matches(rented, rentTotal, `rent ${rent}`);
    matches(owned, ownerCost, `own when rent ${rent}`);
    assert.equal(breakEven, year === 'Not reached' ? year : `Year ${year}`);
  }

  const inflation = 'calculators/inflation-calculator-2026';
  for (const [years, buyingPower, futurePrice] of content(inflation).table.rows) {
    const [price, value] = calculate(inflation, { years: Number(years) });
    matches(buyingPower, value, `${years}-year $1,000 purchasing power`);
    matches(futurePrice, price, `${years}-year future basket cost`);
  }

  const growth = 'calculators/compound-interest-calculator';
  for (const [years, value, gain] of content(growth).table.rows) {
    const [future, , earned] = calculate(growth, { years: Number(years), monthly: 0 });
    matches(value, future, `${years}-year lump-sum balance`);
    matches(gain, earned, `${years}-year lump-sum growth`);
  }

  const comparison = 'calculators/loan-comparison-calculator-2026';
  for (const [label, balance, rate, term, monthly, interest] of content(comparison).table.rows) {
    const [m, i] = calculate(comparison, {
      first: amount(balance), rateA: Number.parseFloat(rate), monthsA: Number.parseInt(term, 10),
    });
    matches(monthly, m, `${label} comparison payment`);
    matches(interest, i, `${label} comparison interest`);
  }

  const card = 'calculators/credit-card-payoff-calculator-2026';
  for (const [payment, months, interest] of content(card).table.rows) {
    const [duration, paidInterest] = calculate(card, { payment: amount(payment) });
    assert.equal(Number(months), duration);
    matches(interest, paidInterest, `${payment} card payment interest`);
  }

  const car = 'calculators/car-loan-calculator-2026';
  for (const [months, payment, interest, total] of content(car).table.rows) {
    const [m, i, t] = calculate(car, { months: Number.parseInt(months, 10) });
    matches(payment, m, `car ${months} payment`);
    matches(interest, i, `car ${months} interest`);
    matches(total, t, `car ${months} total`);
  }

  const savings = 'calculators/savings-goal-calculator-2026';
  for (const [years, monthly, atZero, growthEarned] of content(savings).table.rows) {
    const duration = Number.parseInt(years, 10);
    const [m, contributions] = calculate(savings, { years: duration });
    matches(monthly, m, `${years} savings deposit`);
    matches(atZero, 10000 / (12 * duration), `${years} savings without interest`);
    matches(growthEarned, 10000 - contributions, `${years} savings interest`);
  }

  const student = 'calculators/student-loan-calculator-2026';
  for (const [term, monthly, years, repaid] of content(student).table.rows) {
    assert.equal(Number.parseInt(term, 10), Number(years));
    const [m, , total] = calculate(student, { years: Number(years) });
    matches(monthly, m, `${term} student loan payment`);
    matches(repaid, total, `${term} student loan total`);
  }

  const depreciation = 'calculators/depreciation-calculator-2026';
  for (const [years, retained, resale] of content(depreciation).table.rows) {
    const n = years === 'New' ? 0 : Number(years);
    const expected = 35000 * 0.85 ** n;
    matches(resale, expected, `${years} years of 15% depreciation`);
    assert.ok(Math.abs(Number.parseInt(retained, 10) - expected / 350) < 0.6);
  }

  const balance = 'calculators/salary-in-hours-elon-musk-calculator';
  for (const [netWorth, hours, years] of content(balance).table.rows) {
    const magnitudes = { billion: 1e9, million: 1e6 };
    const [number, unit] = netWorth.slice(1).split(' ');
    const [h, y] = calculate(balance, { balance: Number(number) * magnitudes[unit] });
    matches(hours, h, `${netWorth} equivalent work hours`);
    matches(years, y, `${netWorth} equivalent years`);
  }

  const worth = content('calculators/net-worth-calculator-2026');
  const netWorth = calculate(worth.route, {
    cash: 26000, investments: 140000, home: 400000, assets: 14000, mortgage: 190000, debts: 18000,
  });
  matches(worth.table.rows.at(-1)[1], netWorth[0], 'net worth after home value and mortgage');
  assert.ok(worth.table.rows.every(row => row[0] !== 'Home equity'), 'Do not count equity and mortgage twice');

  const freelance = 'calculators/freelance-rate-calculator-2026';
  for (const [, hours, rate] of content(freelance).table.rows) {
    const [actual] = calculate(freelance, { billable: Number(hours.replace(/,/g, '')) });
    matches(rate, actual, `${hours} billable hours`);
  }
});

test('net worth guide never publishes invented percentile thresholds', async () => {
  const { CLUSTER_CONTENT } = await import('../scripts/cluster-content.mjs');
  const guide = route(CLUSTER_CONTENT)('guides/are-you-rich-net-worth-percentile-2026');
  assert.equal(guide.intent, 'guide');
  assert.ok(guide.table.rows.every(row => row.every(cell => !/\$\d|\d+(?:st|nd|rd|th)\b/.test(cell))));
  assert.match(guide.caveat, /no numeric percentile cutoffs/i);
});
