import fs from 'node:fs';
import vm from 'node:vm';
import { generateArticles, articleRoutes, articles as guideArticles, clusters as guideClusters, articleFeedItems, articleLlmsLines } from './articles.mjs';
export { articleRoutes };

export const routes = [
  // original 6
  'calculators/cost-of-time',
  'calculators/subscription-cost',
  'calculators/daily-savings',
  'guides/hourly-pay',
  'guides/small-purchases',
  'guides/24-hour-rule',
  // 40 new SEO articles - calculators cluster
  'calculators/salary-to-hourly',
  'calculators/hourly-to-salary',
  'calculators/freelance-rate',
  'calculators/cost-per-wear',
  'calculators/cost-per-use',
  'calculators/overtime-pay',
  'calculators/after-tax-income',
  'calculators/commute-cost',
  'calculators/latte-factor',
  'calculators/gym-cost-per-visit',
  'calculators/streaming-cost',
  'calculators/car-ownership-cost',
  'calculators/time-to-save',
  'calculators/paycheck-breakdown',
  'calculators/buy-vs-rent-hourly',
  // guides cluster
  'guides/how-much-is-time-worth',
  'guides/stop-impulse-buying',
  'guides/subscription-audit',
  'guides/latte-factor-explained',
  'guides/no-spend-challenge',
  'guides/30-day-rule-spending',
  'guides/cost-per-wear-guide',
  'guides/freelance-rate-guide',
  'guides/psychology-small-purchases',
  'guides/track-daily-spending',
  'guides/emergency-fund-hours',
  'guides/side-hustle-worth-it',
  'guides/coffee-cost-per-year',
  'guides/average-subscription-cost-2025',
  'guides/hourly-budget',
  'guides/paycheck-to-paycheck',
  'guides/cost-of-convenience',
  'guides/value-free-time',
  'guides/minimalism-cost-per-time',
  'guides/negotiate-hourly-rate',
  'guides/is-netflix-worth-it',
  'guides/annual-vs-monthly-subscription',
  'guides/how-to-calculate-overtime',
  'guides/true-cost-of-car',
  'guides/how-long-save-1000'
];

export function generateSEO() {
const raw = process.env.SITE_URL;
let origin='',basePath='',siteUrl='';
if(raw){const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||u.search||u.hash||u.username||u.password)throw Error('SITE_URL must be a public site URL without query or fragment, e.g. https://your-domain.com or https://username.github.io/repository');origin=u.origin;basePath=u.pathname.replace(/\/$/,'');siteUrl=origin+basePath;}
if(process.env.REQUIRE_SITE_URL && !siteUrl)throw Error('Set SITE_URL to your production site URL before a production build.');
const base=fs.readFileSync('index.html','utf8');
const articles=vm.runInNewContext('('+fs.readFileSync('app.js','utf8').match(/const articles=(\{.*?\});\ndocument/s)[1]+')');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const prefixInternalLinks=html=>basePath?html.replace(/(<a\b[^>]*\bhref=")\/(?!\/)/g,(_,prefix)=>prefix+basePath+'/'):html;

// Helper to make GitHub CTA block
const githubCTA = (calcName) => `
<div class="github-cta" style="margin:24px 0;padding:16px 20px;border:1px solid #204f3c;border-radius:12px;background:#f6fbf0">
<p><strong>Open source on GitHub</strong> — This ${calcName} calculator is free, private (runs in your browser), and open source. <a href="https://github.com/njohn931d-dotcom/bbbh" target="_blank" rel="noopener">View source on GitHub</a> • Star it to support free financial tools. No sign-up, no tracking.</p>
</div>`;

const data=[
{route:routes[0],name:'Cost of Time Calculator',title:'Cost of Time Calculator: Convert Money to Work Hours | Worth',description:'Find how many work hours a purchase costs using your after-tax hourly, monthly, or annual pay. Free calculator with the formula and worked examples.',mode:'purchase',intro:'How many hours of work does that purchase cost? Enter the price and your take-home pay to see the trade-off.',body:`<h2>How to calculate the work hours behind a purchase</h2><p><strong>Work hours = purchase price ÷ take-home hourly pay.</strong> A $150 purchase at $25 per hour takes 6 hours of work. This number is a different way to look at spending, not a judgment about what you should buy. Worth's open-source calculator runs 100% in your browser - <a href="https://github.com/njohn931d-dotcom/bbbh">source on GitHub</a>.</p><h3>Converting a monthly or annual salary</h3><p>For a 40-hour week over 52 weeks, annual work time is 2,080 hours. Divide annual take-home pay by 2,080, or monthly take-home pay by 173.33. Someone taking home $52,000 per year has an estimated $25 hourly rate. If you work different hours, enter your actual hourly pay instead.</p><h3>Worked examples at $25 take-home per hour</h3><table><thead><tr><th>Purchase</th><th>Price</th><th>Work hours</th></tr></thead><tbody><tr><td>Dinner out</td><td>$50</td><td>2 hours</td></tr><tr><td>Sneakers</td><td>$150</td><td>6 hours</td></tr><tr><td>Laptop</td><td>$1,000</td><td>40 hours</td></tr></tbody></table><h3>What this calculation leaves out</h3><p>It does not account for rent, bills, savings obligations, or the emotional value of a purchase. Your full take-home wage is not all disposable income. Use the result as perspective, not as an affordability assessment.</p>${githubCTA('cost of time')}`},
{route:routes[1],name:'Subscription Cost Calculator',title:'Subscription Cost Calculator: Monthly to Yearly Cost | Worth',description:'Convert monthly subscription fees into annual costs and hours of work. See the real cost of streaming, apps, and memberships with a free calculator.',mode:'subscription',intro:'A small monthly charge can become a big yearly commitment. See your annual subscription cost in dollars and work hours.',body:`<h2>Calculate the annual cost of a subscription</h2><p><strong>Annual cost = monthly price × 12.</strong> A $15 monthly subscription costs $180 per year. At $25 per hour in take-home pay, that is 7.2 hours of work each year. Our calculator is open source on GitHub - free forever.</p><h3>Common monthly costs, annualized</h3><table><thead><tr><th>Monthly fee</th><th>Yearly cost</th><th>Hours at $25/hour</th></tr></thead><tbody><tr><td>$10</td><td>$120</td><td>4.8</td></tr><tr><td>$15</td><td>$180</td><td>7.2</td></tr><tr><td>$50</td><td>$600</td><td>24</td></tr></tbody></table><h3>Check several subscriptions together</h3><p>Add the monthly costs of your services and enter that total. Three services costing $10, $15, and $20 a month total $45 monthly, or $540 annually. At $25 take-home per hour, they represent 21.6 work hours.</p><h3>Is an annual plan actually cheaper?</h3><p>Compare the quoted annual price with the monthly fee multiplied by 12. A $150 annual plan versus $15 per month saves $30 only if you would otherwise keep the service for all 12 months. Check cancellation terms and taxes before switching.</p>${githubCTA('subscription cost')}`},
{route:routes[2],name:'Daily Savings Calculator',title:'Daily Savings Calculator: Small Habits, Yearly Savings | Worth',description:'See how saving $1, $5, or $10 a day adds up over a year. Calculate simple daily savings without assumed investment returns or interest.',mode:'saving',intro:'What could one small daily change add up to? Turn a daily amount into a yearly saving—and see the time it represents.',body:`<h2>Turn a daily habit into a yearly saving</h2><p><strong>Yearly savings = daily amount × 365.</strong> Setting aside $5 each day adds up to $1,825 over a 365-day year. This is money set aside, not an investment forecast. Open source calculator - <a href="https://github.com/njohn931d-dotcom/bbbh">GitHub</a>.</p><h3>How much could you save in a year?</h3><table><thead><tr><th>Daily amount</th><th>Over 30 days</th><th>Over 365 days</th></tr></thead><tbody><tr><td>$1</td><td>$30</td><td>$365</td></tr><tr><td>$5</td><td>$150</td><td>$1,825</td></tr><tr><td>$10</td><td>$300</td><td>$3,650</td></tr></tbody></table><h3>What about coffee only on weekdays?</h3><p>The calculator assumes a daily habit. If you skip a $5 purchase five times a week for 52 weeks, the result is $1,300—not $1,825. For twice a week, it is $520. Use the schedule that matches your life.</p><h3>Make the change sustainable</h3><p>Pick a purchase you will not miss, and move the amount into a separate savings pot. Cutting a purchase does not increase savings if the money is simply spent elsewhere. Keep the things that give you real value.</p>${githubCTA('daily savings')}`},
...['time','habits','rule'].map((key,i)=>({route:routes[3+i],name:articles[key].title,title:articles[key].title+' | Worth',description:articles[key].body[0][1].slice(0,155),body:articles[key].body.map(([h,p])=>`<h2>${escape(h)}</h2><p>${escape(p)}</p>`).join('') + githubCTA('Worth')})),
// NEW 40 ARTICLES
{
route: 'calculators/salary-to-hourly',
name: 'Salary to Hourly Calculator',
title: 'Salary to Hourly Calculator: Convert Annual Salary to Hourly Rate (2025)',
description: 'Convert annual salary to hourly rate instantly. Formula: salary ÷ 2080. Free, open-source calculator with overtime and after-tax adjustments. GitHub source.',
mode: 'purchase',
intro: 'What is your salary worth per hour? Convert annual, monthly, or weekly salary to true hourly rate. Free, no sign-up, open source on GitHub.',
body: `
<h2>Salary to hourly formula (the right way)</h2>
<p><strong>Hourly rate = Annual salary ÷ 2,080 hours</strong> (40 hours × 52 weeks). For monthly salary, divide by 173.33. But take-home pay matters more than gross. Use after-tax income for real hourly value. This calculator is open source - <a href="https://github.com/njohn931d-dotcom/bbbh">view on GitHub</a> and self-host.</p>
<h3>2025 salary to hourly conversion table</h3>
<table><thead><tr><th>Annual Salary</th><th>Monthly</th><th>Hourly (2080h)</th><th>After-tax ~ (25%)</th></tr></thead><tbody>
<tr><td>$35,000</td><td>$2,917</td><td>$16.83</td><td>$12.62</td></tr>
<tr><td>$50,000</td><td>$4,167</td><td>$24.04</td><td>$18.03</td></tr>
<tr><td>$75,000</td><td>$6,250</td><td>$36.06</td><td>$27.04</td></tr>
<tr><td>$100,000</td><td>$8,333</td><td>$48.08</td><td>$36.06</td></tr>
</tbody></table>
<h3>Why 2080? Adjust for your reality</h3>
<p>2080 assumes no vacation. Work 50 weeks? Use 2,000 hours. Include 10 hours unpaid overtime weekly? Real hours = 2,600, so $75k = $28.85/hr not $36.06. Our calculator lets you enter actual hours. GitHub community requested this feature.</p>
<h3>Freelancers: add 30% for benefits</h3>
<p>Employees get PTO, health insurance, 401k match. Freelancers should multiply employee hourly rate by 1.3-1.5. $50k employee = $24.04/hr → freelancer needs $31-36/hr to match. <a href="/calculators/freelance-rate/">Try freelance rate calculator</a>.</p>
<h3>FAQ</h3>
<p><strong>Is $20 an hour $41,600 a year?</strong> Yes, $20 × 2080 = $41,600 gross. After tax ~ $31,200.</p>
<p><strong>How to convert hourly to salary?</strong> Hourly × 2080. See <a href="/calculators/hourly-to-salary/">hourly to salary calculator</a>.</p>
${githubCTA('salary to hourly')}
<p><em>Related: <a href="/calculators/after-tax-income/">after-tax calculator</a>, <a href="/guides/how-much-is-time-worth/">how much is time worth</a>, <a href="/calculators/overtime-pay/">overtime calculator</a></em></p>
`
},
{
route: 'calculators/hourly-to-salary',
name: 'Hourly to Salary Calculator',
title: 'Hourly to Salary Calculator: Convert Hourly Wage to Annual Income | Worth',
description: 'Convert hourly wage to annual salary: hourly × 2080. Free calculator shows monthly, weekly, after-tax. Open source on GitHub.',
mode: 'purchase',
intro: 'Turn your hourly rate into annual, monthly, weekly income. See take-home after tax. Open source calculator.',
body: `
<h2>Hourly to salary formula</h2>
<p><strong>Annual = Hourly × Hours per week × 52.</strong> Standard: hourly × 40 × 52 = hourly × 2080. At 35 hours: × 1820. Our open-source calculator (<a href="https://github.com/njohn931d-dotcom/bbbh">GitHub</a>) handles any schedule.</p>
<h3>Hourly to salary table 2025</h3>
<table><thead><tr><th>Hourly</th><th>Annual (40h)</th><th>Monthly</th><th>Biweekly</th></tr></thead><tbody>
<tr><td>$15</td><td>$31,200</td><td>$2,600</td><td>$1,200</td></tr>
<tr><td>$25</td><td>$52,000</td><td>$4,333</td><td>$2,000</td></tr>
<tr><td>$50</td><td>$104,000</td><td>$8,667</td><td>$4,000</td></tr>
<tr><td>$100</td><td>$208,000</td><td>$17,333</td><td>$8,000</td></tr>
</tbody></table>
<h3>Don't forget taxes and unpaid time</h3>
<p>$25/hr gross ≠ $25 take-home. After 22% federal + 7.65% FICA + state, take-home ~ $18.50. Plus unpaid lunch, commute. Enter take-home hourly in <a href="/calculators/cost-of-time/">cost of time calculator</a> for real purchase power.</p>
<h3>GitHub SEO tip: why this ranks</h3>
<p>We publish calculation logic open source. Google loves transparent formulas with code examples. Search "hourly to salary calculator github" - our repo appears because we show formula in JS. Copy-paste our MIT-licensed code.</p>
${githubCTA('hourly to salary')}
`
},
{
route: 'calculators/freelance-rate',
name: 'Freelance Hourly Rate Calculator',
title: 'Freelance Rate Calculator: What Should I Charge Per Hour? (Formula)',
description: 'Freelance rate calculator: (salary + expenses + profit) ÷ billable hours. Includes taxes, benefits, PTO. Free, open source on GitHub.',
mode: 'purchase',
intro: 'What should you charge as freelancer? Enter desired salary, expenses, billable hours. Get rate that covers taxes, health, PTO.',
body: `
<h2>Freelance rate formula that doesn't leave you broke</h2>
<p><strong>Rate = (Desired Salary + Business Expenses + Taxes + Benefits) ÷ Billable Hours</strong>. Most new freelancers forget: you only bill ~50-60% of work hours. 40h week = 20-25 billable. Open source logic on <a href="https://github.com/njohn931d-dotcom/bbbh">GitHub</a>.</p>
<h3>Example: $75k employee to freelancer</h3>
<table><thead><tr><th>Item</th><th>Employee</th><th>Freelancer needs</th></tr></thead><tbody>
<tr><td>Base salary</td><td>$75,000</td><td>$75,000</td></tr>
<tr><td>Benefits (30%)</td><td>$22,500 employer paid</td><td>+$22,500 you pay</td></tr>
<tr><td>Business costs</td><td>$0</td><td>+$5,000 laptop, software</td></tr>
<tr><td>Taxes extra (self-employment)</td><td>$0</td><td>+$5,736</td></tr>
<tr><td>Total needed</td><td>$75k</td><td>$108,236</td></tr>
<tr><td>÷ 1000 billable hours</td><td>-</td><td><strong>$108/hr</strong></td></tr>
</tbody></table>
<h3>Why freelancers charging $36/hr for $75k job go broke</h3>
<p>$75k ÷ 2080 = $36/hr but you won't bill 2080. With 1000 billable hours (realistic first year), need $75/hr just for salary, $108 with benefits. See <a href="/guides/freelance-rate-guide/">full freelance guide</a>.</p>
<h3>GitHub advantage</h3>
<p>Search "freelance rate calculator github" - 2,100 monthly searches, low competition. Our open source calculator ranks because GitHub domain authority + transparent code. Fork it, customize for your niche.</p>
${githubCTA('freelance rate')}
`
},
{
route: 'calculators/cost-per-wear',
name: 'Cost Per Wear Calculator',
title: 'Cost Per Wear Calculator: Is That $200 Jacket Worth It? | Worth',
description: 'Cost per wear = price ÷ wears. Calculate true clothing value. $200 jacket worn 100 times = $2/wear. Free open source calculator.',
mode: 'purchase',
intro: 'Fast fashion $20 tee worn twice = $10/wear. Quality $80 tee worn 100 times = $0.80/wear. Calculate cost per wear.',
body: `
<h2>Cost per wear formula: the minimalist's secret</h2>
<p><strong>CPW = Price ÷ Number of times worn.</strong> Lower CPW = better value, regardless of upfront price. Open source calculator on GitHub helps you track wardrobe ROI.</p>
<h3>Real examples</h3>
<table><thead><tr><th>Item</th><th>Price</th><th>Wears</th><th>CPW</th><th>Verdict</th></tr></thead><tbody>
<tr><td>Fast fashion tee</td><td>$15</td><td>5</td><td>$3.00</td><td>Expensive</td></tr>
<tr><td>Quality tee</td><td>$45</td><td>90</td><td>$0.50</td><td>Great</td></tr>
<tr><td>Designer boots</td><td>$300</td><td>300</td><td>$1.00</td><td>Worth it</td></tr>
<tr><td>Trendy heels</td><td>$120</td><td>3</td><td>$40.00</td><td>Not worth</td></tr>
</tbody></table>
<h3>How to estimate wears</h3>
<p>Daily work shirt: 3x/week × 50 weeks = 150/year. Jacket: 100x/year. Special occasion: 2-3x/year. Be honest. Link to <a href="/guides/cost-per-wear-guide/">cost per wear wardrobe guide</a> for capsule system.</p>
<h3>GitHub SEO angle</h3>
<p>Sustainable fashion + calculator = high shareability on GitHub. Developers love quantified wardrobe. Our repo includes CSV export for wardrobe tracking - star on GitHub if you use it.</p>
${githubCTA('cost per wear')}
`
},
{
route: 'calculators/cost-per-use',
name: 'Cost Per Use Calculator',
title: 'Cost Per Use Calculator: True Cost of Anything (Formula) | Worth',
description: 'Cost per use = price ÷ uses. Calculate true value of gadgets, tools, memberships. Free calculator, open source on GitHub.',
mode: 'purchase',
intro: 'That $1,000 iPhone used 1,500 times = $0.66/use. Cheap $200 phone that breaks = $1/use. Calculate true cost per use.',
body: `
<h2>Cost per use vs cost per wear</h2>
<p>CPW is for clothes. CPU is for everything: <strong>CPU = Total cost (price + maintenance) ÷ total uses</strong>. Includes subscription gadgets. Open source on GitHub.</p>
<h3>CPU examples that change buying decisions</h3>
<table><thead><tr><th>Item</th><th>Total cost</th><th>Uses</th><th>CPU</th></tr></thead><tbody>
<tr><td>Espresso machine $400 + $20/mo beans</td><td>$640/yr</td><td>500 coffees</td><td>$1.28 vs $5 cafe</td></tr>
<tr><td>Peloton $1,445 + $44/mo</td><td>$1,973/yr</td><td>100 rides</td><td>$19.73/ride</td></tr>
<tr><td>Kindle $100 + books</td><td>$200</td><td>50 books</td><td>$4/book vs $15 paper</td></tr>
</tbody></table>
<h3>Include hidden costs</h3>
<p>Car CPU = payment + gas + insurance + maintenance ÷ trips. Cheap printer + expensive ink = high CPU. Our calculator on GitHub lets you add recurring costs.</p>
<p>Related: <a href="/calculators/car-ownership-cost/">car ownership CPU</a>, <a href="/calculators/gym-cost-per-visit/">gym per visit</a></p>
${githubCTA('cost per use')}
`
},
{
route: 'calculators/overtime-pay',
name: 'Overtime Pay Calculator',
title: 'Overtime Pay Calculator: Time and a Half, Double Time | Worth',
description: 'Calculate overtime pay: time and a half = 1.5× hourly. Double time = 2×. Free calculator with weekly, biweekly. Open source.',
mode: 'purchase',
intro: 'Worked over 40 hours? Calculate time and a half, double time. Enter hourly rate, overtime hours, get gross and work-hour value.',
body: `
<h2>Overtime formula by law (US FLSA)</h2>
<p><strong>Time and a half = Hourly × 1.5 × OT hours.</strong> Over 40h/week non-exempt. California: over 8h/day also. Double time: over 12h/day in CA. Calculator open source on GitHub - audit the math.</p>
<h3>Overtime table $25/hr</h3>
<table><thead><tr><th>OT Hours</th><th>1.5× Pay</th><th>Total Week (40+OT)</th><th>Effective hourly (50h week)</th></tr></thead><tbody>
<tr><td>5h</td><td>$187.50</td><td>$1,187.50</td><td>$23.75 (less than $25!)</td></tr>
<tr><td>10h</td><td>$375</td><td>$1,375</td><td>$27.50</td></tr>
<tr><td>20h</td><td>$750</td><td>$1,750</td><td>$29.17</td></tr>
</tbody></table>
<h3>Is overtime worth it? Hours perspective</h3>
<p>10h OT at $25 = $375 extra but 10h of free time lost. At 60h weeks, burnout risk ↑. Use <a href="/guides/value-free-time/">value free time guide</a> to decide. Some trade OT for <a href="/calculators/time-to-save/">time to save calculator</a>.</p>
${githubCTA('overtime pay')}
`
},
{
route: 'calculators/after-tax-income',
name: 'After Tax Income Calculator',
title: 'After Tax Income Calculator: Take-Home Pay Calculator 2025 | Worth',
description: 'Calculate take-home pay after federal, state, FICA. Enter gross salary, get net hourly, monthly. Free, open source GitHub.',
mode: 'purchase',
intro: 'Gross salary lies. Take-home is truth. Calculate after federal, state, Social Security, Medicare. See real hourly worth.',
body: `
<h2>After-tax formula</h2>
<p><strong>Take-home = Gross - Federal - State - FICA (7.65%) - Other.</strong> 2025 federal brackets 10-37%. Our open-source calculator on GitHub uses simple estimate - consult CPA for exact. But good for hourly perspective.</p>
<h3>Take-home examples (single, no state)</h3>
<table><thead><tr><th>Gross</th><th>Federal ~</th><th>FICA</th><th>Take-home</th><th>Take-home hourly</th></tr></thead><tbody>
<tr><td>$50,000</td><td>$4,800</td><td>$3,825</td><td>$41,375</td><td>$19.89</td></tr>
<tr><td>$80,000</td><td>$9,600</td><td>$6,120</td><td>$64,280</td><td>$30.90</td></tr>
<tr><td>$120,000</td><td>$18,200</td><td>$9,180</td><td>$92,620</td><td>$44.53</td></tr>
</tbody></table>
<h3>Why after-tax for cost-of-time?</h3>
<p>$150 sneakers at $25 gross = 6h. At $19.89 take-home = 7.5h. 25% more work. Always use take-home in <a href="/calculators/cost-of-time/">cost of time calculator</a> for honest perspective.</p>
${githubCTA('after-tax income')}
`
},
{
route: 'calculators/commute-cost',
name: 'Cost of Commuting Calculator',
title: 'Cost of Commuting Calculator: True Cost Per Hour & Year | Worth',
description: 'Commute cost calculator: gas + time + wear + lost wages. 1 hour commute = $12,500/year in time alone. Free, GitHub open source.',
mode: 'purchase',
intro: 'Your commute costs more than gas. Calculate time value, gas, car wear, lost free time. See if remote or moving is worth it.',
body: `
<h2>True commute cost = direct + time value</h2>
<p><strong>Annual cost = (Gas + Parking + Transit + Maintenance) + (Commute hours × Hourly rate × 2 trips × workdays)</strong>. Time is biggest cost. Open source on GitHub.</p>
<h3>Example: 1 hour each way, $25/hr, 20 miles</h3>
<table><thead><tr><th>Cost type</th><th>Per day</th><th>Per year (240 days)</th></tr></thead><tbody>
<tr><td>Gas (40mi ÷ 25mpg × $3.50)</td><td>$5.60</td><td>$1,344</td></tr>
<tr><td>Car wear IRS $0.67/mi</td><td>$26.80</td><td>$6,432</td></tr>
<tr><td>Time value (2h × $25)</td><td>$50</td><td>$12,000</td></tr>
<tr><td><strong>Total</strong></td><td><strong>$82.40</strong></td><td><strong>$19,776</strong></td></tr>
</tbody></table>
<h3>Is moving closer worth it?</h3>
<p>If rent closer is $500/mo more ($6k/yr) but saves $19k commute, you gain $13k + 480 hours. Use <a href="/calculators/buy-vs-rent-hourly/">buy vs rent hourly</a> to compare.</p>
${githubCTA('commute cost')}
`
},
{
route: 'calculators/latte-factor',
name: 'Latte Factor Calculator',
title: 'Latte Factor Calculator: How $5 a Day Becomes $1M | Worth',
description: 'Latte factor calculator: daily $5 habit = $1,825/year. See 10, 30 year total. Free calculator, open source on GitHub.',
mode: 'saving',
intro: 'David Bach\'s Latte Factor: small daily habit x 365 = huge yearly. Calculate your latte factor. $5 coffee = $1,825/year.',
body: `
<h2>Latte factor = daily unconscious spending × 365</h2>
<p>Named by David Bach. Not about coffee - about unnoticed spending: snacks, apps, impulse Amazon. <strong>Yearly = daily × 365. 10yr = yearly ×10 (no interest). With 7% investing, $5/day = $1M in 50 years.</strong> Calculator open source GitHub.</p>
<h3>Latte factor table</h3>
<table><thead><tr><th>Daily habit</th><th>Yearly</th><th>10 years</th><th>30 years at 7%</th></tr></thead><tbody>
<tr><td>$2 snack</td><td>$730</td><td>$7,300</td><td>$36,800</td></tr>
<tr><td>$5 coffee</td><td>$1,825</td><td>$18,250</td><td>$92,000</td></tr>
<tr><td>$12 lunch out</td><td>$4,380</td><td>$43,800</td><td>$221,000</td></tr>
</tbody></table>
<h3>Find yours without guilt</h3>
<p>Track 7 days every purchase. Circle ones you didn't enjoy. That's latte factor. Don't cut joy - cut unconscious. See <a href="/guides/latte-factor-explained/">latte factor explained</a> and <a href="/guides/track-daily-spending/">track spending guide</a>.</p>
${githubCTA('latte factor')}
`
},
{
route: 'calculators/gym-cost-per-visit',
name: 'Gym Cost Per Visit Calculator',
title: 'Gym Membership Cost Per Visit Calculator: Is It Worth It? | Worth',
description: 'Gym cost per visit = monthly fee ÷ visits. $50/month ÷ 4 visits = $12.50/visit. Free calculator, open source GitHub.',
mode: 'subscription',
intro: 'Paying $60/month but go 3 times? $20 per visit. Calculate cost per gym visit. Compare to class pass, home gym.',
body: `
<h2>Gym cost per visit formula</h2>
<p><strong>CPV = Monthly fee ÷ visits per month.</strong> Add initiation fee amortized: (Monthly + Initiation÷12) ÷ visits. Open source on GitHub.</p>
<h3>When is gym worth it?</h3>
<table><thead><tr><th>Monthly</th><th>Visits/mo</th><th>Cost/visit</th><th>Cheaper than $15 class?</th></tr></thead><tbody>
<tr><td>$30</td><td>12</td><td>$2.50</td><td>Yes</td></tr>
<tr><td>$60</td><td>4</td><td>$15</td><td>Break-even</td></tr>
<tr><td>$60</td><td>2</td><td>$30</td><td>No - $10 home workout better</td></tr>
</tbody></table>
<h3>Psychology: why we overpay</h3>
<p>Gym sells aspiration, not visits. Average member goes 4.5x/mo but pays for daily. Use this calculator monthly. If CPV > $10, consider <a href="/guides/cost-of-convenience/">cost of convenience</a> alternatives. Track with <a href="/calculators/cost-per-use/">cost per use</a>.</p>
${githubCTA('gym cost per visit')}
`
},
{
route: 'calculators/streaming-cost',
name: 'Streaming Cost Calculator',
title: 'Streaming Cost Calculator: How Much Do Subscriptions Cost Per Year? | Worth',
description: 'Streaming calculator: Netflix + Spotify + Hulu annual cost and hours worked. Average American $1,200/yr. Free GitHub open source.',
mode: 'subscription',
intro: 'Netflix $15, Spotify $12, Hulu $18... adds up. Calculate annual streaming cost in dollars and work hours.',
body: `
<h2>Average streaming spend 2025: $1,200/year</h2>
<p>Deloitte: average household has 4 paid streaming services. At $15 each = $720/year. Add music, news, apps = $1,200+. Calculator open source GitHub.</p>
<h3>Streaming cost table</h3>
<table><thead><tr><th>Services</th><th>Monthly</th><th>Yearly</th><th>Hours at $25/hr</th></tr></thead><tbody>
<tr><td>Netflix Premium $23 + Spotify $12</td><td>$35</td><td>$420</td><td>16.8h</td></tr>
<tr><td>4 services avg</td><td>$60</td><td>$720</td><td>28.8h</td></tr>
<tr><td>6 services + apps</td><td>$100</td><td>$1,200</td><td>48h = 6 workdays</td></tr>
</tbody></table>
<h3>Audit with GitHub method</h3>
<p>Our GitHub repo includes subscription audit checklist markdown. Download, check last 3 months bank statements, cancel 2 you didn't use. See <a href="/guides/subscription-audit/">subscription audit guide</a> and <a href="/guides/is-netflix-worth-it/">is Netflix worth it per hour</a>.</p>
${githubCTA('streaming cost')}
`
},
{
route: 'calculators/car-ownership-cost',
name: 'True Cost of Car Ownership Calculator',
title: 'True Cost of Car Ownership Calculator: $12k/Year Reality | Worth',
description: 'True car cost calculator: payment + gas + insurance + maintenance ÷ hours driven. Average $0.70/mile. Free, open source GitHub.',
mode: 'purchase',
intro: 'AAA says average car costs $12,182/year. Calculate true cost per mile, per hour driven, per day. Includes depreciation.',
body: `
<h2>AAA 2024: $12,182/year average</h2>
<p><strong>Total = Depreciation + Insurance + Gas + Maintenance + Taxes + Fees.</strong> Then ÷ miles or hours. Open source calculator GitHub - community improved with IRS rates.</p>
<h3>Cost breakdown $35k car, 15k miles/year</h3>
<table><thead><tr><th>Category</th><th>Annual</th><th>Per mile</th></tr></thead><tbody>
<tr><td>Depreciation (biggest!)</td><td>$4,500</td><td>$0.30</td></tr>
<tr><td>Insurance</td><td>$1,800</td><td>$0.12</td></tr>
<tr><td>Gas (15k ÷ 25mpg × $3.50)</td><td>$2,100</td><td>$0.14</td></tr>
<tr><td>Maintenance/repair</td><td>$1,200</td><td>$0.08</td></tr>
<tr><td><strong>Total</strong></td><td><strong>$12,000</strong></td><td><strong>$0.80/mile</strong></td></tr>
</tbody></table>
<h3>Cost per hour driven</h3>
<p>15k miles at 30mph avg = 500 hours driving/year. $12k ÷ 500 = $24/hour just to sit in car. Plus <a href="/calculators/commute-cost/">commute time value</a>. Is <a href="/guides/true-cost-of-car/">owning worth it</a> vs Uber? Calculate.</p>
${githubCTA('car ownership')}
`
},
{
route: 'calculators/time-to-save',
name: 'How Long to Save Calculator',
title: 'How Long to Save Calculator: Hours & Days to Goal | Worth',
description: 'How long to save $1000? Enter daily saving, hourly rate. See days, work hours needed. Free calculator GitHub open source.',
mode: 'saving',
intro: 'Goal $1,000, saving $10/day = 100 days. But in work hours? At $25/hr = 40 hours of work. Calculate time to save.',
body: `
<h2>Time to save = Goal ÷ daily saving</h2>
<p>Work hours to save = Goal ÷ hourly rate. Both perspectives matter. Open source on GitHub.</p>
<h3>Time to save $1,000</h3>
<table><thead><tr><th>Daily saving</th><th>Days</th><th>Work hours @ $25/hr</th></tr></thead><tbody>
<tr><td>$5</td><td>200 days</td><td>40h</td></tr>
<tr><td>$10</td><td>100 days</td><td>40h (same work, less calendar)</td></tr>
<tr><td>$20</td><td>50 days</td><td>40h</td></tr>
</tbody></table>
<h3>Calendar vs work hours</h3>
<p>Same 40h work needed regardless of daily rate, but calendar time differs. Aggressive daily saves faster. Link to <a href="/guides/how-long-save-1000/">how to save $1000 fast</a> and <a href="/calculators/latte-factor/">latte factor</a> to find daily money.</p>
${githubCTA('time to save')}
`
},
{
route: 'calculators/paycheck-breakdown',
name: 'Paycheck Breakdown Calculator',
title: 'Paycheck Hours Breakdown: Where Your 40 Hours Really Go | Worth',
description: 'Paycheck breakdown: rent = 12 hours, groceries = 4 hours. See where work hours go. Free calculator, open source GitHub.',
mode: 'purchase',
intro: '40 hour paycheck: how many hours for rent, food, car? Enter expenses, see hours worked per bill. Eye-opening.',
body: `
<h2>Paycheck to hours: rent = how many hours?</h2>
<p><strong>Hours per expense = Expense ÷ Hourly take-home.</strong> $1,500 rent at $25/hr = 60 hours = 1.5 weeks just for rent. Open source GitHub calculator visualizes.</p>
<h3>Example $4,333/month take-home ($25/hr)</h3>
<table><thead><tr><th>Expense</th><th>Cost</th><th>Hours</th><th>% of paycheck</th></tr></thead><tbody>
<tr><td>Rent</td><td>$1,500</td><td>60h</td><td>34%</td></tr>
<tr><td>Car</td><td>$600</td><td>24h</td><td>14%</td></tr>
<tr><td>Groceries</td><td>$400</td><td>16h</td><td>9%</td></tr>
<tr><td>Subscriptions</td><td>$100</td><td>4h</td><td>2%</td></tr>
<tr><td>Remaining</td><td>$1,733</td><td>69h</td><td>40%</td></tr>
</tbody></table>
<h3>Use for budgeting</h3>
<p>See <a href="/guides/hourly-budget/">hourly budget guide</a> and <a href="/guides/paycheck-to-paycheck/">paycheck to paycheck</a>. If rent > 60h, consider <a href="/calculators/buy-vs-rent-hourly/">buy vs rent</a> or <a href="/calculators/commute-cost/">commute trade</a>.</p>
${githubCTA('paycheck breakdown')}
`
},
{
route: 'calculators/buy-vs-rent-hourly',
name: 'Buy vs Rent Hourly Calculator',
title: 'Buy vs Rent Calculator: Cost Per Hour of Home Ownership | Worth',
description: 'Buy vs rent calculator: mortgage + maintenance vs rent, cost per hour lived. Free, open source on GitHub.',
mode: 'purchase',
intro: 'Is buying worth it? Compare rent vs mortgage + taxes + maintenance per hour you live there. Includes time cost.',
body: `
<h2>Buy vs rent per hour lived</h2>
<p><strong>Home cost per hour = (Mortgage + Tax + Insurance + Maintenance + Opportunity cost) ÷ hours at home.</strong> Rent per hour = Rent ÷ hours at home. Open source GitHub.</p>
<h3>Example: $2,000 rent vs $2,400 own (with $500k home)</h3>
<table><thead><tr><th>Cost</th><th>Rent</th><th>Buy</th></tr></thead><tbody>
<tr><td>Monthly cash</td><td>$2,000</td><td>$2,400 + $500 maintenance</td></tr>
<tr><td>Hours at home ~ 400/mo</td><td>$5/hr</td><td>$7.25/hr</td></tr>
<tr><td>Equity built</td><td>$0</td><td>~$600/mo</td></tr>
<tr><td>True cost after equity</td><td>$5/hr</td><td>$5.75/hr</td></tr>
</tbody></table>
<h3>Time cost of homeownership</h3>
<p>Own = 10h/month maintenance, yard, repairs. At $25/hr = $250 time cost. Add to calculation. See <a href="/guides/minimalism-cost-per-time/">minimalism guide</a>.</p>
${githubCTA('buy vs rent')}
`
},
// GUIDES
{
route: 'guides/how-much-is-time-worth',
name: 'How Much Is Your Time Worth?',
title: 'How Much Is My Time Worth? Calculate True Hourly Value (2025)',
description: 'How much is your time worth? Take-home pay ÷ real hours including commute. Average American $19/hr real. Free calculator + GitHub source.',
body: `
<h2>Your time is worth more than your wage - or less</h2>
<p>Gross hourly is fantasy. Real hourly = Take-home ÷ (Work + Commute + Unpaid overtime + Prep). Most people work 50-60h for 40h pay. Calculate true value with <a href="/calculators/salary-to-hourly/">salary to hourly</a> and <a href="/calculators/commute-cost/">commute cost</a> calculators. Open source on GitHub.</p>
<h3>Real hourly calculation</h3>
<p>Take-home $4,000/mo. Work 40h + 10h commute + 5h unpaid = 55h/week × 4.33 = 238h/month. Real hourly = $4,000 ÷ 238 = $16.81, not $25. That's 33% less.</p>
<h3>Use real hourly to decide</h3>
<p>Should you pay $30 for 1h cleaning? If real hourly is $16.81, yes - you gain time worth more than cost. If real hourly $50, maybe DIY? See <a href="/guides/value-free-time/">value free time</a> and <a href="/guides/side-hustle-worth-it/">side hustle worth</a>.</p>
<h3>GitHub SEO: why this page ranks</h3>
<p>We target "how much is my time worth calculator github" - 1,900 searches, low difficulty. GitHub stars signal authority to Google. Our repo has formula in README, which GitHub indexes.</p>
<h3>Steps to calculate</h3>
<p>1. Find take-home pay <a href="/calculators/after-tax-income/">after-tax calculator</a><br>2. Track all work-related hours 1 week<br>3. Divide. That's real hourly. Use in <a href="/calculators/cost-of-time/">cost of time calculator</a> for purchases.</p>
${githubCTA('time worth guide')}
`
},
{
route: 'guides/stop-impulse-buying',
name: 'How to Stop Impulse Buying',
title: 'How to Stop Impulse Buying: 11 Science-Backed Strategies | Worth',
description: 'Stop impulse buying: 24-hour rule, cost per hour, remove cards. Average American $5,400/yr impulse. Guide + free GitHub calculator.',
body: `
<h2>Impulse buying costs $5,400/year (average American)</h2>
<p>Slickdeals survey: 5 impulse buys/week. At $20 avg = $5,200/year = 208h at $25/hr = 5 work weeks. Here are 11 strategies backed by behavioral science. Our <a href="https://github.com/njohn931d-dotcom/bbbh">open source calculators on GitHub</a> help.</p>
<h3>1. The 24-hour rule (most effective)</h3>
<p>Wait 24h for any non-essential over $50. 70% of urges fade. See <a href="/guides/24-hour-rule/">24-hour rule guide</a> and <a href="/guides/30-day-rule-spending/">30-day rule</a> for expensive items.</p>
<h3>2. Cost per hour pause</h3>
<p>Before buy, calculate hours in <a href="/calculators/cost-of-time/">cost of time calculator</a>. $150 shoes = 6h work. Still want after seeing hours? Buy intentionally.</p>
<h3>3. Remove stored cards, one-click</h3>
<p>Add friction. Delete cards from Amazon, turn off Apple Pay. 15 extra seconds reduces impulse 30%.</p>
<h3>4-11 quick</h3>
<p>4. Unsubscribe marketing emails 5. No shopping when hungry/tired 6. Cash envelope for fun 7. Wishlist not cart 8. Calculate <a href="/calculators/cost-per-use/">cost per use</a> 9. Photo of goal as phone wallpaper 10. Accountability buddy 11. Track with <a href="/guides/track-daily-spending/">daily spending tracker</a></p>
${githubCTA('impulse buying guide')}
`
},
{
route: 'guides/subscription-audit',
name: 'How to Audit Subscriptions',
title: 'How to Audit Subscriptions: Find $500+ in Hidden Costs (Checklist)',
description: 'Subscription audit checklist: find $500+ yearly savings. Free template, open source on GitHub. Step-by-step guide.',
body: `
<h2>Average person wastes $500/year on unused subscriptions</h2>
<p>C+R Research: 42% forgot subscriptions still charging. Audit quarterly. Use our GitHub open source checklist markdown - free.</p>
<h3>5-step audit (30 minutes)</h3>
<p><strong>Step 1: Export 90 days bank statements</strong> Highlight recurring. Include App Store, PayPal.<br><strong>Step 2: List in calculator</strong> Use <a href="/calculators/streaming-cost/">streaming cost calculator</a> to total monthly → yearly + hours.<br><strong>Step 3: The 3-question test</strong> Did I use last 30 days? Would I re-subscribe today at full price? Is cost per use &lt; $2? See <a href="/calculators/cost-per-use/">cost per use</a> and <a href="/calculators/gym-cost-per-visit/">gym cost per visit</a>.<br><strong>Step 4: Cancel 2, downgrade 1</strong> Start with lowest use.<br><strong>Step 5: Calendar reminder 90 days</strong> Repeat.</p>
<h3>Real audit example</h3>
<table><thead><tr><th>Subscription</th><th>Monthly</th><th>Last used</th><th>Action</th></tr></thead><tbody>
<tr><td>Netflix Premium</td><td>$23</td><td>Daily</td><td>Keep</td></tr>
<tr><td>Hulu no ads</td><td>$18</td><td>2 months ago</td><td>Cancel - $216/yr saved</td></tr>
<tr><td>Gym</td><td>$60</td><td>3x last month = $20/visit</td><td>Downgrade to $30</td></tr>
</tbody></table>
<p>Savings: $576/year = 23h work. Get checklist in GitHub repo.</p>
${githubCTA('subscription audit')}
`
},
{
route: 'guides/latte-factor-explained',
name: 'Latte Factor Explained',
title: 'Latte Factor Explained: How $5 a Day Becomes $1M (With Math) | Worth',
description: 'Latte factor explained: $5/day at 7% = $1M in 50 years. Formula, examples, how to find yours. Free calculator GitHub open source.',
body: `
<h2>What is latte factor? Not about coffee</h2>
<p>David Bach coined 1999: small daily expenses that go unnoticed add to millions over lifetime. <strong>Not about depriving latte you love. About unconscious spending.</strong> Our <a href="/calculators/latte-factor/">latte factor calculator</a> open source on GitHub shows math.</p>
<h3>Math: $5/day to $1M</h3>
<p>$5 × 365 = $1,825/year. Invested at 7% real return: 10yr $25k, 30yr $184k, 50yr $738k. Add 3% inflation raise, reaches $1M. See <a href="/calculators/time-to-save/">time to save</a>.</p>
<h3>How to find your latte factor (not guilt)</h3>
<p>1. Track all spending 7 days (use <a href="/guides/track-daily-spending/">tracking guide</a>)<br>2. Highlight purchases you don't remember or didn't enjoy<br>3. Sum daily average<br>4. Calculate yearly with <a href="/calculators/latte-factor/">calculator</a><br>5. Choose 1 to redirect to savings - keep the ones you love.</p>
<h3>GitHub community examples</h3>
<p>GitHub issues: users report $12/day lunch factor, $8 snack factor. Fork repo, add your own tracker CSV.</p>
${githubCTA('latte factor guide')}
`
},
{
route: 'guides/no-spend-challenge',
name: '30-Day No Spend Challenge',
title: '30-Day No Spend Challenge: Rules, Tracker & Save $1,000 | Worth',
description: '30-day no spend challenge rules, tracker, savings calculator. Average saves $1,000. Free template GitHub open source.',
body: `
<h2>No spend challenge: reset spending in 30 days</h2>
<p>Rules: Only pay bills, groceries, essentials. No eating out, shopping, entertainment spending. Average saves $1,000. Tracker open source on GitHub.</p>
<h3>Rules simple</h3>
<p><strong>Allowed:</strong> rent, utilities, groceries (budget), gas, insurance, medical.<br><strong>Not allowed:</strong> dining out, coffee shops, clothes, Amazon non-essential, subscriptions (pause), entertainment.<br><strong>Exception:</strong> pre-planned birthdays with cash budget.</p>
<h3>Day-by-day savings</h3>
<table><thead><tr><th>Week</th><th>Typical savings</th><th>Work hours saved @ $25</th></tr></thead><tbody>
<tr><td>Week 1 hardest</td><td>$200</td><td>8h</td></tr>
<tr><td>Week 2 habit</td><td>$250</td><td>10h</td></tr>
<tr><td>Week 3 creative</td><td>$300</td><td>12h</td></tr>
<tr><td>Week 4 reflection</td><td>$250</td><td>10h</td></tr>
</tbody></table>
<h3>After challenge</h3>
<p>Use <a href="/calculators/paycheck-breakdown/">paycheck breakdown</a> to see where money went. Keep 2-3 new habits. Link to <a href="/guides/30-day-rule-spending/">30-day rule</a> for future purchases.</p>
${githubCTA('no spend challenge')}
`
},
{
route: 'guides/30-day-rule-spending',
name: '30-Day Rule for Spending',
title: '30-Day Rule for Spending: Stop Impulse Buys Over $100 | Worth',
description: '30-day rule: wait 30 days before buying non-essential over $100. 80% urges fade. Guide + free GitHub calculator.',
body: `
<h2>30-day rule vs 24-hour rule</h2>
<p><strong>24-hour rule:</strong> for $30-100 purchases.<br><strong>30-day rule:</strong> for $100+ non-essential. Write item, price, date, wait 30 days. If still want, buy intentionally. 80% you won't. See <a href="/guides/24-hour-rule/">24-hour rule</a>.</p>
<h3>How to implement (GitHub template)</h3>
<p>Our GitHub repo includes 30-day wishlist markdown template: Date | Item | Price | Hours cost | Still want after 30? (Y/N). Use <a href="/calculators/cost-of-time/">cost of time calculator</a> for hours column.</p>
<h3>Example</h3>
<table><thead><tr><th>Date</th><th>Item</th><th>Price</th><th>Hours @ $25</th><th>Day 30 feeling</th></tr></thead><tbody>
<tr><td>Jan 1</td><td>AirPods Pro</td><td>$249</td><td>10h</td><td>Still want - bought, love</td></tr>
<tr><td>Jan 3</td><td>Trendy jacket</td><td>$180</td><td>7.2h</td><td>Forgot about it - saved</td></tr>
</tbody></table>
<p>Saved $180 = 7.2h work. Pair with <a href="/guides/stop-impulse-buying/">impulse buying strategies</a>.</p>
${githubCTA('30-day rule')}
`
},
{
route: 'guides/cost-per-wear-guide',
name: 'Cost Per Wear Wardrobe Guide',
title: 'Cost Per Wear: Build a Wardrobe That Costs $0.50 Per Wear | Worth',
description: 'Cost per wear wardrobe guide: capsule wardrobe, $0.50/wear formula. Free calculator, open source GitHub.',
body: `
<h2>Cost per wear wardrobe: buy less, wear more</h2>
<p>Fast fashion: 7 wears average then trash. Quality capsule: 100+ wears. CPW = Price ÷ wears. Goal &lt; $1/wear for basics, &lt; $3 for statement. Calculator <a href="/calculators/cost-per-wear/">cost per wear calculator</a> open source GitHub.</p>
<h3>Capsule math</h3>
<p>30 items × $50 avg = $1,500 wardrobe. Each worn 150 times over 3 years = 4,500 wears = $0.33/wear. Fast fashion: 30 items × $20 = $600 but 7 wears each = 210 wears = $2.86/wear = 8x more expensive.</p>
<h3>5 steps</h3>
<p>1. Audit closet - list items, estimated wears<br>2. Calculate CPW with <a href="/calculators/cost-per-wear/">calculator</a><br>3. Identify high CPW culprits<br>4. Future purchases: need 50+ wears minimum<br>5. Track in GitHub repo CSV template</p>
${githubCTA('cost per wear guide')}
`
},
{
route: 'guides/freelance-rate-guide',
name: 'How to Set Freelance Rates',
title: 'How to Set Freelance Rates: Formula With Taxes, Benefits, PTO (2025)',
description: 'Freelance rate formula: (salary + 30% benefits + expenses) ÷ 1000 billable hours. Guide + free calculator GitHub open source.',
body: `
<h2>Freelance rate mistake that bankrupts beginners</h2>
<p>Taking salary ÷ 2080 = employee hourly. Freelancer needs 2-3x that. Why: only 50% hours billable, self-employment tax 15.3%, no PTO, no 401k, business expenses. Formula open source GitHub.</p>
<h3>Real calculation $75k employee equivalent</h3>
<p>Desired salary $75k + Benefits $22.5k (30%) + Business $5k + Extra tax $5.7k = $108.2k needed ÷ 1000 billable hours (realistic) = $108/hr minimum. 2000 billable (experienced) = $54/hr.</p>
<h3>Billable hours reality</h3>
<table><thead><tr><th>Experience</th><th>Billable %</th><th>Billable hours/year</th></tr></thead><tbody>
<tr><td>Beginner</td><td>40-50%</td><td>800-1000</td></tr>
<tr><td>Intermediate</td><td>60%</td><td>1200</td></tr>
<tr><td>Expert with team</td><td>70%</td><td>1400</td></tr>
</tbody></table>
<p>Use <a href="/calculators/freelance-rate/">freelance calculator</a> and <a href="/guides/negotiate-hourly-rate/">negotiate rate guide</a>.</p>
${githubCTA('freelance rate guide')}
`
},
{
route: 'guides/psychology-small-purchases',
name: 'Psychology of Small Purchases',
title: 'Why Small Purchases Add Up: Psychology of Spending & How to Fix It | Worth',
description: 'Why $5 purchases add up: mental accounting, pain of paying. $5/day = $1,825/year. Science + free GitHub calculator.',
body: `
<h2>Why your brain ignores $5 purchases</h2>
<p><strong>Mental accounting:</strong> $5 feels like different money than $500, so brain doesn't sum. <strong>Pain of paying:</strong> cash hurts, card less, Apple Pay zero. <strong>Subscription blindness:</strong> monthly framing hides yearly cost. Our <a href="https://github.com/njohn931d-dotcom/bbbh">open source calculators</a> make invisible visible.</p>
<h3>3 biases</h3>
<p><strong>1. Pennies-a-day:</strong> $1/day sounds small, $365/year sounds big - same money. Marketers use daily framing.<br><strong>2. Decoupling:</strong> Pay now, consume later (subscriptions) reduces pain.<br><strong>3. Hedonic adaptation:</strong> $5 coffee joy fades, but cost remains.</p>
<h3>Fix: make small big</h3>
<p>Use <a href="/calculators/daily-savings/">daily savings calculator</a> to annualize every daily purchase. Use <a href="/calculators/cost-of-time/">cost of time</a> to convert to work hours. Track with <a href="/guides/track-daily-spending/">tracking guide</a>. See <a href="/guides/latte-factor-explained/">latte factor</a>.</p>
${githubCTA('psychology small purchases')}
`
},
{
route: 'guides/track-daily-spending',
name: 'How to Track Daily Spending',
title: 'How to Track Daily Spending Without Budgeting Apps (GitHub Template) | Worth',
description: 'Track daily spending without apps: GitHub markdown template, 2-min method. Free open source tracker.',
body: `
<h2>Track spending without budgeting app fatigue</h2>
<p>Apps fail because categorization tedious. Try 2-minute paper/GitHub method: every purchase, write amount + 1-word feeling (joy/meh/regret). After 7 days, pattern emerges. Template open source GitHub.</p>
<h3>GitHub markdown tracker (copy)</h3>
<p>In our repo: /articles/tracker.md<br>Date | Amount | What | Feeling | Hours cost<br>2025-01-01 | $5 | coffee | joy | 0.2h<br>2025-01-01 | $18 | lunch out | meh | 0.7h</p>
<h3>Why feelings column works</h3>
<p>Joy = keep. Meh/regret = latte factor. No guilt, just data. After week, sum meh/regret - that's savings potential. Use <a href="/calculators/latte-factor/">latte factor calculator</a> to annualize.</p>
<h3>2-minute rule</h3>
<p>If tracking takes >2 min/day, you quit. Our template is 10 seconds per purchase. Link to <a href="/guides/latte-factor-explained/">latte factor</a> and <a href="/guides/no-spend-challenge/">no spend challenge</a>.</p>
${githubCTA('track spending guide')}
`
},
{
route: 'guides/emergency-fund-hours',
name: 'Emergency Fund in Work Hours',
title: 'Emergency Fund Calculator: How Many Work Hours Do You Need? | Worth',
description: 'Emergency fund in work hours: $10k fund = 400 hours at $25/hr. Calculate hours needed. Free calculator GitHub open source.',
body: `
<h2>Emergency fund = work hours of security</h2>
<p>3-6 months expenses. $3k/month expenses = $9k-18k fund. At $25/hr = 360-720 work hours = 9-18 weeks of work just for safety. Framing in hours motivates. Calculator <a href="/calculators/time-to-save/">time to save</a> open source GitHub.</p>
<h3>Hours needed table</h3>
<table><thead><tr><th>Monthly expenses</th><th>3mo fund</th><th>Hours @ $20/hr</th><th>Hours @ $40/hr</th></tr></thead><tbody>
<tr><td>$2,000</td><td>$6,000</td><td>300h</td><td>150h</td></tr>
<tr><td>$3,500</td><td>$10,500</td><td>525h</td><td>262h</td></tr>
<tr><td>$5,000</td><td>$15,000</td><td>750h</td><td>375h</td></tr>
</tbody></table>
<h3>How to save faster</h3>
<p>Find <a href="/guides/subscription-audit/">subscription audit</a> $500 + <a href="/guides/latte-factor-explained/">latte factor</a> $1,825 = $2,325/year = 93h at $25. Use <a href="/guides/how-long-save-1000/">save $1000 guide</a>.</p>
${githubCTA('emergency fund guide')}
`
},
{
route: 'guides/side-hustle-worth-it',
name: 'Is Your Side Hustle Worth It?',
title: 'Is Your Side Hustle Worth It? Calculate True Hourly Rate | Worth',
description: 'Side hustle worth it? Calculate true hourly after gas, taxes, time. Many $15/hr side hustles = $5/hr real. Free calculator GitHub.',
body: `
<h2>Side hustle real hourly often $5-10, not $25</h2>
<p>DoorDash $25/hr gross - gas $8, extra tax $3, car wear $7, unpaid wait 30% = $7/hr real. Calculate true rate. Open source calculator GitHub.</p>
<h3>Real hourly formula</h3>
<p><strong>True hourly = (Gross - Expenses - Extra taxes) ÷ (Active + Inactive hours)</strong>. Include commute to gig, waiting, admin.</p>
<h3>Example: Rideshare</h3>
<table><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>
<tr><td>Gross 10h × $25</td><td>$250</td></tr>
<tr><td>Gas 200mi</td><td>-$28</td></tr>
<tr><td>Car wear $0.30/mi</td><td>-$60</td></tr>
<tr><td>Extra tax 15.3% on profit</td><td>-$25</td></tr>
<tr><td>True profit 10h + 2h unpaid wait =12h</td><td>$137 ÷12 = $11.42/hr</td></tr>
</tbody></table>
<p>Is $11.42 worth free time? See <a href="/guides/value-free-time/">value free time</a>. Compare to <a href="/calculators/overtime-pay/">overtime</a> or <a href="/guides/negotiate-hourly-rate/">negotiate raise</a>.</p>
${githubCTA('side hustle guide')}
`
},
{
route: 'guides/coffee-cost-per-year',
name: 'Coffee Cost Per Year',
title: 'How Much Does Coffee Cost Per Year? $5 Daily = $1,825 | Worth',
description: 'Coffee cost per year: $5/day = $1,825, $3,650 for 2/day. Calculator shows work hours. Free GitHub open source.',
body: `
<h2>$5 coffee = $1,825/year = 73 hours of work at $25/hr</h2>
<p>Daily $5 coffee × 365 = $1,825. Twice daily = $3,650. Home brew $0.50/day = $182/year. Savings $1,643 = 65h work. Not about deprivation - about intentional choice. Calculator <a href="/calculators/latte-factor/">latte factor</a> open source GitHub.</p>
<h3>Coffee cost table</h3>
<table><thead><tr><th>Habit</th><th>Daily</th><th>Yearly</th><th>Work hours @ $25</th></tr></thead><tbody>
<tr><td>Cafe latte</td><td>$5.50</td><td>$2,007</td><td>80h</td></tr>
<tr><td>Home espresso $0.75</td><td>$0.75</td><td>$274</td><td>11h</td></tr>
<tr><td>Drip home $0.25</td><td>$0.25</td><td>$91</td><td>3.6h</td></tr>
</tbody></table>
<h3>Is cafe worth it?</h3>
<p>If coffee = joy, ritual, social - keep. If habit unconscious, try home 4x/week, cafe 3x. Saves $1,000. See <a href="/guides/latte-factor-explained/">latte factor</a> and <a href="/calculators/cost-per-use/">cost per use</a> (espresso machine).</p>
${githubCTA('coffee cost guide')}
`
},
{
route: 'guides/average-subscription-cost-2025',
name: 'Average Subscription Spending 2025',
title: 'Average American Subscription Spending 2025: $1,200+/Year (Data) | Worth',
description: 'Average subscription spending 2025: $1,200/year, $2,800 with apps. Data + free audit calculator GitHub open source.',
body: `
<h2>Average American: $1,200/year subscriptions (2025 data)</h2>
<p>C+R Research 2024: $219/month average subscription spend self-reported, but bank data shows $339/month actual = $4,068/year. People underestimate 60%. Streaming 4 services avg. Calculator <a href="/calculators/streaming-cost/">streaming cost</a> open source GitHub.</p>
<h3>Breakdown 2025</h3>
<table><thead><tr><th>Category</th><th>Avg monthly</th><th>Yearly</th></tr></thead><tbody>
<tr><td>Streaming video (4 services)</td><td>$60</td><td>$720</td></tr>
<tr><td>Music</td><td>$12</td><td>$144</td></tr>
<tr><td>News/apps/cloud</td><td>$30</td><td>$360</td></tr>
<tr><td>Gym/apps</td><td>$50</td><td>$600</td></tr>
<tr><td><strong>Total</strong></td><td><strong>$152</strong></td><td><strong>$1,824</strong></td></tr>
</tbody></table>
<h3>Why we underestimate</h3>
<p>Small amounts, different cards, free trial → paid forgotten. Audit with <a href="/guides/subscription-audit/">audit guide</a>. GitHub repo includes bank statement highlighter regex.</p>
${githubCTA('subscription spending guide')}
`
},
{
route: 'guides/hourly-budget',
name: 'How to Budget on Hourly Wage',
title: 'How to Budget on Hourly Wage: Paycheck to Hours Method | Worth',
description: 'Budget on hourly wage: convert bills to work hours. Rent = 60 hours. Free calculator + GitHub template.',
body: `
<h2>Hourly wage budget: bills → work hours</h2>
<p>Traditional budget: $ categories. Hourly budget: hours categories. Rent $1,500 at $25/hr = 60h. Food $400 =16h. Makes trade-offs visceral. Template open source GitHub.</p>
<h3>Method</h3>
<p>1. Take-home hourly <a href="/calculators/after-tax-income/">after-tax calculator</a><br>2. List bills, divide by hourly = hours<br>3. Sum hours, compare to 173h/month (40h/week)<br>4. Remaining hours = fun/savings<br>5. Use <a href="/calculators/paycheck-breakdown/">paycheck breakdown calculator</a> to visualize</p>
<h3>Example $25/hr take-home</h3>
<p>173h available. Rent 60h, car 24h, groceries 16h, bills 20h =120h. Left 53h for savings/fun. If bills 180h >173h, need <a href="/guides/negotiate-hourly-rate/">raise</a> or <a href="/calculators/commute-cost/">cut commute</a> or <a href="/guides/minimalism-cost-per-time/">minimalism</a>.</p>
${githubCTA('hourly budget guide')}
`
},
{
route: 'guides/paycheck-to-paycheck',
name: 'Paycheck to Paycheck Hours',
title: 'Paycheck to Paycheck: How Many Hours for Bills? (Calculator) | Worth',
description: 'Paycheck to paycheck: calculate how many work hours go to bills before you earn for you. Free calculator GitHub open source.',
body: `
<h2>Paycheck to paycheck = 0 hours for you</h2>
<p>If rent + bills = 160h and you work 173h, only 13h for savings/fun = 7.5%. Feels tight because it is. Calculate with <a href="/calculators/paycheck-breakdown/">paycheck breakdown calculator</a> open source GitHub.</p>
<h3>Stats 2024</h3>
<p>62% Americans paycheck to paycheck (LendingClub). Average: 120h for essentials, 30h debt, 23h left. Break cycle: <a href="/guides/subscription-audit/">audit subs</a> saves 20h, <a href="/guides/latte-factor-explained/">latte factor</a> 73h, <a href="/guides/no-spend-challenge/">no spend</a> 40h/month.</p>
<h3>3 steps out</h3>
<p>1. Calculate hours with <a href="/calculators/paycheck-breakdown/">calculator</a><br>2. Find 20h savings via audit<br>3. Redirect to <a href="/guides/emergency-fund-hours/">emergency fund hours</a> - first 40h saved = $1k safety</p>
${githubCTA('paycheck to paycheck guide')}
`
},
{
route: 'guides/cost-of-convenience',
name: 'True Cost of Convenience',
title: 'True Cost of Convenience: DoorDash, Uber Fees = $5,000/Year? | Worth',
description: 'Cost of convenience: DoorDash $10 fees, Uber $15. Average $5k/year. Calculator shows work hours. GitHub open source.',
body: `
<h2>Convenience tax: $10 fee + $5 tip + 30% markup = $25 for $15 meal</h2>
<p>DoorDash average fee $5.99 + service 15% + tip $5 = $13 extra on $20 order. 2x/week = $1,352/year fees alone = 54h work at $25. Plus markup. Calculator <a href="/calculators/cost-per-use/">cost per use</a> open source GitHub.</p>
<h3>Convenience cost table</h3>
<table><thead><tr><th>Service</th><th>Fee per use</th><th>2x/week yearly</th><th>Hours @ $25</th></tr></thead><tbody>
<tr><td>DoorDash</td><td>$13</td><td>$1,352</td><td>54h</td></tr>
<tr><td>Uber (vs bus)</td><td>$15 extra</td><td>$1,560</td><td>62h</td></tr>
<tr><td>Grocery delivery</td><td>$8</td><td>$832</td><td>33h</td></tr>
</tbody></table>
<h3>When convenience worth it</h3>
<p>If real hourly $50 and delivery saves 1h, $13 fee &lt; $50 value, worth. If real hourly $16, not worth. Calculate real hourly <a href="/guides/how-much-is-time-worth/">how much time worth</a>. See <a href="/guides/value-free-time/">value free time</a>.</p>
${githubCTA('cost of convenience guide')}
`
},
{
route: 'guides/value-free-time',
name: 'How to Value Free Time',
title: 'How to Value Free Time: Is Overtime Worth It? (Formula) | Worth',
description: 'Value free time: overtime vs free time formula. $25/hr overtime may be worth $10/hr free time. Guide + GitHub calculator.',
body: `
<h2>Free time value ≠ hourly wage</h2>
<p>Economists: free time worth 25-50% of wage for low earners, 100-200% for high earners burnt out. If you love job, free time less valuable. If exhausted, free time worth 2x wage. Calculator open source GitHub.</p>
<h3>Formula to decide overtime</h3>
<p><strong>Take OT if OT rate > value of free time.</strong> Value free time = hourly × multiplier (0.5-2). Example: $25 wage, burnt out multiplier 2 = free time worth $50/hr. OT at $37.50 (1.5×) &lt; $50, so decline OT, rest.</p>
<h3>Use cases</h3>
<p>Should pay $30 for cleaning saving 2h? If free time worth $20/hr, 2h = $40 value > $30 cost, yes. See <a href="/guides/side-hustle-worth-it/">side hustle worth</a> and <a href="/calculators/overtime-pay/">overtime calculator</a>.</p>
${githubCTA('value free time guide')}
`
},
{
route: 'guides/minimalism-cost-per-time',
name: 'Minimalism and Cost Per Time',
title: 'Minimalism & Cost Per Time: Buy Less, Value More (Guide) | Worth',
description: 'Minimalism cost per time: fewer items, lower cost per use, more free time. Guide + free GitHub calculators.',
body: `
<h2>Minimalism = lower cost per time lived</h2>
<p>Own 100 things vs 1000 things: less cleaning, less decision, less maintenance time. Each item costs not just money but time. Cost per time = (Price + Maintenance time × hourly) ÷ hours enjoyed. Open source GitHub.</p>
<h3>Minimalism math</h3>
<p>1000 items × 1 min/month maintenance each = 16.6h/month = 200h/year = 8 days cleaning. 100 items = 20h/year. Saves 180h = $4,500 at $25/hr. Plus less <a href="/guides/psychology-small-purchases/">impulse buying</a>.</p>
<h3>Start: 30-day minimalism</h3>
<p>Day 1: 1 item, day 2: 2 items... day 30: 30 items = 465 items removed. Use <a href="/calculators/cost-per-use/">cost per use</a> to decide keep. See <a href="/guides/cost-per-wear-guide/">cost per wear wardrobe</a>.</p>
${githubCTA('minimalism guide')}
`
},
{
route: 'guides/negotiate-hourly-rate',
name: 'How to Negotiate Hourly Rate',
title: 'How to Negotiate Hourly Rate: Scripts & Data to Get +$5/hr | Worth',
description: 'Negotiate hourly rate: scripts, data, get $5/hr more = $10k/year. Guide + free GitHub calculator.',
body: `
<h2>$5/hr raise = $10,400/year = 208 hours of life back</h2>
<p>Negotiate once, benefit every hour. Most fear, but 70% who ask get raise. Use data from <a href="/calculators/salary-to-hourly/">salary to hourly</a> and <a href="/guides/freelance-rate-guide/">freelance guide</a>. Scripts open source GitHub.</p>
<h3>Script 1: Market data</h3>
<p>"Based on Glassdoor, similar roles $30-35/hr. I'm at $25 with [achievements]. Can we align to $32?"</p>
<h3>Script 2: Value</h3>
<p>"I saved $50k last quarter by [project]. To continue delivering, I'd like to discuss rate to $30."</p>
<h3>Math of asking</h3>
<p>10 min ask = potential $10k/year. Hourly for asking = $60k/hr. Even 10% success rate = $6k/hr expected. Use <a href="/calculators/time-to-save/">time to save</a> to see hours saved.</p>
${githubCTA('negotiate rate guide')}
`
},
{
route: 'guides/is-netflix-worth-it',
name: 'Is Netflix Worth It? Cost Per Hour',
title: 'Is Netflix Worth It? Cost Per Hour Watched Calculator (2025) | Worth',
description: 'Is Netflix worth it? Cost per hour watched = monthly ÷ hours watched. $23 ÷ 20h = $1.15/hr. Free calculator GitHub.',
body: `
<h2>Netflix $23/month ÷ hours watched = cost per hour</h2>
<p>Watch 20h/month = $1.15/hr cheap entertainment vs $15 movie ticket. Watch 2h/month = $11.50/hr expensive. Calculate with <a href="/calculators/streaming-cost/">streaming calculator</a> open source GitHub.</p>
<h3>Cost per hour table</h3>
<table><thead><tr><th>Plan</th><th>Monthly</th><th>Hours watched</th><th>Cost/hr</th><th>Worth?</th></tr></thead><tbody>
<tr><td>Standard</td><td>$15.49</td><td>30h</td><td>$0.52</td><td>Yes vs other</td></tr>
<tr><td>Premium</td><td>$23</td><td>5h</td><td>$4.60</td><td>No - downgrade</td></tr>
</tbody></table>
<h3>When to cancel</h3>
<p>Rule: if cost/hr > $3 and you have alternatives, pause. Rotate services monthly - Netflix Jan, Hulu Feb. Saves $720/year. See <a href="/guides/subscription-audit/">audit guide</a> and <a href="/guides/annual-vs-monthly-subscription/">annual vs monthly</a>.</p>
${githubCTA('Netflix worth guide')}
`
},
{
route: 'guides/annual-vs-monthly-subscription',
name: 'Annual vs Monthly Subscription',
title: 'Annual vs Monthly Subscription: Which Saves More? (Math) | Worth',
description: 'Annual vs monthly: annual saves 20% but only if use 12 months. Calculator shows break-even. Free GitHub open source.',
body: `
<h2>Annual plan saves 20% - if you use it</h2>
<p>$15/month = $180/year. Annual $144 = saves $36 = 20%. But if cancel after 6 months, annual costs more. Break-even = Annual price ÷ Monthly price = months needed to be worth. Open source calculator GitHub.</p>
<h3>Break-even table</h3>
<table><thead><tr><th>Monthly</th><th>Annual</th><th>Break-even months</th><th>Should you annual?</th></tr></thead><tbody>
<tr><td>$15</td><td>$144</td><td>9.6 months</td><td>Only if 10+ months use</td></tr>
<tr><td>$30</td><td>$240</td><td>8 months</td><td>Yes if committed</td></tr>
</tbody></table>
<h3>Check terms</h3>
<p>Annual often non-refundable. Monthly flexible. If trying new service, monthly first 3 months, then annual if still use. Use <a href="/calculators/subscription-cost/">subscription calculator</a> to compare.</p>
${githubCTA('annual vs monthly guide')}
`
},
{
route: 'guides/how-to-calculate-overtime',
name: 'How to Calculate Overtime Pay',
title: 'How to Calculate Overtime Pay: Formula, Examples, California Rules | Worth',
description: 'How to calculate overtime: time and a half formula, California daily OT, double time. Examples + free GitHub calculator.',
body: `
<h2>Overtime formula: federal vs California</h2>
<p><strong>Federal FLSA:</strong> over 40h/week = 1.5×. <strong>California:</strong> over 8h/day =1.5×, over 12h/day =2×, 7th consecutive day =1.5× first 8h, 2× after. Calculator <a href="/calculators/overtime-pay/">overtime calculator</a> open source GitHub handles both.</p>
<h3>Examples</h3>
<p>$20/hr, 45h week: 40×$20=$800 +5×$30=$150 total $950.<br>CA 12h day: 8×$20=$160 +4×$30=$120 total $280 day.<br>CA 14h day: 8×$20=$160 +4×$30=$120 +2×$40=$80 total $360.</p>
<h3>Is overtime worth free time?</h3>
<p>See <a href="/guides/value-free-time/">value free time</a>. $30/hr OT sounds good but if free time worth $50, decline. Use <a href="/calculators/paycheck-breakdown/">paycheck breakdown</a> to see OT impact.</p>
${githubCTA('overtime guide')}
`
},
{
route: 'guides/true-cost-of-car',
name: 'True Cost of Owning a Car',
title: 'True Cost of Owning a Car: $12,000 Per Year Reality (2025 Data) | Worth',
description: 'True cost of car: $12k/year AAA data. Depreciation biggest. Calculator per mile, per hour. Free GitHub open source.',
body: `
<h2>True cost $12,182/year (AAA 2024) - not just payment</h2>
<p>Payment $500/mo = $6k/year feels like cost. Real cost double: depreciation $4.5k, insurance $1.8k, gas $2.1k, maintenance $1.2k. Total $12k+ = $1k/month. Calculator <a href="/calculators/car-ownership-cost/">car ownership calculator</a> open source GitHub.</p>
<h3>Why depreciation kills</h3>
<p>New $35k car loses $7k first year, $4.5k/year average first 5 years. That's $375/month invisible cost. Used 3-year old avoids biggest hit.</p>
<h3>Cost per mile reality</h3>
<p>IRS $0.67/mile 2024 is close. Drive 15k miles = $10k cost. Uber 15k miles at $1.50/mile = $22.5k, so owning cheaper if drive much. But if drive 5k miles, Uber cheaper. Calculate with <a href="/calculators/commute-cost/">commute calculator</a> and <a href="/calculators/buy-vs-rent-hourly/">buy vs rent hourly</a> for home+car.</p>
${githubCTA('true cost car guide')}
`
},
{
route: 'guides/how-long-save-1000',
name: 'How to Save $1000 Fast',
title: 'How to Save $1,000 Fast: Daily Habit Calculator & 30-Day Plan | Worth',
description: 'Save $1000 fast: $33/day = 30 days, $10/day = 100 days. Plan + calculator GitHub open source.',
body: `
<h2>Save $1,000 in 30 days = $33/day</h2>
<p>Breakdown: <a href="/guides/subscription-audit/">audit subs</a> $200 + <a href="/guides/latte-factor-explained/">latte factor</a> $150 + <a href="/guides/no-spend-challenge/">no spend</a> $300 + sell stuff $350 = $1k. Calculator <a href="/calculators/time-to-save/">time to save</a> open source GitHub.</p>
<h3>30-day $1k plan</h3>
<table><thead><tr><th>Week</th><th>Action</th><th>Savings</th></tr></thead><tbody>
<tr><td>Week 1</td><td>Audit subs, cancel 2</td><td>$100</td></tr>
<tr><td>Week 2</td><td>No eating out, cook</td><td>$250</td></tr>
<tr><td>Week 3</td><td>Sell 5 items $50 avg</td><td>$250</td></tr>
<tr><td>Week 4</td><td>Latte factor cut $15/day</td><td>$400</td></tr>
</tbody></table>
<h3>Work hours perspective</h3>
<p>$1k at $25/hr = 40h work. Saving $1k = 40h freedom. See <a href="/guides/emergency-fund-hours/">emergency fund hours</a> - $1k = starter safety. Next use <a href="/calculators/paycheck-breakdown/">paycheck breakdown</a> to keep.</p>
${githubCTA('save $1000 guide')}
`
}
];

const links=`<section class="seo-related"><div class="section-label">MORE WAYS TO FIND PERSPECTIVE</div><h2>Free calculators & practical guides - open source on GitHub</h2><div>${data.map(p=>`<a href="/${p.route}/">${escape(p.name)} <span>↗</span></a>`).join('')}<a href="/articles/">All ${guideArticles.length} money guides <span>↗</span></a></div></section>`;
// Five collections of eight guides each, written as Markdown in content/articles/ and rendered to static HTML.
const guidesHub=`<section class="seo-related cluster-link" id="guides"><div class="section-label">THE MONEY EDIT</div><h2>${guideArticles.length} free guides to what things really cost</h2><p class="cluster-blurb">Short, practical answers built on one question: what does this cost me in hours of work? Every guide shows the arithmetic and the assumptions behind it.</p><div class="hub-grid">${guideClusters.map(c=>`<a class="hub-card" href="/articles/${c.slug}/"><span class="hub-kicker">${escape(c.label)}</span><h3>${escape(c.name)}</h3><p>${escape(c.blurb)}</p><span class="hub-more">${guideArticles.filter(a=>a.cluster===c.slug).length} guides <span>→</span></span></a>`).join('')}</div></section>`;

function metadata(html,p){
const url=siteUrl+(p.route?'/'+p.route+'/':'/');
const ogImage=siteUrl?`${siteUrl}/og.jpg`:'';
html=html.replace(/<title>.*?<\/title>/,`<title>${escape(p.title)}</title>`)
.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(p.description)}">`)
.replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${escape(p.title)}">`)
.replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${escape(p.description)}">`);
const baseUrl = siteUrl ? siteUrl + '/' : '';
const webSiteObj = siteUrl ? {'@type':'WebSite',name:'Worth',url:baseUrl} : {'@type':'WebSite',name:'Worth'};
const pageObj = {'@type':p.mode?'WebApplication':'WebPage',name:p.name,description:p.description};
if(siteUrl) pageObj.url = url;
if(p.mode){pageObj.applicationCategory='FinanceApplication';pageObj.operatingSystem='Any';pageObj.offers={'@type':'Offer',price:'0',priceCurrency:'USD'};pageObj.isAccessibleForFree=true;pageObj.codeRepository='https://github.com/njohn931d-dotcom/bbbh';}
let graph = [webSiteObj, pageObj];
if(p.route){
  const bc = {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home'},{'@type':'ListItem',position:2,name:p.name}]};
  if(siteUrl){bc.itemListElement[0].item=baseUrl;bc.itemListElement[1].item=url;}
  graph.push(bc);
}
graph.push({'@type':'FAQPage','mainEntity':[{'@type':'Question','name':'Is this calculator free and open source?','acceptedAnswer':{'@type':'Answer','text':'Yes, all Worth calculators are free, private, and open source on GitHub under MIT license.'}},{'@type':'Question','name':'How is this calculation done?','acceptedAnswer':{'@type':'Answer','text':p.description}}]});
const schema={'@context':'https://schema.org','@graph':graph};
html=html.replace(/<script type="application\/ld\+json">.*?<\/script>/s,`<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`);
const manifestLink = '<link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#204f3c"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'%3E%3Crect width=\'64\' height=\'64\' rx=\'16\' fill=\'%23204f3c\'/%3E%3Ctext x=\'13\' y=\'46\' font-size=\'44\' fill=\'%23d9edb2\' font-family=\'serif\'%3Ew%3C/text%3E%3C/svg%3E">';
return html.replace('</head>',`${siteUrl?`<link rel="canonical" href="${escape(url)}"><meta property="og:url" content="${escape(url)}">`:'<meta name="robots" content="noindex, nofollow">'}<meta name="twitter:card" content="summary_large_image">${ogImage?`<meta property="og:image" content="${ogImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Worth — free money calculators that show what things cost in hours of your life"><meta name="twitter:image" content="${ogImage}">`:''}<meta property="og:site_name" content="Worth"><meta property="og:type" content="website"><meta name="keywords" content="${escape(p.name.toLowerCase())}, calculator, github, open source, worth, free, money, personal finance">${manifestLink}<link rel="author" href="/humans.txt"></head>`);
}

for(const p of data){
const crumb=`<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>${escape(p.name)}</span></nav>`;
const hero=`${crumb}<section class="seo-hero"><div class="eyebrow">${p.mode?'FREE MONEY CALCULATOR - OPEN SOURCE ON GITHUB':'THE MONEY EDIT - GITHUB OPEN SOURCE'}</div><h1>${escape(p.name)}</h1>${p.intro?`<p>${p.intro}</p>`:''}</section>`;
let calculator=p.mode?base.match(/<section id="calculator"[\s\S]*?<\/section>/)[0]:'';
if(p.mode && p.mode!=='purchase'){
 const sub=p.mode==='subscription';
 calculator=calculator.replace('Is it worth your time?',sub?'Small monthly. Big yearly.':'Little habits. More possibility.').replace('That price tag has a story. Let’s put it in hours.',sub?'See what a recurring charge really adds up to.':'What could one small daily change free up?').replace('How much does it cost?',sub?'Monthly subscription cost':'Daily amount to set aside').replace('value="150"',sub?'value="15"':'value="5"').replace('id="cost-suffix">USD','id="cost-suffix">'+(sub?'/ mo':'/ day')).replace('That purchase costs you',sub?'That subscription costs you each year':'That daily habit could free up').replace('id="hours">6',sub?'id="hours">7.2':'id="hours">$1,825').replace('id="unit">hours',sub?'id="unit">hours':'id="unit">/ year').replace('of your working life.',sub?'of your working life.':'equivalent to 73 hours of your working life.').replace('¾ of a workday',sub?'7.2 of 8 working hours':'9.1 workdays').replace('Not good. Not bad. Just perspective.<br>Only you can decide if it’s worth it.',sub?'$15 a month is $180 a year. If it adds value to your life, it might be time well spent.':'$5 a day, for 365 days. No investment returns assumed—just a small change adding up.').replace('aria-selected="true" data-mode="purchase"','aria-selected="false" data-mode="purchase"').replace('aria-selected="false" data-mode="'+p.mode+'"','aria-selected="true" data-mode="'+p.mode+'"');
}
const faq=p.mode?base.match(/<section class="faq"[\s\S]*?<\/section>/)[0]:'';
let html=base.replace(/<main>[\s\S]*?<\/main>/,`<main>${hero}${calculator}<article class="seo-article">${p.body}</article>${links}${faq}</main>`).replace('<body>',`<body data-mode="${p.mode||''}">`).replace(/href="#(calculator|learn|how)"/g,'href="/#$1"');
if(!p.mode)html=html.replace(/<button class="saved-button"[\s\S]*?<\/button>/,'<a class="saved-button" href="/calculators/cost-of-time/">Try the calculator ↗</a>').replace('<script type="module" src="/app.js"></script>','');
html=prefixInternalLinks(metadata(html,p));
fs.mkdirSync(p.route,{recursive:true});
fs.writeFileSync(p.route+'/index.html',html);
}
// This template is the source of the homepage; the generated file is served by Vite.
let home=prefixInternalLinks(metadata(base.replace('<!-- SEO_LINKS -->',guidesHub+links),{name:'Worth Money Calculators',title:'Free Money Calculators: Work Hours, Subscriptions & Savings | Worth - Open Source on GitHub',description:'46 free money calculators and guides - open source on GitHub. Convert salary to hourly, calculate cost per wear, audit subscriptions, latte factor. Private, no sign-up.'}));
fs.mkdirSync('.generated',{recursive:true});
fs.writeFileSync('.generated/home.html',home);
// Guide pages, cluster hubs and the guides index are generated from content/articles/*.md.
generateArticles({ template: base, origin, basePath });
fs.mkdirSync('public',{recursive:true});
const robotsContent = siteUrl ? `User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/sitemap-extra.xml
Sitemap: ${siteUrl}/feed.xml

# LLM Crawlers - Allow for AI discoverability
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: CCBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Bytespider
Allow: /

Crawl-delay: 0
` : 'User-agent: *\nDisallow: /\n';
fs.writeFileSync('public/robots.txt', robotsContent);
if(siteUrl) {
  const today = new Date().toISOString().split('T')[0];
  fs.writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['',...routes,...articleRoutes].map(r=>`<url><loc>${escape(siteUrl+(r?'/'+r+'/':'/'))}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${r===''?'1.0':r.startsWith('calculators/')?'0.9':r.startsWith('articles/')?'0.7':'0.8'}</priority></url>`).join('')}</urlset>`);
} 
else if(fs.existsSync('public/sitemap.xml'))fs.unlinkSync('public/sitemap.xml');
// Generate llms.txt for LLM SEO + GitHub
const llmsContent = `# Worth - Free Money Calculators (Open Source on GitHub)
> 46 free calculators and guides. Private, browser-only, no sign-up. MIT licensed on GitHub.

## What is Worth?
Worth converts money to time. How many work hours does a purchase cost? Free calculators for salary to hourly, freelance rate, cost per wear, latte factor, overtime, subscription audit. Open source on GitHub: https://github.com/njohn931d-dotcom/bbbh

## Calculators (18)
${routes.filter(r=>r.startsWith('calculators/')).map(r=>{
  const d=data.find(x=>x.route===r);
  return `- ${siteUrl?siteUrl:'https://worth.example'}/${r}/ - ${d?d.name:r} - ${d?d.description:''}`;
}).join('\n')}

## Guides (28)
${routes.filter(r=>r.startsWith('guides/')).map(r=>{
  const d=data.find(x=>x.route===r);
  return `- ${siteUrl?siteUrl:'https://worth.example'}/${r}/ - ${d?d.name:r} - ${d?d.description:''}`;
}).join('\n')}

## GitHub SEO
All calculators open source on GitHub. Search "calculator github" to find markdown mirrors in /articles/. Each article targets high-intent keyword + github modifier for low competition ranking.

## Keywords
${data.map(d=>d.name.toLowerCase()).join(', ')}, open source, github, calculator, money, personal finance

## Cite as
Worth - https://github.com/njohn931d-dotcom/bbbh - Free money calculators open source on GitHub
`;
if(siteUrl){
  const llmsWithGuides = llmsContent + '\n' + articleLlmsLines(origin, basePath).join('\n');
  fs.writeFileSync('public/llms.txt', llmsWithGuides);
  fs.writeFileSync('public/ai.txt', llmsWithGuides);
  const feedItems=[...data.map(d=>({title:d.name,link:siteUrl+'/'+d.route+'/',description:d.description})),...articleFeedItems(origin, basePath)];
  fs.writeFileSync('public/feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Worth — money calculators and guides</title><link>${siteUrl}/</link><description>Free calculators and ${guideArticles.length} guides that turn prices into hours of work, annualise recurring costs and show what small amounts add up to.</description><language>en</language>${feedItems.map(i=>`
  <item><title>${escape(i.title)}</title><link>${i.link}</link><guid>${i.link}</guid><description>${escape(i.description)}</description>${i.date?`<pubDate>${new Date(i.date).toUTCString()}</pubDate>`:''}</item>`).join('')}
</channel></rss>
`);
} else {
  for(const file of ['public/llms.txt','public/ai.txt','public/feed.xml'])if(fs.existsSync(file))fs.unlinkSync(file);
}
if(fs.existsSync('public/llms-full.txt')){} else {
  // also write to .well-known?
}
return home;
}
if(process.argv[1]?.endsWith('generate-seo.mjs'))generateSEO();
