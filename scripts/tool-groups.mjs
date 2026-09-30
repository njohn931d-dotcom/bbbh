/**
 * Routes that are not calculators or guides: the two browse hubs and the three
 * pages a money site is judged on. Declared here rather than in generate-hubs.mjs
 * because generate-seo.mjs needs the same list for llms.txt, and
 * generate-hubs.mjs already imports generate-seo.mjs.
 */
export const HUB_ROUTES = ['calculators', 'guides', 'about', 'methodology', 'privacy'];

/**
 * How the tools are grouped for browsing.
 *
 * Shared by the /calculators/ index and the homepage directory so the two can
 * never disagree about which tools exist or what they are called.
 *
 * Any route a future build adds without being named here still appears on the
 * index — generate-hubs.mjs puts unnamed routes in a final "More tools" group,
 * so a page can never be silently dropped from the index.
 */

/**
 * Grouping. Routes named here appear under a heading in this order; anything a
 * future build adds without being named still shows up, under "More tools", so
 * a page can never be silently dropped from the index.
 */
export const GROUPS = [
  {
    name: 'Pay, hours and take-home pay',
    blurb: 'What an hour is worth, what is withheld, and what actually arrives.',
    routes: [
      'calculators/cost-of-time', 'calculators/salary-to-hourly', 'calculators/hourly-to-salary',
      'calculators/after-tax-income', 'calculators/paycheck-breakdown', 'calculators/paycheck-calculator-2026',
      'calculators/overtime-pay', 'calculators/bonus-tax-calculator', 'calculators/wage-growth-calculator-2026',
      'calculators/freelance-rate', 'calculators/freelance-rate-calculator-2026', 'calculators/side-hustle-calculator-2026',
      'calculators/time-to-save', 'calculators/income-percentile-calculator-2026',
    ],
  },
  {
    name: 'Borrowing, debt and credit',
    blurb: 'Payments, interest, payoff order and the arithmetic of getting out.',
    routes: [
      'calculators/mortgage-calculator-2026', 'calculators/car-loan-calculator-2026', 'calculators/student-loan-calculator-2026',
      'calculators/loan-comparison-calculator-2026', 'calculators/credit-card-payoff-calculator-2026',
      'calculators/debt-snowball-vs-avalanche-calculator',
    ],
  },
  {
    name: 'Saving, investing and net worth',
    blurb: 'Compounding, returns and what a balance becomes over time.',
    routes: [
      'calculators/compound-interest-calculator', 'calculators/investment-return-calculator-2026', 'calculators/roi-calculator',
      'calculators/apy-calculator', 'calculators/401k-calculator', 'calculators/savings-goal-calculator-2026',
      'calculators/emergency-fund-calculator', 'calculators/net-worth-calculator-2026', 'calculators/inflation-calculator-2026',
      'calculators/crypto-profit-calculator-2026',
    ],
  },
  {
    name: 'Housing and moving',
    blurb: 'Deposits, rent, affordability and the cost of changing address.',
    routes: [
      'calculators/rent-affordability-calculator', 'calculators/down-payment-calculator', 'calculators/rent-vs-buy-calculator-2026',
      'calculators/cost-of-living-calculator-2026', 'calculators/moving-cost-calculator',
    ],
  },
  {
    name: 'Cars, fuel and running costs',
    blurb: 'What a vehicle costs to own, not just to buy.',
    routes: [
      'calculators/car-ownership-cost', 'calculators/depreciation-calculator-2026', 'calculators/commute-cost', 'calculators/gas-cost-calculator',
    ],
  },
  {
    name: 'Everyday spending',
    blurb: 'Tips, tax, discounts, unit prices and the habits behind them.',
    routes: [
      'calculators/tip-calculator', 'calculators/sales-tax-calculator', 'calculators/percent-off-calculator',
      'calculators/unit-price-calculator', 'calculators/cost-per-use', 'calculators/cost-per-wear', 'calculators/latte-factor',
      'calculators/daily-savings', 'calculators/50-30-20-budget-calculator', 'calculators/electricity-cost-calculator',
      'calculators/buy-vs-rent-hourly',
    ],
  },
  {
    name: 'Subscriptions and recurring charges',
    blurb: 'Monthly prices converted into annual bills.',
    routes: [
      'calculators/subscription-cost', 'calculators/subscription-audit', 'calculators/annual-vs-monthly-subscription',
      'calculators/streaming-cost', 'calculators/gym-cost-per-visit',
    ],
  },
  {
    name: 'Family, life events and one-off bills',
    blurb: 'The costs that arrive once and stay for years.',
    routes: [
      'calculators/child-cost-calculator-2026', 'calculators/childcare-cost-calculator-2026',
      'calculators/wedding-budget-calculator-2026', 'calculators/divorce-cost-calculator-2026',
      'calculators/pet-cost-calculator', 'calculators/lottery-tax-calculator-2026', 'calculators/trump-tariff-calculator-2026',
      'calculators/profit-margin-calculator',
    ],
  },
  {
    name: 'Creator and viral economics',
    blurb: 'What views, subscribers and audiences are actually worth.',
    routes: [
      'calculators/youtube-earnings-calculator-2026', 'calculators/tiktok-money-calculator-2026',
      'calculators/onlyfans-earnings-calculator-2026', 'calculators/mrbeast-earnings-per-second-calculator',
      'calculators/salary-in-hours-elon-musk-calculator', 'calculators/taylor-swift-concert-cost-calculator',
      'calculators/ai-job-replacement-calculator-2026', 'calculators/chatgpt-cost-calculator-2026',
    ],
  },
];

/** Group headings for the guides hub, keyed by the article cluster slug. */
export const GUIDE_GROUPS = [
  { name: 'Money in hours', blurb: 'What a price costs in the time it took to earn.', match: r => /time-worth|work-hours|cost-of-time/.test(r) },
  { name: 'Subscriptions', blurb: 'Recurring charges, annualised.', match: r => /subscription|streaming|netflix|annual-vs-monthly/.test(r) },
  { name: 'Saving habits', blurb: 'Small amounts, long horizons.', match: r => /saving|save|emergency-fund|sinking/.test(r) },
  { name: 'Pay and rates', blurb: 'Hourly, annual, take-home and overtime.', match: r => /hourly|salary|overtime|paycheck|freelance|wage/.test(r) },
  { name: 'Spending decisions', blurb: 'How to compare two things honestly.', match: r => /cost-per|impulse|purchase|rent-or-buy|car|latte|convenience|minimalism|value-free/.test(r) },
];

/**
 * The footer link set every generated page carries.
 *
 * Kept here rather than in either generator because both need it and neither
 * may import the other: generate-hubs.mjs already imports generate-seo.mjs, so
 * a shared home in generate-seo.mjs would close the cycle.
 */
export const siteFooter = () =>
  '<p style="font-size:9px;color:#96a08b;text-align:right">' +
  '<a href="/about/">About</a> · <a href="/methodology/">How the numbers are made</a> · ' +
  '<a href="/privacy/">Privacy</a> · <a href="/calculators/">All calculators</a> · ' +
  '<a href="/guides/">All guides</a> · <a href="/articles/">The money edit</a></p>';
