/*
 * Calculator models shared by the static renderer and the browser. Each page
 * exposes inputs that actually compute the result promised by its heading.
 * No fetches, tracking, external rates or invented tax brackets. All monetary
 * rates that depend on a person's circumstances are user-supplied estimates.
 */
const field = (key, label, value, options = {}) => ({ key, label, value, min: 0, max: 1e9, step: 'any', ...options });
const usd = (key, label, value, options = {}) => field(key, label, value, { prefix: '$', ...options });
const pct = (key, label, value, options = {}) => field(key, label, value, { suffix: '%', max: 100, ...options });
const num = (key, label, value, options = {}) => field(key, label, value, options);
const result = (label, value, format = 'money') => ({ label, value, format });
const def = (fields, calculate, note = '') => ({ fields, calculate, note });
const definitions = {};
function register(routes, model) {
  for (const route of Array.isArray(routes) ? routes : [routes]) definitions[route] = model;
}

// Level-payment loans. Handles zero APR and keeps the remaining-balance model
// numerically stable, rather than dividing by zero or assuming every loan is 30 years.
export function loanPayment(principal, annualRate, months) {
  const r = annualRate / 1200;
  if (!r) return principal / months;
  return principal * r / (1 - (1 + r) ** -months);
}
function loanBalance(principal, annualRate, months, paid) {
  const r = annualRate / 1200;
  const pmt = loanPayment(principal, annualRate, months);
  return Math.max(0, r ? principal * (1 + r) ** paid - pmt * ((1 + r) ** paid - 1) / r : principal - paid * pmt);
}
const moneyAfterTax = (gross, rate) => gross * (1 - rate / 100);
const round = n => Math.round(n * 100) / 100;

const mortgage = def([
  usd('principal', 'Loan amount', 400000, { min: 1 }),
  pct('apr', 'Interest rate (annual, not APR with fees)', 6.5, { max: 50 }),
  num('years', 'Loan term in years', 30, { min: 1, max: 40, step: 1 }),
], ({ principal, apr, years }) => {
  const months = years * 12;
  const payment = loanPayment(principal, apr, months);
  return [result('Monthly principal + interest', payment), result('Total interest', payment * months - principal), result('Total repaid', payment * months)];
}, 'Principal and interest only. Excludes taxes, insurance, PMI and fees; APR with fees is not the interest rate used to amortize a loan.');
register(['calculators/mortgage-calculator-2026', 'guides/calculadora-hipoteca-2026-espana-mexico'], mortgage);

register('calculators/rent-vs-buy-calculator-2026', def([
  usd('price', 'Home price', 350000, { min: 1 }), usd('down', 'Down payment', 70000),
  pct('apr', 'Mortgage interest rate', 6.5, { max: 50 }), num('term', 'Mortgage term (years)', 30, { min: 1, max: 40, step: 1 }),
  num('years', 'Years you plan to stay', 7, { min: 1, max: 40, step: 1 }),
  usd('rent', 'Comparable monthly rent', 1900), pct('tax', 'Annual property tax (% of home value)', 1.1),
  usd('insurance', 'Annual insurance', 1400), pct('maintenance', 'Annual maintenance (% of home value)', 1),
  pct('growth', 'Annual home price change', 2, { min: -50, max: 50 }), pct('selling', 'Sale costs (% of final value)', 6),
], v => {
  if (v.down >= v.price) throw new RangeError('Down payment must be less than the home price.');
  const borrowed = v.price - v.down, months = v.term * 12, payment = loanPayment(borrowed, v.apr, months);
  const ownedCost = y => {
    const periods = y * 12;
    const value = v.price * (1 + v.growth / 100) ** y;
    // Cash out (including down payment), minus net proceeds on sale. Not a
    // monthly-payment-only comparison: principal repaid is recovered at sale.
    return v.down + payment * Math.min(periods, months) +
      y * (v.price * (v.tax + v.maintenance) / 100 + v.insurance) -
      (value * (1 - v.selling / 100) - loanBalance(borrowed, v.apr, months, Math.min(periods, months)));
  };
  const breakEven = Array.from({ length: v.years }, (_, i) => i + 1).find(y => ownedCost(y) <= v.rent * 12 * y);
  return [result(`Owning net cost over ${v.years} years`, ownedCost(v.years)), result('Rent paid over same period', v.rent * 12 * v.years),
    result('First break-even year in this period', breakEven ?? 'Not reached', breakEven ? 'years' : 'text')];
}, 'Simplified sale-at-end comparison. Ignores rent increases, closing costs at purchase, tax benefits, down-payment investment returns and changes in insurance/taxes. Negative ownership cost means appreciation exceeds cash outlay.'));

register('calculators/compound-interest-calculator', def([
  usd('starting', 'Starting balance', 10000), usd('monthly', 'Monthly contribution (end of month)', 100),
  pct('rate', 'Estimated annual return', 7, { min: -50, max: 50 }),
  num('years', 'Years invested', 10, { min: 1, max: 80, step: 1 }),
], ({ starting, monthly, rate, years }) => {
  const periods = years * 12, r = rate / 1200;
  const future = starting * (1 + r) ** periods + monthly * (r ? ((1 + r) ** periods - 1) / r : periods);
  return [result('Projected ending balance', future), result('Total contributed', starting + monthly * periods), result('Gain / loss', future - starting - monthly * periods)];
}, 'Monthly compounding at a constant estimated return; not guaranteed. Excludes fees, taxes and inflation.'));

register('calculators/inflation-calculator-2026', def([
  usd('amount', 'Cost of a basket today', 1000, { min: 0.01 }), pct('rate', 'Estimated annual inflation', 3, { min: -50, max: 100 }),
  num('years', 'Years from now', 10, { min: 1, max: 100, step: 1 }),
], ({ amount, rate, years }) => [result('Future price for same basket', amount * (1 + rate / 100) ** years),
  result(`Purchasing power of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)} in ${years} years`, amount / (1 + rate / 100) ** years)],
'Constant hypothetical inflation, not a forecast of prices.'));

register('calculators/crypto-profit-calculator-2026', def([
  usd('invested', 'Amount spent including entry fee', 1000, { min: 0.01 }),
  usd('buy', 'Price per coin at purchase', 100, { min: 0.000001 }), usd('now', 'Price per coin now', 130),
  pct('entry', 'Entry fee', 0.5, { max: 99 }), pct('exit', 'Exit fee', 0.5, { max: 99 }),
], v => {
  const coins = v.invested / (v.buy * (1 + v.entry / 100));
  const proceeds = coins * v.now * (1 - v.exit / 100);
  return [result('Net sale proceeds', proceeds), result('Profit / loss before tax', proceeds - v.invested),
    result('Break-even price per coin', v.invested / (coins * (1 - v.exit / 100)), 'small-money'),
    result('Value after a 50% price drop', proceeds / 2)];
}, 'No price prediction. Fees are estimates; excludes network fees, spreads and tax.'));

const payEstimate = def([
  usd('salary', 'Annual gross pay', 60000, { min: 0.01 }),
  pct('withheld', 'Estimated TOTAL withholding (taxes + FICA + other %)', 22, { max: 99 }),
  usd('deductions', 'Other fixed deductions per year', 0),
], v => {
  const takeHome = moneyAfterTax(v.salary, v.withheld) - v.deductions;
  if (takeHome < 0) throw new RangeError('Deductions cannot exceed estimated take-home pay.');
  return [result('Estimated annual take-home', takeHome), result('Monthly take-home', takeHome / 12),
    result('Hourly take-home (2,080 hours/year)', takeHome / 2080)];
}, 'Enter your own total withholding: this is NOT a tax-bracket or state-tax calculator. Use a pay stub for decisions.');
register(['calculators/paycheck-calculator-2026', 'calculators/after-tax-income'], payEstimate);

register('calculators/overtime-pay', def([
  usd('rate', 'Regular hourly pay', 30, { min: 0.01 }), num('regular', 'Regular hours this week', 40, { max: 168 }),
  num('overtime', 'Overtime hours this week', 5, { max: 168 }),
  num('multiplier', 'Overtime pay multiplier (e.g. 1.5)', 1.5, { min: 1, max: 3 }),
], v => [result('Total gross pay this week', v.regular * v.rate + v.overtime * v.rate * v.multiplier),
  result('Overtime pay (included above)', v.overtime * v.rate * v.multiplier),
  result('Extra premium vs regular time', v.overtime * v.rate * (v.multiplier - 1))],
'Enter overtime hours according to your employer’s rules; daily thresholds, bonuses and local law may change the regular rate.'));

register('calculators/lottery-tax-calculator-2026', def([
  usd('payout', 'Actual cash payout before tax (not advertised annuity jackpot)', 1000000, { min: 0.01 }),
  pct('federal', 'Estimated EFFECTIVE federal tax rate', 30, { max: 99 }), pct('state', 'Estimated effective state/local tax rate', 5, { max: 99 }),
], v => {
  if (v.federal + v.state >= 100) throw new RangeError('Combined effective tax rates must be below 100%.');
  return [result('Estimated amount kept', v.payout * (1 - (v.federal + v.state) / 100)),
    result('Estimated federal tax', v.payout * v.federal / 100), result('Estimated state/local tax', v.payout * v.state / 100)];
}, 'Winnings are generally ordinary income, not capital gains. This uses YOUR estimated effective rates, not a flat top bracket. Verify payout and taxes with a professional.'));

register('calculators/car-loan-calculator-2026', def([
  usd('price', 'Out-the-door vehicle price', 35000, { min: 1 }), usd('down', 'Down payment + trade-in', 5000),
  pct('apr', 'Loan interest rate', 7, { max: 50 }), num('months', 'Loan length (months)', 60, { min: 1, max: 120, step: 1 }),
], v => {
  if (v.down >= v.price) throw new RangeError('Down payment must be less than the out-the-door price.');
  const financed = v.price - v.down, pmt = loanPayment(financed, v.apr, v.months);
  return [result('Monthly loan payment', pmt), result('Interest over loan', pmt * v.months - financed), result('Total including down payment', pmt * v.months + v.down)];
}, 'Excludes fuel, insurance, maintenance and any add-ons not included in your out-the-door price.'));

const vehicleCost = def([
  usd('price', 'Purchase price', 35000, { min: 1 }), usd('resale', 'Estimated resale price', 18500),
  num('years', 'Years you keep it', 3, { min: 1, max: 40, step: 1 }),
  num('miles', 'Miles driven per year', 12000, { min: 1, max: 200000 }), num('mpg', 'Miles per gallon', 25, { min: 1, max: 200 }),
  usd('gas', 'Gas price per gallon', 3.5), usd('insurance', 'Insurance per year', 1800),
  usd('other', 'Maintenance + fees per year', 1200),
], v => {
  const annual = (v.price - v.resale) / v.years + v.miles / v.mpg * v.gas + v.insurance + v.other;
  return [result('Total estimated cost per year', annual), result('Cost per mile', annual / v.miles),
    result('Depreciation per year (included)', (v.price - v.resale) / v.years)];
}, 'Does not include financing interest or the value of time driving. Resale is an estimate.');
register('calculators/car-ownership-cost', vehicleCost);

register('calculators/commute-cost', def([
  num('miles', 'Round-trip miles per workday', 24, { min: 0, max: 1000 }), num('days', 'Commute days per year', 240, { min: 1, max: 366, step: 1 }),
  num('mpg', 'Miles per gallon', 25, { min: 1, max: 200 }), usd('gas', 'Gas per gallon', 3.5),
  usd('wear', 'Wear/depreciation per mile (excluding fuel)', 0.2), usd('parking', 'Parking / fares per workday', 0),
  num('minutes', 'Round-trip minutes per workday', 60, { max: 1440 }), usd('time', 'Your estimated value per hour', 25),
], v => {
  const direct = (v.miles / v.mpg * v.gas + v.miles * v.wear + v.parking) * v.days;
  const combined = direct + v.minutes / 60 * v.time * v.days;
  return [result('Direct travel cost per year', direct), result('Time value (not a cash expense)', v.minutes / 60 * v.time * v.days),
    result('Combined economic cost per year', combined),
    result('Combined cost per commute hour', v.minutes ? combined / (v.minutes / 60 * v.days) : 'No commute time entered', v.minutes ? 'money' : 'text')];
}, 'Time value is illustrative, not lost wages. Do not add the IRS full-mileage allowance to fuel; it already includes fuel and wear.'));

register('calculators/depreciation-calculator-2026', def([
  usd('price', 'Original price', 35000, { min: 0.01 }), pct('rate', 'Estimated annual depreciation', 15, { max: 99 }),
  num('years', 'Years owned', 5, { min: 1, max: 40, step: 1 }),
], v => [result('Estimated value after ownership', v.price * (1 - v.rate / 100) ** v.years),
  result('Value lost', v.price - v.price * (1 - v.rate / 100) ** v.years)],
'Constant declining-balance rate, not a model-specific resale quote.'));

const freelance = def([
  usd('target', 'Target ANNUAL take-home pay', 75000, { min: 0.01 }), usd('expenses', 'Business costs per year', 5000),
  num('billable', 'Billable hours per year', 1000, { min: 1, max: 8760 }), pct('tax', 'Estimated effective tax on profit', 25, { max: 99 }),
], v => {
  const revenue = v.target / (1 - v.tax / 100) + v.expenses;
  return [result('Minimum hourly rate to quote', revenue / v.billable), result('Revenue needed per year', revenue),
    result('Working weeks at 25 billable hours/week', v.billable / 25, 'decimal')];
}, 'Estimated effective tax, not tax advice; add your own benefits, downtime and nonbillable hours to costs and billable-hours estimate.');
register(['calculators/freelance-rate-calculator-2026', 'calculators/freelance-rate'], freelance);

register('calculators/side-hustle-calculator-2026', def([
  usd('revenue', 'Gross revenue this month', 500), usd('costs', 'Costs and platform fees this month', 80),
  pct('tax', 'Estimated tax on profit', 20, { max: 99 }),
  num('paid', 'Paid hours this month', 15, { min: 0, max: 744 }), num('unpaid', 'Unpaid/admin hours', 5, { min: 0, max: 744 }),
], v => {
  if (!v.paid && !v.unpaid) throw new RangeError('Enter at least one hour of work.');
  const net = v.revenue - v.costs - Math.max(0, v.revenue - v.costs) * v.tax / 100;
  return [result('Estimated net earnings', net), result('Net per actual hour worked', net / (v.paid + v.unpaid))];
}, 'Tax is applied only to positive profit. Your local tax rules and expenses may differ.'));

register('calculators/salary-in-hours-elon-musk-calculator', def([
  usd('balance', 'Illustrative net worth (not salary)', 1000000000, { min: 0.01, max: 1e13 }),
  usd('rate', 'Your after-tax hourly rate', 30, { min: 0.01 }),
], v => [result('Your work hours equivalent to that balance', v.balance / v.rate, 'decimal'),
  result('Years at 2,080 hours/year', v.balance / v.rate / 2080, 'decimal')],
'Net worth is a balance of assets minus debts, NOT earnings per second; the comparison does not imply it could all be cashed out.'));

const creatorFields = [num('views', 'Monthly video views', 100000, { min: 0, max: 1e12, step: 1 }),
  usd('rpm', 'Your estimated USD RPM per 1,000 views', 3, { max: 1000 }),
  usd('sponsors', 'Monthly sponsorship income', 0)];
const creatorNote = 'RPM means earnings per THOUSAND views after the platform share, not per million. Results exclude production costs, fees and income tax.';
register('calculators/youtube-earnings-calculator-2026', def(creatorFields, v => [
  result('Estimated monthly creator revenue', v.views / 1000 * v.rpm + v.sponsors),
  result('Ads from views', v.views / 1000 * v.rpm), result('Sponsorships (included)', v.sponsors),
], creatorNote));
register('calculators/mrbeast-earnings-per-second-calculator', def([
  ...creatorFields, usd('hour', 'Your take-home pay per work hour', 25, { min: 0.01 }),
], v => {
  const monthly = v.views / 1000 * v.rpm + v.sponsors;
  return [result('Estimated monthly creator revenue', monthly),
    result('Average per calendar second (illustrative)', monthly / (30 * 24 * 3600), 'small-money'),
    result('Equivalent of your work hours', monthly / v.hour, 'decimal')];
}, creatorNote + ' Average per second is monthly revenue divided by all seconds in a 30-day month, not real-time income.'));

register('calculators/tiktok-money-calculator-2026', def([
  num('views', 'Eligible monthly video views', 1000000, { max: 1e12, step: 1 }),
  usd('rpm', 'Estimated payout per 1,000 eligible views', 0.03, { max: 100 }),
  usd('sponsors', 'Monthly brand deals', 500),
  num('hours', 'Hours spent making content this month', 40, { min: 1, max: 744 }),
], v => [result('Estimated monthly gross revenue', v.views / 1000 * v.rpm + v.sponsors),
  result('Platform payout only', v.views / 1000 * v.rpm),
  result('Gross revenue per content hour', (v.views / 1000 * v.rpm + v.sponsors) / v.hours)],
'Not every view is eligible; actual creator programs and RPM change. Excludes taxes and production costs.'));

register('calculators/onlyfans-earnings-calculator-2026', def([
  num('subscribers', 'Paying subscribers this month', 100, { max: 1e7, step: 1 }),
  usd('price', 'Monthly price per subscriber', 10), pct('churn', 'Estimated cancellations by next month', 10),
  pct('fee', 'Platform fee', 20, { max: 99 }),
], v => [result('This month after platform fee (before tax)', v.subscribers * v.price * (1 - v.fee / 100)),
  result('Next month if nobody new subscribes', v.subscribers * (1 - v.churn / 100) * v.price * (1 - v.fee / 100))],
'Assumes no new subscribers, tips, chargebacks or other costs. Do not treat this as a guaranteed income estimate.'));

register('calculators/ai-job-replacement-calculator-2026', def([
  usd('course', 'Course and materials cost', 2000), num('study', 'Study hours', 100, { max: 10000 }),
  usd('hour', 'Value of one study hour', 25), usd('uplift', 'Estimated extra after-tax income per month', 250),
], v => {
  const cost = v.course + v.study * v.hour;
  return [result('Total investment including time', cost),
    result('Months to break even', v.uplift ? cost / v.uplift : 'No break-even at $0 uplift', v.uplift ? 'decimal' : 'text')];
}, 'Models a scenario, NOT the probability a role will be automated or a promise of higher pay.'));

register('calculators/chatgpt-cost-calculator-2026', def([
  usd('fee', 'Monthly subscription price', 20), num('tasks', 'Useful tasks done per month', 50, { min: 1, max: 1e7, step: 1 }),
  num('minutes', 'Minutes saved on each task', 5, { max: 1440 }), usd('hour', 'Your estimated value per hour', 25),
], v => [result('Cost per useful task', v.fee / v.tasks),
  result('Time value minus subscription (not cash saved)', v.tasks * v.minutes / 60 * v.hour - v.fee)],
'Saved time is not necessarily paid work. Use current plan pricing; no external price feed.'));

register('calculators/cost-of-living-calculator-2026', def([
  usd('salary', 'Annual salary in current city', 70000, { min: 0.01 }),
  num('current', 'Your current city cost index', 100, { min: 1, max: 1000 }),
  num('new', 'New city cost index (same source)', 120, { min: 1, max: 1000 }),
], v => [result('Salary needed for comparable purchasing power', v.salary * v.new / v.current),
  result('Difference per year', v.salary * (v.new / v.current - 1))],
'Indexes must come from the same data provider and year. Local taxes, housing choices and lifestyle may differ.'));

register('calculators/net-worth-calculator-2026', def([
  usd('cash', 'Cash / savings', 5000), usd('investments', 'Investments', 25000),
  usd('home', 'Current home + other property value', 300000), usd('assets', 'Other assets', 10000),
  usd('mortgage', 'Mortgage balance', 240000), usd('debts', 'Other debt / loans', 8000),
], v => {
  const assets = v.cash + v.investments + v.home + v.assets, debts = v.mortgage + v.debts;
  return [result('Your net worth', assets - debts), result('Total assets', assets), result('Total liabilities', debts)];
}, 'Use current market values, not original purchase prices. Home value and mortgage belong on opposite sides; do not enter home equity again.'));

register('calculators/wage-growth-calculator-2026', def([
  usd('salary', 'Current annual pay', 60000, { min: 0.01 }),
  pct('raise', 'Estimated annual pay raise', 3, { min: -50, max: 100 }),
  pct('inflation', 'Estimated annual inflation', 3, { min: -50, max: 100 }),
  num('years', 'Years', 10, { min: 1, max: 80, step: 1 }),
], v => [result('Real change per year', ((1 + v.raise / 100) / (1 + v.inflation / 100) - 1) * 100, 'percent'),
  result('Pay in future dollars', v.salary * (1 + v.raise / 100) ** v.years),
  result('Future pay in today’s purchasing power', v.salary * ((1 + v.raise / 100) / (1 + v.inflation / 100)) ** v.years)],
'A raise matching inflation preserves purchasing power before tax; this is a constant-rate illustration, not a forecast.'));

register('calculators/savings-goal-calculator-2026', def([
  usd('goal', 'Savings goal', 10000, { min: 0.01 }), usd('saved', 'Already saved', 0),
  pct('rate', 'Estimated annual return', 5, { min: -50, max: 50 }), num('years', 'Years to goal', 5, { min: 1, max: 80, step: 1 }),
], v => {
  const months = v.years * 12, r = v.rate / 1200, growth = (1 + r) ** months;
  const gap = v.goal - v.saved * growth;
  const payment = Math.max(0, gap / (r ? (growth - 1) / r : months));
  return [result('Monthly deposit needed (end of month)', payment), result('Total new deposits', payment * months)];
}, 'Constant estimated monthly compounding, no guarantee of return. If the starting amount already meets the goal, the monthly deposit is $0.'));

register('calculators/investment-return-calculator-2026', def([
  usd('starting', 'Investment amount', 10000, { min: 0.01 }),
  pct('gross', 'Gross return in one year', 7, { min: -90, max: 1000 }), pct('fee', 'Annual fee as % of assets', 0.5, { max: 50 }),
  pct('tax', 'Estimated tax on positive gains', 15, { max: 99 }), pct('inflation', 'Inflation in that year', 3, { min: -50, max: 100 }),
], v => {
  const gain = v.starting * (v.gross - v.fee) / 100;
  const afterTax = v.starting + gain - Math.max(0, gain) * v.tax / 100;
  return [result('After-fee, after-tax ending value', afterTax),
    result('Real return after inflation', (afterTax / v.starting / (1 + v.inflation / 100) - 1) * 100, 'percent')];
}, 'Illustrates one year. Actual taxes depend on realization, account type and tax law. Returns and inflation are not guaranteed.'));

register('calculators/loan-comparison-calculator-2026', def([
  usd('first', 'Loan A balance', 20000, { min: 0.01 }), pct('rateA', 'Loan A interest rate', 6, { max: 50 }),
  num('monthsA', 'Loan A term in months', 60, { min: 1, max: 480, step: 1 }),
  usd('second', 'Loan B balance', 20000, { min: 0.01 }), pct('rateB', 'Loan B interest rate', 8, { max: 50 }),
  num('monthsB', 'Loan B term in months', 60, { min: 1, max: 480, step: 1 }),
], v => {
  const a = loanPayment(v.first, v.rateA, v.monthsA), b = loanPayment(v.second, v.rateB, v.monthsB);
  return [result('Loan A monthly payment', a), result('Loan A total interest', a * v.monthsA - v.first),
    result('Loan B monthly payment', b), result('Loan B total interest', b * v.monthsB - v.second)];
}, 'Compare interest only for equal loan amounts. Different balances/terms are not directly comparable; fees and prepayment changes are excluded.'));

register('calculators/credit-card-payoff-calculator-2026', def([
  usd('balance', 'Card balance', 6000, { min: 0.01 }), pct('apr', 'Annual interest rate', 22.99, { max: 100 }),
  usd('payment', 'Fixed monthly payment', 200, { min: 0.01 }),
], v => {
  const rate = v.apr / 1200;
  if (v.payment <= v.balance * rate) return [result('Payoff time', 'Never at this payment', 'text'),
    result('First month’s interest', v.balance * rate), result('Monthly payment needed to reduce principal', v.balance * rate + 0.01)];
  let balance = v.balance, interest = 0, months = 0;
  while (balance > 0.000001 && months < 1200) {
    const charge = balance * rate;
    interest += charge;
    balance = Math.max(0, balance + charge - v.payment);
    months++;
  }
  if (balance > 0.000001) return [result('Payoff time', 'Over 100 years', 'text')];
  return [result('Months to pay off', months, 'months'), result('Total interest', interest), result('Total paid', v.balance + interest)];
}, 'Assumes a fixed monthly payment and constant APR, no new charges or fees. The final payment is capped at the balance due.'));

register('calculators/student-loan-calculator-2026', def([
  usd('balance', 'Student loan balance', 30000, { min: 0.01 }), pct('apr', 'Fixed interest rate', 6.5, { max: 50 }),
  num('years', 'Standard repayment term (years)', 10, { min: 1, max: 40, step: 1 }),
], v => {
  const months = v.years * 12, monthly = loanPayment(v.balance, v.apr, months);
  return [result('Estimated standard monthly payment', monthly), result('Total interest', monthly * months - v.balance), result('Total paid', monthly * months)];
}, 'Standard fixed-rate amortization ONLY. Does not model federal income-driven plans, forgiveness, subsidies or changing rules.'));

register('calculators/child-cost-calculator-2026', def([
  usd('infant', 'Annual cost per child at ages 0–1', 28000),
  usd('preschool', 'Annual cost at ages 2–5', 20000),
  usd('school', 'Annual cost at ages 6–12', 16000), usd('teen', 'Annual cost at ages 13–17', 18000),
], v => {
  const total = 2 * v.infant + 4 * v.preschool + 7 * v.school + 5 * v.teen;
  return [result('Illustrative total through age 17', total), result('Average per month over 18 years', total / 216)];
}, '18 years = 2 + 4 + 7 + 5. Enter your own costs; no regional dataset or college costs are assumed.'));

register('calculators/childcare-cost-calculator-2026', def([
  usd('salary', 'Monthly gross earnings from work', 5600), pct('withheld', 'Your estimated total withholding', 30, { max: 99 }),
  usd('care', 'Childcare per month', 1450), usd('commute', 'Work travel per month', 250), usd('other', 'Other work expenses per month', 150),
], v => [result('Estimated take-home after work-related costs', moneyAfterTax(v.salary, v.withheld) - v.care - v.commute - v.other),
  result('Childcare + work expenses', v.care + v.commute + v.other)],
'Illustrative cash comparison, not a decision about returning to work. Does not value benefits, career progression or unpaid care.'));

register('calculators/wedding-budget-calculator-2026', def([
  usd('budget', 'Total wedding budget', 30000, { min: 0.01 }), num('guests', 'Guests', 120, { min: 1, max: 100000, step: 1 }),
  pct('venue', 'Share for venue + catering', 55), pct('photo', 'Share for photo/video', 12),
], v => {
  if (v.venue + v.photo > 100) throw new RangeError('Category shares cannot total over 100%.');
  return [result('Venue and catering', v.budget * v.venue / 100), result('Photo and video', v.budget * v.photo / 100),
    result('Left for all other categories', v.budget * (1 - (v.venue + v.photo) / 100)),
    result('Budget per guest', v.budget / v.guests)];
}, 'Category shares are YOUR plan, not a quote from vendors. Budget for taxes, tips and contingencies.'));

register('calculators/divorce-cost-calculator-2026', def([
  usd('legal', 'Estimated legal fees', 10000), usd('filing', 'Filing and court fees', 400),
  usd('mediation', 'Mediation / expert costs', 1500), usd('assets', 'Other transaction costs', 2000),
  num('hours', 'Your hours spent on the process', 100, { max: 100000 }), usd('rate', 'Illustrative value per hour', 25),
], v => [result('Cash expenses (does not include asset division)', v.legal + v.filing + v.mediation + v.assets),
  result('Time value (not a cash expense)', v.hours * v.rate),
  result('Combined illustrative cost', v.legal + v.filing + v.mediation + v.assets + v.hours * v.rate)],
'Not legal advice, an estimate of your inputs. Fees and asset division depend on local law and individual circumstances.'));

register('calculators/trump-tariff-calculator-2026', def([
  usd('price', 'Customs value of item', 100, { min: 0.01 }), pct('tariff', 'Applicable tariff rate', 25, { max: 1000 }),
  usd('shipping', 'Shipping and handling', 15),
], v => [result('Illustrative landed cost before other taxes', v.price * (1 + v.tariff / 100) + v.shipping),
  result('Tariff on item value only', v.price * v.tariff / 100)],
'Illustration only. Tariff classification, exemptions, freight treatment and other duties depend on current rules.'));

register('calculators/taylor-swift-concert-cost-calculator', def([
  usd('ticket', 'Ticket price', 180), usd('fees', 'Resale and booking fees', 30), usd('travel', 'Round-trip travel', 150),
  usd('hotel', 'Accommodation', 220), usd('food', 'Meals and other spending', 80),
  num('hours', 'Paid work hours you would actually miss', 0, { max: 1000 }), usd('rate', 'Pay lost per missed hour', 25),
], v => [result('Cash you will spend', v.ticket + v.fees + v.travel + v.hotel + v.food),
  result('Pay lost only if hours are unpaid', v.hours * v.rate),
  result('Total including missed pay', v.ticket + v.fees + v.travel + v.hotel + v.food + v.hours * v.rate)],
'Missed pay is $0 when you use paid leave or attend outside work. Examples do not reflect actual ticket quotes.'));

register('calculators/streaming-cost', def([
  usd('first', 'First service per month', 18), usd('second', 'Second service per month', 12),
  usd('third', 'Other services per month (combined)', 20),
  num('hours', 'Total hours watched/listened per month', 40, { min: 1, max: 744 }),
], v => {
  const monthly = v.first + v.second + v.third;
  return [result('All services per year', monthly * 12), result('Cost per hour of actual use', monthly / v.hours)];
}, 'Add actual bills rather than list prices. Hours must include only time you use these paid services.'));

register('calculators/gym-cost-per-visit', def([
  usd('fee', 'Monthly membership fee', 60), usd('joining', 'One-time joining fee', 0),
  num('visits', 'Visits per month', 4, { min: 1, max: 1000, step: 1 }),
], v => [result('Cost per visit over first 12 months', (v.fee * 12 + v.joining) / (v.visits * 12)),
  result('Total cost in first year', v.fee * 12 + v.joining)],
'Assumes the same number of visits each month for 12 months; excludes travel and cancellation penalties.'));

register('calculators/latte-factor', def([
  usd('spend', 'Amount per purchase', 5), num('days', 'Days per week', 5, { min: 1, max: 7, step: 1 }),
  num('years', 'Years', 10, { min: 1, max: 80, step: 1 }),
  pct('return', 'Hypothetical investment return', 7, { min: -50, max: 50 }),
], v => {
  const annual = v.spend * v.days * 52, monthly = annual / 12, months = v.years * 12, r = v.return / 1200;
  const future = monthly * (r ? ((1 + r) ** months - 1) / r : months);
  return [result('Annual spending (52 weeks)', annual), result('Spending over chosen years, no returns', annual * v.years),
    result('If invested monthly at that return', future)];
}, 'Investment outcome is hypothetical and not guaranteed. The choice to spend or save is yours.'));

register('calculators/subscription-audit', def([
  usd('fee', 'Monthly subscription fee', 15), num('uses', 'Times used this month', 3, { min: 0, max: 1e7, step: 1 }),
], v => [result('Annual cost if kept for 12 months', v.fee * 12),
  result('Cost per use this month', v.uses ? v.fee / v.uses : 'No uses this month', v.uses ? 'money' : 'text')],
'This is a cost check, not a recommendation to cancel. Decide whether the benefit is worth the price to you.'));

register('calculators/annual-vs-monthly-subscription', def([
  usd('monthly', 'Monthly plan price', 15.99, { min: 0.01 }), usd('annual', 'Upfront annual plan price', 153.50),
  num('months', 'Months you expect to use the service', 12, { min: 1, max: 12, step: 1 }),
], v => [result('Expected cost of monthly plan', v.monthly * v.months),
  result('Upfront annual cost', v.annual),
  result('Months of use to break even', Math.ceil(v.annual / v.monthly), 'months'),
  result('Savings from annual plan if used all 12 months', v.monthly * 12 - v.annual)],
'Annual plans may not be refundable; the break-even month is ceil(annual price ÷ monthly price). Negative savings mean the annual plan costs more.'));

// Older, non-cluster routes now have their own real inputs instead of the
// unrelated purchase-to-work-hours form. The original three cost-of-time tools
// keep the existing working calculator in app.js.
register('calculators/salary-to-hourly', def([
  usd('salary', 'Annual take-home salary', 52000, { min: 0.01 }),
  num('hours', 'Hours worked per week', 40, { min: 1, max: 168 }),
  num('weeks', 'Weeks worked per year', 52, { min: 1, max: 53 }),
], v => [result('Take-home per working hour', v.salary / (v.hours * v.weeks)), result('Working hours per year', v.hours * v.weeks, 'decimal')],
'This uses take-home pay; if entering gross salary, the result is gross hourly pay. Excludes unpaid overtime and commuting unless you include those hours.'));
register('calculators/hourly-to-salary', def([
  usd('hour', 'Hourly pay', 25, { min: 0.01 }), num('hours', 'Hours worked per week', 40, { min: 1, max: 168 }),
  num('weeks', 'Weeks paid per year', 52, { min: 1, max: 53 }),
], v => [result('Annual pay before any deductions', v.hour * v.hours * v.weeks), result('Average monthly pay', v.hour * v.hours * v.weeks / 12)],
'Annual amount assumes every week entered is paid; overtime multipliers, unpaid leave and taxes are not included.'));
register('calculators/cost-per-wear', def([
  usd('price', 'Item cost including alterations', 100, { min: 0.01 }),
  num('wears', 'Expected lifetime wears', 50, { min: 1, max: 1e7, step: 1 }),
], v => [result('Cost per wear', v.price / v.wears)], 'Estimate the number of wears you will actually get, not the maximum the garment could survive.'));
register('calculators/cost-per-use', def([
  usd('price', 'Total cost (including upkeep)', 120, { min: 0.01 }),
  num('uses', 'Expected lifetime uses', 40, { min: 1, max: 1e7, step: 1 }),
], v => [result('Cost per use', v.price / v.uses)], 'Maintenance or subscription costs belong in the total if applicable.'));
register('calculators/time-to-save', def([
  usd('goal', 'Amount to save', 1000, { min: 0.01 }),
  usd('daily', 'Amount actually saved per day', 10, { min: 0.01 }),
  usd('hour', 'Take-home hourly pay', 25, { min: 0.01 }),
], v => [result('Days until goal (rounded up)', Math.ceil(v.goal / v.daily), 'days'),
  result('Goal expressed as work hours', v.goal / v.hour, 'decimal')],
'Work hours are a comparison, not disposable income. Savings assumes daily deposits without interest.'));
register('calculators/paycheck-breakdown', def([
  usd('takehome', 'Monthly take-home pay', 4300, { min: 0.01 }), num('hours', 'Monthly hours worked', 173.33, { min: 1, max: 744 }),
  usd('rent', 'Housing expense per month', 1500), usd('food', 'Food per month', 400),
  usd('transport', 'Transport per month', 600), usd('other', 'Other bills per month', 100),
], v => {
  const bills = v.rent + v.food + v.transport + v.other;
  return [result('Work hours for these bills', bills / (v.takehome / v.hours), 'decimal'),
    result('Remaining monthly pay', v.takehome - bills), result('Housing work hours', v.rent / (v.takehome / v.hours), 'decimal')];
}, 'Uses your actual monthly hours and after-tax pay. Negative remaining pay means expenses exceed take-home income.'));
register('calculators/buy-vs-rent-hourly', def([
  usd('rent', 'Monthly rent', 2000), usd('own', 'Monthly cash cost of owning (loan, tax, maintenance, insurance)', 2400),
  num('hours', 'Hours spent at home each day', 14, { min: 1, max: 24 }),
], v => [result('Renter cost per hour at home', v.rent / (v.hours * 365 / 12)),
  result('Owner cash cost per hour at home', v.own / (v.hours * 365 / 12))],
'NOT a rent-vs-buy investment comparison: mortgage principal builds equity. For a sale-at-end cost comparison use the Rent vs Buy calculator.'));

export const calculatorRoutes = Object.freeze(Object.keys(definitions));
export function getCalculator(route) { return definitions[route] || null; }
export function calculateRoute(route, values) {
  const model = getCalculator(route);
  if (!model) throw new Error(`No calculator model for ${route}`);
  const inputs = {};
  for (const f of model.fields) {
    // Empty strings must not silently turn into zero, and Infinity/NaN must
    // never be emitted into a visitor-facing result or a schema description.
    const raw = values[f.key];
    if (raw === '' || raw == null) throw new RangeError(`Enter ${f.label.toLowerCase()}.`);
    const n = Number(raw);
    if (!Number.isFinite(n) || n < f.min || n > f.max || (f.step === 1 && !Number.isInteger(n))) {
      throw new RangeError(`${f.label} must be between ${f.min} and ${f.max}${f.step === 1 ? ' (whole number)' : ''}.`);
    }
    inputs[f.key] = n;
  }
  const outputs = model.calculate(inputs);
  if (!Array.isArray(outputs) || !outputs.length || outputs.some(o =>
    !o || typeof o.label !== 'string' ||
    (typeof o.value === 'number' && !Number.isFinite(o.value)) ||
    (typeof o.value !== 'number' && (o.format !== 'text' || typeof o.value !== 'string')))) {
    throw new RangeError('That combination of inputs cannot be calculated; please check your numbers.');
  }
  return outputs;
}
export function formatResult({ value, format }, currency = 'USD') {
  if (format === 'text') return value;
  const locale = currency === 'EUR' ? 'es-ES' : currency === 'MXN' ? 'es-MX' : 'en-US';
  if (format === 'money') return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(round(value));
  if (format === 'small-money') return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 8 }).format(value);
  const rendered = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(round(value));
  return format === 'percent' ? `${rendered}%` : format === 'months' ? `${rendered} months` : format === 'years' ? `${rendered} years` : format === 'days' ? `${rendered} days` : rendered;
}
