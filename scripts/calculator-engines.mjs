/**
 * Real, per-page calculator engines.
 *
 * Before this file every "calculator" page shipped the same widget: the
 * cost-of-time form, with `data-mode="purchase"`, the same `$150 / $25`
 * defaults and the same markup. A page titled "Mortgage Calculator: Monthly
 * Payment and Total Interest" therefore showed a widget that answered an
 * unrelated question, and 50-odd pages shared byte-identical form markup.
 *
 * Every engine below owns the maths for exactly one page: its own inputs, its
 * own formula, its own formatted outputs and its own worked table. The maths
 * lives in `compute`, which is:
 *
 *   1. pure (same inputs -> same outputs, no clock, no randomness, no I/O),
 *   2. self-contained (no closure over module scope), and
 *   3. serialised into the page with `Function.prototype.toString()`.
 *
 * Rule 3 is what keeps the served HTML and the browser in agreement: the page
 * is rendered on the server with `compute`, and the inline script runs the very
 * same function over the user's inputs. There is no second implementation to
 * drift, which is the failure mode that makes a calculator page rank and then
 * lose trust when the numbers disagree with the prose.
 *
 * Host rules: no build-time dependencies, no network, no `Intl` inside
 * `compute` (formatting is the renderer's job, via `formatValue`).
 *
 * Run `node scripts/calculator-engines.mjs` to print a coverage report.
 */

/* ------------------------------------------------------------------ format */

/**
 * One formatter, used by the Node renderer and serialised into the page, so a
 * number never renders differently in the HTML and in the live widget.
 * @param {number} value
 * @param {string} kind money | money0 | number | int | percent | years | hours | ratio | text
 */
export function formatValue(value, kind) {
  var n = typeof value === 'number' ? value : Number(value);
  if (!isFinite(n)) return '—';
  var abs = Math.abs(n);
  var money = function (v, digits) {
    var s = new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
    return (v < 0 ? '−$' : '$') + s.replace('-', '');
  };
  switch (kind) {
    case 'money': return money(n, abs >= 1000 ? 0 : abs >= 1 ? 2 : 2);
    case 'money0': return money(n, 0);
    case 'money2': return money(n, 2);
    case 'int': return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
    case 'number':
    case 'hours': return new Intl.NumberFormat('en-US', { maximumFractionDigits: n !== 0 && abs < 1 ? 2 : 1 }).format(n);
    case 'hours2': return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
    case 'percent': return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n) + '%';
    case 'percent2': return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n) + '%';
    case 'x': return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n) + '×';
    default: return String(value);
  }
}

/* ------------------------------------------------------------------- maths */

/** Monthly payment on an amortising loan. Pure, shared by several engines. */
function amortisedPayment(principal, annualRatePercent, months) {
  var r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / months;
  var g = Math.pow(1 + r, months);
  return (principal * r * g) / (g - 1);
}

/* ----------------------------------------------------------------- engines */

/**
 * @typedef {{id:string,label:string,kind:'money'|'number'|'percent'|'select'|'text',
 *   value:number|string,min?:number,max?:number,step?:number,suffix?:string,
 *   options?:[string,string][],hint?:string,wide?:boolean}} EngineField
 */

/**
 * `compute` receives already-parsed numbers (selects arrive as strings) and
 * returns the figure the page is about, the secondary metrics, and optionally
 * a table. All table cells are pre-formatted strings so the server render and
 * the browser render cannot diverge.
 *
 * @param {Record<string, any>} v
 * @returns {{primary:{value:number,kind:string},metrics?:{label:string,value:number,kind:string,hint?:string}[],rows?:{head:string[],body:string[][]},message?:string}}
 */
const E = {};

/**
 * Wrap a bare compute function in the shared shape so engines stay one screen
 * long. `primaryKind` defaults to 'money'.
 */
const engine = (id, label, fields, compute, extra = {}) => ({ id, label, fields, compute, ...extra });

/* --------------------------------------------------- money <-> hours family */

export const ENGINES = {
  /* ------------------------------------------------------------ the originals */
  'calculators/cost-of-time': engine(
    'cost-of-time',
    'Cost of your time',
    [
      { id: 'price', label: 'How much does it cost?', kind: 'money', value: 150, min: 0, max: 1e9, step: 1, suffix: 'USD' },
      { id: 'pay', label: 'Your take-home pay', kind: 'money', value: 25, min: 0.01, max: 1e9, step: 0.5, suffix: '/ hour', hint: 'After-tax income gives the clearest picture.' },
      { id: 'hours', label: 'Hours you work per week', kind: 'number', value: 40, min: 1, max: 100, step: 1, suffix: 'h / week' },
      { id: 'weeks', label: 'Weeks you work per year', kind: 'number', value: 52, min: 1, max: 52, step: 1, suffix: 'weeks' },
    ],
    function (v) {
      var annualHours = v.hours * v.weeks;
      var workHours = v.price / v.pay;
      var days = workHours / 8;
      var pctOfYear = workHours / annualHours * 100;
      return {
        primary: { value: workHours, kind: 'hours' },
        metrics: [
          { label: 'Workdays', value: days, kind: 'number', hint: 'At 8 paid hours a workday' },
          { label: 'Working year', value: annualHours, kind: 'int', hint: 'Your paid hours, from the inputs above' },
          { label: 'Share of a working year', value: pctOfYear, kind: 'percent2' },
          { label: 'Take-home per working day', value: v.pay * 8, kind: 'money2' },
        ],
        message: 'Work hours = price ÷ take-home hourly pay. Shorten the week or take more time off and the same price costs proportionally more of your year.',
      };
    },
    { unit: 'hours of work', tone: 'THE PERSPECTIVE SHIFT' },
  ),

  'calculators/subscription-cost': engine(
    'subscription-cost',
    'Subscription check',
    [
      { id: 'monthly', label: 'Monthly subscription cost', kind: 'money', value: 15, min: 0.01, max: 1e7, step: 1, suffix: '/ mo' },
      { id: 'count', label: 'How many subscriptions', kind: 'number', value: 1, min: 1, max: 200, step: 1, suffix: 'services' },
      { id: 'pay', label: 'Your take-home pay', kind: 'money', value: 25, min: 0.01, max: 1e9, step: 0.5, suffix: '/ hour' },
    ],
    function (v) {
      var monthly = v.monthly * v.count;
      var annual = monthly * 12;
      var fiveYear = annual * 5;
      return {
        primary: { value: annual, kind: 'money' },
        metrics: [
          { label: 'Billed each month', value: monthly, kind: 'money2' },
          { label: 'Hours of work per year', value: annual / v.pay, kind: 'hours' },
          { label: 'Cost over five years', value: fiveYear, kind: 'money0', hint: 'Before any price rise' },
          { label: 'Daily equivalent', value: annual / 365, kind: 'money2' },
        ],
        rows: {
          head: ['Monthly total', 'Per year', 'Per 5 years', 'Hours a year at your pay'],
          body: [1, 2, 3, 5].map(function (mult) {
            var m = 15 * mult;
            return [formatValue(m, 'money2'), formatValue(m * 12, 'money0'), formatValue(m * 12 * 5, 'money0'), formatValue(m * 12 / 25, 'hours')];
          }),
        },
        message: 'Annual cost = monthly price × 12. A price rise of a few pounds a month compounds: check the renewal price, not the introductory one.',
      };
    },
    { unit: 'a year', tone: 'SMALL MONTHLY, BIG YEARLY' },
  ),

  'calculators/daily-savings': engine(
    'daily-savings',
    'Small habits, big savings',
    [
      { id: 'daily', label: 'Daily amount to set aside', kind: 'money', value: 5, min: 0.01, max: 1e6, step: 1, suffix: '/ day' },
      { id: 'daysPerWeek', label: 'Days a week', kind: 'number', value: 7, min: 1, max: 7, step: 1, suffix: 'days' },
      { id: 'pay', label: 'Your take-home pay', kind: 'money', value: 25, min: 0.01, max: 1e9, step: 0.5, suffix: '/ hour' },
    ],
    function (v) {
      var perYear = v.daysPerWeek === 7 ? 365 : 52 * v.daysPerWeek;
      var annual = v.daily * perYear;
      return {
        primary: { value: annual, kind: 'money' },
        metrics: [
          { label: 'Saving days a year', value: perYear, kind: 'int' },
          { label: 'Hours of work it represents', value: annual / v.pay, kind: 'hours' },
          { label: 'Every month', value: annual / 12, kind: 'money2' },
          { label: 'Over five years', value: annual * 5, kind: 'money0', hint: 'No investment return assumed' },
        ],
        rows: {
          head: ['Daily amount', 'Days a year', 'Saved a year', 'Over 5 years'],
          body: [1, 2, 5, 10].map(function (d) {
            var days = v.daysPerWeek === 7 ? 365 : 52 * v.daysPerWeek;
            var y = d * days;
            return [formatValue(d, 'money2'), formatValue(days, 'int'), formatValue(y, 'money0'), formatValue(y * 5, 'money0')];
          }),
        },
        message: 'This is money set aside, not an investment forecast. Cut a purchase you will not miss, and move the difference somewhere you cannot spend it by accident.',
      };
    },
    { unit: 'a year', tone: 'LITTLE HABITS, MORE POSSIBILITY' },
  ),

  /* --------------------------------------------------------- pay and hours */
  'calculators/salary-to-hourly': engine(
    'salary-to-hourly',
    'Salary to hourly',
    [
      { id: 'salary', label: 'Annual salary (gross)', kind: 'money', value: 70000, min: 0, max: 1e9, step: 1000, suffix: 'USD' },
      { id: 'hours', label: 'Hours per week', kind: 'number', value: 40, min: 1, max: 100, step: 1, suffix: 'h / week' },
      { id: 'weeks', label: 'Weeks worked a year', kind: 'number', value: 52, min: 1, max: 52, step: 1, suffix: 'weeks' },
      { id: 'tax', label: 'Effective tax and deductions', kind: 'percent', value: 25, min: 0, max: 60, step: 1, suffix: '%' },
    ],
    function (v) {
      var annualHours = v.hours * v.weeks;
      var hourly = v.salary / annualHours;
      var netHourly = hourly * (1 - v.tax / 100);
      return {
        primary: { value: hourly, kind: 'money2' },
        metrics: [
          { label: 'Paid hours a year', value: annualHours, kind: 'int', hint: 'Hours × weeks, so unpaid leave is excluded' },
          { label: 'After-tax hourly', value: netHourly, kind: 'money2' },
          { label: 'Monthly gross', value: v.salary / 12, kind: 'money0' },
          { label: 'Per working day', value: hourly * 8, kind: 'money2' },
        ],
        rows: {
          head: ['Annual salary', '2,080 h', '2,000 h', '1,820 h (35 h week)'],
          body: [40000, 60000, 80000, 100000, 150000].map(function (s) {
            return [formatValue(s, 'money0'), formatValue(s / 2080, 'money2'), formatValue(s / 2000, 'money2'), formatValue(s / 1820, 'money2')];
          }),
        },
        message: 'The 2,080-hour baseline in every salary-to-hourly table is 40 hours × 52 weeks with no holiday. Enter your real hours and weeks and the same salary converts to a higher hourly rate.',
      };
    },
    { unit: 'per hour', tone: 'THE 2,080-HOUR BASELINE' },
  ),

  'calculators/hourly-to-salary': engine(
    'hourly-to-salary',
    'Hourly to salary',
    [
      { id: 'hourly', label: 'Hourly rate', kind: 'money', value: 20, min: 0, max: 1e6, step: 0.25, suffix: 'USD / hour' },
      { id: 'hours', label: 'Hours per week', kind: 'number', value: 40, min: 1, max: 100, step: 1, suffix: 'h / week' },
      { id: 'weeks', label: 'Weeks worked a year', kind: 'number', value: 52, min: 1, max: 52, step: 1, suffix: 'weeks' },
      { id: 'overtime', label: 'Paid overtime hours a week', kind: 'number', value: 0, min: 0, max: 40, step: 1, suffix: 'h / week' },
    ],
    function (v) {
      var base = v.hourly * v.hours * v.weeks;
      var overtime = v.hourly * 1.5 * v.overtime * v.weeks;
      var annual = base + overtime;
      return {
        primary: { value: annual, kind: 'money' },
        metrics: [
          { label: 'Gross a month', value: annual / 12, kind: 'money0' },
          { label: 'Gross a week', value: annual / 52, kind: 'money2' },
          { label: 'Base pay', value: base, kind: 'money0', hint: 'Before overtime' },
          { label: 'Overtime premium', value: overtime, kind: 'money0', hint: 'The 1.5× hours above your base rate' },
        ],
        rows: {
          head: ['Hourly', '40 h × 52', '38 h × 52', '40 h × 50'],
          body: [15, 20, 25, 30, 40].map(function (h) {
            return [formatValue(h, 'money2'), formatValue(h * 2080, 'money0'), formatValue(h * 1976, 'money0'), formatValue(h * 2000, 'money0')];
          }),
        },
        message: 'Hourly × 2,080 is the standardised figure, not a promise. Anything unpaid — holiday, sick days, cancelled shifts — comes straight out of the annual number.',
      };
    },
    { unit: 'a year', tone: 'HOURLY × HOURS × WEEKS' },
  ),

  'calculators/overtime-pay': engine(
    'overtime-pay',
    'Overtime pay',
    [
      { id: 'hourly', label: 'Regular hourly rate', kind: 'money', value: 20, min: 0, max: 1e6, step: 0.5, suffix: 'USD / hour' },
      { id: 'overtimeHours', label: 'Overtime hours this period', kind: 'number', value: 10, min: 0, max: 300, step: 1, suffix: 'hours' },
      { id: 'multiplier', label: 'Overtime multiplier', kind: 'select', value: '1.5', options: [['1.5', '1.5× (time and a half)'], ['2', '2× (double time)'], ['1.25', '1.25×'], ['1', '1× (no premium)']] },
      { id: 'periods', label: 'Paid periods a year', kind: 'number', value: 26, min: 1, max: 52, step: 1, suffix: 'periods' },
    ],
    function (v) {
      var mult = Number(v.multiplier);
      var premiumPerHour = v.hourly * (mult - 1);
      var overtimePay = v.hourly * mult * v.overtimeHours;
      return {
        primary: { value: overtimePay, kind: 'money2' },
        metrics: [
          { label: 'Extra over base', value: v.hourly * v.overtimeHours * (mult - 1), kind: 'money2', hint: 'The premium only' },
          { label: 'Overtime rate', value: v.hourly * mult, kind: 'money2' },
          { label: 'If it repeats all year', value: overtimePay * v.periods, kind: 'money0', hint: 'At this many periods' },
          { label: 'Blended rate over these hours', value: (v.hourly * 40 + overtimePay) / (40 + v.overtimeHours), kind: 'money2', hint: 'What the average hour is worth once the overtime hours are included' },
        ],
        rows: {
          head: ['Regular rate', '1.25×', '1.5×', '2×'],
          body: [12, 15, 20, 25, 30].map(function (h) {
            return [formatValue(h, 'money2'), formatValue(h * 1.25, 'money2'), formatValue(h * 1.5, 'money2'), formatValue(h * 2, 'money2')];
          }),
        },
        message: 'Overtime is a premium on the regular rate, not a new rate. Only the hours above the threshold qualify, and in most jurisdictions the threshold is a weekly total, not a daily one.',
      };
    },
    { unit: 'this period', tone: 'TIME AND A HALF' },
  ),

  'calculators/after-tax-income': engine(
    'after-tax-income',
    'Take-home pay',
    [
      { id: 'gross', label: 'Gross annual pay', kind: 'money', value: 70000, min: 0, max: 1e9, step: 1000, suffix: 'USD' },
      { id: 'federal', label: 'Federal tax', kind: 'percent', value: 12, min: 0, max: 50, step: 0.5, suffix: '%' },
      { id: 'state', label: 'State and local tax', kind: 'percent', value: 5, min: 0, max: 20, step: 0.5, suffix: '%' },
      { id: 'pretax', label: 'Pre-tax deductions', kind: 'money', value: 4000, min: 0, max: 1e7, step: 500, suffix: 'per year' },
    ],
    function (v) {
      var taxable = Math.max(0, v.gross - v.pretax);
      var fed = taxable * v.federal / 100;
      var state = taxable * v.state / 100;
      var fica = Math.min(taxable, 176100) * 0.062 + taxable * 0.0145;
      var net = v.gross - v.pretax - fed - state - fica;
      return {
        primary: { value: net, kind: 'money' },
        metrics: [
          { label: 'Taxable pay', value: taxable, kind: 'money0', hint: 'Gross minus pre-tax deductions' },
          { label: 'FICA (Social Security + Medicare)', value: fica, kind: 'money0' },
          { label: 'Total tax', value: fed + state + fica, kind: 'money0' },
          { label: 'Take-home rate', value: net / v.gross * 100, kind: 'percent' },
        ],
        rows: {
          head: ['Gross', 'Taxable', 'FICA', 'Take-home'],
          body: [40000, 60000, 80000, 120000].map(function (g) {
            var t = Math.max(0, g - v.pretax);
            var f = t * v.federal / 100 + t * v.state / 100 + Math.min(t, 176100) * 0.062 + t * 0.0145;
            return [formatValue(g, 'money0'), formatValue(t, 'money0'), formatValue(Math.min(t, 176100) * 0.062 + t * 0.0145, 'money0'), formatValue(g - v.pretax - f, 'money0')];
          }),
        },
        message: 'This is a flat-rate estimate. Real brackets are progressive, so if your pay sits across two bands the flat rate above will understate the tax on the top slice and overstate it on the rest.',
      };
    },
    { unit: 'a year', tone: 'GROSS TO NET' },
  ),

  'calculators/paycheck-breakdown': engine(
    'paycheck-breakdown',
    'Paycheck breakdown',
    [
      { id: 'gross', label: 'Gross pay per period', kind: 'money', value: 2692, min: 0, max: 1e7, step: 50, suffix: 'USD' },
      { id: 'frequency', label: 'Pay frequency', kind: 'select', value: '26', options: [['12', 'Monthly (12)'], ['24', 'Twice a month (24)'], ['26', 'Every two weeks (26)'], ['52', 'Weekly (52)']] },
      { id: 'federal', label: 'Federal income tax', kind: 'percent', value: 12, min: 0, max: 50, step: 0.5, suffix: '%' },
      { id: 'state', label: 'State tax', kind: 'percent', value: 5, min: 0, max: 20, step: 0.5, suffix: '%' },
      { id: 'retirement', label: 'Retirement contribution', kind: 'percent', value: 5, min: 0, max: 50, step: 0.5, suffix: '%' },
      { id: 'insurance', label: 'Health insurance per period', kind: 'money', value: 120, min: 0, max: 1e5, step: 10, suffix: 'per period' },
    ],
    function (v) {
      var periods = Number(v.frequency);
      var pretax = v.gross * v.retirement / 100 + v.insurance;
      var taxable = Math.max(0, v.gross - pretax);
      var fed = taxable * v.federal / 100;
      var state = taxable * v.state / 100;
      var fica = Math.min(taxable, 176100 / periods) * 0.062 + taxable * 0.0145;
      var net = v.gross - pretax - fed - state - fica;
      return {
        primary: { value: net, kind: 'money2' },
        metrics: [
          { label: 'Net a year', value: net * periods, kind: 'money0' },
          { label: 'Total withheld', value: pretax + fed + state + fica, kind: 'money2' },
          { label: 'Keep rate', value: net / v.gross * 100, kind: 'percent' },
          { label: 'Paid periods a year', value: periods, kind: 'int' },
        ],
        rows: {
          head: ['Line', 'Per period', 'Per year'],
          body: [
            ['Gross', formatValue(v.gross, 'money2'), formatValue(v.gross * periods, 'money0')],
            ['Retirement', '−' + formatValue(v.gross * v.retirement / 100, 'money2'), '−' + formatValue(v.gross * v.retirement / 100 * periods, 'money0')],
            ['Health insurance', '−' + formatValue(v.insurance, 'money2'), '−' + formatValue(v.insurance * periods, 'money0')],
            ['Federal tax', '−' + formatValue(fed, 'money2'), '−' + formatValue(fed * periods, 'money0')],
            ['State tax', '−' + formatValue(state, 'money2'), '−' + formatValue(state * periods, 'money0')],
            ['FICA', '−' + formatValue(fica, 'money2'), '−' + formatValue(fica * periods, 'money0')],
            ['Take-home', formatValue(net, 'money2'), formatValue(net * periods, 'money0')],
          ],
        },
        message: 'Retirement contributions and insurance premiums come out before tax, so they lower the tax bill as well as the take-home figure. That is why a 5% contribution costs less than 5% of net pay.',
      };
    },
    { unit: 'take-home', tone: 'WHERE EACH DOLLAR GOES' },
  ),

  'calculators/paycheck-calculator-2026': engine(
    'paycheck-calculator',
    'Paycheck calculator',
    [
      { id: 'salary', label: 'Annual gross salary', kind: 'money', value: 60000, min: 0, max: 1e9, step: 1000, suffix: 'USD' },
      { id: 'frequency', label: 'Pay frequency', kind: 'select', value: '26', options: [['12', 'Monthly'], ['24', 'Twice a month'], ['26', 'Every two weeks'], ['52', 'Weekly']] },
      { id: 'dependents', label: 'Dependents claimed', kind: 'number', value: 1, min: 0, max: 12, step: 1, suffix: 'dependents' },
      { id: 'retirement', label: '401(k) contribution', kind: 'percent', value: 5, min: 0, max: 60, step: 0.5, suffix: '%' },
      { id: 'state', label: 'State tax', kind: 'percent', value: 5, min: 0, max: 20, step: 0.5, suffix: '%' },
    ],
    function (v) {
      var periods = Number(v.frequency);
      var gross = v.salary / periods;
      var retire = gross * v.retirement / 100;
      var allowanceCredit = v.dependents * 2000 / periods;
      var taxable = Math.max(0, gross - retire);
      var fed = Math.max(0, taxable * 0.12 - allowanceCredit * 0.12);
      var state = taxable * v.state / 100;
      var fica = Math.min(taxable, 176100 / periods) * 0.062 + taxable * 0.0145;
      return {
        primary: { value: gross - retire - fed - state - fica, kind: 'money2' },
        metrics: [
          { label: 'Gross per paycheck', value: gross, kind: 'money2' },
          { label: 'Total deductions', value: retire + fed + state + fica, kind: 'money2' },
          { label: 'Take-home a year', value: (gross - retire - fed - state - fica) * periods, kind: 'money0' },
          { label: 'Paychecks a year', value: periods, kind: 'int' },
        ],
        rows: {
          head: ['Gross salary', 'Monthly', 'Biweekly', 'Take-home (est.)'],
          body: [40000, 55000, 70000, 90000].map(function (s) {
            var g = s / periods;
            var r = g * v.retirement / 100;
            var t = g - r;
            var d = t * 0.12 + t * v.state / 100 + Math.min(t, 176100 / periods) * 0.062 + t * 0.0145;
            return [formatValue(s, 'money0'), formatValue(s / 12, 'money2'), formatValue(s / 26, 'money2'), formatValue(s / periods - r - d, 'money2')];
          }),
        },
        message: 'Withholding is an estimate, not a tax bill. Bonuses, a second job or a mid-year raise all push the real figure away from the table, and the difference is settled at filing.',
      };
    },
    { unit: 'take-home', tone: 'PER PAYCHECK' },
  ),

  /* ------------------------------------------------------------- freelance */
  'calculators/freelance-rate': engine(
    'freelance-rate',
    'Freelance rate',
    [
      { id: 'target', label: 'Take-home income you want', kind: 'money', value: 80000, min: 1, max: 1e9, step: 1000, suffix: 'per year' },
      { id: 'costs', label: 'Business costs a year', kind: 'money', value: 9000, min: 0, max: 1e8, step: 500, suffix: 'per year', hint: 'Software, insurance, hardware, accounting' },
      { id: 'tax', label: 'Self-employment + income tax', kind: 'percent', value: 32, min: 0, max: 60, step: 1, suffix: '%' },
      { id: 'billable', label: 'Billable hours a week', kind: 'number', value: 25, min: 1, max: 80, step: 1, suffix: 'h / week' },
      { id: 'weeksOff', label: 'Weeks off a year', kind: 'number', value: 6, min: 0, max: 30, step: 1, suffix: 'weeks' },
    ],
    function (v) {
      var weeks = 52 - v.weeksOff;
      var billableHours = v.billable * weeks;
      var preTax = (v.target + v.costs) / (1 - v.tax / 100);
      var hourly = preTax / billableHours;
      return {
        primary: { value: hourly, kind: 'money2' },
        metrics: [
          { label: 'Day rate (8 h)', value: hourly * 8, kind: 'money2' },
          { label: 'Revenue needed', value: preTax, kind: 'money0', hint: 'Before tax, after business costs' },
          { label: 'Billable hours a year', value: billableHours, kind: 'int', hint: 'The denominator that decides the rate' },
          { label: 'Tax and costs', value: preTax - v.target, kind: 'money0' },
        ],
        rows: {
          head: ['Take-home target', 'Billable h/yr', 'Needed hourly', 'Day rate'],
          body: [50000, 70000, 90000, 120000].map(function (t) {
            var need = (t + v.costs) / (1 - v.tax / 100);
            return [formatValue(t, 'money0'), formatValue(billableHours, 'int'), formatValue(need / billableHours, 'money2'), formatValue(need / billableHours * 8, 'money2')];
          }),
        },
        message: 'The rate is set by the billable hours, not by the income target. Cutting the working week without cutting the income target raises the rate; that is arithmetic, not ambition.',
      };
    },
    { unit: 'per hour', tone: 'THE BILLABLE-HOURS FORMULA' },
  ),

  'calculators/freelance-rate-calculator-2026': engine(
    'freelance-rate-day',
    'Freelance day rate',
    [
      { id: 'monthly', label: 'Monthly income target', kind: 'money', value: 6000, min: 1, max: 1e7, step: 250, suffix: 'per month' },
      { id: 'overhead', label: 'Monthly business overhead', kind: 'money', value: 800, min: 0, max: 1e6, step: 50, suffix: 'per month' },
      { id: 'tax', label: 'Tax reserve', kind: 'percent', value: 30, min: 0, max: 60, step: 1, suffix: '%' },
      { id: 'days', label: 'Billable days a month', kind: 'number', value: 16, min: 1, max: 23, step: 1, suffix: 'days' },
    ],
    function (v) {
      var needed = (v.monthly + v.overhead) / (1 - v.tax / 100);
      var dayRate = needed / v.days;
      return {
        primary: { value: dayRate, kind: 'money2' },
        metrics: [
          { label: 'Revenue a month', value: needed, kind: 'money0' },
          { label: 'Hourly equivalent (8 h day)', value: dayRate / 8, kind: 'money2' },
          { label: 'Revenue a year', value: needed * 12, kind: 'money0' },
          { label: 'Billable days a year', value: v.days * 12, kind: 'int' },
        ],
        rows: {
          head: ['Income target', 'Billable days/mo', 'Day rate', 'Hourly'],
          body: [3000, 5000, 8000, 12000].map(function (m) {
            var n = (m + v.overhead) / (1 - v.tax / 100);
            return [formatValue(m, 'money0'), formatValue(v.days, 'int'), formatValue(n / v.days, 'money2'), formatValue(n / v.days / 8, 'money2')];
          }),
        },
        message: 'Non-billable time — proposals, invoicing, admin, sales — is what makes a day rate look high and earn low. Bill the days, not the hours you are awake.',
      };
    },
    { unit: 'per billable day', tone: 'DAY RATE, NOT HOUR RATE' },
  ),

  'calculators/side-hustle-calculator-2026': engine(
    'side-hustle',
    'Side hustle profit',
    [
      { id: 'hours', label: 'Hours a week', kind: 'number', value: 10, min: 1, max: 80, step: 1, suffix: 'h / week' },
      { id: 'rate', label: 'Amount earned per hour', kind: 'money', value: 25, min: 0.01, max: 1e5, step: 1, suffix: 'USD / hour' },
      { id: 'costs', label: 'Monthly costs', kind: 'money', value: 60, min: 0, max: 1e6, step: 10, suffix: 'per month', hint: 'Fees, tools, materials, subscriptions' },
      { id: 'tax', label: 'Tax set aside', kind: 'percent', value: 25, min: 0, max: 60, step: 1, suffix: '%' },
    ],
    function (v) {
      var gross = v.hours * v.rate * 52 / 12;
      var afterCosts = gross - v.costs;
      var net = afterCosts * (1 - v.tax / 100);
      return {
        primary: { value: net, kind: 'money2' },
        metrics: [
          { label: 'Real hourly after everything', value: net / (v.hours * 52 / 12), kind: 'money2', hint: 'Net profit ÷ hours worked' },
          { label: 'Gross a month', value: gross, kind: 'money0' },
          { label: 'Tax and costs', value: gross - net, kind: 'money0' },
          { label: 'Net a year', value: net * 12, kind: 'money0' },
        ],
        rows: {
          head: ['Hours a week', 'Gross a month', 'Net a month', 'Net hourly'],
          body: [5, 10, 20, 30].map(function (h) {
            var g = h * v.rate * 52 / 12;
            var n = (g - v.costs) * (1 - v.tax / 100);
            return [formatValue(h, 'int'), formatValue(g, 'money0'), formatValue(n, 'money0'), formatValue(n / (h * 52 / 12), 'money2')];
          }),
        },
        message: 'The number worth watching is the last column: net profit per hour worked. A side hustle at a high rate with heavy costs can pay less per hour than a lower rate with none.',
      };
    },
    { unit: 'net a month', tone: 'PROFIT, NOT REVENUE' },
  ),

  /* ---------------------------------------------------- recurring purchases */
  'calculators/streaming-cost': engine(
    'streaming-cost',
    'Streaming audit',
    [
      { id: 'services', label: 'Streaming services', kind: 'number', value: 5, min: 1, max: 40, step: 1, suffix: 'services' },
      { id: 'average', label: 'Average price each', kind: 'money', value: 15, min: 0.01, max: 500, step: 1, suffix: '/ month' },
      { id: 'watched', label: 'Hours watched a week', kind: 'number', value: 12, min: 0.1, max: 168, step: 1, suffix: 'h / week' },
      { id: 'annualDiscount', label: 'Services on an annual plan', kind: 'number', value: 0, min: 0, max: 40, step: 1, suffix: 'services', hint: 'Annual plans typically save about 16%' },
    ],
    function (v) {
      var monthly = v.average * (v.services - v.annualDiscount) + v.average * 0.84 * v.annualDiscount;
      var annual = monthly * 12;
      var weeklyHours = v.watched;
      var hourlyCost = monthly / (weeklyHours * 52 / 12);
      return {
        primary: { value: annual, kind: 'money' },
        metrics: [
          { label: 'Monthly bill', value: monthly, kind: 'money2' },
          { label: 'Cost per hour watched', value: hourlyCost, kind: 'money2', hint: 'Everything you watch across all services' },
          { label: 'Saving from annual plans', value: (v.average * v.annualDiscount * 0.16) * 12, kind: 'money0' },
          { label: 'Hours watched a year', value: weeklyHours * 52, kind: 'int' },
        ],
        rows: {
          head: ['Services', 'Monthly', 'Yearly', 'Cost per hour (12 h/wk)'],
          body: [1, 3, 5, 8].map(function (n) {
            var m = n * v.average;
            return [formatValue(n, 'int'), formatValue(m, 'money2'), formatValue(m * 12, 'money0'), formatValue(m / (weeklyHours * 52 / 12), 'money2')];
          }),
        },
        message: 'The cheapest service per month is not always the cheapest per hour watched. Rotating one subscription at a time usually beats holding five for the occasional series.',
      };
    },
    { unit: 'a year', tone: 'COST PER HOUR WATCHED' },
  ),

  'calculators/gym-cost-per-visit': engine(
    'gym-cost-per-visit',
    'Cost per gym visit',
    [
      { id: 'monthly', label: 'Monthly membership', kind: 'money', value: 45, min: 0, max: 5000, step: 5, suffix: '/ month' },
      { id: 'joining', label: 'Joining and annual fees', kind: 'money', value: 80, min: 0, max: 1e5, step: 10, suffix: 'per year' },
      { id: 'visits', label: 'Visits a month', kind: 'number', value: 8, min: 1, max: 60, step: 1, suffix: 'visits' },
      { id: 'dropIn', label: 'Drop-in price', kind: 'money', value: 15, min: 0, max: 500, step: 1, suffix: 'per visit' },
    ],
    function (v) {
      var monthlyTotal = v.monthly + v.joining / 12;
      var perVisit = monthlyTotal / v.visits;
      return {
        primary: { value: perVisit, kind: 'money2' },
        metrics: [
          { label: 'Effective monthly cost', value: monthlyTotal, kind: 'money2', hint: 'Membership plus 1/12 of the annual fees' },
          { label: 'What a year costs', value: monthlyTotal * 12, kind: 'money0' },
          { label: 'Drop-in cost for the same visits', value: v.dropIn * v.visits * 12, kind: 'money0' },
          { label: 'Break-even visits a month', value: monthlyTotal / v.dropIn, kind: 'number' },
        ],
        rows: {
          head: ['Visits a month', 'Cost per visit', 'A year of member visits'],
          body: [1, 2, 4, 8, 12, 20].map(function (n) {
            return [formatValue(n, 'int'), formatValue(monthlyTotal / n, 'money2'), formatValue(monthlyTotal * 12, 'money0')];
          }),
        },
        message: 'Annual fees are the part everyone forgets: dividing them by 12 is the difference between a $45 membership and a $52 one. Below the break-even visit count, drop-in is cheaper.',
      };
    },
    { unit: 'per visit', tone: 'THE JOINING FEE PROBLEM' },
  ),

  'calculators/cost-per-use': engine(
    'cost-per-use',
    'Cost per use',
    [
      { id: 'price', label: 'Purchase price', kind: 'money', value: 240, min: 0, max: 1e8, step: 10, suffix: 'USD' },
      { id: 'usesPerWeek', label: 'Uses a week', kind: 'number', value: 3, min: 0.1, max: 100, step: 1, suffix: 'uses' },
      { id: 'years', label: 'Expected years of use', kind: 'number', value: 3, min: 0.1, max: 50, step: 0.5, suffix: 'years' },
      { id: 'upkeep', label: 'Upkeep a year', kind: 'money', value: 20, min: 0, max: 1e6, step: 5, suffix: 'per year' },
    ],
    function (v) {
      var uses = v.usesPerWeek * 52 * v.years;
      var total = v.price + v.upkeep * v.years;
      return {
        primary: { value: total / uses, kind: 'money2' },
        metrics: [
          { label: 'Total lifetime cost', value: total, kind: 'money0' },
          { label: 'Uses over its life', value: uses, kind: 'int' },
          { label: 'Cost a year', value: total / v.years, kind: 'money2' },
          { label: 'Uses to reach $5 per use', value: total / 5, kind: 'int', hint: 'Where buying stops being cheaper than a one-off alternative' },
        ],
        rows: {
          head: ['Price', 'Uses a week', 'Cost per use', 'Cost a year'],
          body: [60, 120, 240, 480, 900].map(function (p) {
            var t = p + v.upkeep * v.years;
            return [formatValue(p, 'money0'), formatValue(v.usesPerWeek, 'number'), formatValue(t / uses, 'money2'), formatValue(t / v.years, 'money2')];
          }),
        },
        message: 'Cost per use only helps when the two things are genuinely comparable. A cheap item used twice and an expensive one used constantly are not the same purchase, whatever the arithmetic says.',
      };
    },
    { unit: 'per use', tone: 'PRICE ÷ USES' },
  ),

  'calculators/cost-per-wear': engine(
    'cost-per-wear',
    'Cost per wear',
    [
      { id: 'price', label: 'Item price', kind: 'money', value: 180, min: 0, max: 1e6, step: 10, suffix: 'USD' },
      { id: 'wearsPerMonth', label: 'Times worn a month', kind: 'number', value: 4, min: 0.1, max: 60, step: 1, suffix: 'wears' },
      { id: 'years', label: 'Seasons of wear', kind: 'number', value: 3, min: 0.1, max: 40, step: 0.5, suffix: 'years' },
      { id: 'care', label: 'Cleaning and repair a year', kind: 'money', value: 15, min: 0, max: 1e5, step: 5, suffix: 'per year' },
    ],
    function (v) {
      var wears = v.wearsPerMonth * 12 * v.years;
      var total = v.price + v.care * v.years;
      return {
        primary: { value: total / wears, kind: 'money2' },
        metrics: [
          { label: 'Total wears', value: wears, kind: 'int' },
          { label: 'Total cost of ownership', value: total, kind: 'money0' },
          { label: 'Wears needed to hit $1', value: total, kind: 'int', hint: 'The number of wears that takes cost per wear to a dollar' },
          { label: 'Cost a year', value: total / v.years, kind: 'money2' },
        ],
        rows: {
          head: ['Price', '1 wear/mo', '4 wears/mo', '12 wears/mo'],
          body: [50, 120, 180, 400, 1200].map(function (p) {
            return [formatValue(p, 'money0'), formatValue(p / (12 * v.years), 'money2'), formatValue(p / (48 * v.years), 'money2'), formatValue(p / (144 * v.years), 'money2')];
          }),
        },
        message: 'Cost per wear rewards the item you reach for, not the one that was cheap. It also exposes the mistake of buying a second version of something you already wear constantly.',
      };
    },
    { unit: 'per wear', tone: 'THE WARDROBE ARGUMENT' },
  ),

  'calculators/latte-factor': engine(
    'latte-factor',
    'Latte factor',
    [
      { id: 'cost', label: 'Cost of the daily habit', kind: 'money', value: 5, min: 0.5, max: 500, step: 0.5, suffix: 'per day' },
      { id: 'daysPerWeek', label: 'Days a week', kind: 'number', value: 5, min: 1, max: 7, step: 1, suffix: 'days' },
      { id: 'years', label: 'Years', kind: 'number', value: 10, min: 1, max: 50, step: 1, suffix: 'years' },
      { id: 'return', label: 'Invested return', kind: 'percent', value: 7, min: 0, max: 20, step: 0.5, suffix: '% a year' },
    ],
    function (v) {
      var yearly = v.cost * v.daysPerWeek * 52;
      var spent = yearly * v.years;
      var r = v.return / 100 / 12;
      var months = v.years * 12;
      var monthly = yearly / 12;
      var invested = r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
      return {
        primary: { value: spent, kind: 'money' },
        metrics: [
          { label: 'Cost a year', value: yearly, kind: 'money0' },
          { label: 'If invested at ' + formatValue(v.return, 'percent'), value: invested, kind: 'money0', hint: 'Contributions made monthly, compounded monthly' },
          { label: 'Growth on top', value: invested - spent, kind: 'money0' },
          { label: 'Hours of work a year', value: yearly / (v.cost | 0 || 1), kind: 'int', hint: 'The habit paid for in days of the habit itself' },
        ],
        rows: {
          head: ['Daily cost', 'A year', formatValue(v.years, 'int') + ' years spent', 'Invested at ' + formatValue(v.return, 'percent')],
          body: [2, 3, 5, 8, 12].map(function (c) {
            var y = c * v.daysPerWeek * 52;
            var m = y / 12;
            var inv = r === 0 ? m * months : m * ((Math.pow(1 + r, months) - 1) / r);
            return [formatValue(c, 'money2'), formatValue(y, 'money0'), formatValue(y * v.years, 'money0'), formatValue(inv, 'money0')];
          }),
        },
        message: 'The latte factor is only half an argument. A habit you genuinely enjoy is not waste, and the invested column assumes money you would otherwise have spent actually gets invested. Treat it as a question, not a verdict.',
      };
    },
    { unit: 'over the whole period', tone: 'SMALL, FREQUENT, CUMULATIVE' },
  ),

  /* --------------------------------------------------------- transport */
  'calculators/commute-cost': engine(
    'commute-cost',
    'Commute cost',
    [
      { id: 'miles', label: 'Round-trip distance', kind: 'number', value: 24, min: 0.1, max: 500, step: 1, suffix: 'miles' },
      { id: 'daysPerWeek', label: 'Commuting days a week', kind: 'number', value: 5, min: 1, max: 7, step: 1, suffix: 'days' },
      { id: 'costPerMile', label: 'Cost per mile', kind: 'money', value: 0.67, min: 0, max: 20, step: 0.01, suffix: 'per mile', hint: 'IRS-style rate covering fuel, wear, insurance and depreciation' },
      { id: 'minutes', label: 'One-way travel time', kind: 'number', value: 35, min: 1, max: 300, step: 5, suffix: 'minutes' },
      { id: 'pay', label: 'Your take-home hourly pay', kind: 'money', value: 28, min: 0.01, max: 1e6, step: 0.5, suffix: '/ hour' },
    ],
    function (v) {
      var milesYear = v.miles * v.daysPerWeek * 52;
      var costYear = milesYear * v.costPerMile;
      var hoursYear = (v.minutes * 2 / 60) * v.daysPerWeek * 52;
      return {
        primary: { value: costYear, kind: 'money' },
        metrics: [
          { label: 'Hours a year in transit', value: hoursYear, kind: 'int' },
          { label: 'Value of that time', value: hoursYear * v.pay, kind: 'money0', hint: 'Your take-home rate applied to the travel time' },
          { label: 'Cost a day', value: v.miles * v.costPerMile, kind: 'money2' },
          { label: 'Miles a year', value: milesYear, kind: 'int' },
        ],
        rows: {
          head: ['Round trip', 'Miles a year', 'Cost a year', 'Hours a year'],
          body: [10, 20, 30, 50, 80].map(function (m) {
            return [formatValue(m, 'int') + ' mi', formatValue(m * v.daysPerWeek * 52, 'int'), formatValue(m * v.daysPerWeek * 52 * v.costPerMile, 'money0'), formatValue((v.minutes * 2 / 60) * v.daysPerWeek * 52, 'int')];
          }),
        },
        message: 'The IRS-style mileage rate exists because fuel is the smallest part of running a car. Using only the petrol price understates a commute by roughly half.',
      };
    },
    { unit: 'a year', tone: 'MILES, HOURS, AND THE RATE' },
  ),

  'calculators/car-ownership-cost': engine(
    'car-ownership-cost',
    'True cost of a car',
    [
      { id: 'price', label: 'Purchase price', kind: 'money', value: 32000, min: 0, max: 1e8, step: 500, suffix: 'USD' },
      { id: 'years', label: 'Years owned', kind: 'number', value: 6, min: 1, max: 25, step: 1, suffix: 'years' },
      { id: 'resale', label: 'Resale value at the end', kind: 'money', value: 11000, min: 0, max: 1e8, step: 500, suffix: 'USD' },
      { id: 'annual', label: 'Running costs a year', kind: 'money', value: 6200, min: 0, max: 1e7, step: 100, suffix: 'per year', hint: 'Insurance, fuel, servicing, tyres, tax, parking' },
      { id: 'miles', label: 'Miles a year', kind: 'number', value: 11000, min: 100, max: 200000, step: 500, suffix: 'miles' },
    ],
    function (v) {
      var depreciation = v.price - v.resale;
      var running = v.annual * v.years;
      var total = depreciation + running;
      return {
        primary: { value: total / v.years, kind: 'money' },
        metrics: [
          { label: 'Total cost of ownership', value: total, kind: 'money0' },
          { label: 'Depreciation', value: depreciation, kind: 'money0', hint: 'The drop in value, which is a real cost even though nothing is invoiced' },
          { label: 'Running costs', value: running, kind: 'money0' },
          { label: 'Cost per mile', value: total / (v.miles * v.years), kind: 'money2' },
        ],
        rows: {
          head: ['Years owned', 'Depreciation', 'Running', 'Cost a month'],
          body: [3, 5, 8, 12].map(function (y) {
            var t = depreciation + v.annual * y;
            return [formatValue(y, 'int'), formatValue(depreciation, 'money0'), formatValue(v.annual * y, 'money0'), formatValue(t / y / 12, 'money0')];
          }),
        },
        message: 'Depreciation dominates in the first years and running costs dominate later. Holding a car longer than average is the single cheapest decision, because the largest cost has already been paid.',
      };
    },
    { unit: 'a month', tone: 'DEPRECIATION IS THE COST' },
  ),

  'calculators/buy-vs-rent-hourly': engine(
    'buy-vs-rent-hourly',
    'Buy versus rent',
    [
      { id: 'buyPrice', label: 'Purchase price', kind: 'money', value: 1200, min: 1, max: 1e8, step: 10, suffix: 'USD' },
      { id: 'rentPrice', label: 'Rental price per use', kind: 'money', value: 35, min: 0.01, max: 1e6, step: 1, suffix: 'per use' },
      { id: 'usesPerYear', label: 'Uses a year', kind: 'number', value: 6, min: 1, max: 500, step: 1, suffix: 'uses' },
      { id: 'resale', label: 'Resale value later', kind: 'money', value: 500, min: 0, max: 1e8, step: 10, suffix: 'USD' },
      { id: 'years', label: 'Years you would keep it', kind: 'number', value: 5, min: 0.5, max: 40, step: 0.5, suffix: 'years' },
    ],
    function (v) {
      var owning = v.buyPrice - v.resale;
      var renting = v.rentPrice * v.usesPerYear * v.years;
      var mode = owning < renting ? 'Buying' : 'Renting';
      var breakEven = v.usesPerYear > 0 && (v.buyPrice - v.resale) > 0 ? (v.buyPrice - v.resale) / (v.rentPrice * v.years) : 0;
      return {
        primary: { value: Math.abs(owning - renting), kind: 'money' },
        metrics: [
          { label: 'Cheaper option over ' + formatValue(v.years, 'number') + ' years', text: mode, hint: 'By the difference shown above' },
          { label: 'Cost of buying', value: owning, kind: 'money0' },
          { label: 'Cost of renting', value: renting, kind: 'money0' },
          { label: 'Break-even uses a year', value: breakEven, kind: 'number' },
        ],
        rows: {
          head: ['Uses a year', 'Rent over ' + formatValue(v.years, 'number') + ' yr', 'Buy net cost', 'Winner'],
          body: [1, 3, 6, 12, 24].map(function (u) {
            var r = v.rentPrice * u * v.years;
            return [formatValue(u, 'int'), formatValue(r, 'money0'), formatValue(owning, 'money0'), r < owning ? 'Rent' : 'Buy'];
          }),
        },
        message: 'Renting buys flexibility; buying buys a lower cost per use if you actually use it. The break-even row is the honest answer — below it, rent.',
      };
    },
    { unit: 'difference', tone: 'BREAK-EVEN USES' },
  ),

  /* --------------------------------------------------------- big purchases */
  'calculators/time-to-save': engine(
    'time-to-save',
    'Time to save',
    [
      { id: 'target', label: 'Amount you need', kind: 'money', value: 3000, min: 1, max: 1e8, step: 100, suffix: 'USD' },
      { id: 'current', label: 'Already saved', kind: 'money', value: 400, min: 0, max: 1e8, step: 50, suffix: 'USD' },
      { id: 'monthly', label: 'Saved each month', kind: 'money', value: 350, min: 0.01, max: 1e6, step: 25, suffix: 'per month' },
      { id: 'apy', label: 'Savings rate', kind: 'percent', value: 4, min: 0, max: 20, step: 0.25, suffix: '% a year' },
    ],
    function (v) {
      var r = v.apy / 100 / 12;
      var months = 0;
      var balance = v.current;
      while (balance < v.target && months < 1200) {
        balance = balance * (1 + r) + v.monthly;
        months++;
      }
      var withoutInterest = v.monthly > 0 ? Math.max(0, (v.target - v.current) / v.monthly) : 0;
      return {
        primary: { value: months, kind: 'number' },
        metrics: [
          { label: 'Money you add', value: Math.max(0, v.target - v.current), kind: 'money0' },
          { label: 'Interest earned', value: months > 0 ? balance - v.current - v.monthly * months : 0, kind: 'money0', hint: 'The reason the last month arrives early' },
          { label: 'Months without interest', value: withoutInterest, kind: 'number' },
          { label: 'Time to target', text: months + (months === 1 ? ' month' : ' months'), hint: 'From today, at the monthly amount you entered' },
        ],
        rows: {
          head: ['Saved a month', 'Months to target', 'Interest earned'],
          body: [50, 100, 250, 500, 1000].map(function (m) {
            var rr = v.apy / 100 / 12;
            var b = v.current, mm = 0;
            while (b < v.target && mm < 1200) { b = b * (1 + rr) + m; mm++; }
            return [formatValue(m, 'money0'), formatValue(mm, 'int'), formatValue(Math.max(0, b - v.current - m * mm), 'money0')];
          }),
        },
        message: 'Once the balance earns interest the last month arrives earlier than the arithmetic of pure saving suggests. On goals under a year the effect is small, so a high-yield account matters more than the maths.',
      };
    },
    { unit: 'months', tone: 'HOW LONG WILL THIS TAKE?' },
  ),

  'calculators/cost-of-living-calculator-2026': engine(
    'cost-of-living',
    'Cost of living change',
    [
      { id: 'expenses', label: 'Your monthly essentials', kind: 'money', value: 3200, min: 1, max: 1e7, step: 100, suffix: 'per month' },
      { id: 'currentIndex', label: 'Current place index', kind: 'number', value: 100, min: 1, max: 400, step: 1, suffix: 'index' },
      { id: 'newIndex', label: 'New place index', kind: 'number', value: 128, min: 1, max: 400, step: 1, suffix: 'index' },
      { id: 'currentSalary', label: 'Current salary', kind: 'money', value: 85000, min: 1, max: 1e9, step: 1000, suffix: 'per year' },
    ],
    function (v) {
      var ratio = v.newIndex / v.currentIndex;
      var newExpenses = v.expenses * ratio;
      var required = v.currentSalary * ratio;
      return {
        primary: { value: required, kind: 'money' },
        metrics: [
          { label: 'Monthly essentials there', value: newExpenses, kind: 'money0' },
          { label: 'Difference a month', value: newExpenses - v.expenses, kind: 'money2' },
          { label: 'Difference a year', value: (newExpenses - v.expenses) * 12, kind: 'money0' },
          { label: 'Salary change needed', value: required - v.currentSalary, kind: 'percent' },
        ],
        rows: {
          head: ['Index there', 'Monthly essentials', 'Salary needed', 'Change'],
          body: [90, 100, 115, 130, 150].map(function (idx) {
            var m = v.expenses * idx / v.currentIndex;
            return [formatValue(idx, 'int'), formatValue(m, 'money0'), formatValue(v.currentSalary * idx / v.currentIndex, 'money0'), formatValue((idx / v.currentIndex - 1) * 100, 'percent')];
          }),
        },
        message: 'An index is a basket average, not your life. Housing dominates in some cities and childcare in others, so check the two lines that matter most to you rather than trusting the headline number.',
      };
    },
    { unit: 'needed there', tone: 'KEEP THE SAME STANDARD' },
  ),

  /* ------------------------------------------------------- debt and saving */
  'calculators/savings-goal-calculator-2026': engine(
    'savings-goal',
    'Savings goal',
    [
      { id: 'goal', label: 'Goal amount', kind: 'money', value: 20000, min: 1, max: 1e9, step: 500, suffix: 'USD' },
      { id: 'have', label: 'Saved so far', kind: 'money', value: 2500, min: 0, max: 1e9, step: 250, suffix: 'USD' },
      { id: 'months', label: 'Months to save', kind: 'number', value: 30, min: 1, max: 480, step: 1, suffix: 'months' },
      { id: 'apy', label: 'Expected return', kind: 'percent', value: 4, min: 0, max: 20, step: 0.25, suffix: '% a year' },
    ],
    function (v) {
      var r = v.apy / 100 / 12;
      var n = v.months;
      var grownExisting = v.have * Math.pow(1 + r, n);
      var remaining = v.goal - grownExisting;
      var monthly = remaining <= 0 ? 0 : r === 0 ? remaining / n : remaining * r / (Math.pow(1 + r, n) - 1);
      return {
        primary: { value: monthly, kind: 'money2' },
        metrics: [
          { label: 'Saved so far grows to', value: grownExisting, kind: 'money0', hint: 'Existing savings, left to compound' },
          { label: 'Total contributions', value: monthly * n, kind: 'money0' },
          { label: 'Return earned', value: Math.max(0, v.goal - v.have - monthly * n), kind: 'money0' },
          { label: 'Saved a year', value: monthly * 12, kind: 'money0' },
        ],
        rows: {
          head: ['Timeline', 'Per month', 'Per week', 'Per day'],
          body: [12, 24, 36, 60].map(function (m) {
            var rr = v.apy / 100 / 12;
            var grown = v.have * Math.pow(1 + rr, m);
            var rem = v.goal - grown;
            var mo = rem <= 0 ? 0 : rr === 0 ? rem / m : rem * rr / (Math.pow(1 + rr, m) - 1);
            return [m + ' months', formatValue(mo, 'money2'), formatValue(mo * 12 / 52, 'money2'), formatValue(mo * 12 / 365, 'money2')];
          }),
        },
        message: 'A shorter deadline is the expensive part: halving the months doubles the contribution, and the return has less time to help. The per-day column is usually the one that makes a goal feel achievable.',
      };
    },
    { unit: 'a month', tone: 'WHAT THE DEADLINE COSTS' },
  ),

  'calculators/credit-card-payoff-calculator-2026': engine(
    'credit-card-payoff',
    'Credit card payoff',
    [
      { id: 'balance', label: 'Card balance', kind: 'money', value: 6500, min: 1, max: 1e8, step: 100, suffix: 'USD' },
      { id: 'apr', label: 'APR', kind: 'percent', value: 24.99, min: 0, max: 60, step: 0.01, suffix: '%' },
      { id: 'payment', label: 'Monthly payment', kind: 'money', value: 250, min: 1, max: 1e7, step: 10, suffix: 'per month' },
      { id: 'minimumPct', label: 'Card minimum', kind: 'percent', value: 2, min: 1, max: 10, step: 0.5, suffix: '% of balance' },
    ],
    function (v) {
      var r = v.apr / 100 / 12;
      var months = 0, interest = 0, bal = v.balance;
      while (bal > 0 && months < 1200) {
        var i = bal * r;
        var pay = Math.max(v.payment, 1);
        if (pay <= i) { months = 1200; break; }
        interest += i;
        bal = bal + i - pay;
        months++;
      }
      var minFirst = Math.max(v.balance * v.minimumPct / 100, 25);
      var minMonths = 0, minInterest = 0, mbal = v.balance;
      while (mbal > 0 && minMonths < 1200) {
        var mi = mbal * r;
        var mp = Math.max(mbal * v.minimumPct / 100, 25);
        minInterest += mi;
        mbal = mbal + mi - mp;
        minMonths++;
      }
      return {
        primary: { value: months, kind: 'number' },
        metrics: [
          { label: 'Interest paid', value: interest, kind: 'money0', hint: 'Cost of the balance over the payoff period' },
          { label: 'Total paid', value: v.balance + interest, kind: 'money0' },
          { label: 'Months on minimum payments', value: minMonths, kind: 'int', hint: 'Paying ' + formatValue(v.minimumPct, 'percent') + ' of the balance each month' },
          { label: 'Interest on minimum payments', value: minInterest, kind: 'money0' },
        ],
        rows: {
          head: ['Monthly payment', 'Months', 'Interest', 'Total paid'],
          body: [100, 200, 300, 500, 1000].map(function (p) {
            var b = v.balance, mm = 0, ii = 0;
            while (b > 0 && mm < 1200) {
              var x = b * r;
              if (p <= x) { mm = 1200; break; }
              ii += x; b = b + x - p; mm++;
            }
            return [formatValue(p, 'money0'), formatValue(mm, 'int'), formatValue(ii, 'money0'), formatValue(v.balance + ii, 'money0')];
          }),
        },
        message: 'Above the interest line every extra dollar goes straight at the balance. Below it the balance grows and no payment ever clears it — that is the only number on this page that can be fatal.',
      };
    },
    { unit: 'months to clear', tone: 'THE INTEREST LINE' },
  ),

  'calculators/student-loan-calculator-2026': engine(
    'student-loan',
    'Student loan payment',
    [
      { id: 'balance', label: 'Loan balance', kind: 'money', value: 32000, min: 1, max: 1e8, step: 500, suffix: 'USD' },
      { id: 'apr', label: 'Interest rate', kind: 'percent', value: 6.53, min: 0, max: 30, step: 0.01, suffix: '%' },
      { id: 'years', label: 'Repayment term', kind: 'number', value: 10, min: 1, max: 30, step: 1, suffix: 'years' },
      { id: 'income', label: 'Annual income', kind: 'money', value: 55000, min: 1, max: 1e9, step: 1000, suffix: 'per year' },
    ],
    function (v) {
      var n = v.years * 12;
      var payment = amortisedPayment(v.balance, v.apr, n);
      var total = payment * n;
      var share = payment * 12 / v.income * 100;
      return {
        primary: { value: payment, kind: 'money2' },
        metrics: [
          { label: 'Total paid', value: total, kind: 'money0' },
          { label: 'Interest', value: total - v.balance, kind: 'money0' },
          { label: 'Share of income', value: share, kind: 'percent', hint: 'Below 8% of gross income is the usual affordability yardstick' },
          { label: 'Cost per $1 borrowed', value: total / v.balance, kind: 'number' },
        ],
        rows: {
          head: ['Term', 'Monthly payment', 'Total interest', 'Per $1 borrowed'],
          body: [5, 10, 15, 20, 25].map(function (y) {
            var nn = y * 12;
            var p = amortisedPayment(v.balance, v.apr, nn);
            var t = p * nn;
            return [y + ' years', formatValue(p, 'money2'), formatValue(t - v.balance, 'money0'), formatValue(t / v.balance, 'number')];
          }),
        },
        message: 'Stretching the term lowers the payment and raises the interest, roughly in proportion. The share-of-income column is the one lenders and advisers use to judge whether the payment is survivable.',
      };
    },
    { unit: 'a month', tone: 'AMORTISED OVER THE TERM' },
  ),

  'calculators/compound-interest-calculator': engine(
    'compound-interest',
    'Compound interest',
    [
      { id: 'principal', label: 'Starting amount', kind: 'money', value: 5000, min: 0, max: 1e9, step: 500, suffix: 'USD' },
      { id: 'monthly', label: 'Added each month', kind: 'money', value: 300, min: 0, max: 1e7, step: 25, suffix: 'per month' },
      { id: 'rate', label: 'Annual return', kind: 'percent', value: 7, min: 0, max: 30, step: 0.25, suffix: '%' },
      { id: 'years', label: 'Years invested', kind: 'number', value: 20, min: 1, max: 60, step: 1, suffix: 'years' },
      { id: 'compound', label: 'Compounding', kind: 'select', value: '12', options: [['12', 'Monthly'], ['4', 'Quarterly'], ['1', 'Annually'], ['365', 'Daily']] },
    ],
    function (v) {
      var m = Number(v.compound);
      var rate = v.rate / 100;
      var perPeriod = rate / m;
      var periods = v.years * m;
      var monthlyToPeriod = v.monthly * 12 / m;
      var fvPrincipal = v.principal * Math.pow(1 + perPeriod, periods);
      var fvContrib = perPeriod === 0 ? monthlyToPeriod * periods : monthlyToPeriod * ((Math.pow(1 + perPeriod, periods) - 1) / perPeriod);
      var contributed = v.principal + v.monthly * 12 * v.years;
      var fv = fvPrincipal + fvContrib;
      return {
        primary: { value: fv, kind: 'money' },
        metrics: [
          { label: 'Total contributed', value: contributed, kind: 'money0' },
          { label: 'Growth', value: fv - contributed, kind: 'money0' },
          { label: 'Effective annual rate', value: (Math.pow(1 + rate / m, m) - 1) * 100, kind: 'percent2', hint: 'Daily or monthly compounding beats the headline rate' },
          { label: 'Doubling time at this rate', value: 72 / (v.rate || 0.0001), kind: 'number', hint: 'Rule of 72, a shortcut not a guarantee' },
        ],
        rows: {
          head: ['Years', 'Contributed', 'Balance', 'Growth share'],
          body: [5, 10, 20, 30, 40].map(function (y) {
            var p = y * m;
            var pp = v.principal * Math.pow(1 + perPeriod, p);
            var cc = perPeriod === 0 ? monthlyToPeriod * p : monthlyToPeriod * ((Math.pow(1 + perPeriod, p) - 1) / perPeriod);
            var total = pp + cc;
            var contrib = v.principal + v.monthly * 12 * y;
            return [formatValue(y, 'int'), formatValue(contrib, 'money0'), formatValue(total, 'money0'), formatValue(total > 0 ? (total - contrib) / total * 100 : 0, 'percent')];
          }),
        },
        message: 'The growth share column is the whole idea: at 30 years most of the balance is return, at 5 years almost none of it is. Time does more work than the contribution in the long run.',
      };
    },
    { unit: 'future value', tone: 'TIME IN THE MARKET' },
  ),

  'calculators/investment-return-calculator-2026': engine(
    'investment-return',
    'Investment return',
    [
      { id: 'initial', label: 'Amount invested', kind: 'money', value: 25000, min: 1, max: 1e9, step: 500, suffix: 'USD' },
      { id: 'final', label: 'Value today', kind: 'money', value: 41000, min: 0, max: 1e9, step: 500, suffix: 'USD' },
      { id: 'years', label: 'Years held', kind: 'number', value: 6, min: 0.25, max: 60, step: 0.25, suffix: 'years' },
      { id: 'fees', label: 'Fees paid over the period', kind: 'money', value: 900, min: 0, max: 1e8, step: 50, suffix: 'USD' },
    ],
    function (v) {
      var net = v.final - v.fees;
      var roi = (net - v.initial) / v.initial * 100;
      var cagr = (Math.pow(Math.max(net, 0.0001) / v.initial, 1 / v.years) - 1) * 100;
      return {
        primary: { value: roi, kind: 'percent2' },
        metrics: [
          { label: 'Annualised return (CAGR)', value: cagr, kind: 'percent2', hint: 'The constant yearly rate that produces the same total' },
          { label: 'Profit after fees', value: net - v.initial, kind: 'money0' },
          { label: 'Fees as a share of gains', value: v.final > v.initial ? v.fees / (v.final - v.initial) * 100 : 0, kind: 'percent' },
          { label: 'Money multiple', value: net / v.initial, kind: 'x' },
        ],
        rows: {
          head: ['Years held', 'Total return', 'Annualised'],
          body: [1, 3, 5, 10, 20].map(function (y) {
            var c = (Math.pow(Math.max(net, 0.0001) / v.initial, 1 / y) - 1) * 100;
            return [formatValue(y, 'int'), formatValue(roi, 'percent2'), formatValue(c, 'percent2')];
          }),
        },
        message: 'Total return flatters short holding periods and annualised return exposes them. Judging a ten-year fund on one good year is the most common mistake in this arithmetic.',
      };
    },
    { unit: 'total return', tone: 'TOTAL VERSUS ANNUALISED' },
  ),

  'calculators/loan-comparison-calculator-2026': engine(
    'loan-comparison',
    'Compare two loans',
    [
      { id: 'amount', label: 'Amount borrowed', kind: 'money', value: 25000, min: 1, max: 1e9, step: 500, suffix: 'USD' },
      { id: 'rateA', label: 'Loan A rate', kind: 'percent', value: 6.5, min: 0, max: 40, step: 0.01, suffix: '%' },
      { id: 'feesA', label: 'Loan A fees', kind: 'money', value: 250, min: 0, max: 1e7, step: 25, suffix: 'upfront' },
      { id: 'yearsA', label: 'Loan A term', kind: 'number', value: 5, min: 1, max: 30, step: 1, suffix: 'years' },
      { id: 'rateB', label: 'Loan B rate', kind: 'percent', value: 5.9, min: 0, max: 40, step: 0.01, suffix: '%' },
      { id: 'feesB', label: 'Loan B fees', kind: 'money', value: 1200, min: 0, max: 1e7, step: 25, suffix: 'upfront' },
      { id: 'yearsB', label: 'Loan B term', kind: 'number', value: 5, min: 1, max: 30, step: 1, suffix: 'years' },
    ],
    function (v) {
      var a = amortisedPayment(v.amount, v.rateA, v.yearsA * 12) * v.yearsA * 12 + v.feesA;
      var b = amortisedPayment(v.amount, v.rateB, v.yearsB * 12) * v.yearsB * 12 + v.feesB;
      var winner = a <= b ? 'A' : 'B';
      return {
        primary: { value: Math.abs(a - b), kind: 'money' },
        metrics: [
          { label: 'Cheaper loan, fees included', text: 'Loan ' + winner, hint: 'Total cost over the full term, upfront fees included' },
          { label: 'Loan A total cost', value: a, kind: 'money0' },
          { label: 'Loan B total cost', value: b, kind: 'money0' },
          { label: 'Monthly payment A vs B', text: formatValue(amortisedPayment(v.amount, v.rateA, v.yearsA * 12), 'money2') + ' vs ' + formatValue(amortisedPayment(v.amount, v.rateB, v.yearsB * 12), 'money2'), hint: 'The lower payment is not always the cheaper loan' },
        ],
        rows: {
          head: ['', 'Monthly', 'Term', 'Fees', 'Total cost'],
          body: [
            ['Loan A', formatValue(amortisedPayment(v.amount, v.rateA, v.yearsA * 12), 'money2'), v.yearsA + ' yr', formatValue(v.feesA, 'money0'), formatValue(a, 'money0')],
            ['Loan B', formatValue(amortisedPayment(v.amount, v.rateB, v.yearsB * 12), 'money2'), v.yearsB + ' yr', formatValue(v.feesB, 'money0'), formatValue(b, 'money0')],
          ],
        },
        message: 'The lower rate is not automatically the cheaper loan: a fee can swallow the difference, and a longer term spreads a slightly higher rate over more years of interest.',
      };
    },
    { unit: 'difference', tone: 'RATE, FEES AND TERM TOGETHER' },
  ),

  'calculators/mortgage-calculator-2026': engine(
    'mortgage',
    'Monthly mortgage payment',
    [
      { id: 'price', label: 'Home price', kind: 'money', value: 450000, min: 1000, max: 1e9, step: 5000, suffix: 'USD' },
      { id: 'down', label: 'Down payment', kind: 'money', value: 50000, min: 0, max: 1e9, step: 5000, suffix: 'USD' },
      { id: 'rate', label: 'Interest rate (APR)', kind: 'percent', value: 6.5, min: 0, max: 25, step: 0.05, suffix: '%' },
      { id: 'years', label: 'Term', kind: 'select', value: '30', options: [['15', '15 years'], ['20', '20 years'], ['25', '25 years'], ['30', '30 years']] },
      { id: 'tax', label: 'Property tax a year', kind: 'money', value: 5400, min: 0, max: 1e7, step: 100, suffix: 'per year' },
      { id: 'insurance', label: 'Insurance a year', kind: 'money', value: 1500, min: 0, max: 1e6, step: 100, suffix: 'per year' },
    ],
    function (v) {
      var principal = Math.max(0, v.price - v.down);
      var months = Number(v.years) * 12;
      var pi = amortisedPayment(principal, v.rate, months);
      var escrow = (v.tax + v.insurance) / 12;
      var pmi = v.down < v.price * 0.2 ? principal * 0.005 / 12 : 0;
      var totalInterest = pi * months - principal;
      return {
        primary: { value: pi + escrow + pmi, kind: 'money2' },
        metrics: [
          { label: 'Principal and interest', value: pi, kind: 'money2' },
          { label: 'Tax and insurance', value: escrow, kind: 'money2', hint: 'Usually collected in escrow with the payment' },
          { label: 'Total interest over the term', value: totalInterest, kind: 'money0' },
          { label: 'Loan-to-value', value: principal / v.price * 100, kind: 'percent', hint: 'Above 80% normally means mortgage insurance' },
        ],
        rows: {
          head: ['Term', 'Payment (P&I)', 'Total interest', 'Total paid'],
          body: [[15, 5.75], [20, 6.0], [25, 6.25], [30, v.rate]].map(function (t) {
            var p = amortisedPayment(principal, t[1], t[0] * 12);
            return [t[0] + ' yr @ ' + t[1] + '%', formatValue(p, 'money2'), formatValue(p * t[0] * 12 - principal, 'money0'), formatValue(p * t[0] * 12 + v.down, 'money0')];
          }),
        },
        message: 'A shorter term raises the monthly payment and cuts the interest dramatically. The 30-year row is the most affordable month and the most expensive loan; that trade is the whole decision.',
      };
    },
    { unit: 'a month', tone: 'PRINCIPAL, INTEREST AND ESCROW' },
  ),

  'calculators/rent-vs-buy-calculator-2026': engine(
    'rent-vs-buy',
    'Rent or buy',
    [
      { id: 'price', label: 'Home price', kind: 'money', value: 400000, min: 1000, max: 1e9, step: 5000, suffix: 'USD' },
      { id: 'down', label: 'Down payment', kind: 'money', value: 80000, min: 0, max: 1e9, step: 5000, suffix: 'USD' },
      { id: 'rate', label: 'Mortgage rate', kind: 'percent', value: 6.5, min: 0, max: 25, step: 0.05, suffix: '%' },
      { id: 'rent', label: 'Equivalent monthly rent', kind: 'money', value: 2200, min: 0, max: 1e6, step: 50, suffix: 'per month' },
      { id: 'years', label: 'Years you would stay', kind: 'number', value: 7, min: 1, max: 40, step: 1, suffix: 'years' },
      { id: 'growth', label: 'Home appreciation a year', kind: 'percent', value: 3, min: -5, max: 15, step: 0.25, suffix: '%' },
    ],
    function (v) {
      var principal = Math.max(0, v.price - v.down);
      var months = 30 * 12;
      var pi = amortisedPayment(principal, v.rate, months);
      var buyCost = pi * v.years * 12 + v.down + v.price * 0.02 + v.price * 0.01 * v.years;
      var equity = v.price * Math.pow(1 + v.growth / 100, v.years) - (principal - (pi * v.years * 12 - principal * 0));
      var rentCost = v.rent * 12 * v.years * 1.03 * 0.5 + v.rent * 12 * v.years * 0.5;
      var netBuy = buyCost - Math.max(0, equity);
      var diff = netBuy - rentCost;
      return {
        primary: { value: Math.abs(diff), kind: 'money' },
        metrics: [
          { label: 'Cheaper over ' + formatValue(v.years, 'int') + ' years', text: diff < 0 ? 'Buying' : 'Renting', hint: 'By the difference shown above' },
          { label: 'Buying, all-in', value: netBuy, kind: 'money0', hint: 'Payments, deposit and closing costs, less equity' },
          { label: 'Renting, all-in', value: rentCost, kind: 'money0', hint: 'Rent with modest annual increases' },
          { label: 'Equity built', value: equity, kind: 'money0' },
        ],
        rows: {
          head: ['Years', 'Buy net cost', 'Rent cost', 'Cheaper'],
          body: [3, 5, 7, 10, 15].map(function (y) {
            var b = pi * y * 12 + v.down + v.price * 0.02 + v.price * 0.01 * y;
            var e = v.price * Math.pow(1 + v.growth / 100, y) - principal;
            var r = v.rent * 12 * y;
            var nb = b - Math.max(0, e);
            return [formatValue(y, 'int'), formatValue(nb, 'money0'), formatValue(r, 'money0'), nb < r ? 'Buy' : 'Rent'];
          }),
        },
        message: 'Buying usually wins on a long enough timeline because each payment buys equity, while rent buys nothing but the months. On short timelines the transaction costs dominate and renting wins.',
      };
    },
    { unit: 'difference', tone: 'THE BREAK-EVEN YEAR' },
  ),

  'calculators/car-loan-calculator-2026': engine(
    'car-loan',
    'Car loan payment',
    [
      { id: 'price', label: 'Vehicle price', kind: 'money', value: 32000, min: 100, max: 1e8, step: 500, suffix: 'USD' },
      { id: 'trade', label: 'Trade-in or deposit', kind: 'money', value: 5000, min: 0, max: 1e8, step: 500, suffix: 'USD' },
      { id: 'rate', label: 'Loan APR', kind: 'percent', value: 7.9, min: 0, max: 35, step: 0.05, suffix: '%' },
      { id: 'months', label: 'Loan term', kind: 'select', value: '60', options: [['36', '36 months'], ['48', '48 months'], ['60', '60 months'], ['72', '72 months'], ['84', '84 months']] },
      { id: 'taxRate', label: 'Sales tax', kind: 'percent', value: 6, min: 0, max: 20, step: 0.1, suffix: '%' },
    ],
    function (v) {
      var taxable = v.price;
      var tax = taxable * v.taxRate / 100;
      var principal = Math.max(0, taxable + tax - v.trade);
      var months = Number(v.months);
      var payment = amortisedPayment(principal, v.rate, months);
      var total = payment * months;
      return {
        primary: { value: payment, kind: 'money2' },
        metrics: [
          { label: 'Amount financed', value: principal, kind: 'money0', hint: 'Price plus tax, minus your deposit' },
          { label: 'Total interest', value: total - principal, kind: 'money0' },
          { label: 'Total paid', value: total + v.trade, kind: 'money0', hint: 'Including your deposit, excluding insurance and fuel' },
          { label: 'Cost per month over ' + formatValue(v.months, 'int') + ' months', value: total / months, kind: 'money2' },
        ],
        rows: {
          head: ['Term', 'Payment', 'Total interest', 'Total cost'],
          body: [36, 48, 60, 72, 84].map(function (m) {
            var p = amortisedPayment(principal, v.rate, m);
            return [m + ' months', formatValue(p, 'money2'), formatValue(p * m - principal, 'money0'), formatValue(p * m + v.trade, 'money0')];
          }),
        },
        message: 'Longer terms are sold as affordability. They cut the monthly figure and raise the interest, and they also leave you owing more than the car is worth for longer — negative equity is a term-length problem.',
      };
    },
    { unit: 'a month', tone: 'PRICE, TAX, TERM' },
  ),

  'calculators/depreciation-calculator-2026': engine(
    'depreciation',
    'Asset depreciation',
    [
      { id: 'cost', label: 'Purchase price', kind: 'money', value: 32000, min: 1, max: 1e9, step: 500, suffix: 'USD' },
      { id: 'rate', label: 'First-year depreciation', kind: 'percent', value: 20, min: 1, max: 60, step: 1, suffix: '%' },
      { id: 'years', label: 'Years to project', kind: 'number', value: 7, min: 1, max: 30, step: 1, suffix: 'years' },
      { id: 'floor', label: 'Residual floor', kind: 'money', value: 3000, min: 0, max: 1e8, step: 500, suffix: 'USD' },
    ],
    function (v) {
      var rate = v.rate / 100 * 0.75;
      var value = v.cost;
      var schedule = [];
      for (var y = 1; y <= v.years; y++) {
        value = Math.max(v.floor, value * (1 - rate));
        schedule.push([y, value, v.cost - value]);
      }
      var final = schedule[schedule.length - 1][1];
      return {
        primary: { value: final, kind: 'money' },
        metrics: [
          { label: 'Lost to depreciation', value: v.cost - final, kind: 'money0' },
          { label: 'Steady annual rate used', value: rate * 100, kind: 'percent', hint: 'The first-year rate damped, because depreciation slows as value falls' },
          { label: 'After 3 years', value: schedule[Math.min(2, schedule.length - 1)][1], kind: 'money0' },
          { label: 'Cost per year of ownership', value: (v.cost - final) / v.years, kind: 'money0' },
        ],
        rows: {
          head: ['Year', 'Value', 'Lost'],
          body: schedule.map(function (row) {
            return ['Year ' + row[0], formatValue(row[1], 'money0'), formatValue(row[2], 'money0')];
          }),
        },
        message: 'The steepest loss happens in the first year and slows afterwards, which is why a two-year-old vehicle is usually the cheapest way to own a nearly new one.',
      };
    },
    { unit: 'value after the term', tone: 'DECLINING BALANCE' },
  ),

  /* ---------------------------------------------------------- taxes, windfalls */
  'calculators/lottery-tax-calculator-2026': engine(
    'lottery-tax',
    'Lottery take-home',
    [
      { id: 'jackpot', label: 'Advertised jackpot', kind: 'money', value: 10000000, min: 1, max: 1e12, step: 100000, suffix: 'USD' },
      { id: 'lumpPct', label: 'Lump-sum cash value', kind: 'percent', value: 60, min: 20, max: 100, step: 1, suffix: '% of jackpot' },
      { id: 'federal', label: 'Federal tax', kind: 'percent', value: 37, min: 0, max: 60, step: 1, suffix: '%' },
      { id: 'state', label: 'State tax', kind: 'percent', value: 5, min: 0, max: 15, step: 0.5, suffix: '%' },
    ],
    function (v) {
      var cash = v.jackpot * v.lumpPct / 100;
      var tax = cash * (v.federal + v.state) / 100;
      var net = cash - tax;
      return {
        primary: { value: net, kind: 'money' },
        metrics: [
          { label: 'Cash value before tax', value: cash, kind: 'money0' },
          { label: 'Tax bill', value: tax, kind: 'money0' },
          { label: 'Share of the advertised jackpot', value: net / v.jackpot * 100, kind: 'percent', hint: 'The headline number is not what anyone receives' },
          { label: 'Annual payout option', value: v.jackpot / 30, kind: 'money0', hint: 'Over 30 years, before tax, if offered' },
        ],
        rows: {
          head: ['Jackpot', 'Cash value', 'Tax', 'Take-home'],
          body: [1000000, 10000000, 100000000, 500000000].map(function (j) {
            var c = j * v.lumpPct / 100;
            return [formatValue(j, 'money0'), formatValue(c, 'money0'), formatValue(c * (v.federal + v.state) / 100, 'money0'), formatValue(c * (1 - (v.federal + v.state) / 100), 'money0')];
          }),
        },
        message: 'Withholding is only a deposit against the year\'s tax. A lump sum can push you into the top bracket for one year, so the final bill can be higher than the amount withheld.',
      };
    },
    { unit: 'take-home', tone: 'THE HEADLINE IS NOT THE PRIZE' },
  ),

  'calculators/trump-tariff-calculator-2026': engine(
    'tariff',
    'Tariff price impact',
    [
      { id: 'price', label: 'Current retail price', kind: 'money', value: 800, min: 1, max: 1e7, step: 10, suffix: 'USD' },
      { id: 'tariff', label: 'Tariff rate', kind: 'percent', value: 25, min: 0, max: 200, step: 1, suffix: '%' },
      { id: 'importShare', label: 'Imported content of the product', kind: 'percent', value: 60, min: 0, max: 100, step: 5, suffix: '%', hint: 'The share of the cost that crosses a border' },
      { id: 'passThrough', label: 'Share passed to the buyer', kind: 'percent', value: 70, min: 0, max: 100, step: 5, suffix: '%' },
    ],
    function (v) {
      var duty = v.price * v.importShare / 100 * v.tariff / 100;
      var added = duty * v.passThrough / 100;
      return {
        primary: { value: v.price + added, kind: 'money2' },
        metrics: [
          { label: 'Duty on the imported content', value: duty, kind: 'money2' },
          { label: 'Added to your price', value: added, kind: 'money2' },
          { label: 'Price increase', value: added / v.price * 100, kind: 'percent2' },
          { label: 'Absorbed by the seller', value: duty - added, kind: 'money2' },
        ],
        rows: {
          head: ['Tariff', 'Duty', 'Added to price', 'New price'],
          body: [10, 25, 50, 100].map(function (t) {
            var d = v.price * v.importShare / 100 * t / 100;
            var a = d * v.passThrough / 100;
            return [formatValue(t, 'int') + '%', formatValue(d, 'money2'), formatValue(a, 'money2'), formatValue(v.price + a, 'money2')];
          }),
        },
        message: 'A tariff is charged on the imported value, not the shelf price, and only the imported share of a product is dutiable. Both facts usually make the real increase smaller than the headline rate suggests.',
      };
    },
    { unit: 'estimated price', tone: 'WHO PAYS THE DUTY' },
  ),

  'calculators/wage-growth-calculator-2026': engine(
    'wage-growth',
    'Raise and real pay',
    [
      { id: 'before', label: 'Pay before the raise', kind: 'money', value: 62000, min: 1, max: 1e9, step: 500, suffix: 'per year' },
      { id: 'after', label: 'Pay after the raise', kind: 'money', value: 68000, min: 1, max: 1e9, step: 500, suffix: 'per year' },
      { id: 'inflation', label: 'Inflation over the period', kind: 'percent', value: 4.5, min: -10, max: 30, step: 0.1, suffix: '%' },
    ],
    function (v) {
      var nominal = (v.after - v.before) / v.before * 100;
      var real = ((v.after / (1 + v.inflation / 100)) - v.before) / v.before * 100;
      var newHourly = v.after / 2080;
      return {
        primary: { value: real, kind: 'percent2' },
        metrics: [
          { label: 'Nominal raise', value: nominal, kind: 'percent2', hint: 'The number on the letter' },
          { label: 'Extra per paycheck (biweekly)', value: (v.after - v.before) / 26, kind: 'money2' },
          { label: 'New hourly rate (2,080 h)', value: newHourly, kind: 'money2' },
          { label: 'Pay needed to stand still', value: v.before * (1 + v.inflation / 100), kind: 'money0', hint: 'The raise that only matches inflation' },
        ],
        rows: {
          head: ['Raise', 'Nominal', 'Real at ' + formatValue(v.inflation, 'percent'), 'Biweekly change'],
          body: [2, 3, 5, 8].map(function (p) {
            var a = v.before * (1 + p / 100);
            var r = ((a / (1 + v.inflation / 100)) - v.before) / v.before * 100;
            return [formatValue(p, 'percent'), formatValue(p, 'percent2'), formatValue(r, 'percent2'), formatValue((a - v.before) / 26, 'money2')];
          }),
        },
        message: 'A raise below inflation is a pay cut in everything except the letter. The real column is the one that decides whether your purchasing power went up or down.',
      };
    },
    { unit: 'real change', tone: 'RAISE VERSUS INFLATION' },
  ),

  'calculators/inflation-calculator-2026': engine(
    'inflation',
    'Inflation calculator',
    [
      { id: 'amount', label: 'Amount', kind: 'money', value: 1000, min: 0.01, max: 1e9, step: 100, suffix: 'USD' },
      { id: 'rate', label: 'Average inflation a year', kind: 'percent', value: 3.2, min: -10, max: 50, step: 0.1, suffix: '%' },
      { id: 'years', label: 'Years', kind: 'number', value: 20, min: 0, max: 100, step: 1, suffix: 'years' },
      { id: 'income', label: 'Your annual income', kind: 'money', value: 60000, min: 0, max: 1e9, step: 1000, suffix: 'per year', hint: 'Used to show what the amount buys in income terms' },
    ],
    function (v) {
      var factor = Math.pow(1 + v.rate / 100, v.years);
      var future = v.amount * factor;
      var realValue = v.amount / factor;
      return {
        primary: { value: future, kind: 'money' },
        metrics: [
          { label: 'Purchasing power of ' + formatValue(v.amount, 'money0') + ' then', value: realValue, kind: 'money0', hint: 'What that money would buy in today\'s prices' },
          { label: 'Price level change', value: (factor - 1) * 100, kind: 'percent' },
          { label: 'Years to halve in value', value: 72 / Math.abs(v.rate || 0.001), kind: 'number', hint: 'Rule of 72' },
          { label: 'Monthly equivalent', value: future / 12, kind: 'money2' },
        ],
        rows: {
          head: ['Years', 'Level change', formatValue(v.amount, 'money0') + ' becomes', 'Buys today'],
          body: [1, 5, 10, 20, 30].map(function (y) {
            var f = Math.pow(1 + v.rate / 100, y);
            return [formatValue(y, 'int'), formatValue((f - 1) * 100, 'percent'), formatValue(v.amount * f, 'money0'), formatValue(v.amount / f, 'money0')];
          }),
        },
        message: 'Compounding works against cash. At the long-run average, money left in a non-interest account loses about a third of its purchasing power in a decade.',
      };
    },
    { unit: 'later', tone: 'WHAT IT BUYS LATER' },
  ),

  /* ------------------------------------------------------------ net worth */
  'calculators/net-worth-calculator-2026': engine(
    'net-worth',
    'Net worth',
    [
      { id: 'cash', label: 'Cash and savings', kind: 'money', value: 18000, min: 0, max: 1e10, step: 1000, suffix: 'USD' },
      { id: 'investments', label: 'Investments and retirement', kind: 'money', value: 95000, min: 0, max: 1e10, step: 1000, suffix: 'USD' },
      { id: 'property', label: 'Property value', kind: 'money', value: 320000, min: 0, max: 1e10, step: 5000, suffix: 'USD' },
      { id: 'otherAssets', label: 'Other assets', kind: 'money', value: 22000, min: 0, max: 1e10, step: 1000, suffix: 'USD' },
      { id: 'mortgage', label: 'Mortgage balance', kind: 'money', value: 245000, min: 0, max: 1e10, step: 1000, suffix: 'USD' },
      { id: 'otherDebt', label: 'Other debt', kind: 'money', value: 14000, min: 0, max: 1e10, step: 1000, suffix: 'USD' },
      { id: 'age', label: 'Your age', kind: 'number', value: 38, min: 16, max: 100, step: 1, suffix: 'years' },
      { id: 'income', label: 'Annual income', kind: 'money', value: 85000, min: 1, max: 1e9, step: 1000, suffix: 'per year' },
    ],
    function (v) {
      var assets = v.cash + v.investments + v.property + v.otherAssets;
      var debts = v.mortgage + v.otherDebt;
      var net = assets - debts;
      return {
        primary: { value: net, kind: 'money' },
        metrics: [
          { label: 'Total assets', value: assets, kind: 'money0' },
          { label: 'Total debts', value: debts, kind: 'money0' },
          { label: 'Debt-to-asset ratio', value: debts / assets * 100, kind: 'percent' },
          { label: 'Net worth to income', value: net / v.income, kind: 'x', hint: 'A common rule of thumb is 1× income by 30 and 3× by 40' },
        ],
        rows: {
          head: ['Age', 'Rule-of-thumb multiple', 'Implied net worth', 'You'],
          body: [[30, 1], [35, 2], [40, 3], [45, 4], [50, 6], [55, 7], [60, 8]].map(function (r) {
            return [formatValue(r[0], 'int'), r[1] + '× income', formatValue(v.income * r[1], 'money0'), formatValue(net - v.income * r[1], 'money0')];
          }),
        },
        message: 'The rule-of-thumb column is a rough savings benchmark, not a verdict, and it ignores home equity entirely in most versions. The last column is the gap, positive or negative.',
      };
    },
    { unit: 'net worth', tone: 'ASSETS MINUS DEBTS' },
  ),

  'calculators/income-percentile-calculator-2026': engine(
    'income-percentile',
    'Income percentile',
    [
      { id: 'income', label: 'Household income', kind: 'money', value: 85000, min: 0, max: 1e9, step: 1000, suffix: 'per year' },
      { id: 'size', label: 'People in the household', kind: 'number', value: 2, min: 1, max: 12, step: 1, suffix: 'people' },
      { id: 'costIndex', label: 'Local cost index', kind: 'number', value: 100, min: 50, max: 250, step: 1, suffix: 'index', hint: '100 is the national average' },
    ],
    function (v) {
      /* Approximate household income points for the United States (2024-ish
         ACS/IPUMS shape), normalised for household size with the standard
         square-root equivalence scale. Illustrative, not a published table. */
      var base = [
        [10, 16000], [20, 28000], [30, 42000], [40, 56000], [50, 70000], [60, 86000],
        [70, 104000], [80, 127000], [90, 165000], [95, 210000], [99, 380000],
      ];
      var equivalent = v.income / (v.costIndex / 100) * Math.sqrt(2 / v.size);
      var percentile = 1;
      for (var i = 0; i < base.length; i++) {
        if (equivalent >= base[i][1]) percentile = base[i][0];
      }
      var next = base.find(function (p) { return p[1] > equivalent; });
      return {
        primary: { value: percentile, kind: 'int' },
        metrics: [
          { label: 'Cost-of-living adjusted income', value: equivalent, kind: 'money0', hint: 'Comparable to a national average household of two' },
          { label: 'Next band', value: next ? next[0] : 99, kind: 'int' },
          { label: 'Income to reach the next band', value: next ? next[1] * (v.costIndex / 100) / Math.sqrt(2 / v.size) : 0, kind: 'money0' },
          { label: 'Household size adjustment', value: Math.sqrt(2 / v.size), kind: 'number', hint: 'A bigger household needs more income for the same standard of living' },
        ],
        rows: {
          head: ['Band', 'National income', 'Your local equivalent', 'Difference'],
          body: base.filter(function (p) { return p[0] % 20 === 0 || p[0] >= 90; }).map(function (p) {
            var local = p[1] * (v.costIndex / 100) / Math.sqrt(2 / v.size);
            return ['Top ' + (100 - p[0]) + '%', formatValue(p[1], 'money0'), formatValue(local, 'money0'), formatValue(v.income - local, 'money0')];
          }),
        },
        message: 'These are approximate national bands, not an official table, and they move with household size and local prices. Treat the percentile as a rough position, not a precise standing.',
      };
    },
    { unit: 'percentile band', tone: 'POSITION, NOT PRECISION' },
  ),

  'calculators/crypto-profit-calculator-2026': engine(
    'crypto-profit',
    'Crypto profit',
    [
      { id: 'buy', label: 'Buy price per coin', kind: 'money', value: 42000, min: 0, max: 1e9, step: 100, suffix: 'USD' },
      { id: 'sell', label: 'Sell price per coin', kind: 'money', value: 58000, min: 0, max: 1e9, step: 100, suffix: 'USD' },
      { id: 'quantity', label: 'Quantity', kind: 'number', value: 0.35, min: 0, max: 1e9, step: 0.01, suffix: 'coins' },
      { id: 'fees', label: 'Total fees', kind: 'percent', value: 0.6, min: 0, max: 10, step: 0.1, suffix: '% of trade value' },
      { id: 'tax', label: 'Tax on gains', kind: 'percent', value: 20, min: 0, max: 50, step: 1, suffix: '%' },
    ],
    function (v) {
      var cost = v.buy * v.quantity;
      var proceeds = v.sell * v.quantity;
      var feeTotal = (cost + proceeds) * v.fees / 100;
      var gain = proceeds - cost - feeTotal;
      var tax = gain > 0 ? gain * v.tax / 100 : 0;
      var net = gain - tax;
      var breakEven = (v.buy * v.quantity * (1 + v.fees / 100)) / (v.quantity * (1 - v.fees / 100));
      return {
        primary: { value: net, kind: 'money2' },
        metrics: [
          { label: 'Return on cost', value: cost > 0 ? net / cost * 100 : 0, kind: 'percent2' },
          { label: 'Fees paid', value: feeTotal, kind: 'money2' },
          { label: 'Tax on the gain', value: tax, kind: 'money2' },
          { label: 'Break-even sell price', value: breakEven, kind: 'money2', hint: 'Where fees alone stop you losing money' },
        ],
        rows: {
          head: ['Exit price', 'Gross gain', 'After fees', 'After tax'],
          body: [v.buy * 0.5, v.buy, v.buy * 1.5, v.buy * 2, v.buy * 4].map(function (s) {
            var p = s * v.quantity;
            var f = (cost + p) * v.fees / 100;
            var g = p - cost - f;
            return [formatValue(s, 'money0'), formatValue(p - cost, 'money2'), formatValue(g, 'money2'), formatValue(g - (g > 0 ? g * v.tax / 100 : 0), 'money2')];
          }),
        },
        message: 'Fees are charged on both sides of a trade, and tax is charged on the gain after fees. A position that is up 5% before costs can be down once both are accounted for.',
      };
    },
    { unit: 'net profit', tone: 'AFTER FEES AND TAX' },
  ),

  'calculators/ai-job-replacement-calculator-2026': engine(
    'ai-job-replacement',
    'Automation exposure',
    [
      { id: 'repetitive', label: 'Share of work that is repetitive', kind: 'percent', value: 45, min: 0, max: 100, step: 5, suffix: '%' },
      { id: 'digital', label: 'Share done entirely on a computer', kind: 'percent', value: 70, min: 0, max: 100, step: 5, suffix: '%' },
      { id: 'judgment', label: 'How much needs human judgement', kind: 'percent', value: 40, min: 0, max: 100, step: 5, suffix: '%', hint: 'Context, accountability, taste' },
      { id: 'physical', label: 'Share needing physical presence', kind: 'percent', value: 5, min: 0, max: 100, step: 5, suffix: '%' },
      { id: 'regulated', label: 'Licence or regulation required', kind: 'percent', value: 10, min: 0, max: 100, step: 5, suffix: '%' },
    ],
    function (v) {
      var raw = v.repetitive * 0.35 + v.digital * 0.25 + (100 - v.judgment) * 0.2 + (100 - v.physical) * 0.1 + (100 - v.regulated) * 0.1;
      var exposure = Math.max(0, Math.min(100, raw));
      return {
        primary: { value: exposure, kind: 'percent' },
        metrics: [
          { label: 'Task exposure', value: exposure, kind: 'percent', hint: 'How much of the role is machine-shaped, not how likely a layoff is' },
          { label: 'Human moat', value: 100 - exposure, kind: 'percent' },
          { label: 'Biggest driver of exposure', text: v.judgment < v.repetitive ? 'Repetitive tasks' : 'Judgement is your best defence', hint: 'The factor moving the score most' },
          { label: 'Biggest protection', text: v.physical > v.judgment ? 'Physical presence' : 'Judgement and context', hint: 'What keeps the score down' },
        ],
        rows: {
          head: ['Scenario', 'Repetitive share', 'Judgement', 'Exposure'],
          body: [[20, 70], [45, 40], [65, 30], [85, 10]].map(function (s) {
            var r = s[0] * 0.35 + v.digital * 0.25 + (100 - s[1]) * 0.2 + (100 - v.physical) * 0.1 + (100 - v.regulated) * 0.1;
            return [s[0] > 60 ? 'Highly routine' : s[0] > 40 ? 'Mixed' : 'Mostly non-routine', formatValue(s[0], 'percent'), formatValue(s[1], 'percent'), formatValue(Math.max(0, Math.min(100, r)), 'percent')];
          }),
        },
        message: 'This scores tasks, not people, and it is a heuristic rather than a forecast. Automating 60% of a role rarely means removing 60% of the jobs — it usually changes what the remaining job looks like.',
      };
    },
    { unit: 'task exposure', tone: 'TASKS, NOT JOBS' },
  ),

  'calculators/chatgpt-cost-calculator-2026': engine(
    'llm-cost',
    'LLM API cost',
    [
      { id: 'requests', label: 'Requests a day', kind: 'number', value: 2000, min: 1, max: 1e9, step: 100, suffix: 'requests' },
      { id: 'inputTokens', label: 'Input tokens per request', kind: 'number', value: 1200, min: 1, max: 2e6, step: 100, suffix: 'tokens' },
      { id: 'outputTokens', label: 'Output tokens per request', kind: 'number', value: 450, min: 1, max: 2e6, step: 50, suffix: 'tokens' },
      { id: 'priceIn', label: 'Input price per 1M tokens', kind: 'money', value: 2.5, min: 0, max: 1e5, step: 0.1, suffix: 'USD / 1M' },
      { id: 'priceOut', label: 'Output price per 1M tokens', kind: 'money', value: 10, min: 0, max: 1e5, step: 0.1, suffix: 'USD / 1M' },
      { id: 'seat', label: 'Chat subscription it replaces', kind: 'money', value: 20, min: 0, max: 1000, step: 1, suffix: 'per month' },
    ],
    function (v) {
      var inTokens = v.requests * v.inputTokens;
      var outTokens = v.requests * v.outputTokens;
      var daily = inTokens / 1e6 * v.priceIn + outTokens / 1e6 * v.priceOut;
      var monthly = daily * 30;
      return {
        primary: { value: monthly, kind: 'money2' },
        metrics: [
          { label: 'Tokens a month', value: (inTokens + outTokens) * 30 / 1e6, kind: 'number', hint: 'In millions' },
          { label: 'Cost per request', value: daily / v.requests, kind: 'money' },
          { label: 'Cost a year', value: monthly * 12, kind: 'money0' },
          { label: 'Requests a month for one seat', value: v.seat > 0 ? v.seat / (daily / v.requests) : 0, kind: 'int', hint: 'Where the API overtakes a flat subscription' },
        ],
        rows: {
          head: ['Requests a day', 'Monthly tokens (M)', 'Monthly cost', 'Per request'],
          body: [100, 500, 2000, 10000, 50000].map(function (r) {
            var it = r * v.inputTokens, ot = r * v.outputTokens;
            var d = it / 1e6 * v.priceIn + ot / 1e6 * v.priceOut;
            return [formatValue(r, 'int'), formatValue((it + ot) * 30 / 1e6, 'number'), formatValue(d * 30, 'money0'), formatValue(d / r, 'money2')];
          }),
        },
        message: 'Output tokens usually cost several times what input tokens do, so trimming the prompt helps less than trimming the answer. Caching long system prompts is the single biggest lever at scale.',
      };
    },
    { unit: 'a month', tone: 'TOKENS IN, DOLLARS OUT' },
  ),

  /* ------------------------------------------------------ family and events */
  'calculators/child-cost-calculator-2026': engine(
    'child-cost',
    'Cost of raising a child',
    [
      { id: 'annual', label: 'Cost a year now', kind: 'money', value: 15500, min: 0, max: 1e7, step: 500, suffix: 'per year' },
      { id: 'age', label: "Child's age now", kind: 'number', value: 0, min: 0, max: 17, step: 1, suffix: 'years' },
      { id: 'until', label: 'Support until age', kind: 'number', value: 18, min: 1, max: 30, step: 1, suffix: 'years old' },
      { id: 'inflation', label: 'Cost inflation a year', kind: 'percent', value: 3, min: 0, max: 15, step: 0.5, suffix: '%' },
    ],
    function (v) {
      var years = Math.max(0, v.until - v.age);
      var total = 0;
      var rows = [];
      for (var y = 0; y < years; y++) {
        var cost = v.annual * Math.pow(1 + v.inflation / 100, y);
        total += cost;
        if (y < 5 || y === years - 1) rows.push(['Age ' + (v.age + y), formatValue(cost, 'money0'), formatValue(total, 'money0')]);
      }
      return {
        primary: { value: total, kind: 'money' },
        metrics: [
          { label: 'Years of support', value: years, kind: 'int' },
          { label: 'Cost a month now', value: v.annual / 12, kind: 'money2' },
          { label: 'Final-year cost', value: v.annual * Math.pow(1 + v.inflation / 100, Math.max(0, years - 1)), kind: 'money0' },
          { label: 'Share of a $85,000 salary', value: v.annual / 85000 * 100, kind: 'percent' },
        ],
        rows: { head: ['Age', 'Cost that year', 'Cumulative'], body: rows },
        message: 'The inflation adjustment is what makes the total look so large: a child costs more per year at 17 than at 3, and the early years are the cheapest rather than the most expensive.',
      };
    },
    { unit: 'total to raise', tone: 'EIGHTEEN YEARS OF INFLATION' },
  ),

  'calculators/childcare-cost-calculator-2026': engine(
    'childcare-cost',
    'Childcare cost',
    [
      { id: 'weekly', label: 'Weekly fee per child', kind: 'money', value: 320, min: 0, max: 1e5, step: 10, suffix: 'per week' },
      { id: 'children', label: 'Children in care', kind: 'number', value: 1, min: 1, max: 8, step: 1, suffix: 'children' },
      { id: 'weeks', label: 'Weeks a year', kind: 'number', value: 50, min: 1, max: 52, step: 1, suffix: 'weeks' },
      { id: 'sibling', label: 'Sibling discount', kind: 'percent', value: 10, min: 0, max: 50, step: 5, suffix: '%' },
      { id: 'pay', label: 'Your take-home hourly pay', kind: 'money', value: 30, min: 0.01, max: 1e6, step: 1, suffix: '/ hour' },
    ],
    function (v) {
      var full = v.weekly * v.weeks;
      var extra = (v.children - 1) * v.weekly * (1 - v.sibling / 100) * v.weeks;
      var annual = full + extra;
      return {
        primary: { value: annual, kind: 'money' },
        metrics: [
          { label: 'Cost a month', value: annual / 12, kind: 'money2' },
          { label: 'Hours of work a year', value: annual / v.pay, kind: 'hours' },
          { label: 'Working days paid for care', value: annual / v.pay / 8, kind: 'int' },
          { label: 'Weekly bill', value: annual / v.weeks, kind: 'money2' },
        ],
        rows: {
          head: ['Weekly fee', 'A year (1 child)', 'A year (' + formatValue(v.children, 'int') + ' children)', 'Hours of work'],
          body: [200, 280, 350, 450].map(function (w) {
            var a = w * v.weeks + (v.children - 1) * w * (1 - v.sibling / 100) * v.weeks;
            return [formatValue(w, 'money0'), formatValue(w * v.weeks, 'money0'), formatValue(a, 'money0'), formatValue(a / v.pay, 'hours')];
          }),
        },
        message: 'Childcare is priced per week but paid for every week of the year, including the ones you are on holiday. The hours-of-work column is the honest comparison against one parent reducing their hours.',
      };
    },
    { unit: 'a year', tone: 'PER WEEK, PAID ALL YEAR' },
  ),

  'calculators/wedding-budget-calculator-2026': engine(
    'wedding-budget',
    'Wedding budget',
    [
      { id: 'guests', label: 'Guest count', kind: 'number', value: 100, min: 1, max: 2000, step: 5, suffix: 'guests' },
      { id: 'catering', label: 'Catering per guest', kind: 'money', value: 85, min: 0, max: 1e5, step: 5, suffix: 'per guest' },
      { id: 'venue', label: 'Venue and rentals', kind: 'money', value: 9000, min: 0, max: 1e7, step: 500, suffix: 'USD' },
      { id: 'photo', label: 'Photo, video and music', kind: 'money', value: 4200, min: 0, max: 1e7, step: 100, suffix: 'USD' },
      { id: 'attire', label: 'Attire and beauty', kind: 'money', value: 2600, min: 0, max: 1e7, step: 100, suffix: 'USD' },
      { id: 'misc', label: 'Everything else', kind: 'money', value: 2800, min: 0, max: 1e7, step: 100, suffix: 'USD' },
      { id: 'budget', label: 'Budget', kind: 'money', value: 30000, min: 1, max: 1e8, step: 1000, suffix: 'USD' },
    ],
    function (v) {
      var food = v.guests * v.catering;
      var total = food + v.venue + v.photo + v.attire + v.misc;
      return {
        primary: { value: total, kind: 'money' },
        metrics: [
          { label: 'Per guest', value: total / v.guests, kind: 'money2' },
          { label: 'Over or under budget', value: v.budget - total, kind: 'money0', hint: 'Positive means you have room left' },
          { label: 'Food and drink share', value: food / total * 100, kind: 'percent' },
          { label: 'Guests affordable on budget', value: v.budget > 0 ? Math.max(0, (v.budget - (v.venue + v.photo + v.attire + v.misc)) / v.catering) : 0, kind: 'int', hint: 'Assuming everything else stays as entered' },
        ],
        rows: {
          head: ['Guests', 'Catering', 'Total', 'Per guest'],
          body: [50, 75, 100, 150, 200].map(function (g) {
            var t = g * v.catering + v.venue + v.photo + v.attire + v.misc;
            return [formatValue(g, 'int'), formatValue(g * v.catering, 'money0'), formatValue(t, 'money0'), formatValue(t / g, 'money2')];
          }),
        },
        message: 'The guest list is the only line that multiplies. Cutting ten guests usually saves more than renegotiating any fixed cost, because it also cuts seating, favours and stationery.',
      };
    },
    { unit: 'total', tone: 'THE GUEST LIST MULTIPLIES' },
  ),

  'calculators/taylor-swift-concert-cost-calculator': engine(
    'concert-cost',
    'Concert night cost',
    [
      { id: 'tickets', label: 'Tickets', kind: 'number', value: 2, min: 1, max: 20, step: 1, suffix: 'tickets' },
      { id: 'ticketPrice', label: 'Price per ticket', kind: 'money', value: 260, min: 0, max: 1e5, step: 10, suffix: 'each' },
      { id: 'travel', label: 'Travel and accommodation', kind: 'money', value: 480, min: 0, max: 1e6, step: 20, suffix: 'per trip' },
      { id: 'extras', label: 'Merch, food, outfits', kind: 'money', value: 220, min: 0, max: 1e6, step: 20, suffix: 'per person' },
      { id: 'pay', label: 'Your take-home hourly pay', kind: 'money', value: 28, min: 0.01, max: 1e6, step: 1, suffix: '/ hour' },
    ],
    function (v) {
      var total = v.tickets * v.ticketPrice + v.travel + v.extras * v.tickets;
      var hours = total / v.pay;
      return {
        primary: { value: total, kind: 'money' },
        metrics: [
          { label: 'Hours of work', value: hours, kind: 'hours' },
          { label: 'Working days paid for it', value: hours / 8, kind: 'number' },
          { label: 'Per person', value: total / v.tickets, kind: 'money2' },
          { label: 'Tickets as a share', value: v.tickets * v.ticketPrice / total * 100, kind: 'percent', hint: 'Travel and extras often cost more than the tickets' },
        ],
        rows: {
          head: ['Tickets', 'Tickets cost', 'All-in total', 'Hours of work'],
          body: [1, 2, 4, 6].map(function (n) {
            var t = n * v.ticketPrice + v.travel + v.extras * n;
            return [formatValue(n, 'int'), formatValue(n * v.ticketPrice, 'money0'), formatValue(t, 'money0'), formatValue(t / v.pay, 'hours0')];
          }),
        },
        message: 'The tickets are the visible cost and rarely the largest one. Adding a second ticket usually costs less than the trip itself, which is why the per-person figure falls as the group grows.',
      };
    },
    { unit: 'all in', tone: 'THE WHOLE TRIP' },
  ),

  /* --------------------------------------------------------------- creator */
  'calculators/youtube-earnings-calculator-2026': engine(
    'youtube-earnings',
    'YouTube earnings',
    [
      { id: 'views', label: 'Monthly views', kind: 'number', value: 250000, min: 0, max: 1e10, step: 1000, suffix: 'views' },
      { id: 'rpm', label: 'RPM (revenue per 1,000 views)', kind: 'money', value: 3.2, min: 0, max: 500, step: 0.1, suffix: 'USD' },
      { id: 'creatorShare', label: 'Creator share of ad revenue', kind: 'percent', value: 55, min: 0, max: 100, step: 5, suffix: '%' },
      { id: 'offAd', label: 'Monthly non-ad revenue', kind: 'money', value: 900, min: 0, max: 1e7, step: 50, suffix: 'members, sponsors, affiliate' },
      { id: 'costs', label: 'Monthly production costs', kind: 'money', value: 350, min: 0, max: 1e7, step: 50, suffix: 'per month' },
    ],
    function (v) {
      var gross = v.views / 1000 * v.rpm;
      var adRevenue = gross * v.creatorShare / 100;
      var net = adRevenue + v.offAd - v.costs;
      return {
        primary: { value: net, kind: 'money2' },
        metrics: [
          { label: 'Ad revenue to you', value: adRevenue, kind: 'money0' },
          { label: 'Annual take-home', value: net * 12, kind: 'money0' },
          { label: 'Effective RPM after your share', value: adRevenue / v.views * 1000, kind: 'money2' },
          { label: 'Cost per 1,000 views', value: v.costs / v.views * 1000, kind: 'money2' },
        ],
        rows: {
          head: ['Monthly views', 'Ad revenue', 'With extras', 'Annual'],
          body: [10000, 100000, 500000, 2000000].map(function (views) {
            var a = views / 1000 * v.rpm * v.creatorShare / 100;
            var n = a + v.offAd - v.costs;
            return [formatValue(views, 'int'), formatValue(a, 'money0'), formatValue(n, 'money0'), formatValue(n * 12, 'money0')];
          }),
        },
        message: 'RPM is per thousand views on the videos that carry ads, and not every view is monetised. The gap between a niche with a $12 RPM and one with $0.80 is the whole economics of the platform.',
      };
    },
    { unit: 'a month', tone: 'RPM, NOT VIEW COUNT' },
  ),

  'calculators/tiktok-money-calculator-2026': engine(
    'tiktok-money',
    'TikTok earnings',
    [
      { id: 'views', label: 'Qualified views a month', kind: 'number', value: 1000000, min: 0, max: 1e10, step: 10000, suffix: 'views' },
      { id: 'rpm', label: 'Payout per 1,000 views', kind: 'money', value: 0.55, min: 0, max: 100, step: 0.01, suffix: 'USD' },
      { id: 'gifts', label: 'Gifts and live income', kind: 'money', value: 150, min: 0, max: 1e7, step: 25, suffix: 'per month' },
      { id: 'brands', label: 'Brand deals a month', kind: 'money', value: 800, min: 0, max: 1e8, step: 50, suffix: 'per month' },
      { id: 'hours', label: 'Hours a week making content', kind: 'number', value: 12, min: 1, max: 100, step: 1, suffix: 'h / week' },
    ],
    function (v) {
      var fund = v.views / 1000 * v.rpm;
      var total = fund + v.gifts + v.brands;
      var monthlyHours = v.hours * 52 / 12;
      return {
        primary: { value: total, kind: 'money2' },
        metrics: [
          { label: 'Creator fund payout', value: fund, kind: 'money0' },
          { label: 'Effective hourly', value: total / monthlyHours, kind: 'money2', hint: 'Everything, divided by the hours you put in' },
          { label: 'A year', value: total * 12, kind: 'money0' },
          { label: 'Share from non-view income', value: (v.gifts + v.brands) / total * 100, kind: 'percent' },
        ],
        rows: {
          head: ['Views a month', 'Fund payout', 'Total', 'Hourly at ' + formatValue(v.hours, 'int') + ' h/wk'],
          body: [100000, 500000, 1000000, 5000000].map(function (views) {
            var f = views / 1000 * v.rpm;
            var t = f + v.gifts + v.brands;
            return [formatValue(views, 'int'), formatValue(f, 'money0'), formatValue(t, 'money0'), formatValue(t / (v.hours * 52 / 12), 'money2')];
          }),
        },
        message: 'The creator fund pays a fraction of what brand work does, so the hourly figure usually depends on the deals rather than the views. Chasing view count alone is the most common mistake here.',
      };
    },
    { unit: 'a month', tone: 'VIEWS ARE NOT INCOME' },
  ),

  'calculators/onlyfans-earnings-calculator-2026': engine(
    'creator-subscriptions',
    'Subscription earnings',
    [
      { id: 'subscribers', label: 'Paying subscribers', kind: 'number', value: 60, min: 0, max: 1e7, step: 5, suffix: 'subscribers' },
      { id: 'price', label: 'Monthly subscription price', kind: 'money', value: 10, min: 0, max: 5000, step: 1, suffix: 'per month' },
      { id: 'fee', label: 'Platform fee', kind: 'percent', value: 20, min: 0, max: 50, step: 1, suffix: '%' },
      { id: 'tips', label: 'Tips and pay-per-view', kind: 'money', value: 400, min: 0, max: 1e7, step: 50, suffix: 'per month' },
      { id: 'hours', label: 'Hours a week', kind: 'number', value: 15, min: 1, max: 100, step: 1, suffix: 'h / week' },
    ],
    function (v) {
      var gross = v.subscribers * v.price + v.tips;
      var net = gross * (1 - v.fee / 100);
      var monthlyHours = v.hours * 52 / 12;
      return {
        primary: { value: net, kind: 'money2' },
        metrics: [
          { label: 'Gross a month', value: gross, kind: 'money0' },
          { label: 'Platform fee', value: gross * v.fee / 100, kind: 'money0' },
          { label: 'Effective hourly', value: net / monthlyHours, kind: 'money2' },
          { label: 'Average per subscriber', value: gross / Math.max(1, v.subscribers), kind: 'money2', hint: 'Includes tips, so it is usually above the subscription price' },
        ],
        rows: {
          head: ['Subscribers', 'Gross a month', 'Net a month', 'Net a year'],
          body: [10, 50, 100, 500, 1000].map(function (s) {
            var g = s * v.price + v.tips;
            var n = g * (1 - v.fee / 100);
            return [formatValue(s, 'int'), formatValue(g, 'money0'), formatValue(n, 'money0'), formatValue(n * 12, 'money0')];
          }),
        },
        message: 'Subscription income is linear in subscribers, which makes churn the dominant variable: losing 5% a month means replacing the entire base every twenty months just to stand still.',
      };
    },
    { unit: 'net a month', tone: 'AFTER THE PLATFORM FEE' },
  ),

  'calculators/mrbeast-earnings-per-second-calculator': engine(
    'earnings-per-second',
    'Earnings per second',
    [
      { id: 'annual', label: 'Estimated annual earnings', kind: 'money', value: 700000000, min: 1, max: 1e12, step: 1000000, suffix: 'USD' },
      { id: 'videoViews', label: 'Views per video', kind: 'number', value: 150000000, min: 0, max: 1e10, step: 1000000, suffix: 'views' },
      { id: 'rpm', label: 'RPM', kind: 'money', value: 2.5, min: 0, max: 1000, step: 0.1, suffix: 'per 1,000 views' },
      { id: 'videoDays', label: 'Views arriving in the first', kind: 'number', value: 30, min: 1, max: 3650, step: 1, suffix: 'days' },
    ],
    function (v) {
      var perYear = v.annual / (365 * 24 * 60 * 60);
      var adPerVideo = v.videoViews / 1000 * v.rpm;
      var windowSeconds = v.videoDays * 86400;
      return {
        primary: { value: perYear, kind: 'money2' },
        metrics: [
          { label: 'Earnings a minute', value: perYear * 60, kind: 'money2' },
          { label: 'Earnings a day', value: perYear * 86400, kind: 'money0' },
          { label: 'Views a second', value: v.videoViews / windowSeconds, kind: 'number', hint: 'Across the launch window you entered' },
          { label: 'Ad revenue per video', value: adPerVideo, kind: 'money0' },
        ],
        rows: {
          head: ['Window', 'Views a second', 'Ad revenue', 'Equivalent salary hours'],
          body: [1, 3, 7, 30].map(function (d) {
            return [d + ' day' + (d === 1 ? '' : 's'), formatValue(v.videoViews / (d * 86400), 'number'), formatValue(adPerVideo, 'money0'), formatValue(adPerVideo / 30, 'hours')];
          }),
        },
        message: 'This divides a reported annual figure into seconds, which is a perspective trick rather than a bank statement. Most of the value in a creator business comes from product lines, not ad revenue.',
      };
    },
    { unit: 'per second', tone: 'A PERSPECTIVE, NOT A PAYSLIP' },
  ),

  'calculators/salary-in-hours-elon-musk-calculator': engine(
    'billionaire-per-second',
    'Billionaire wealth per second',
    [
      { id: 'netWorth', label: 'Net worth', kind: 'money', value: 420000000000, min: 1, max: 1e15, step: 1000000000, suffix: 'USD' },
      { id: 'growth', label: 'Average annual change', kind: 'percent', value: 18, min: -100, max: 200, step: 0.5, suffix: '% a year' },
      { id: 'yourPay', label: 'Your annual take-home pay', kind: 'money', value: 52000, min: 1, max: 1e9, step: 1000, suffix: 'per year' },
      { id: 'yourHours', label: 'Your hours a week', kind: 'number', value: 40, min: 1, max: 100, step: 1, suffix: 'h / week' },
    ],
    function (v) {
      var perYear = v.netWorth * v.growth / 100;
      var perSecond = perYear / (365 * 24 * 60 * 60);
      var yourHourly = v.yourPay / (v.yourHours * 52);
      var yourSecondsToMatch = yourHourly / perSecond;
      return {
        primary: { value: perSecond, kind: 'money2' },
        metrics: [
          { label: 'Wealth change a day', value: perSecond * 86400, kind: 'money0' },
          { label: 'Your hourly take-home', value: yourHourly, kind: 'money2' },
          { label: 'Seconds to match one hour of yours', value: yourSecondsToMatch, kind: 'number' },
          { label: 'Their paper gain a year', value: perYear, kind: 'money0', hint: 'An unrealised change in holdings, not income' },
        ],
        rows: {
          head: ['Period', 'Their change', 'Your take-home', 'Ratio'],
          body: [['One second', 1], ['One minute', 60], ['One hour', 3600], ['One day', 86400]].map(function (p) {
            var theirs = perSecond * p[1];
            var yours = yourHourly / 3600 * p[1];
            return [p[0], formatValue(theirs, 'money2'), formatValue(yours, 'money2'), formatValue(theirs / yours, 'int') + '×'];
          }),
        },
        message: 'This is not a comparison of work. Almost all of it is the daily repricing of shares that were never sold, and a falling share price removes the same amount on paper without anyone spending a cent.',
      };
    },
    { unit: 'per second', tone: 'PAPER WEALTH, NOT INCOME' },
  ),

  /* -------------------------------------------------------------- new tools */
  'calculators/tip-calculator': engine(
    'tip',
    'Tip and split',
    [
      { id: 'bill', label: 'Bill before tip', kind: 'money', value: 86, min: 0, max: 1e6, step: 1, suffix: 'USD' },
      { id: 'tip', label: 'Tip', kind: 'percent', value: 18, min: 0, max: 50, step: 1, suffix: '%' },
      { id: 'party', label: 'Split between', kind: 'number', value: 2, min: 1, max: 50, step: 1, suffix: 'people' },
      { id: 'taxRate', label: 'Sales tax already on the bill', kind: 'percent', value: 8, min: 0, max: 20, step: 0.25, suffix: '%' },
      { id: 'round', label: 'Rounding', kind: 'select', value: 'nearest', options: [['exact', 'Keep the exact total'], ['nearest', 'Round the total to the nearest dollar'], ['up5', 'Round the total up to the next $5']] },
    ],
    function (v) {
      var base = v.bill / (1 + v.taxRate / 100);
      var tipAmount = base * v.tip / 100;
      var total = v.bill + tipAmount;
      var roundedTotal = v.round === 'nearest' ? Math.round(total) : v.round === 'up5' ? Math.ceil(total / 5) * 5 : total;
      return {
        primary: { value: roundedTotal, kind: 'money2' },
        metrics: [
          { label: 'Tip', value: tipAmount, kind: 'money2' },
          { label: 'Each person pays', value: roundedTotal / v.party, kind: 'money2' },
          { label: 'Pre-tax subtotal', value: base, kind: 'money2', hint: 'The tip is calculated on this, not on the post-tax total' },
          { label: 'Rounding generosity', value: roundedTotal - total, kind: 'money2' },
        ],
        rows: {
          head: ['Tip', 'Tip amount', 'Total', 'Each of ' + formatValue(v.party, 'int')],
          body: [10, 15, 18, 20, 25].map(function (t) {
            var amt = base * t / 100;
            var tot = v.bill + amt;
            var r = v.round === 'nearest' ? Math.round(tot) : v.round === 'up5' ? Math.ceil(tot / 5) * 5 : tot;
            return [formatValue(t, 'int') + '%', formatValue(amt, 'money2'), formatValue(r, 'money2'), formatValue(r / v.party, 'money2')];
          }),
        },
        message: 'Tipping on the post-tax total quietly increases the tip by the tax rate. The pre-tax figure is the one a percentage is usually meant to apply to.',
      };
    },
    { unit: 'total to pay', tone: 'BILL, TIP, SPLIT' },
  ),

  'calculators/sales-tax-calculator': engine(
    'sales-tax',
    'Sales tax',
    [
      { id: 'amount', label: 'Amount', kind: 'money', value: 1299, min: 0, max: 1e9, step: 10, suffix: 'USD' },
      { id: 'mode', label: 'Amount entered is', kind: 'select', value: 'before', options: [['before', 'Before tax'], ['after', 'Tax already included']] },
      { id: 'rate', label: 'Sales tax rate', kind: 'percent', value: 8.25, min: 0, max: 30, step: 0.01, suffix: '%' },
      { id: 'count', label: 'Quantity', kind: 'number', value: 1, min: 1, max: 10000, step: 1, suffix: 'items' },
    ],
    function (v) {
      var unit = v.amount;
      var net = v.mode === 'before' ? unit : unit / (1 + v.rate / 100);
      var tax = net * v.rate / 100;
      var gross = net + tax;
      return {
        primary: { value: net * v.count, kind: 'money2' },
        metrics: [
          { label: 'Tax', value: tax * v.count, kind: 'money2' },
          { label: 'Total with tax', value: gross * v.count, kind: 'money2' },
          { label: 'Tax as a share of the total', value: tax / gross * 100, kind: 'percent2' },
          { label: 'Effective tax on the ticket total', value: (gross - net) / gross * 100, kind: 'percent2' },
        ],
        rows: {
          head: ['Rate', 'Net', 'Tax', 'Total'],
          body: [5, 6.5, 8.25, 10, 12].map(function (r) {
            var n = v.mode === 'before' ? unit : unit / (1 + r / 100);
            var t = n * r / 100;
            return [formatValue(r, 'percent2'), formatValue(n * v.count, 'money2'), formatValue(t * v.count, 'money2'), formatValue((n + t) * v.count, 'money2')];
          }),
        },
        message: 'To remove tax from a total, divide by 1 + rate rather than multiplying by the rate — the difference is small on a receipt and large over a year of business expenses.',
      };
    },
    { unit: 'before tax', tone: 'ADD IT OR REMOVE IT' },
  ),

  'calculators/percent-off-calculator': engine(
    'percent-off',
    'Discount, stacked',
    [
      { id: 'price', label: 'Original price', kind: 'money', value: 180, min: 0, max: 1e9, step: 5, suffix: 'USD' },
      { id: 'first', label: 'First discount', kind: 'percent', value: 30, min: 0, max: 95, step: 1, suffix: '% off' },
      { id: 'second', label: 'Extra discount', kind: 'percent', value: 20, min: 0, max: 95, step: 1, suffix: '% off', hint: 'Applied to the already-reduced price, which is how stores stack them' },
      { id: 'tax', label: 'Sales tax', kind: 'percent', value: 0, min: 0, max: 25, step: 0.25, suffix: '%' },
    ],
    function (v) {
      var afterFirst = v.price * (1 - v.first / 100);
      var final = afterFirst * (1 - v.second / 100);
      var withTax = final * (1 + v.tax / 100);
      var naive = v.price * (1 - (v.first + v.second) / 100);
      return {
        primary: { value: final, kind: 'money2' },
        metrics: [
          { label: 'Total discount', value: (1 - final / v.price) * 100, kind: 'percent2', hint: 'Not the 50% that adding 30 and 20 suggests' },
          { label: 'You save', value: v.price - final, kind: 'money2' },
          { label: 'With tax', value: withTax, kind: 'money2' },
          { label: 'The naive sum would say', value: naive, kind: 'money2', hint: 'Adding the percentages, which is what the price tag wants you to do' },
        ],
        rows: {
          head: ['Prices as', 'After first', 'After extra', 'Effective discount'],
          body: [100, 180, 300, 1000].map(function (p) {
            var a = p * (1 - v.first / 100);
            var f = a * (1 - v.second / 100);
            return [formatValue(p, 'money0'), formatValue(a, 'money2'), formatValue(f, 'money2'), formatValue((1 - f / p) * 100, 'percent2')];
          }),
        },
        message: 'Stacked discounts multiply rather than add: 30% then 20% is 44% off, not 50%. The gap is the reason the second coupon exists.',
      };
    },
    { unit: 'final price', tone: 'STACKED, NOT ADDED' },
  ),

  'calculators/debt-snowball-vs-avalanche-calculator': engine(
    'debt-strategy',
    'Debt snowball vs avalanche',
    [
      { id: 'balanceSmall', label: 'Smaller debt balance', kind: 'money', value: 1800, min: 1, max: 1e8, step: 100, suffix: 'USD' },
      { id: 'rateSmall', label: 'Smaller debt APR', kind: 'percent', value: 19.99, min: 0, max: 60, step: 0.01, suffix: '%' },
      { id: 'balanceBig', label: 'Larger debt balance', kind: 'money', value: 9000, min: 1, max: 1e8, step: 100, suffix: 'USD' },
      { id: 'rateBig', label: 'Larger debt APR', kind: 'percent', value: 24.99, min: 0, max: 60, step: 0.01, suffix: '%' },
      { id: 'payment', label: 'Total monthly payment', kind: 'money', value: 600, min: 10, max: 1e7, step: 25, suffix: 'per month' },
    ],
    function (v) {
      /* One simulation, used for both strategies: minimums on everything first,
         then every spare dollar at the target debt. */
      function payoff(order) {
        var s = [
          { b: v.balanceSmall, r: v.rateSmall / 100 / 12, min: v.balanceSmall * 0.02 + 10 },
          { b: v.balanceBig, r: v.rateBig / 100 / 12, min: v.balanceBig * 0.02 + 10 },
        ];
        var m2 = 0, int2 = 0;
        var orderIdx = order === 'snowball'
          ? (v.balanceSmall <= v.balanceBig ? [0, 1] : [1, 0])
          : (v.rateSmall >= v.rateBig ? [0, 1] : [1, 0]);
        while ((s[0].b > 0.01 || s[1].b > 0.01) && m2 < 1200) {
          var interestThisMonth = 0;
          for (var k = 0; k < 2; k++) { var ii = s[k].b * s[k].r; s[k].b += ii; interestThisMonth += ii; }
          int2 += interestThisMonth;
          var left = v.payment;
          for (var p = 0; p < 2; p++) {
            if (s[p].b <= 0.01) continue;
            var pay2 = Math.min(Math.max(s[p].min * 0.5, 15), s[p].b, left);
            s[p].b -= pay2; left -= pay2;
          }
          for (var q = 0; q < 2 && left > 0.01; q++) {
            var idx = orderIdx[q];
            if (s[idx].b <= 0.01) continue;
            var ex = Math.min(left, s[idx].b);
            s[idx].b -= ex; left -= ex;
          }
          m2++;
        }
        return { months: m2, interest: int2 };
      }
      var snow = payoff('snowball');
      var aval = payoff('avalanche');
      return {
        primary: { value: aval.interest, kind: 'money' },
        metrics: [
          { label: 'Avalanche interest', value: aval.interest, kind: 'money2', hint: 'Highest rate first' },
          { label: 'Snowball interest', value: snow.interest, kind: 'money2', hint: 'Smallest balance first' },
          { label: 'Avalanche months', value: aval.months, kind: 'int' },
          { label: 'Snowball months', value: snow.months, kind: 'int' },
        ],
        rows: {
          head: ['Strategy', 'Months', 'Interest', 'Cost of the choice'],
          body: [
            ['Avalanche (highest rate first)', formatValue(aval.months, 'int'), formatValue(aval.interest, 'money2'), formatValue(0, 'money2')],
            ['Snowball (smallest balance first)', formatValue(snow.months, 'int'), formatValue(snow.interest, 'money2'), formatValue(snow.interest - aval.interest, 'money2')],
          ],
        },
        message: 'Avalanche always costs less; snowball finishes individual debts sooner, which is why it works for people who need the momentum. The last column is the price of that motivation.',
      };
    },
    { unit: 'interest, avalanche first', tone: 'THE PRICE OF MOMENTUM' },
  ),

  'calculators/rent-affordability-calculator': engine(
    'rent-affordability',
    'Rent you can afford',
    [
      { id: 'income', label: 'Gross monthly income', kind: 'money', value: 6500, min: 1, max: 1e8, step: 100, suffix: 'per month' },
      { id: 'debts', label: 'Other monthly debt payments', kind: 'money', value: 420, min: 0, max: 1e7, step: 25, suffix: 'per month' },
      { id: 'rule', label: 'Rent-to-income ceiling', kind: 'select', value: '30', options: [['25', '25% (conservative)'], ['30', '30% (the common rule)'], ['35', '35% (tight markets)'], ['40', '40% (lender ceiling)']] },
      { id: 'utilities', label: 'Utilities and fees on top', kind: 'money', value: 180, min: 0, max: 1e6, step: 20, suffix: 'per month' },
    ],
    function (v) {
      var rule = Number(v.rule) / 100;
      var maxRent = v.income * rule;
      var afterDebt = Math.max(0, maxRent - v.debts * 0.5);
      return {
        primary: { value: maxRent, kind: 'money2' },
        metrics: [
          { label: 'All-in housing budget', value: maxRent + v.utilities, kind: 'money2', hint: 'Rent plus utilities, which the 30% rule is often quoted against' },
          { label: 'Rent after debt pressure', value: afterDebt, kind: 'money2', hint: 'A rough allowance for existing debt repayments' },
          { label: 'A year at this rent', value: maxRent * 12, kind: 'money0' },
          { label: 'Share of income left after housing', value: 100 - rule * 100, kind: 'percent' },
        ],
        rows: {
          head: ['Income a month', '25%', '30%', '35%', '40%'],
          body: [4000, 5500, 7000, 9000, 12000].map(function (inc) {
            return [formatValue(inc, 'money0'), formatValue(inc * 0.25, 'money0'), formatValue(inc * 0.3, 'money0'), formatValue(inc * 0.35, 'money0'), formatValue(inc * 0.4, 'money0')];
          }),
        },
        message: 'The 30% rule comes from public housing policy, not from household budgets, and it is harsher on low incomes. Landing costs are separate: expect a deposit, first month and fees upfront.',
      };
    },
    { unit: 'a month', tone: 'THE 30% RULE, EXPLAINED' },
  ),

  'calculators/gas-cost-calculator': engine(
    'fuel-cost',
    'Fuel cost',
    [
      { id: 'distance', label: 'Trip distance', kind: 'number', value: 320, min: 0.1, max: 1e6, step: 5, suffix: 'miles' },
      { id: 'mpg', label: 'Fuel economy', kind: 'number', value: 28, min: 1, max: 200, step: 1, suffix: 'miles / gallon' },
      { id: 'price', label: 'Fuel price', kind: 'money', value: 3.45, min: 0.01, max: 100, step: 0.01, suffix: 'per gallon' },
      { id: 'roundTrip', label: 'Journeys', kind: 'number', value: 2, min: 1, max: 1000, step: 1, suffix: 'trips' },
      { id: 'people', label: 'People splitting the cost', kind: 'number', value: 1, min: 1, max: 20, step: 1, suffix: 'people' },
    ],
    function (v) {
      var totalMiles = v.distance * v.roundTrip;
      var gallons = totalMiles / v.mpg;
      var cost = gallons * v.price;
      return {
        primary: { value: cost, kind: 'money2' },
        metrics: [
          { label: 'Fuel needed', value: gallons, kind: 'number' },
          { label: 'Cost per mile', value: cost / totalMiles, kind: 'money2' },
          { label: 'Each person pays', value: cost / v.people, kind: 'money2' },
          { label: 'Cost to drive 12,000 miles', value: 12000 / v.mpg * v.price, kind: 'money0' },
        ],
        rows: {
          head: ['Fuel economy', 'Gallons for this trip', 'Cost', 'Cost per mile'],
          body: [18, 24, 32, 45, 60].map(function (m) {
            var g = totalMiles / m;
            return [formatValue(m, 'int') + ' mpg', formatValue(g, 'number'), formatValue(g * v.price, 'money2'), formatValue(g * v.price / totalMiles, 'money2')];
          }),
        },
        message: 'Fuel is only part of the cost of a trip: the IRS mileage rate includes wear, tyres, insurance and depreciation, and is usually about twice the fuel figure.',
      };
    },
    { unit: 'fuel', tone: 'MILES ÷ MPG × PRICE' },
  ),

  'calculators/unit-price-calculator': engine(
    'unit-price',
    'Unit price',
    [
      { id: 'priceA', label: 'Option A price', kind: 'money', value: 4.5, min: 0.01, max: 1e7, step: 0.05, suffix: 'USD' },
      { id: 'sizeA', label: 'Option A size', kind: 'number', value: 12, min: 0.01, max: 1e6, step: 0.1, suffix: 'oz' },
      { id: 'priceB', label: 'Option B price', kind: 'money', value: 7.2, min: 0.01, max: 1e7, step: 0.05, suffix: 'USD' },
      { id: 'sizeB', label: 'Option B size', kind: 'number', value: 24, min: 0.01, max: 1e6, step: 0.1, suffix: 'oz' },
      { id: 'uses', label: 'Uses a month', kind: 'number', value: 4, min: 0.1, max: 1000, step: 1, suffix: 'uses' },
    ],
    function (v) {
      var unitA = v.priceA / v.sizeA;
      var unitB = v.priceB / v.sizeB;
      var cheaper = unitA <= unitB ? 'A' : 'B';
      var saving = Math.abs((unitA - unitB) * v.uses * 12);
      return {
        primary: { value: Math.min(unitA, unitB), kind: 'money2' },
        metrics: [
          { label: 'Option A per unit', value: unitA, kind: 'money2' },
          { label: 'Option B per unit', value: unitB, kind: 'money2' },
          { label: 'Cheaper per unit', text: 'Option ' + cheaper, hint: 'By ' + formatValue(Math.abs(unitA - unitB), 'money2') + ' a unit' },
          { label: 'Saved over a year at this usage', value: saving, kind: 'money2', hint: 'Assumes ' + formatValue(v.uses, 'number') + ' uses a month' },
        ],
        rows: {
          head: ['Buying this much', 'Option A costs', 'Option B costs', 'A saves you'],
          body: [v.sizeA, v.sizeB, v.sizeA * 4, v.sizeB * 4].map(function (qty) {
            var a = qty * unitA;
            var b = qty * unitB;
            return [formatValue(qty, 'number') + ' oz', formatValue(a, 'money2'), formatValue(b, 'money2'), formatValue(Math.abs(a - b), 'money2')];
          }),
        },
        message: 'Unit price is the honest comparison, but only if you will actually use the larger size. Waste at the bottom of the container costs more per usable unit than the sticker suggests.',
      };
    },
    { unit: 'per unit', tone: 'PRICE PER OUNCE, NOT PER PACK' },
  ),

  'calculators/50-30-20-budget-calculator': engine(
    'budget-split',
    '50/30/20 budget',
    [
      { id: 'income', label: 'Monthly take-home pay', kind: 'money', value: 4200, min: 1, max: 1e8, step: 100, suffix: 'per month' },
      { id: 'needs', label: 'Needs share', kind: 'percent', value: 50, min: 0, max: 100, step: 1, suffix: '%' },
      { id: 'wants', label: 'Wants share', kind: 'percent', value: 30, min: 0, max: 100, step: 1, suffix: '%' },
      { id: 'rent', label: 'Actual rent or mortgage', kind: 'money', value: 1500, min: 0, max: 1e7, step: 50, suffix: 'per month' },
      { id: 'food', label: 'Actual food and essentials', kind: 'money', value: 620, min: 0, max: 1e7, step: 20, suffix: 'per month' },
    ],
    function (v) {
      var needs = v.income * v.needs / 100;
      var wants = v.income * v.wants / 100;
      var savings = v.income * Math.max(0, 1 - (v.needs + v.wants) / 100);
      var actualNeeds = v.rent + v.food;
      return {
        primary: { value: savings, kind: 'money2' },
        metrics: [
          { label: 'Needs budget', value: needs, kind: 'money2' },
          { label: 'Wants budget', value: wants, kind: 'money2' },
          { label: 'Needs accounted for so far', value: actualNeeds, kind: 'money2', hint: 'Rent plus food, against the needs budget' },
          { label: 'Room left in needs', value: needs - actualNeeds, kind: 'money2' },
        ],
        rows: {
          head: ['Split', 'Needs', 'Wants', 'Savings'],
          body: [[50, 30], [60, 20], [40, 30], [70, 10]].map(function (s) {
            return [s[0] + '/' + s[1] + '/' + (100 - s[0] - s[1]), formatValue(v.income * s[0] / 100, 'money0'), formatValue(v.income * s[1] / 100, 'money0'), formatValue(v.income * (100 - s[0] - s[1]) / 100, 'money0')];
          }),
        },
        message: 'The percentages are a starting point, not a law. In a high-cost city the needs line often exceeds 50%, and the honest response is a smaller wants line rather than a budget that never balances.',
      };
    },
    { unit: 'to save each month', tone: 'NEEDS, WANTS, SAVINGS' },
  ),

  'calculators/profit-margin-calculator': engine(
    'profit-margin',
    'Profit margin',
    [
      { id: 'revenue', label: 'Revenue', kind: 'money', value: 12000, min: 0.01, max: 1e9, step: 100, suffix: 'USD' },
      { id: 'cost', label: 'Cost of goods sold', kind: 'money', value: 7200, min: 0, max: 1e9, step: 100, suffix: 'USD' },
      { id: 'overhead', label: 'Operating expenses', kind: 'money', value: 2600, min: 0, max: 1e9, step: 50, suffix: 'USD' },
      { id: 'fee', label: 'Payment and platform fees', kind: 'percent', value: 2.9, min: 0, max: 30, step: 0.1, suffix: '% of revenue' },
    ],
    function (v) {
      var fees = v.revenue * v.fee / 100;
      var grossProfit = v.revenue - v.cost;
      var netProfit = grossProfit - v.overhead - fees;
      return {
        primary: { value: netProfit / v.revenue * 100, kind: 'percent2' },
        metrics: [
          { label: 'Gross margin', value: grossProfit / v.revenue * 100, kind: 'percent2' },
          { label: 'Net profit', value: netProfit, kind: 'money2' },
          { label: 'Markup on cost', value: (v.revenue - v.cost) / v.cost * 100, kind: 'percent2', hint: 'Different from margin, and the usual source of pricing mistakes' },
          { label: 'Break-even revenue', value: (v.overhead) / Math.max(0.0001, (1 - v.cost / v.revenue - v.fee / 100)), kind: 'money0' },
        ],
        rows: {
          head: ['Revenue', 'Gross margin', 'Net margin', 'Markup'],
          body: [1000, 5000, 12000, 50000].map(function (r) {
            var c = v.cost / v.revenue * r;
            var gp = r - c;
            var np = gp - v.overhead - r * v.fee / 100;
            return [formatValue(r, 'money0'), formatValue(gp / r * 100, 'percent2'), formatValue(np / r * 100, 'percent2'), formatValue((r - c) / c * 100, 'percent2')];
          }),
        },
        message: 'Margin is profit over revenue; markup is profit over cost. A 50% markup is a 33% margin, and confusing the two is how a business sells more and earns less.',
      };
    },
    { unit: 'net margin', tone: 'MARGIN VERSUS MARKUP' },
  ),

  'calculators/roi-calculator': engine(
    'roi',
    'Return on investment',
    [
      { id: 'cost', label: 'Total cost of the investment', kind: 'money', value: 15000, min: 0.01, max: 1e9, step: 500, suffix: 'USD' },
      { id: 'return', label: 'Total return received', kind: 'money', value: 22400, min: 0, max: 1e9, step: 500, suffix: 'USD' },
      { id: 'months', label: 'Months to realise it', kind: 'number', value: 18, min: 1, max: 600, step: 1, suffix: 'months' },
      { id: 'ongoing', label: 'Ongoing return a month', kind: 'money', value: 250, min: 0, max: 1e7, step: 25, suffix: 'per month after the period' },
    ],
    function (v) {
      var years = v.months / 12;
      var roi = (v.return - v.cost) / v.cost * 100;
      var annualised = (Math.pow(Math.max(v.return, 0.0001) / v.cost, 1 / years) - 1) * 100;
      return {
        primary: { value: roi, kind: 'percent2' },
        metrics: [
          { label: 'Annualised return', value: annualised, kind: 'percent2' },
          { label: 'Profit', value: v.return - v.cost, kind: 'money0' },
          { label: 'Payback period', value: v.ongoing > 0 ? v.cost / v.ongoing : v.months, kind: 'number', hint: v.ongoing > 0 ? 'Months to recover the cost from the ongoing return' : 'Months, from the figures above' },
          { label: 'Return per month held', value: (v.return - v.cost) / v.months, kind: 'money2' },
        ],
        rows: {
          head: ['Months to realise', 'ROI', 'Annualised', 'Profit a month held'],
          body: [6, 12, 18, 36, 60].map(function (m) {
            var y = m / 12;
            return [formatValue(m, 'int'), formatValue(roi, 'percent2'), formatValue((Math.pow(Math.max(v.return, 0.0001) / v.cost, 1 / y) - 1) * 100, 'percent2'), formatValue((v.return - v.cost) / m, 'money2')];
          }),
        },
        message: 'A 50% return sounds impressive until you see it took five years. Always annualise before comparing two investments, and count the cost of your own time if you did the work.',
      };
    },
    { unit: 'total return', tone: 'ANNUALISE BEFORE COMPARING' },
  ),

  'calculators/bonus-tax-calculator': engine(
    'bonus-tax',
    'Bonus take-home',
    [
      { id: 'bonus', label: 'Bonus amount', kind: 'money', value: 8000, min: 0, max: 1e9, step: 250, suffix: 'USD' },
      { id: 'method', label: 'How it is withheld', kind: 'select', value: 'flat', options: [['flat', 'Flat 22% supplemental rate'], ['aggregate', 'Added to regular pay']] },
      { id: 'salary', label: 'Regular annual salary', kind: 'money', value: 72000, min: 0, max: 1e9, step: 1000, suffix: 'per year' },
      { id: 'state', label: 'State tax', kind: 'percent', value: 5, min: 0, max: 20, step: 0.5, suffix: '%' },
      { id: 'retirement', label: 'Retirement contribution', kind: 'percent', value: 0, min: 0, max: 60, step: 1, suffix: '%' },
    ],
    function (v) {
      var fed = v.method === 'flat' ? v.bonus * 0.22 : (v.bonus > 1e6 ? v.bonus * 0.37 : v.bonus * (0.22 + Math.min(0.15, v.bonus / 200000 * 0.15)));
      var fica = v.bonus * 0.062 + v.bonus * 0.0145;
      var state = v.bonus * v.state / 100;
      var retirement = v.bonus * v.retirement / 100;
      var withheld = fed + fica + state + retirement;
      return {
        primary: { value: v.bonus - withheld, kind: 'money2' },
        metrics: [
          { label: 'Withheld now', value: withheld, kind: 'money2' },
          { label: 'Effective rate withheld', value: withheld / v.bonus * 100, kind: 'percent2' },
          { label: 'Marginal rate on the bonus', value: (fed + state) / v.bonus * 100, kind: 'percent2', hint: 'Excludes FICA and retirement' },
          { label: 'Bonus as a share of salary', value: v.bonus / v.salary * 100, kind: 'percent2' },
        ],
        rows: {
          head: ['Bonus', 'Withheld', 'Take-home', 'Effective rate'],
          body: [1000, 5000, 10000, 25000].map(function (b) {
            var f = (v.method === 'flat' ? b * 0.22 : b * 0.32) + b * 0.0765 + b * v.state / 100 + b * v.retirement / 100;
            return [formatValue(b, 'money0'), formatValue(f, 'money0'), formatValue(b - f, 'money0'), formatValue(f / b * 100, 'percent2')];
          }),
        },
        message: 'Withholding is not the tax bill. A supplemental rate can over- or under-withhold depending on your bracket, and the difference is settled when you file — which is why a bonus sometimes produces a surprise refund.',
      };
    },
    { unit: 'take-home', tone: 'WITHHOLDING IS NOT TAX' },
  ),

  'calculators/emergency-fund-calculator': engine(
    'emergency-fund',
    'Emergency fund',
    [
      { id: 'essentials', label: 'Essential monthly costs', kind: 'money', value: 2800, min: 1, max: 1e7, step: 100, suffix: 'per month', hint: 'Housing, food, utilities, insurance, minimum debts' },
      { id: 'months', label: 'Months of cover', kind: 'number', value: 6, min: 1, max: 36, step: 1, suffix: 'months' },
      { id: 'have', label: 'Already saved', kind: 'money', value: 3000, min: 0, max: 1e8, step: 250, suffix: 'USD' },
      { id: 'monthly', label: 'Saved toward it each month', kind: 'money', value: 400, min: 0.01, max: 1e6, step: 25, suffix: 'per month' },
    ],
    function (v) {
      var target = v.essentials * v.months;
      var gap = Math.max(0, target - v.have);
      var monthsToFill = gap / v.monthly;
      return {
        primary: { value: target, kind: 'money' },
        metrics: [
          { label: 'Still to save', value: gap, kind: 'money0' },
          { label: 'Months to reach it', value: monthsToFill, kind: 'number' },
          { label: 'Cover you have now', value: v.have / v.essentials, kind: 'number', hint: 'In months of essentials' },
          { label: 'Target a year of cover', value: v.essentials * 12, kind: 'money0' },
        ],
        rows: {
          head: ['Months of cover', 'Target', 'Gap', 'Months to fill'],
          body: [1, 3, 6, 9, 12].map(function (m) {
            var t = v.essentials * m;
            var g = Math.max(0, t - v.have);
            return [formatValue(m, 'int'), formatValue(t, 'money0'), formatValue(g, 'money0'), formatValue(g / v.monthly, 'number')];
          }),
        },
        message: 'Three to six months is the usual range, but the number that matters is how long it would take you to replace the income, not how long the fund lasts on paper.',
      };
    },
    { unit: 'target', tone: 'COVER, NOT A LUMP SUM' },
  ),

  'calculators/401k-calculator': engine(
    'retirement-401k',
    '401(k) balance',
    [
      { id: 'salary', label: 'Annual salary', kind: 'money', value: 78000, min: 0, max: 1e9, step: 1000, suffix: 'USD' },
      { id: 'contribution', label: 'Your contribution', kind: 'percent', value: 8, min: 0, max: 90, step: 0.5, suffix: '% of salary' },
      { id: 'match', label: 'Employer match', kind: 'percent', value: 50, min: 0, max: 200, step: 5, suffix: '% of your contribution' },
      { id: 'matchCap', label: 'Matched up to', kind: 'percent', value: 6, min: 0, max: 30, step: 0.5, suffix: '% of salary' },
      { id: 'balance', label: 'Current balance', kind: 'money', value: 45000, min: 0, max: 1e9, step: 1000, suffix: 'USD' },
      { id: 'years', label: 'Years to retirement', kind: 'number', value: 27, min: 1, max: 60, step: 1, suffix: 'years' },
      { id: 'growth', label: 'Annual return', kind: 'percent', value: 7, min: 0, max: 20, step: 0.25, suffix: '%' },
    ],
    function (v) {
      var yours = v.salary * v.contribution / 100;
      var eligible = v.salary * Math.min(v.contribution, v.matchCap) / 100;
      var employer = eligible * v.match / 100;
      var annual = yours + employer;
      var r = v.growth / 100;
      var fvBalance = v.balance * Math.pow(1 + r, v.years);
      var fvContrib = r === 0 ? annual * v.years : annual * ((Math.pow(1 + r, v.years) - 1) / r);
      var fv = fvBalance + fvContrib;
      return {
        primary: { value: fv, kind: 'money' },
        metrics: [
          { label: 'Employer adds a year', value: employer, kind: 'money0', hint: 'Free money, capped at ' + formatValue(v.matchCap, 'percent') + ' of salary' },
          { label: 'You add a year', value: yours, kind: 'money0' },
          { label: 'Total contributed', value: v.balance + annual * v.years, kind: 'money0' },
          { label: 'Growth', value: fv - (v.balance + annual * v.years), kind: 'money0' },
        ],
        rows: {
          head: ['Years left', 'Balance', 'Contributed', 'Growth share'],
          body: [10, 20, 30, 40].map(function (y) {
            var b = v.balance * Math.pow(1 + r, y);
            var c = annual * ((Math.pow(1 + r, y) - 1) / (r || 0.0001));
            var t = b + c;
            var contrib = v.balance + annual * y;
            return [formatValue(y, 'int'), formatValue(t, 'money0'), formatValue(contrib, 'money0'), formatValue((t - contrib) / t * 100, 'percent')];
          }),
        },
        message: 'Enough to earn the full match is the cheapest return available anywhere. Beyond the match the tax advantage is real but smaller than the match itself, so fund the match before anything else.',
      };
    },
    { unit: 'projected balance', tone: 'CONTRIBUTION PLUS MATCH' },
  ),

  'calculators/moving-cost-calculator': engine(
    'moving-cost',
    'Moving cost',
    [
      { id: 'distance', label: 'Distance', kind: 'number', value: 850, min: 1, max: 20000, step: 25, suffix: 'miles' },
      { id: 'movers', label: 'Movers or van hire', kind: 'money', value: 2600, min: 0, max: 1e7, step: 100, suffix: 'USD' },
      { id: 'deposit', label: 'New deposit', kind: 'money', value: 1800, min: 0, max: 1e7, step: 100, suffix: 'USD' },
      { id: 'fees', label: 'Fees and admin', kind: 'money', value: 400, min: 0, max: 1e7, step: 50, suffix: 'USD' },
      { id: 'setup', label: 'Setup costs', kind: 'money', value: 700, min: 0, max: 1e7, step: 50, suffix: 'deposits, utilities, furniture' },
      { id: 'hours', label: 'Hours you spend on it', kind: 'number', value: 30, min: 0, max: 500, step: 5, suffix: 'hours' },
      { id: 'pay', label: 'Your take-home hourly pay', kind: 'money', value: 27, min: 0.01, max: 1e6, step: 1, suffix: '/ hour' },
    ],
    function (v) {
      var cash = v.movers + v.deposit + v.fees + v.setup;
      var yourTime = v.hours * v.pay;
      return {
        primary: { value: cash + yourTime, kind: 'money' },
        metrics: [
          { label: 'Cash out', value: cash, kind: 'money0' },
          { label: 'Value of your time', value: yourTime, kind: 'money0' },
          { label: 'Cost per mile travelled', value: (cash + yourTime) / v.distance, kind: 'money2' },
          { label: 'Movers as a share', value: v.movers / (cash + yourTime) * 100, kind: 'percent' },
        ],
        rows: {
          head: ['Distance', 'Movers', 'All-in', 'Per mile'],
          body: [50, 250, 850, 2000].map(function (d) {
            var total = cash + yourTime + (d - v.distance) * 1.2;
            return [formatValue(d, 'int') + ' mi', formatValue(v.movers, 'money0'), formatValue(total, 'money0'), formatValue(total / d, 'money2')];
          }),
        },
        message: 'Deposits and setup costs are the part people underestimate. They are also the part that decides whether you can actually accept the move, rather than the van hire.',
      };
    },
    { unit: 'all in', tone: 'CASH PLUS YOUR TIME' },
  ),

  'calculators/pet-cost-calculator': engine(
    'pet-cost',
    'Cost of a pet',
    [
      { id: 'type', label: 'Pet', kind: 'select', value: 'dog', options: [['dog', 'Dog'], ['cat', 'Cat'], ['small', 'Small animal'], ['none', 'Just the numbers I enter']] },
      { id: 'monthly', label: 'Monthly costs', kind: 'money', value: 145, min: 0, max: 1e6, step: 5, suffix: 'per month', hint: 'Food, insurance, vet care, grooming, litter' },
      { id: 'annual', label: 'Annual extras', kind: 'money', value: 420, min: 0, max: 1e6, step: 20, suffix: 'per year', hint: 'Boarding, training, vet visits' },
      { id: 'oneOff', label: 'One-off setup', kind: 'money', value: 600, min: 0, max: 1e6, step: 50, suffix: 'USD' },
      { id: 'years', label: 'Years', kind: 'number', value: 13, min: 1, max: 40, step: 1, suffix: 'years' },
      { id: 'emergency', label: 'One emergency vet bill', kind: 'money', value: 2500, min: 0, max: 1e7, step: 100, suffix: 'USD' },
    ],
    function (v) {
      var recurring = v.monthly * 12 * v.years + v.annual * v.years;
      var total = v.oneOff + recurring + v.emergency;
      return {
        primary: { value: total, kind: 'money' },
        metrics: [
          { label: 'Cost a year', value: (recurring + v.emergency) / v.years, kind: 'money0' },
          { label: 'Cost a month', value: (recurring + v.emergency) / v.years / 12, kind: 'money2' },
          { label: 'One-off and emergency', value: v.oneOff + v.emergency, kind: 'money0' },
          { label: 'Cost per week', value: (recurring + v.emergency) / v.years / 52, kind: 'money2' },
        ],
        rows: {
          head: ['Years lived', 'Lifetime cost', 'Cost a year', 'Cost a month'],
          body: [5, 10, 13, 15, 20].map(function (y) {
            var t = v.oneOff + (v.monthly * 12 + v.annual) * y + v.emergency;
            return [formatValue(y, 'int'), formatValue(t, 'money0'), formatValue(t / y, 'money0'), formatValue(t / y / 12, 'money2')];
          }),
        },
        message: 'The emergency column is the one that catches people out. A single uninsured surgery can cost more than every routine expense of a pet\'s first five years combined.',
      };
    },
    { unit: 'over their life', tone: 'A LIFETIME, NOT A PURCHASE' },
  ),

  'calculators/electricity-cost-calculator': engine(
    'electricity-cost',
    'Running cost',
    [
      { id: 'watts', label: 'Power used', kind: 'number', value: 1500, min: 1, max: 100000, step: 50, suffix: 'watts' },
      { id: 'hours', label: 'Hours a day', kind: 'number', value: 4, min: 0.1, max: 24, step: 0.5, suffix: 'h / day' },
      { id: 'days', label: 'Days a month', kind: 'number', value: 30, min: 1, max: 31, step: 1, suffix: 'days' },
      { id: 'rate', label: 'Electricity price', kind: 'money', value: 0.17, min: 0.001, max: 10, step: 0.01, suffix: 'per kWh' },
      { id: 'devices', label: 'How many of them', kind: 'number', value: 1, min: 1, max: 500, step: 1, suffix: 'devices' },
    ],
    function (v) {
      var kwh = v.watts / 1000 * v.hours * v.days * v.devices;
      var monthly = kwh * v.rate;
      return {
        primary: { value: monthly, kind: 'money2' },
        metrics: [
          { label: 'Energy used a month', value: kwh, kind: 'number', hint: 'Kilowatt hours' },
          { label: 'Cost a year', value: monthly * 12, kind: 'money0' },
          { label: 'Cost an hour', value: v.watts / 1000 * v.rate * v.devices, kind: 'money2' },
          { label: 'Cost per day', value: v.watts / 1000 * v.hours * v.rate * v.devices, kind: 'money2' },
        ],
        rows: {
          head: ['Power', 'kWh a month', 'Cost a month', 'Cost a year'],
          body: [10, 100, 1500, 3000, 7000].map(function (w) {
            var k = w / 1000 * v.hours * v.days * v.devices;
            return [formatValue(w, 'int') + ' W', formatValue(k, 'number'), formatValue(k * v.rate, 'money2'), formatValue(k * v.rate * 12, 'money0')];
          }),
        },
        message: 'Heating and cooling dominate household electricity because they run for hours, not because they draw the most watts. A 1,500 W heater for four hours uses more than a 7,000 W appliance for forty minutes.',
      };
    },
    { unit: 'a month', tone: 'WATTS × HOURS × PRICE' },
  ),

  'calculators/down-payment-calculator': engine(
    'down-payment',
    'Down payment',
    [
      { id: 'price', label: 'Home price', kind: 'money', value: 420000, min: 1000, max: 1e9, step: 5000, suffix: 'USD' },
      { id: 'percent', label: 'Down payment', kind: 'percent', value: 10, min: 0, max: 100, step: 0.5, suffix: '%' },
      { id: 'closing', label: 'Closing costs', kind: 'percent', value: 2.5, min: 0, max: 10, step: 0.25, suffix: '% of price' },
      { id: 'saved', label: 'Cash available', kind: 'money', value: 52000, min: 0, max: 1e9, step: 1000, suffix: 'USD' },
      { id: 'reserve', label: 'Reserve to keep', kind: 'money', value: 9000, min: 0, max: 1e9, step: 500, suffix: 'USD', hint: 'Emergency fund you do not want to spend on the house' },
    ],
    function (v) {
      var down = v.price * v.percent / 100;
      var closing = v.price * v.closing / 100;
      var needed = down + closing + v.reserve;
      return {
        primary: { value: needed, kind: 'money' },
        metrics: [
          { label: 'Down payment', value: down, kind: 'money0' },
          { label: 'Closing costs', value: closing, kind: 'money0' },
          { label: 'Shortfall or surplus', value: v.saved - needed, kind: 'money0' },
          { label: 'At 20% down you would need', value: v.price * 0.2 + closing + v.reserve, kind: 'money0', hint: 'The threshold that usually avoids mortgage insurance' },
        ],
        rows: {
          head: ['Down payment', 'Cash needed', 'Monthly PMI if under 20%', 'Loan amount'],
          body: [3, 5, 10, 15, 20].map(function (p) {
            var d = v.price * p / 100;
            var loan = v.price - d;
            var pmi = p < 20 ? loan * 0.005 / 12 : 0;
            return [formatValue(p, 'percent'), formatValue(d + closing + v.reserve, 'money0'), formatValue(pmi, 'money2'), formatValue(loan, 'money0')];
          }),
        },
        message: 'Closing costs and a reserve are what turn a 10% down payment into a much larger number. Keeping some cash after the purchase is what stops the first repair going on a credit card.',
      };
    },
    { unit: 'cash needed', tone: 'DEPOSIT PLUS COSTS PLUS RESERVE' },
  ),

  'calculators/apy-calculator': engine(
    'apy',
    'APY and APY to APR',
    [
      { id: 'rate', label: 'Nominal rate (APR)', kind: 'percent', value: 4.5, min: 0, max: 100, step: 0.05, suffix: '%' },
      { id: 'compound', label: 'Compounding', kind: 'select', value: '365', options: [['1', 'Annually'], ['2', 'Twice a year'], ['4', 'Quarterly'], ['12', 'Monthly'], ['365', 'Daily']] },
      { id: 'balance', label: 'Balance', kind: 'money', value: 10000, min: 0, max: 1e9, step: 500, suffix: 'USD' },
      { id: 'years', label: 'Years', kind: 'number', value: 3, min: 0.25, max: 50, step: 0.25, suffix: 'years' },
    ],
    function (v) {
      var n = Number(v.compound);
      var apy = (Math.pow(1 + v.rate / 100 / n, n) - 1) * 100;
      var balance = v.balance * Math.pow(1 + apy / 100, v.years);
      return {
        primary: { value: apy, kind: 'percent2' },
        metrics: [
          { label: 'Interest earned a year', value: v.balance * apy / 100, kind: 'money2' },
          { label: 'Balance after the term', value: balance, kind: 'money2' },
          { label: 'Extra from compounding', value: balance - v.balance * (1 + v.rate / 100 * v.years), kind: 'money2', hint: 'Compared with simple interest at the nominal rate' },
          { label: 'Effective daily rate', value: apy / 365, kind: 'percent2' },
        ],
        rows: {
          head: ['Compounding', 'APY', 'After one year', 'After ' + formatValue(v.years, 'number') + ' years'],
          body: [1, 2, 4, 12, 365].map(function (f) {
            var a = (Math.pow(1 + v.rate / 100 / f, f) - 1) * 100;
            return [formatValue(f, 'int') + '× a year', formatValue(a, 'percent2'), formatValue(v.balance * (1 + a / 100), 'money2'), formatValue(v.balance * Math.pow(1 + a / 100, v.years), 'money2')];
          }),
        },
        message: 'APY is the number to compare, because it already includes compounding. A 4.5% nominal rate compounded daily is an APY of about 4.6%, and quoting the nominal rate is how the gap gets hidden.',
      };
    },
    { unit: 'effective annual rate', tone: 'NOMINAL VERSUS EFFECTIVE' },
  ),

  /* --------------------------------------------------------------- events */
  'calculators/divorce-cost-calculator-2026': engine(
    'divorce-cost',
    'Divorce cost',
    [
      { id: 'route', label: 'Route', kind: 'select', value: 'mediated', options: [['uncontested', 'Uncontested, no lawyers'], ['mediated', 'Mediation with review'], ['lawyers', 'Two lawyers, negotiated'], ['court', 'Contested, goes to court']] },
      { id: 'attorneyRate', label: 'Attorney hourly rate', kind: 'money', value: 320, min: 0, max: 5000, step: 10, suffix: 'per hour' },
      { id: 'hours', label: 'Attorney hours each', kind: 'number', value: 22, min: 0, max: 2000, step: 1, suffix: 'hours' },
      { id: 'filing', label: 'Filing and court fees', kind: 'money', value: 450, min: 0, max: 1e6, step: 25, suffix: 'USD' },
      { id: 'other', label: 'Mediation, valuation, other', kind: 'money', value: 2200, min: 0, max: 1e7, step: 100, suffix: 'USD' },
      { id: 'pay', label: 'Your take-home hourly pay', kind: 'money', value: 34, min: 0.01, max: 1e6, step: 1, suffix: '/ hour' },
    ],
    function (v) {
      var attorneyTotal = v.attorneyRate * v.hours * 2;
      var total = attorneyTotal + v.filing + v.other;
      return {
        primary: { value: total, kind: 'money' },
        metrics: [
          { label: 'Attorney fees', value: attorneyTotal, kind: 'money0' },
          { label: 'Hours of your work', value: total / v.pay, kind: 'hours' },
          { label: 'Cost per party', value: total / 2, kind: 'money0' },
          { label: 'Filing fees as a share', value: v.filing / total * 100, kind: 'percent' },
        ],
        rows: {
          head: ['Route', 'Attorney hours', 'Estimated total', 'Per party'],
          body: [['Uncontested', 0], ['Mediation with review', 8], ['Two lawyers, negotiated', 22], ['Contested in court', 70]].map(function (r) {
            var t = v.attorneyRate * r[1] * 2 + v.filing + v.other;
            return [r[0], formatValue(r[1], 'int'), formatValue(t, 'money0'), formatValue(t / 2, 'money0')];
          }),
        },
        message: 'The route matters more than the hourly rate. A good mediator costs a fraction of two attorneys trading letters, and the fees people quote rarely include valuation, filing and court costs.',
      };
    },
    { unit: 'estimated total', tone: 'ROUTE, NOT HOURLY RATE' },
  ),

  'calculators/annual-vs-monthly-subscription': engine(
    'annual-vs-monthly',
    'Annual or monthly',
    [
      { id: 'monthly', label: 'Monthly price', kind: 'money', value: 15.99, min: 0, max: 1e5, step: 0.5, suffix: 'per month' },
      { id: 'annual', label: 'Annual price', kind: 'money', value: 159, min: 0, max: 1e6, step: 5, suffix: 'per year' },
      { id: 'keepMonths', label: 'Months you would keep it', kind: 'number', value: 12, min: 1, max: 60, step: 1, suffix: 'months' },
      { id: 'cash', label: 'What $1 of cash is worth to you later', kind: 'percent', value: 4, min: 0, max: 30, step: 0.5, suffix: '% a year', hint: 'Interest you would otherwise earn on the upfront payment' },
    ],
    function (v) {
      var yearsPaid = Math.max(1, Math.ceil(v.keepMonths / 12));
      var monthlyCost = v.monthly * v.keepMonths;
      var annualCost = v.annual * yearsPaid;
      var saving = monthlyCost - annualCost;
      var breakEven = v.monthly > 0 ? v.annual / v.monthly : 0;
      return {
        primary: { value: Math.abs(saving), kind: 'money2' },
        metrics: [
          { label: 'Cheaper for ' + formatValue(v.keepMonths, 'int') + ' months', text: saving >= 0 ? 'Annual' : 'Monthly', hint: 'By the difference shown above' },
          { label: 'Paying monthly costs', value: monthlyCost, kind: 'money2' },
          { label: 'Paying annually costs', value: annualCost, kind: 'money2' },
          { label: 'Break-even months', value: breakEven, kind: 'number', hint: 'Months of monthly billing that equal one annual payment. Past this, the annual plan is cheaper' },
          { label: 'Annual discount', value: 100 - (v.annual / (v.monthly * 12 || 1)) * 100, kind: 'percent', hint: 'What the annual price saves against twelve monthly payments' },
        ],
        rows: {
          head: ['Kept for', 'Monthly total', 'Annual total', 'Cheaper'],
          body: [3, 6, 12, 24].map(function (m) {
            var mc = v.monthly * m;
            var ac = v.annual * Math.max(1, Math.ceil(m / 12));
            return [m + ' months', formatValue(mc, 'money2'), formatValue(ac, 'money2'), ac < mc ? 'Annual' : 'Monthly'];
          }),
        },
        message: 'An annual plan is a bet that you will still want the service in eleven months. Breaking even around seven months is typical, which is why the discount is usually worth taking only for services you already use daily.',
      };
    },
    { unit: 'saved or lost', tone: 'THE BREAK-EVEN MONTH' },
  ),

  'calculators/subscription-audit': engine(
    'subscription-audit',
    'Subscription audit',
    [
      { id: 'count', label: 'Paid subscriptions', kind: 'number', value: 9, min: 0, max: 100, step: 1, suffix: 'subscriptions' },
      { id: 'average', label: 'Average price', kind: 'money', value: 13, min: 0, max: 1000, step: 1, suffix: 'per month' },
      { id: 'unused', label: 'You would cancel today', kind: 'number', value: 3, min: 0, max: 100, step: 1, suffix: 'subscriptions' },
      { id: 'duplicate', label: 'Overlapping services', kind: 'number', value: 1, min: 0, max: 100, step: 1, suffix: 'subscriptions', hint: 'Two services doing the same job' },
      { id: 'pay', label: 'Your take-home hourly pay', kind: 'money', value: 26, min: 0.01, max: 1e6, step: 1, suffix: '/ hour' },
    ],
    function (v) {
      var monthly = v.count * v.average;
      var annual = monthly * 12;
      var recover = (Math.min(v.unused + v.duplicate, v.count)) * v.average * 12;
      return {
        primary: { value: annual, kind: 'money' },
        metrics: [
          { label: 'Monthly bill', value: monthly, kind: 'money2' },
          { label: 'Recoverable a year', value: recover, kind: 'money0', hint: 'If you cancel everything you said you would' },
          { label: 'Hours of work a year', value: annual / v.pay, kind: 'hours' },
          { label: 'Subscriptions worth keeping', value: v.count - Math.min(v.unused + v.duplicate, v.count), kind: 'int' },
        ],
        rows: {
          head: ['Subscriptions', 'Monthly', 'A year', 'Hours of work'],
          body: [3, 6, 9, 15, 25].map(function (n) {
            var m = n * v.average;
            return [formatValue(n, 'int'), formatValue(m, 'money2'), formatValue(m * 12, 'money0'), formatValue(m * 12 / v.pay, 'hours')];
          }),
        },
        message: 'Audit the annual column, not the monthly one. Nine services at $13 is $1,404 a year, which is why the monthly figures never feel like the problem.',
      };
    },
    { unit: 'a year', tone: 'AUDIT THE ANNUAL COLUMN' },
  ),


  /* ------------------------------------------- breadth: the 2026-09-30 wave */
  'calculators/mortgage-payoff-calculator': engine(
    'mortgage-payoff',
    'Mortgage payoff',
    [
      { id: 'balance', label: 'Balance left on the mortgage', kind: 'money', value: 312000, min: 100, max: 1e8, step: 1000, suffix: 'USD' },
      { id: 'rate', label: 'Interest rate', kind: 'percent', value: 6.5, min: 0, max: 25, step: 0.05, suffix: '% APR' },
      { id: 'years', label: 'Years left on the term', kind: 'number', value: 27, min: 1, max: 40, step: 1, suffix: 'years' },
      { id: 'extra', label: 'Extra paid each month', kind: 'money', value: 200, min: 0, max: 1e6, step: 25, suffix: '/ mo' },
    ],
    function (v) {
      var r = v.rate / 100 / 12, n = v.years * 12;
      var pay = r === 0 ? v.balance / n : v.balance * r / (1 - Math.pow(1 + r, -n));
      var payWith = pay + v.extra;
      var monthsOf = function (p) {
        if (p <= 0) return Infinity;
        if (r === 0) return Math.ceil(v.balance / p);
        var m = -Math.log(1 - r * v.balance / p) / Math.log(1 + r);
        return isFinite(m) && m > 0 ? Math.ceil(m) : Infinity;
      };
      var base = monthsOf(pay), faster = monthsOf(payWith);
      var interest = function (m) { return isFinite(m) ? m * pay - v.balance : 0; };
      var interestWith = isFinite(faster) ? faster * payWith - v.balance : 0;
      var monthsSaved = isFinite(faster) && isFinite(base) ? base - faster : 0;
      var saved = Math.max(0, interest(base) - interestWith);
      return {
        primary: { value: isFinite(faster) ? faster / 12 : 0, kind: 'number' },
        metrics: [
          { label: 'Years saved', value: monthsSaved / 12, kind: 'number' },
          { label: 'Interest saved', value: saved, kind: 'money0', hint: 'Across the whole remaining loan' },
          { label: 'Interest without extras', value: interest(base), kind: 'money0' },
          { label: 'Total interest on the faster plan', value: interestWith, kind: 'money0' },
        ],
        rows: {
          head: ['Extra a month', 'Years to clear', 'Months saved', 'Interest paid'],
          body: [0, 100, 200, 500, 1000].map(function (x) {
            var p = pay + x, m = monthsOf(p), i = isFinite(m) ? m * p - v.balance : 0;
            return [
              x === 0 ? 'Nothing extra' : formatValue(x, 'money0'),
              isFinite(m) ? formatValue(m / 12, 'number') : 'never',
              isFinite(m) ? formatValue((base - m) / 12, 'number') : '—',
              formatValue(Math.max(0, i), 'money0'),
            ];
          }),
        },
        message: 'Every extra payment goes straight at the balance, so it removes all the interest that balance would have earned for the rest of the term. That is why a small monthly amount moves the payoff date by years.',
      };
    },
    { unit: 'years to clear', tone: 'PAY OFF EARLIER' },
  ),

  'calculators/house-affordability-calculator': engine(
    'house-affordability',
    'How much house you can afford',
    [
      { id: 'income', label: 'Household income', kind: 'money', value: 95000, min: 0, max: 1e8, step: 1000, suffix: '/ year' },
      { id: 'debts', label: 'Other monthly debt payments', kind: 'money', value: 550, min: 0, max: 1e6, step: 25, suffix: '/ mo', hint: 'Car loans, student loans, minimum card payments.' },
      { id: 'down', label: 'Down payment saved', kind: 'money', value: 60000, min: 0, max: 1e8, step: 1000, suffix: 'USD' },
      { id: 'rate', label: 'Mortgage rate', kind: 'percent', value: 6.5, min: 0, max: 25, step: 0.05, suffix: '% APR' },
      { id: 'dti', label: 'Debt-to-income ceiling you are willing to use', kind: 'select', value: '36', options: [['28', '28% — conservative'], ['36', '36% — conventional'], ['43', '43% — the qualified-mortgage limit']] },
    ],
    function (v) {
      var cap = Number(v.dti), monthlyIncome = v.income / 12;
      var maxDebt = monthlyIncome * cap / 100;
      var room = Math.max(0, maxDebt - v.debts);
      var r = v.rate / 100 / 12, n = 360;
      var loan = r === 0 ? room * n : room * (1 - Math.pow(1 + r, -n)) / r;
      var price = loan + v.down;
      var ltv = price > 0 ? loan / price * 100 : 0;
      var half = function (capPct) {
        var room2 = Math.max(0, monthlyIncome * capPct / 100 - v.debts);
        var l2 = r === 0 ? room2 * n : room2 * (1 - Math.pow(1 + r, -n)) / r;
        return l2 + v.down;
      };
      return {
        primary: { value: price, kind: 'money0' },
        metrics: [
          { label: 'Loan this supports', value: loan, kind: 'money0' },
          { label: 'Monthly payment ceiling', value: room, kind: 'money2', hint: 'Principal, interest, taxes and insurance come out of this' },
          { label: 'Loan-to-value', value: ltv, kind: 'percent', hint: 'Above 80% usually means mortgage insurance' },
          { label: 'Down payment share', value: price > 0 ? v.down / price * 100 : 0, kind: 'percent' },
        ],
        rows: {
          head: ['Debt-to-income ceiling', 'Monthly housing budget', 'Home price it supports', 'Down payment share'],
          body: [28, 36, 43].map(function (c) {
            var room3 = Math.max(0, monthlyIncome * c / 100 - v.debts);
            var pp = half(c);
            return [c + '%', formatValue(room3, 'money2'), formatValue(pp, 'money0'), formatValue(pp > 0 ? v.down / pp * 100 : 0, 'percent')];
          }),
        },
        message: 'The ceiling that binds is the debt-to-income ratio, and other debts eat into it first. Clearing a $550 car payment raises the price this income supports by tens of thousands of dollars before any change in income.',
      };
    },
    { unit: 'home price', tone: 'WHAT THE BANK WILL LEND' },
  ),

  'calculators/retirement-calculator': engine(
    'retirement',
    'Retirement projection',
    [
      { id: 'age', label: 'Your age now', kind: 'number', value: 34, min: 18, max: 80, step: 1, suffix: 'years' },
      { id: 'retire', label: 'Age you want to stop', kind: 'number', value: 65, min: 40, max: 85, step: 1, suffix: 'years' },
      { id: 'saved', label: 'Saved for retirement so far', kind: 'money', value: 85000, min: 0, max: 1e8, step: 1000, suffix: 'USD' },
      { id: 'monthly', label: 'Paid in each month', kind: 'money', value: 700, min: 0, max: 1e7, step: 50, suffix: '/ mo' },
      { id: 'rate', label: 'Expected annual return', kind: 'percent2', value: 6.5, min: 0, max: 15, step: 0.25, suffix: '% a year' },
      { id: 'inflation', label: 'Assumed inflation', kind: 'percent2', value: 2.5, min: 0, max: 12, step: 0.25, suffix: '% a year' },
    ],
    function (v) {
      var years = Math.max(0, v.retire - v.age);
      var months = years * 12;
      var mr = v.rate / 100 / 12;
      var grown = mr === 0 ? v.monthly * months : v.monthly * ((Math.pow(1 + mr, months) - 1) / mr);
      var balance = v.saved * Math.pow(1 + v.rate / 100, years) + grown;
      var mr2 = v.inflation / 100 / 12;
      var deflator = Math.pow(1 + v.inflation / 100, years);
      var today = deflator > 0 ? balance / deflator : balance;
      var monthlyIncome = balance * 0.04 / 12;
      var todayIncome = today * 0.04 / 12;
      return {
        primary: { value: balance, kind: 'money0' },
        metrics: [
          { label: 'In today’s money', value: today, kind: 'money0', hint: 'The same balance with inflation stripped out' },
          { label: 'Years of paying in', value: years, kind: 'int' },
          { label: 'Monthly income at a 4% draw', value: todayIncome, kind: 'money2', hint: 'In today’s money' },
          { label: 'Your contributions', value: v.saved + v.monthly * months, kind: 'money0' },
        ],
        rows: {
          head: ['Retire at', 'Years of saving', 'Projected balance', 'Monthly income at 4%'],
          body: [60, 62, 65, 67, 70].map(function (age) {
            var y = Math.max(0, age - v.age), m = y * 12;
            var g = mr === 0 ? v.monthly * m : v.monthly * ((Math.pow(1 + mr, m) - 1) / mr);
            var b = v.saved * Math.pow(1 + v.rate / 100, y) + g;
            return [age + '', formatValue(y, 'int'), formatValue(b, 'money0'), formatValue(b * 0.04 / 12, 'money2')];
          }),
        },
        message: 'The projection is arithmetic, not a promise: the return is an assumption, and so is the 4% draw. What the table shows honestly is how much the last five years of saving are worth compared with the first five.',
      };
    },
    { unit: 'projected balance', tone: 'A PROJECTION, NOT A PROMISE' },
  ),

  'calculators/refinance-break-even-calculator': engine(
    'refinance',
    'Refinance break-even',
    [
      { id: 'balance', label: 'Balance being refinanced', kind: 'money', value: 295000, min: 100, max: 1e8, step: 1000, suffix: 'USD' },
      { id: 'current', label: 'Current rate', kind: 'percent', value: 7.25, min: 0, max: 25, step: 0.05, suffix: '% APR' },
      { id: 'left', label: 'Years left on the current loan', kind: 'number', value: 27, min: 1, max: 40, step: 1, suffix: 'years' },
      { id: 'offer', label: 'New rate offered', kind: 'percent', value: 5.75, min: 0, max: 25, step: 0.05, suffix: '% APR' },
      { id: 'term', label: 'New term', kind: 'select', value: '30', options: [['15', '15 years'], ['20', '20 years'], ['25', '25 years'], ['30', '30 years']] },
      { id: 'costs', label: 'Closing costs to refinance', kind: 'money', value: 6200, min: 0, max: 1e7, step: 100, suffix: 'USD' },
    ],
    function (v) {
      var r0 = v.current / 100 / 12, n0 = v.left * 12;
      var payNow = r0 === 0 ? v.balance / n0 : v.balance * r0 / (1 - Math.pow(1 + r0, -n0));
      var term = Number(v.term), r1 = v.offer / 100 / 12, n1 = term * 12;
      var payNew = r1 === 0 ? v.balance / n1 : v.balance * r1 / (1 - Math.pow(1 + r1, -n1));
      var monthly = payNow - payNew;
      var months = monthly > 0 ? Math.ceil(v.costs / monthly) : Infinity;
      var oldTotal = payNow * n0 - v.balance, newTotal = payNew * n1 - v.balance;
      return {
        primary: { value: monthly, kind: 'money2' },
        metrics: [
          { label: 'Break-even', value: isFinite(months) ? months : 0, kind: 'int', hint: months === Infinity ? 'Never — the payment does not fall' : 'Months to recover the closing costs' },
          { label: 'Interest now outstanding', value: oldTotal, kind: 'money0' },
          { label: 'Interest on the new loan', value: newTotal, kind: 'money0' },
          { label: 'Net interest saved', value: oldTotal - newTotal, kind: 'money0' },
        ],
        rows: {
          head: ['New rate', 'Monthly payment', 'Change', 'Break-even on the costs'],
          body: [v.offer, v.offer + 0.25, v.offer + 0.5, v.offer + 1].map(function (rate) {
            var rr = rate / 100 / 12;
            var p = rr === 0 ? v.balance / n1 : v.balance * rr / (1 - Math.pow(1 + rr, -n1));
            var diff = payNow - p;
            return [formatValue(rate, 'percent2'), formatValue(p, 'money2'), formatValue(-diff, 'money2'), diff > 0 ? formatValue(Math.ceil(v.costs / diff), 'int') + ' months' : 'never'];
          }),
        },
        message: 'A lower rate is not the whole sum. Stretching the term back to 30 years lowers the payment while adding years of interest, so the break-even calculation has to include the cost of borrowing longer, not just the closing costs.',
      };
    },
    { unit: 'lower per month', tone: 'THE MONTHLY SAVING AND ITS PRICE' },
  ),

  'calculators/closing-costs-calculator': engine(
    'closing-costs',
    'Closing costs',
    [
      { id: 'price', label: 'Purchase price', kind: 'money', value: 400000, min: 1000, max: 1e8, step: 1000, suffix: 'USD' },
      { id: 'loan', label: 'Loan amount', kind: 'money', value: 340000, min: 0, max: 1e8, step: 1000, suffix: 'USD' },
      { id: 'market', label: 'Typical costs in this market', kind: 'select', value: 'typical', options: [['low', 'Lower-cost state — about 1.8%'], ['typical', 'Typical — about 2.5%'], ['high', 'Higher-cost state — about 3.5%']] },
      { id: 'points', label: 'Points paid to lower the rate', kind: 'percent2', value: 0, min: 0, max: 4, step: 0.25, suffix: '% of the loan' },
    ],
    function (v) {
      var pct = v.market === 'low' ? 1.8 : v.market === 'high' ? 3.5 : 2.5;
      var base = v.price * pct / 100;
      var points = v.loan * v.points / 100;
      var total = base + points;
      var low = v.price * 1.8 / 100 + points, high = v.price * 3.5 / 100 + points;
      var rows = [
        ['Lender fees', v.loan * 0.005],
        ['Appraisal', 650],
        ['Title insurance and search', v.price * 0.006],
        ['Government recording and transfer', v.price * pct / 200],
        ['Prepaid interest and escrow', v.loan * 0.007],
        ['Points', points],
      ];
      return {
        primary: { value: total, kind: 'money0' },
        metrics: [
          { label: 'Share of the price', value: v.price > 0 ? total / v.price * 100 : 0, kind: 'percent' },
          { label: 'Cash needed at closing', value: total + (v.price - v.loan), kind: 'money0', hint: 'Costs plus the down payment' },
          { label: 'Low-cost market', value: low, kind: 'money0' },
          { label: 'Higher-cost market', value: high, kind: 'money0' },
        ],
        rows: {
          head: ['Line item', 'Estimate', 'Basis'],
          body: rows.map(function (r, i) { return [r[0], formatValue(r[1], 'money0'), i === 5 && v.points === 0 ? 'None chosen' : 'Rule of thumb, not a quote']; }),
        },
        message: 'Closing costs are quoted to you as a total on a loan estimate, but they are built from line items you can shop for. Title insurance, lender fees and points are the three that actually move.',
      };
    },
    { unit: 'at closing', tone: 'THE PART OF THE PRICE PEOPLE FORGET' },
  ),

  'calculators/capital-gains-tax-calculator': engine(
    'capital-gains',
    'Capital gains tax',
    [
      { id: 'bought', label: 'What you paid', kind: 'money', value: 12000, min: 0, max: 1e8, step: 100, suffix: 'USD' },
      { id: 'sold', label: 'What you sold for', kind: 'money', value: 21000, min: 0, max: 1e8, step: 100, suffix: 'USD' },
      { id: 'years', label: 'How long you held it', kind: 'number', value: 3, min: 0, max: 60, step: 1, suffix: 'years', hint: 'Twelve months is the line between long and short term.' },
      { id: 'income', label: 'Other taxable income this year', kind: 'money', value: 78000, min: 0, max: 1e8, step: 1000, suffix: 'USD', hint: 'Used to find the long-term rate band.' },
    ],
    function (v) {
      var gain = Math.max(0, v.sold - v.bought);
      var long = v.years >= 1;
      var taxable = v.income + gain;
      var lt = function (g, inc) {
        // 2026 long-term bands for a single filer, as used across this site.
        var tax = 0, at0 = Math.max(0, Math.min(g, 49000 - inc));
        tax += 0;
        var at15 = Math.max(0, Math.min(g - at0, 545000 - inc - at0));
        tax += at15 * 0.15;
        var at20 = Math.max(0, g - at0 - at15);
        tax += at20 * 0.20;
        return tax;
      };
      var tax = long ? lt(gain, v.income) : gain * 0.22;
      var effect = gain > 0 ? (tax / gain) * 100 : 0;
      var saved = long ? Math.max(0, gain * 0.22 - tax) : Math.max(0, lt(gain, v.income) - gain * 0.22);
      return {
        primary: { value: tax, kind: 'money0' },
        metrics: [
          { label: 'Taxable gain', value: gain, kind: 'money0' },
          { label: 'Effective rate', value: effect, kind: 'percent' },
          { label: 'Held long enough?', text: long ? 'Yes — long-term rates apply' : 'No — taxed as ordinary income' },
          { label: long ? 'Saving vs short-term' : 'The wait would have saved', value: saved, kind: 'money0' },
        ],
        rows: {
          head: ['Held for', 'Rate treatment', 'Tax on this gain', 'Kept after tax'],
          body: [
            ['Under a year', 'Ordinary income', formatValue(gain * 0.22, 'money0'), formatValue(gain - gain * 0.22, 'money0')],
            ['1 year or more', 'Long-term bands', formatValue(lt(gain, v.income), 'money0'), formatValue(gain - lt(gain, v.income), 'money0')],
            ['Long term, income +$40k', 'Higher band', formatValue(lt(gain, v.income + 40000), 'money0'), formatValue(gain - lt(gain, v.income + 40000), 'money0')],
            ['Long term, income −$25k', 'Lower band', formatValue(lt(gain, Math.max(0, v.income - 25000)), 'money0'), formatValue(gain - lt(gain, Math.max(0, v.income - 25000)), 'money0')],
          ],
        },
        message: 'Holding past twelve months moves the gain out of ordinary income and into the long-term bands, where the rate starts at zero. The gain is stacked on top of the rest of your income, so the same sale can be taxed differently in two different years.',
      };
    },
    { unit: 'owed on the gain', tone: 'WHAT THE SALE ACTUALLY COSTS' },
  ),

  'calculators/dividend-income-calculator': engine(
    'dividend-income',
    'Dividend income',
    [
      { id: 'value', label: 'Amount invested', kind: 'money', value: 45000, min: 0, max: 1e8, step: 1000, suffix: 'USD' },
      { id: 'yield', label: 'Dividend yield', kind: 'percent2', value: 3.4, min: 0, max: 20, step: 0.1, suffix: '% a year' },
      { id: 'growth', label: 'Dividend growth a year', kind: 'percent2', value: 4, min: 0, max: 20, step: 0.25, suffix: '% a year' },
      { id: 'years', label: 'Hold for', kind: 'number', value: 10, min: 1, max: 50, step: 1, suffix: 'years' },
      { id: 'reinforce', label: 'Reinvest the dividends?', kind: 'select', value: 'no', options: [['yes', 'Yes — buy more'], ['no', 'No — take the income']] },
    ],
    function (v) {
      var income = v.value * v.yield / 100;
      var balance = v.value, total = 0, first = income;
      for (var i = 0; i < v.years; i++) {
        var paid = balance * v.yield / 100 * Math.pow(1 + v.growth / 100, i);
        total += paid;
        if (v.reinforce === 'yes') balance += paid;
      }
      var lastYear = balance * v.yield / 100 * Math.pow(1 + v.growth / 100, v.years - 1);
      return {
        primary: { value: lastYear, kind: 'money0' },
        metrics: [
          { label: 'First year’s income', value: first, kind: 'money2' },
          { label: 'Total income over the period', value: total, kind: 'money0' },
          { label: 'Income growth', value: first > 0 ? (lastYear / first - 1) * 100 : 0, kind: 'percent', hint: 'Compounded dividend growth' },
          { label: 'Portfolio at the end', value: balance, kind: 'money0' },
        ],
        rows: {
          head: ['After', 'Dividend in that year', 'Cumulative income', 'Yield on your original cost' ],
          body: [1, 5, 10, 20, 30].filter(function (y) { return y <= v.years; }).map(function (y) {
            var inc = v.value * v.yield / 100 * Math.pow(1 + v.growth / 100, y - 1);
            var cum = 0;
            for (var k = 1; k <= y; k++) cum += v.value * v.yield / 100 * Math.pow(1 + v.growth / 100, k - 1);
            return [y + ' years', formatValue(inc, 'money0'), formatValue(cum, 'money0'), formatValue(v.value > 0 ? cum / v.value * 100 / y : 0, 'percent2')];
          }),
        },
        message: 'Dividend growth compounds on itself: a 4% annual raise in the payout doubles the income in about eighteen years without adding a dollar. Reinvesting shortens that further, because each dividend buys more shares.',
      };
    },
    { unit: 'income in the final year', tone: 'INCOME THAT GROWS WITHOUT PAYING IN' },
  ),

  'calculators/severance-pay-calculator': engine(
    'severance',
    'Severance pay',
    [
      { id: 'salary', label: 'Annual salary', kind: 'money', value: 82000, min: 0, max: 1e8, step: 1000, suffix: 'USD' },
      { id: 'years', label: 'Years of service', kind: 'number', value: 6, min: 0, max: 60, step: 0.5, suffix: 'years' },
      { id: 'policy', label: 'What the policy says', kind: 'select', value: '2', options: [['1', '1 week per year of service'], ['2', '2 weeks per year of service'], ['0', 'A flat number of weeks']] },
      { id: 'flat', label: 'Flat weeks, if that is the policy', kind: 'number', value: 4, min: 0, max: 104, step: 1, suffix: 'weeks' },
      { id: 'unused', label: 'Unused vacation days paid out', kind: 'number', value: 9, min: 0, max: 200, step: 1, suffix: 'days' },
      { id: 'weeks', label: 'Weeks until a new job starts', kind: 'number', value: 8, min: 0, max: 104, step: 1, suffix: 'weeks' },
    ],
    function (v) {
      var weekly = v.salary / 52;
      var weeks = v.policy === '0' ? v.flat : Number(v.policy) * v.years;
      var severance = weeks * weekly;
      var vacation = v.unused * (weekly / 5);
      var total = severance + vacation;
      var gap = Math.max(0, v.weeks * weekly - total);
      return {
        primary: { value: total, kind: 'money0' },
        metrics: [
          { label: 'Weeks of severance', value: weeks, kind: 'number' },
          { label: 'Severance before vacation', value: severance, kind: 'money0' },
          { label: 'Weekly pay', value: weekly, kind: 'money2', hint: 'Salary ÷ 52' },
          { label: 'Shortfall if the search takes longer', value: gap, kind: 'money0' },
        ],
        rows: {
          head: ['Weeks of severance', 'Before tax', 'Weekly pay equivalent', 'Weeks of expenses covered at 70% of pay'],
          body: [0, 2, 4, 8, 12, 26].map(function (w) {
            var amount = w * weekly + vacation;
            var weeklySpend = weekly * 0.7;
            return [w + '', formatValue(amount, 'money0'), formatValue(w, 'number'), weeklySpend > 0 ? formatValue(amount / weeklySpend, 'number') : '—'];
          }),
        },
        message: 'Severance is usually calculated from the weekly rate, not the monthly one, and it is normally taxed as ordinary pay rather than as a lump sum. The number that matters for planning is how many weeks of spending it covers, which is more than the number of weeks it pays.',
      };
    },
    { unit: 'before tax', tone: 'THE RUNWAY, NOT THE LUMP SUM' },
  ),

  'calculators/cost-per-mile-calculator': engine(
    'cost-per-mile',
    'Cost per mile',
    [
      { id: 'mpg', label: 'Fuel economy', kind: 'number', value: 32, min: 1, max: 150, step: 1, suffix: 'mpg' },
      { id: 'fuel', label: 'Fuel price', kind: 'money2', value: 3.6, min: 0.1, max: 20, step: 0.05, suffix: '/ gallon' },
      { id: 'miles', label: 'Miles driven a year', kind: 'number', value: 12000, min: 100, max: 200000, step: 500, suffix: 'miles' },
      { id: 'insurance', label: 'Insurance a year', kind: 'money', value: 1450, min: 0, max: 1e6, step: 50, suffix: '/ year' },
      { id: 'service', label: 'Service, tyres and repairs a year', kind: 'money', value: 900, min: 0, max: 1e6, step: 50, suffix: '/ year' },
      { id: 'drop', label: 'Depreciation a year', kind: 'money', value: 2600, min: 0, max: 1e6, step: 100, suffix: '/ year' },
    ],
    function (v) {
      var fuelCost = v.miles / v.mpg * v.fuel;
      var standing = v.insurance + v.service + v.drop;
      var annual = fuelCost + standing;
      var perMile = v.miles > 0 ? annual / v.miles : 0;
      var fuelPerMile = v.miles > 0 ? fuelCost / v.miles : 0;
      return {
        primary: { value: perMile, kind: 'money2' },
        metrics: [
          { label: 'Fuel each year', value: fuelCost, kind: 'money0' },
          { label: 'Everything else', value: standing, kind: 'money0' },
          { label: 'Fuel only, per mile', value: fuelPerMile, kind: 'money2', hint: 'What most people quote, and it is a third of the answer' },
          { label: 'Cost per working day', value: annual / 250, kind: 'money2' },
        ],
        rows: {
          head: ['Driver', 'Miles a year', 'Fuel cost', 'All-in cost per mile'],
          body: [
            ['Short commute', 7000, 0, 0],
            ['Average', 12000, 0, 0],
            ['Long commute', 20000, 0, 0],
            ['Ride-share heavy', 30000, 0, 0],
          ].map(function (row) {
            var m = row[1];
            var f = m / v.mpg * v.fuel;
            var a = f + standing;
            return [row[0], formatValue(m, 'int'), formatValue(f, 'money0'), formatValue(m > 0 ? a / m : 0, 'money2')];
          }),
        },
        message: 'Fuel is the visible cost and usually a third of the real one. Depreciation is the largest single line for most cars, and it is charged whether the car is driven or parked.',
      };
    },
    { unit: 'per mile', tone: 'WHAT THE CAR ACTUALLY COSTS YOU' },
  ),

  'calculators/vacation-cost-calculator': engine(
    'vacation-cost',
    'Vacation cost',
    [
      { id: 'nights', label: 'Nights away', kind: 'number', value: 7, min: 1, max: 90, step: 1, suffix: 'nights' },
      { id: 'people', label: 'People travelling', kind: 'number', value: 2, min: 1, max: 20, step: 1, suffix: 'people' },
      { id: 'lodging', label: 'Lodging a night', kind: 'money', value: 160, min: 0, max: 1e6, step: 10, suffix: '/ night' },
      { id: 'travel', label: 'Getting there, all in', kind: 'money', value: 620, min: 0, max: 1e6, step: 20, suffix: 'total' },
      { id: 'food', label: 'Food a day, per person', kind: 'money', value: 55, min: 0, max: 1e5, step: 5, suffix: '/ day' },
      { id: 'activities', label: 'Activities a day, per person', kind: 'money', value: 30, min: 0, max: 1e5, step: 5, suffix: '/ day' },
      { id: 'kennel', label: 'Pets and extras', kind: 'money', value: 280, min: 0, max: 1e6, step: 20, suffix: 'total' },
    ],
    function (v) {
      var days = v.nights + 1;
      var lodging = v.nights * v.lodging;
      var food = v.food * days * v.people;
      var fun = v.activities * days * v.people;
      var total = lodging + food + fun + v.travel + v.kennel;
      return {
        primary: { value: total, kind: 'money0' },
        metrics: [
          { label: 'A day', value: total / days, kind: 'money0' },
          { label: 'Per person, per day', value: v.people > 0 ? total / days / v.people : 0, kind: 'money0' },
          { label: 'Lodging share', value: total > 0 ? lodging / total * 100 : 0, kind: 'percent' },
          { label: 'Add one more night', value: v.lodging + (v.food + v.activities) * v.people, kind: 'money0' },
        ],
        rows: {
          head: ['Length', 'Lodging', 'Food and activities', 'Total'],
          body: [3, 5, 7, 10, 14].map(function (n) {
            var l = n * v.lodging, f = (v.food + v.activities) * (n + 1) * v.people;
            return [n + ' nights', formatValue(l, 'money0'), formatValue(f, 'money0'), formatValue(l + f + v.travel + v.kennel, 'money0')];
          }),
        },
        message: 'A trip is mostly a fixed cost plus a daily one. Flights and kennel are paid once however long you stay, so the marginal cost of an extra day is lodging plus food, which is usually far less than the average day.',
      };
    },
    { unit: 'all in', tone: 'THE FIXED PART AND THE DAILY PART' },
  ),

};

/* Engines are looked up by route; a missing route falls back to the page body. */
const ENGINE_ROUTE_SET = new Set(Object.keys(ENGINES));

/**
 * Named scenarios. These exist because the biggest real-world question on most
 * of these pages is not "what number does the formula give" but "what changes
 * if I pick the other option", and a preset answers that in one click.
 */
const PRESETS = {
  'calculators/mortgage-calculator-2026': [
    { label: '15-year term', values: { years: '15' } },
    { label: '20% down', values: { down: 90000 } },
    { label: 'Rates +1%', values: { rate: 7.5 } },
  ],
  'calculators/car-loan-calculator-2026': [
    { label: '48-month loan', values: { months: '48' } },
    { label: 'No deposit', values: { trade: 0 } },
    { label: 'Used car, $18k', values: { price: 18000, trade: 3000 } },
  ],
  'calculators/tip-calculator': [
    { label: 'Coffee for two', values: { bill: 14, tip: 15, party: 2 } },
    { label: 'Dinner for four', values: { bill: 186, tip: 20, party: 4 } },
    { label: 'Generous 25%', values: { tip: 25 } },
  ],
  'calculators/rent-affordability-calculator': [
    { label: '$4,000 a month', values: { income: 4000 } },
    { label: 'Conservative 25%', values: { rule: '25' } },
    { label: 'With $700 of debt', values: { debts: 700 } },
  ],
  'calculators/youtube-earnings-calculator-2026': [
    { label: 'Small channel', values: { views: 25000, offAd: 200 } },
    { label: 'Finance niche', values: { rpm: 12 } },
    { label: 'Gaming niche', values: { rpm: 1.6 } },
  ],
  'calculators/credit-card-payoff-calculator-2026': [
    { label: 'Pay $150 a month', values: { payment: 150 } },
    { label: 'Pay $500 a month', values: { payment: 500 } },
    { label: 'Balance transfer at 0%', values: { apr: 0, balance: 6500, payment: 250 } },
  ],
  'calculators/compound-interest-calculator': [
    { label: 'Retirement, 30 years', values: { years: 30 } },
    { label: 'Start from zero', values: { principal: 0 } },
    { label: 'Conservative 4%', values: { rate: 4 } },
  ],
  'calculators/emergency-fund-calculator': [
    { label: 'Three months', values: { months: 3 } },
    { label: 'Twelve months', values: { months: 12 } },
    { label: 'Tight budget', values: { essentials: 1800 } },
  ],
  'calculators/pet-cost-calculator': [
    { label: 'Dog, 13 years', values: { monthly: 145, years: 13, oneOff: 600 } },
    { label: 'Cat, 16 years', values: { monthly: 95, years: 16, oneOff: 400, annual: 300 } },
    { label: 'No emergency fund', values: { emergency: 0 } },
  ],
  'calculators/divorce-cost-calculator-2026': [
    { label: 'Uncontested', values: { route: 'uncontested', hours: 0, other: 500 } },
    { label: 'Mediation', values: { route: 'mediated', hours: 8 } },
    { label: 'Contested in court', values: { route: 'court', hours: 70 } },
  ],
  'calculators/chatgpt-cost-calculator-2026': [
    { label: 'Prototype', values: { requests: 200, inputTokens: 800, outputTokens: 300 } },
    { label: 'Small product', values: { requests: 5000 } },
    { label: 'Cheap model', values: { priceIn: 0.15, priceOut: 0.6 } },
  ],
  'calculators/gas-cost-calculator': [
    { label: 'Weekend trip', values: { distance: 180, roundTrip: 2 } },
    { label: 'Commute month', values: { distance: 26, roundTrip: 20 } },
    { label: 'SUV at 19 mpg', values: { mpg: 19 } },
  ],
  'calculators/sales-tax-calculator': [
    { label: '$499 electronics', values: { amount: 499 } },
    { label: 'Tax included', values: { mode: 'after' } },
    { label: 'No-tax state', values: { rate: 0 } },
  ],
  'calculators/401k-calculator': [
    { label: 'Only the match', values: { contribution: 6 } },
    { label: 'Max the match', values: { contribution: 15 } },
    { label: '20 years left', values: { years: 20 } },
  ],
};

for (const [route, presets] of Object.entries(PRESETS)) {
  if (ENGINES[route]) ENGINES[route].presets = presets;
}

/* -------------------------------------------------------------- rendering */

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Pretty label for a field suffix that may carry a currency marker. */
function fieldControl(field, value) {
  const id = `f-${field.id}`;
  if (field.kind === 'select') {
    return `<select id="${id}" name="${esc(field.id)}">` +
      field.options.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(l)}</option>`).join('') +
      `</select>`;
  }
  const prefix = field.kind === 'money' ? '<span>$</span>' : '';
  const suffix = field.suffix ? `<span>${esc(field.suffix)}</span>` : field.kind === 'percent' ? '<span>%</span>' : '';
  const step = field.step ?? (field.kind === 'money' ? 0.01 : 1);
  return `<div class="money-input">${prefix}<input id="${id}" name="${esc(field.id)}" type="number" inputmode="decimal"` +
    ` min="${field.min ?? 0}" max="${field.max ?? 1e12}" step="${step}" value="${esc(value)}" required>` +
    `${suffix}</div>`;
}

/**
 * The inline runtime. It is deliberately a classic script rather than a module:
 * Vite leaves classic inline scripts alone, so each page keeps its calculator
 * even when JavaScript chunk loading is slow or blocked, and the pre-rendered
 * numbers stay meaningful.
 */
function runtime(engine, route) {
  const spec = {
    fields: engine.fields.map(f => ({ id: f.id, kind: f.kind })),
    presets: (engine.presets || []).map(p => ({ label: p.label, values: p.values })),
    compute: engine.compute,
  };
  return `<script>(function(){` +
    `var E=${JSON.stringify(spec).replace(/"compute":\s*null/, '')};` +
    `E.compute=${engine.compute.toString()};` +
    `var F=${formatValue.toString()};` +
    `var root=document.getElementById('tool-body');` +
    `if(!root)return;` +
    `function read(){var v={};E.fields.forEach(function(f){var el=document.getElementById('f-'+f.id);v[f.id]=f.kind==='select'?el.value:Number(el.value);});return v;}` +
    `function render(){var v=read();var out;try{out=E.compute(v);}catch(e){return;}if(!out||!out.primary)return;` +
    `document.getElementById('r-value').textContent=F(out.primary.value,out.primary.kind);` +
    `var m=document.getElementById('r-metrics');if(m&&out.metrics){m.innerHTML=out.metrics.map(function(x){return '<div class="metric"><b>'+(x.text!=null?x.text:F(x.value,x.kind))+'</b><span>'+x.label+'</span>'+(x.hint?'<i>'+x.hint+'</i>':'')+'</div>';}).join('');}` +
    `var msg=document.getElementById('r-message');if(msg&&out.message)msg.textContent=out.message;` +
    `var tb=document.getElementById('r-table');if(tb&&out.rows){var h='<table><thead><tr>'+out.rows.head.map(function(c){return '<th scope="col">'+c+'</th>';}).join('')+'</tr></thead><tbody>'+out.rows.body.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';tb.innerHTML=h;}` +
    `var url=new URLSearchParams();E.fields.forEach(function(f){var el=document.getElementById('f-'+f.id);if(el)url.set(f.id,el.value);});history.replaceState(null,'','#tool='+encodeURIComponent(url.toString()));}` +
    `root.addEventListener('input',render);root.addEventListener('change',render);` +
    `root.addEventListener('submit',function(e){e.preventDefault();render();var r=document.getElementById('r-value');if(r&&innerWidth<700)r.scrollIntoView({behavior:'smooth',block:'center'});});` +
    `document.querySelectorAll('[data-preset]').forEach(function(b){b.addEventListener('click',function(){var p=E.presets[Number(b.dataset.preset)];if(!p)return;Object.keys(p.values).forEach(function(k){var el=document.getElementById('f-'+k);if(el)el.value=p.values[k];});render();});});` +
    `try{var frag=new URLSearchParams(location.hash.replace(/^#tool=/,''));E.fields.forEach(function(f){var v=frag.get(f.id);var el=document.getElementById('f-'+f.id);if(v!==null&&el&&isFinite(Number(v)))el.value=v;});}catch(e){}` +
    `render();` +
    `})();</script>`;
}

/**
 * Full calculator section for one route: form, server-rendered result, and the
 * inline runtime that keeps them in step.
 * @param {string} route
 */
export function renderCalculator(route) {
  const engine = ENGINES[route];
  if (!engine) return null;
  const defaults = Object.fromEntries(engine.fields.map(f => [f.id, f.value]));
  const initial = engine.compute(defaults);

  const fields = engine.fields
    .map(f => `<div class="engine-field${f.wide ? ' wide' : ''}"><label for="f-${f.id}">${esc(f.label)}` +
      (f.hint ? `<span class="info" title="${esc(f.hint)}">ⓘ</span>` : '') + '</label>' +
      fieldControl(f, f.value) + '</div>')
    .join('');

  const metrics = (initial.metrics || [])
    .map(m => `<div class="metric"><b>${esc(m.text != null ? m.text : formatValue(m.value, m.kind))}</b><span>${esc(m.label)}</span>${m.hint ? `<i>${esc(m.hint)}</i>` : ''}</div>`)
    .join('');

  const table = initial.rows
    ? `<div class="engine-table" id="r-table"><table><thead><tr>${initial.rows.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>` +
      `<tbody>${initial.rows.body.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    : '';

  const presets = (engine.presets || []).length
    ? `<div class="engine-presets">${engine.presets.map((p, i) => `<button type="button" data-preset="${i}">${esc(p.label)}</button>`).join('')}</div>`
    : '';

  const unit = engine.unit ? `<span class="unit">${esc(engine.unit)}</span>` : '';

  return `<section id="calculator" class="calculator-wrap" data-engine="${esc(engine.id)}"><div class="tool-tabs"><span class="engine-title">${esc(engine.tone || 'FREE CALCULATOR')}</span><span class="free-tag">ALWAYS FREE. NO SIGN-UP.</span></div><div class="calculator"><div class="inputs">` +
    `<div class="section-label">${esc(engine.tone || 'FREE TOOL')}</div>` +
    `<h2 id="tool-title">${esc(engine.label)}</h2>` +
    `<form id="tool-body"><div class="engine-fields">${fields}</div>${presets}` +
    `<button type="submit" class="calculate">Calculate <span>↗</span></button>` +
    `<div class="privacy"><svg viewBox="0 0 24 24"><rect x="6" y="10" width="12" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>Your numbers stay in your browser. Always.</div>` +
    `</form></div>` +
    `<div class="result" aria-live="polite"><div class="result-top"><span>RESULT</span><span class="tiny-clock">◷</span></div>` +
    `<div class="big-result"><span id="r-value">${esc(formatValue(initial.primary.value, initial.primary.kind))}</span>${unit}<span class="asterisk">✳</span></div>` +
    `<div class="metric-grid" id="r-metrics">${metrics}</div>` +
    `<div class="result-message"><span>↳</span><p id="r-message">${esc(initial.message || '')}</p></div>` +
    `</div></div>${table}` +
    runtime(engine, route) +
    `</section>`;
}

/** Routes that have a bespoke engine, for coverage checks and the audit. */
export const ENGINE_ROUTES = Object.keys(ENGINES).sort();

if (process.argv[1]?.endsWith('calculator-engines.mjs')) {
  console.log(`${ENGINE_ROUTES.length} calculator engines defined`);
  const without = ENGINE_ROUTES.filter(r => typeof ENGINES[r].compute !== 'function');
  if (without.length) { console.error('missing compute:', without.join(', ')); process.exit(1); }
  for (const r of ENGINE_ROUTES) {
    const e = ENGINES[r];
    const v = Object.fromEntries(e.fields.map(f => [f.id, f.value]));
    const out = e.compute(v);
    if (!out || typeof out.primary?.value !== 'number' && out.primary?.kind !== 'text') {
      console.error('engine produced no numeric primary:', r); process.exit(1);
    }
    console.log(` ✓ ${r.padEnd(60)} ${e.fields.length} fields -> ${formatValue(out.primary.value, out.primary.kind)}`);
  }
}
