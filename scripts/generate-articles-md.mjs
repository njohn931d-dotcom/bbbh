import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The live origin every mirror links back to. Read from package.json
// "homepage" - the one place the deployed URL is declared - rather than a
// literal here, so a domain move is a single edit. Deliberately NOT read from
// SITE_URL: these files are committed, so their output must not depend on
// whatever happens to be exported in the shell that regenerated them.
const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'));
const SITE = String(pkg.homepage || '').replace(/\/+$/, '');
if (!/^https:\/\/[^/]+/.test(SITE) || /\.example\b/.test(SITE)) {
  throw new Error(`package.json "homepage" must be the live site URL (got ${JSON.stringify(pkg.homepage)}); the markdown mirrors link back to it.`);
}

// Same 40 articles data (simplified from generate-seo.mjs)
const articles = [
  {
    slug: 'salary-to-hourly',
    type: 'calculator',
    title: 'Salary to Hourly Calculator: Convert Annual Salary to Hourly Rate (2025)',
    keyword: 'salary to hourly calculator',
    description: 'Convert annual salary to hourly rate: salary ÷ 2080. Free, open-source, GitHub source. After-tax adjustments included.',
    searchVolume: '22,000/mo',
    body: `## Formula
Hourly = Annual ÷ 2080 (40h × 52w). Monthly ÷ 173.33. Real hourly = Take-home ÷ real hours (work + commute + unpaid).

## Table
| Salary | Hourly | After-tax (25%) |
|--------|--------|-----------------|
| $35k | $16.83 | $12.62 |
| $50k | $24.04 | $18.03 |
| $75k | $36.06 | $27.04 |
| $100k | $48.08 | $36.06 |

## Why 2080 is wrong for most
2080 assumes no vacation, no overtime. Real hours often 2300-2600. $75k at 2600h = $28.85/hr real, not $36. Freelancers need ×1.3 for benefits.

## GitHub SEO
Search "salary to hourly calculator github" - 1,800 searches, low competition. Our MIT-licensed JS ranks because GitHub DA 96. Fork: https://github.com/njohn931d-dotcom/bbbh

Live: ${SITE}/calculators/salary-to-hourly/
`
  },
  {
    slug: 'hourly-to-salary',
    type: 'calculator',
    title: 'Hourly to Salary Calculator: Convert Hourly Wage to Annual Income',
    keyword: 'hourly to salary calculator',
    description: 'Convert hourly to annual salary: hourly × 2080. Shows monthly, biweekly, after-tax. Open source GitHub.',
    searchVolume: '18,000/mo',
    body: `## Formula
Annual = Hourly × 40 × 52. At 35h: ×1820.

## Table
| Hourly | Annual | Monthly |
|--------|--------|---------|
| $15 | $31,200 | $2,600 |
| $25 | $52,000 | $4,333 |
| $50 | $104,000 | $8,667 |

## Take-home trap
$25/hr gross ≈ $18.50 take-home after tax. Use take-home in cost-of-time calculator for honest purchase power.

Live: ${SITE}/calculators/hourly-to-salary/
GitHub: https://github.com/njohn931d-dotcom/bbbh`
  },
  {
    slug: 'freelance-rate',
    type: 'calculator',
    title: 'Freelance Hourly Rate Calculator: What Should You Charge? Formula',
    keyword: 'freelance rate calculator',
    description: 'Freelance rate = (salary + expenses + taxes) ÷ billable hours. Includes benefits, PTO. Free, GitHub open source.',
    searchVolume: '8,100/mo',
    body: `## Formula that prevents bankruptcy
Rate = (Desired Salary + Benefits 30% + Business + Extra Tax) ÷ Billable Hours. Billable = 50% of work hours first year.

Example $75k employee → freelancer needs $108k ÷ 1000h = $108/hr minimum.

## GitHub angle
"freelance rate calculator github" = 1,200/mo, low KD. Code transparency = trust = rank.

Live: ${SITE}/calculators/freelance-rate/`
  },
  {
    slug: 'cost-per-wear',
    type: 'calculator',
    title: 'Cost Per Wear Calculator: Is That $200 Jacket Worth It?',
    keyword: 'cost per wear calculator',
    description: 'Cost per wear = price ÷ wears. $200 jacket × 100 wears = $2/wear. Free open source calculator.',
    searchVolume: '3,600/mo',
    body: `## Formula
CPW = Price ÷ Wears. Lower = better.

| Item | Price | Wears | CPW |
|------|-------|-------|-----|
| Fast fashion tee | $15 | 5 | $3.00 |
| Quality tee | $45 | 90 | $0.50 |
| Boots | $300 | 300 | $1.00 |

Goal < $1/wear basics. Sustainable fashion + calculator = high shareability on GitHub.

Live: ${SITE}/calculators/cost-per-wear/`
  },
  {
    slug: 'cost-per-use',
    type: 'calculator',
    title: 'Cost Per Use Calculator: True Cost of Anything',
    keyword: 'cost per use calculator',
    description: 'Cost per use = total cost ÷ uses. Gadgets, tools, memberships. Free, GitHub open source.',
    searchVolume: '2,400/mo',
    body: `## CPU vs CPW
CPU for everything: (Price + maintenance) ÷ uses.

- Espresso $400 + $20/mo beans ÷ 500 = $1.28 vs $5 cafe
- Peloton $1973/yr ÷ 100 rides = $19.73/ride
- Kindle $200 ÷ 50 books = $4/book

Live: ${SITE}/calculators/cost-per-use/`
  },
  {
    slug: 'overtime-pay',
    type: 'calculator',
    title: 'Overtime Pay Calculator: Time and a Half, Double Time',
    keyword: 'overtime calculator',
    description: 'Overtime pay: 1.5× hourly, double 2×. Free calculator weekly, biweekly. Open source.',
    searchVolume: '12,000/mo',
    body: `## FLSA
Time and a half = Hourly ×1.5 × OT hours over 40/week. CA: over 8h/day also 1.5×, over 12h 2×.

$25/hr, 10h OT = $375 extra but 10h free time lost. Effective hourly for 50h week = $27.50, not $37.50.

Live: ${SITE}/calculators/overtime-pay/`
  },
  {
    slug: 'after-tax-income',
    type: 'calculator',
    title: 'After Tax Income Calculator: Take-Home Pay 2025',
    keyword: 'after tax income calculator',
    description: 'Take-home pay after federal, state, FICA. Enter gross, get net hourly, monthly. Free GitHub.',
    searchVolume: '9,900/mo',
    body: `## Formula
Take-home = Gross - Federal - State - FICA 7.65%

$50k gross → $41,375 take-home → $19.89/hr real. Use take-home in cost-of-time for honest perspective.

Live: ${SITE}/calculators/after-tax-income/`
  },
  {
    slug: 'commute-cost',
    type: 'calculator',
    title: 'Cost of Commuting Calculator: True Cost Per Year',
    keyword: 'cost of commuting calculator',
    description: 'Commute cost: gas + time + wear. 1h commute = $12,500/year in time. Free GitHub open source.',
    searchVolume: '2,900/mo',
    body: `## True cost
Annual = (Gas + Parking + Maintenance) + (Commute hours × Hourly × 2 × workdays)

1h each way, $25/hr, 20mi = $82/day = $19,776/year. $500/mo more rent closer saves $13k + 480h.

Live: ${SITE}/calculators/commute-cost/`
  },
  {
    slug: 'latte-factor',
    type: 'calculator',
    title: 'Latte Factor Calculator: How $5 a Day Becomes $1M',
    keyword: 'latte factor calculator',
    description: 'Latte factor: $5/day = $1,825/year. 10, 30 year total. Free calculator GitHub.',
    searchVolume: '4,400/mo',
    body: `## David Bach concept
Yearly = Daily ×365. $5/day at 7% = $92k in 30yr, $738k 50yr.

| Daily | Yearly | 30yr at 7% |
|-------|--------|------------|
| $2 | $730 | $36,800 |
| $5 | $1,825 | $92,000 |
| $12 | $4,380 | $221,000 |

Find yours: track 7 days, circle meh purchases.

Live: ${SITE}/calculators/latte-factor/`
  },
  {
    slug: 'gym-cost-per-visit',
    type: 'calculator',
    title: 'Gym Cost Per Visit Calculator: Is Membership Worth It?',
    keyword: 'gym cost per visit calculator',
    description: 'Gym cost per visit = monthly ÷ visits. $50 ÷ 4 = $12.50/visit. Free GitHub.',
    searchVolume: '1,600/mo',
    body: `## CPV
Monthly ÷ visits. $30/mo ÷12 = $2.50/visit worth. $60 ÷2 = $30/visit not worth.

Avg member goes 4.5x/mo but pays for daily.

Live: ${SITE}/calculators/gym-cost-per-visit/`
  },
  {
    slug: 'streaming-cost',
    type: 'calculator',
    title: 'Streaming Cost Calculator: Annual Cost of Subscriptions',
    keyword: 'streaming cost calculator',
    description: 'Streaming: Netflix + Spotify annual cost and work hours. Avg $1,200/yr. Free GitHub.',
    searchVolume: '1,300/mo',
    body: `## 2025 avg $1,200/yr
Deloitte: 4 services avg. $15 each = $720/yr video + music $144 + apps $360 = $1,224.

4 services = 28.8h work at $25/hr.

Live: ${SITE}/calculators/streaming-cost/`
  },
  {
    slug: 'car-ownership-cost',
    type: 'calculator',
    title: 'True Cost of Car Ownership Calculator: $12k/Year',
    keyword: 'true cost of car ownership calculator',
    description: 'Car cost: payment + gas + insurance + maintenance ÷ hours. $0.70/mile avg. Free GitHub.',
    searchVolume: '2,900/mo',
    body: `## AAA $12,182/yr
Depreciation $4,500 + Insurance $1,800 + Gas $2,100 + Maintenance $1,200.

$12k ÷ 500h driving (15k miles @30mph) = $24/hr to sit in car.

Live: ${SITE}/calculators/car-ownership-cost/`
  },
  {
    slug: 'time-to-save',
    type: 'calculator',
    title: 'How Long to Save Calculator: Hours & Days to Goal',
    keyword: 'how long to save calculator',
    description: 'How long to save $1000? Daily saving, hourly rate. Days, work hours. Free GitHub.',
    searchVolume: '1,000/mo',
    body: `## Time to save
Goal ÷ daily = days. Goal ÷ hourly = work hours.

$1,000 goal: $5/day =200 days, $10/day=100 days. Work hours @ $25 =40h always.

Live: ${SITE}/calculators/time-to-save/`
  },
  {
    slug: 'paycheck-breakdown',
    type: 'calculator',
    title: 'Paycheck Hours Breakdown: Where Your Hours Go',
    keyword: 'paycheck breakdown calculator',
    description: 'Paycheck breakdown: rent =12h, groceries=4h. See where hours go. Free GitHub.',
    searchVolume: '800/mo',
    body: `## Hours per bill
Hours = Expense ÷ Hourly.

$4,333/mo take-home ($25/hr):
- Rent $1,500 =60h (34%)
- Car $600=24h
- Groceries $400=16h
- Left 69h fun/savings

If bills >173h (40h/week), need raise or cut.

Live: ${SITE}/calculators/paycheck-breakdown/`
  },
  {
    slug: 'buy-vs-rent-hourly',
    type: 'calculator',
    title: 'Buy vs Rent Calculator: Cost Per Hour of Ownership',
    keyword: 'buy vs rent calculator',
    description: 'Buy vs rent: mortgage + maintenance vs rent per hour lived. Free GitHub.',
    searchVolume: '6,600/mo',
    body: `## Per hour lived
Home cost/hr = (Mortgage+Tax+Insurance+Maintenance) ÷ hours at home.

$2,000 rent vs $2,900 own ($500k home): rent $5/hr, buy $7.25/hr minus $1.50 equity = $5.75/hr true.

Add 10h/mo maintenance time.

Live: ${SITE}/calculators/buy-vs-rent-hourly/`
  },
  // GUIDES
  {
    slug: 'how-much-is-time-worth',
    type: 'guide',
    title: 'How Much Is My Time Worth? Calculate True Hourly Value',
    keyword: 'how much is my time worth',
    description: 'Time worth = take-home ÷ real hours including commute. Avg American $19/hr real. Free calculator GitHub.',
    searchVolume: '5,400/mo',
    body: `## Real hourly
Take-home ÷ (Work + Commute + Unpaid OT + Prep).

$4k/mo take-home, 55h/week real (40+10 commute+5 unpaid) =238h/mo = $16.81/hr real, not $25.

## Use real hourly
Pay $30 for 1h cleaning? If real $16.81, yes - gain time worth more. If real $50, DIY.

GitHub SEO: target "how much is my time worth calculator github" 1,900/mo low difficulty. Stars = authority.

Live: ${SITE}/guides/how-much-is-time-worth/`
  },
  {
    slug: 'stop-impulse-buying',
    type: 'guide',
    title: 'How to Stop Impulse Buying: 11 Science-Backed Strategies',
    keyword: 'how to stop impulse buying',
    description: 'Stop impulse buying: 24-hour rule, cost per hour, remove cards. Avg $5,400/yr impulse. Guide + GitHub.',
    searchVolume: '4,400/mo',
    body: `## Costs $5,400/yr
Slickdeals: 5 impulse buys/week × $20 = $5,200/yr =208h at $25.

## Top 3
1. 24-hour rule for $50+ - 70% urges fade
2. Cost per hour pause - $150 shoes =6h work
3. Remove stored cards - 15s friction = -30% impulse

Live: ${SITE}/guides/stop-impulse-buying/`
  },
  {
    slug: 'subscription-audit',
    type: 'guide',
    title: 'How to Audit Subscriptions: Find $500+ in Hidden Costs',
    keyword: 'how to audit subscriptions',
    description: 'Subscription audit checklist: find $500+ yearly savings. Free template GitHub.',
    searchVolume: '1,000/mo',
    body: `## Avg wastes $500/yr unused
42% forgot subs still charging (C+R).

## 5-step audit 30min
1. Export 90d statements
2. List in streaming calculator → yearly + hours
3. 3-question test: used 30d? re-subscribe today? cost/use <$2?
4. Cancel 2, downgrade 1
5. Calendar 90d repeat

Live: ${SITE}/guides/subscription-audit/`
  },
  {
    slug: 'latte-factor-explained',
    type: 'guide',
    title: 'Latte Factor Explained: How $5 a Day Becomes $1M',
    keyword: 'latte factor explained',
    description: 'Latte factor: $5/day at 7% = $1M in 50yr. Formula, examples. Free calculator GitHub.',
    searchVolume: '2,900/mo',
    body: `## Not about coffee
Small daily unnoticed expenses → millions over lifetime. Not deprivation, about unconscious spending.

## Math
$5×365=$1,825/yr at 7%: 10yr $25k, 30yr $184k, 50yr $738k.

Find: track 7 days, highlight didn't enjoy, sum daily avg, annualize.

Live: ${SITE}/guides/latte-factor-explained/`
  },
  {
    slug: 'no-spend-challenge',
    type: 'guide',
    title: '30-Day No Spend Challenge: Rules, Tracker & Save $1,000',
    keyword: 'no spend challenge',
    description: '30-day no spend challenge rules, tracker, savings calculator. Avg saves $1k. Free GitHub.',
    searchVolume: '6,600/mo',
    body: `## Rules
Allowed: bills, groceries, gas, medical. Not allowed: dining out, shopping, entertainment.

## Savings
Week1 $200, W2 $250, W3 $300, W4 $250 = $1k =40h @ $25.

Live: ${SITE}/guides/no-spend-challenge/`
  },
  {
    slug: '30-day-rule-spending',
    type: 'guide',
    title: '30-Day Rule for Spending: Stop Impulse Buys Over $100',
    keyword: '30 day rule spending',
    description: '30-day rule: wait 30 days before buying non-essential over $100. 80% urges fade. Guide + GitHub.',
    searchVolume: '1,600/mo',
    body: `## 24h vs 30d
24h for $30-100, 30d for $100+ non-essential. Write item, price, date, wait. 80% you won't.

Template in GitHub repo: Date | Item | Price | Hours | Still want?

Live: ${SITE}/guides/30-day-rule-spending/`
  },
  {
    slug: 'cost-per-wear-guide',
    type: 'guide',
    title: 'Cost Per Wear: Build Wardrobe That Costs $0.50 Per Wear',
    keyword: 'cost per wear wardrobe',
    description: 'Cost per wear wardrobe guide: capsule, $0.50/wear formula. Free calculator GitHub.',
    searchVolume: '1,900/mo',
    body: `## Capsule math
30 items × $50 = $1,500 wardrobe ×150 wears over 3y =4,500 wears = $0.33/wear. Fast fashion 30×$20=$600 ×7 wears=210 wears=$2.86/wear 8x more.

Future purchases need 50+ wears min.

Live: ${SITE}/guides/cost-per-wear-guide/`
  },
  {
    slug: 'freelance-rate-guide',
    type: 'guide',
    title: 'How to Set Freelance Rates: Formula With Taxes, Benefits, PTO',
    keyword: 'how to set freelance rates',
    description: 'Freelance rate formula: (salary +30% benefits + expenses) ÷1000 billable hours. Guide + GitHub.',
    searchVolume: '2,400/mo',
    body: `## Mistake bankrupts beginners
Salary ÷2080 = employee hourly. Freelancer needs 2-3×.

$75k employee = $108k needed ÷1000 billable (realistic) = $108/hr min. 2000 billable expert = $54/hr.

Billable %: beginner 40-50% =800-1000h/yr, expert 70%=1400h.

Live: ${SITE}/guides/freelance-rate-guide/`
  },
  {
    slug: 'psychology-small-purchases',
    type: 'guide',
    title: 'Why Small Purchases Add Up: Psychology of Spending',
    keyword: 'why small purchases add up',
    description: 'Why $5 purchases add up: mental accounting, pain of paying. $5/day=$1,825/yr. Science + GitHub.',
    searchVolume: '1,300/mo',
    body: `## Brain ignores $5
Mental accounting: $5 feels different than $500, doesn't sum. Pain of paying: cash hurts, card less, Apple Pay zero. Subscription blindness: monthly hides yearly.

Fix: annualize every daily with daily savings calculator, convert to work hours with cost-of-time.

Live: ${SITE}/guides/psychology-small-purchases/`
  },
  {
    slug: 'track-daily-spending',
    type: 'guide',
    title: 'How to Track Daily Spending Without Budgeting Apps',
    keyword: 'how to track daily spending',
    description: 'Track daily spending without apps: GitHub markdown template, 2-min method. Free open source.',
    searchVolume: '1,900/mo',
    body: `## 2-min method
Every purchase: amount + 1-word feeling (joy/meh/regret). After 7 days pattern.

GitHub markdown tracker:
Date | Amount | What | Feeling | Hours
2025-01-01 | $5 | coffee | joy | 0.2h

Joy=keep, meh/regret=latte factor.

Live: ${SITE}/guides/track-daily-spending/`
  },
  {
    slug: 'emergency-fund-hours',
    type: 'guide',
    title: 'Emergency Fund Calculator: How Many Work Hours Do You Need?',
    keyword: 'emergency fund calculator',
    description: 'Emergency fund in work hours: $10k =400h at $25/hr. Calculate hours needed. Free GitHub.',
    searchVolume: '6,600/mo',
    body: `## Hours of security
3-6mo expenses. $3k/mo = $9k-18k =360-720h @ $25 =9-18 weeks work for safety.

Find $2,325/yr via sub audit $500 + latte $1,825 =93h @ $25.

Live: ${SITE}/guides/emergency-fund-hours/`
  },
  {
    slug: 'side-hustle-worth-it',
    type: 'guide',
    title: 'Is Your Side Hustle Worth It? Calculate True Hourly Rate',
    keyword: 'is side hustle worth it',
    description: 'Side hustle worth it? True hourly after gas, taxes, time. Many $15/hr = $5/hr real. Free GitHub.',
    searchVolume: '2,400/mo',
    body: `## Real hourly often $5-10
DoorDash $25 gross - gas $8 - tax $3 - wear $7 - 30% unpaid wait = $7/hr real.

Formula: (Gross - Expenses - Extra taxes) ÷ (Active + Inactive hours)

Include commute, waiting, admin. Compare to overtime or raise negotiation.

Live: ${SITE}/guides/side-hustle-worth-it/`
  },
  {
    slug: 'coffee-cost-per-year',
    type: 'guide',
    title: 'How Much Does Coffee Cost Per Year? $5 Daily = $1,825',
    keyword: 'how much does coffee cost per year',
    description: 'Coffee cost per year: $5/day=$1,825, $3,650 for 2/day. Work hours. Free GitHub.',
    searchVolume: '1,600/mo',
    body: `## $5 coffee = $1,825/yr =73h work @ $25
Twice daily = $3,650. Home brew $0.50/day=$182/yr savings $1,643=65h.

| Habit | Yearly | Hours @ $25 |
|-------|--------|-------------|
| Cafe $5.50 | $2,007 | 80h |
| Home espresso $0.75 | $274 | 11h |
| Drip $0.25 | $91 | 3.6h |

Keep if joy/ritual, cut if unconscious.

Live: ${SITE}/guides/coffee-cost-per-year/`
  },
  {
    slug: 'average-subscription-cost-2025',
    type: 'guide',
    title: 'Average American Subscription Spending 2025: $1,200+/Year',
    keyword: 'average subscription cost',
    description: 'Average subscription spending 2025: $1,200/yr, $2,800 with apps. Data + free audit calculator GitHub.',
    searchVolume: '2,900/mo',
    body: `## Avg $1,200/yr, bank data $4,068/yr
C+R 2024: self-reported $219/mo, actual $339/mo =60% underestimate.

Breakdown: video 4 services $60=$720, music $12=$144, news/apps $30=$360, gym $50=$600 total $1,824.

Why underestimate: small amounts, different cards, free→paid forgotten.

Live: ${SITE}/guides/average-subscription-cost-2025/`
  },
  {
    slug: 'hourly-budget',
    type: 'guide',
    title: 'How to Budget on Hourly Wage: Paycheck to Hours Method',
    keyword: 'how to budget on hourly wage',
    description: 'Budget on hourly wage: convert bills to work hours. Rent=60h. Free calculator + GitHub template.',
    searchVolume: '1,600/mo',
    body: `## Bills → work hours
Rent $1,500 @ $25=60h. Food $400=16h. Makes trade-offs visceral.

Method:
1. Take-home hourly via after-tax calc
2. Bills ÷ hourly = hours
3. Sum vs 173h/mo (40h/week)
4. Remaining = fun/savings

If bills 180h >173h, need raise or cut commute or minimalism.

Live: ${SITE}/guides/hourly-budget/`
  },
  {
    slug: 'paycheck-to-paycheck',
    type: 'guide',
    title: 'Paycheck to Paycheck: How Many Hours for Bills?',
    keyword: 'paycheck to paycheck calculator',
    description: 'Paycheck to paycheck: calculate how many work hours go to bills before you earn for you. Free GitHub.',
    searchVolume: '3,600/mo',
    body: `## 0 hours for you
If rent+bills=160h and work 173h, only 13h for savings/fun=7.5%.

62% Americans paycheck to paycheck 2024.

Break cycle: audit subs 20h + latte 73h + no spend 40h/mo.

Live: ${SITE}/guides/paycheck-to-paycheck/`
  },
  {
    slug: 'cost-of-convenience',
    type: 'guide',
    title: 'True Cost of Convenience: DoorDash, Uber Fees = $5,000/Year?',
    keyword: 'cost of convenience',
    description: 'Cost of convenience: DoorDash $10 fees, Uber $15. Avg $5k/yr. Work hours. GitHub.',
    searchVolume: '1,000/mo',
    body: `## Convenience tax
DoorDash $5.99 fee +15% service +$5 tip =$13 extra on $20 order. 2x/week=$1,352/yr fees=54h @ $25. Plus 30% markup.

| Service | Fee | 2x/week yr | Hours @ $25 |
|---------|-----|------------|-------------|
| DoorDash | $13 | $1,352 | 54h |
| Uber vs bus | $15 | $1,560 | 62h |

Worth if real hourly $50 and saves 1h, $13<$50 value.

Live: ${SITE}/guides/cost-of-convenience/`
  },
  {
    slug: 'value-free-time',
    type: 'guide',
    title: 'How to Value Free Time: Is Overtime Worth It? Formula',
    keyword: 'how to value free time',
    description: 'Value free time: overtime vs free time formula. $25/hr overtime may be worth $10/hr free time. Guide + GitHub.',
    searchVolume: '1,300/mo',
    body: `## Free time value ≠ wage
Economists: free time worth 25-50% wage low earners, 100-200% high earners burnt out.

Take OT if OT rate > value free time. Value = hourly × multiplier 0.5-2.

$25 wage burnt out multiplier 2 = free time $50/hr worth. OT $37.50 < $50, decline.

Live: ${SITE}/guides/value-free-time/`
  },
  {
    slug: 'minimalism-cost-per-time',
    type: 'guide',
    title: 'Minimalism & Cost Per Time: Buy Less, Value More',
    keyword: 'minimalism cost per time',
    description: 'Minimalism cost per time: fewer items, lower cost per use, more free time. Guide + GitHub calculators.',
    searchVolume: '1,000/mo',
    body: `## Cost per time
Own 100 vs 1000 things: less cleaning, decision, maintenance. Cost per time = (Price + Maintenance time × hourly) ÷ hours enjoyed.

1000 items ×1min/mo=16.6h/mo=200h/yr=8 days cleaning. 100 items=20h/yr saves 180h=$4,500 @ $25.

Start: 30-day minimalism day1 1 item, day2 2 items... day30 30 items =465 removed.

Live: ${SITE}/guides/minimalism-cost-per-time/`
  },
  {
    slug: 'negotiate-hourly-rate',
    type: 'guide',
    title: 'How to Negotiate Hourly Rate: Scripts & Data to Get +$5/hr',
    keyword: 'how to negotiate hourly rate',
    description: 'Negotiate hourly rate: scripts, data, get $5/hr more=$10k/yr. Guide + GitHub calculator.',
    searchVolume: '2,400/mo',
    body: `## $5/hr = $10,400/yr =208h life back
Negotiate once, benefit every hour. 70% who ask get raise.

Script market data: "Based on Glassdoor $30-35/hr, I'm at $25 with [achievements], can we align to $32?"

10min ask = potential $10k/yr hourly for asking = $60k/hr.

Live: ${SITE}/guides/negotiate-hourly-rate/`
  },
  {
    slug: 'is-netflix-worth-it',
    type: 'guide',
    title: 'Is Netflix Worth It? Cost Per Hour Watched Calculator (2025)',
    keyword: 'is netflix worth it',
    description: 'Is Netflix worth it? Cost per hour watched = monthly ÷ hours. $23 ÷20h=$1.15/hr. Free GitHub.',
    searchVolume: '8,100/mo',
    body: `## Cost per hour
Monthly ÷ hours watched.

20h/mo $23=$1.15/hr cheap vs $15 movie ticket. 2h/mo=$11.50/hr expensive.

| Plan | Monthly | Hours | Cost/hr |
|------|---------|-------|---------|
| Standard $15.49 | 30h | $0.52 | Yes |
| Premium $23 | 5h | $4.60 | No downgrade |

Rule: if cost/hr >$3 and alternatives, pause. Rotate monthly.

Live: ${SITE}/guides/is-netflix-worth-it/`
  },
  {
    slug: 'annual-vs-monthly-subscription',
    type: 'guide',
    title: 'Annual vs Monthly Subscription: Which Saves More? Math',
    keyword: 'annual vs monthly subscription',
    description: 'Annual vs monthly: annual saves 20% but only if use 12mo. Break-even calculator. Free GitHub.',
    searchVolume: '1,300/mo',
    body: `## Annual saves 20% if use
$15/mo=$180/yr annual $144 saves $36=20%. But if cancel after 6mo, annual costs more.

Break-even = Annual ÷ Monthly = months needed.

| Monthly | Annual | Break-even | Should annual? |
|---------|--------|------------|----------------|
| $15 | $144 | 9.6mo | Only if 10+ mo use |
| $30 | $240 | 8mo | Yes if committed |

Annual often non-refundable. Monthly first 3mo then annual if still use.

Live: ${SITE}/guides/annual-vs-monthly-subscription/`
  },
  {
    slug: 'how-to-calculate-overtime',
    type: 'guide',
    title: 'How to Calculate Overtime Pay: Formula, Examples, California Rules',
    keyword: 'how to calculate overtime',
    description: 'How to calculate overtime: time and a half formula, California daily OT, double time. Examples + GitHub.',
    searchVolume: '12,000/mo',
    body: `## Federal vs California
Federal: over 40h/week=1.5×. CA: over 8h/day=1.5×, over 12h=2×, 7th day=1.5× first 8h, 2× after.

Examples $20/hr:
- 45h week: 40×$20=$800 +5×$30=$150 total $950
- CA 12h day: 8×$20=$160 +4×$30=$120 total $280
- CA 14h day: $160+$120+2×$40=$80 total $360

Live: ${SITE}/guides/how-to-calculate-overtime/`
  },
  {
    slug: 'true-cost-of-car',
    type: 'guide',
    title: 'True Cost of Owning a Car: $12,000 Per Year Reality (2025 Data)',
    keyword: 'true cost of owning a car',
    description: 'True cost of car: $12k/year AAA data. Depreciation biggest. Calculator per mile, per hour. Free GitHub.',
    searchVolume: '4,400/mo',
    body: `## AAA $12,182/yr not just payment
Payment $500/mo=$6k/yr feels like cost, real double: depreciation $4.5k, insurance $1.8k, gas $2.1k, maintenance $1.2k = $12k+ = $1k/mo.

Depreciation kills: new $35k loses $7k first year, $4.5k/yr avg first 5y.

IRS $0.67/mile 2024 close. 15k miles=$10k cost. Uber 15k @ $1.50=$22.5k, owning cheaper if drive much, but 5k miles Uber cheaper.

Live: ${SITE}/guides/true-cost-of-car/`
  },
  {
    slug: 'how-long-save-1000',
    type: 'guide',
    title: 'How to Save $1,000 Fast: Daily Habit Calculator & 30-Day Plan',
    keyword: 'how to save $1000 fast',
    description: 'Save $1000 fast: $33/day=30 days, $10/day=100 days. Plan + calculator GitHub.',
    searchVolume: '8,100/mo',
    body: `## $1,000 in 30 days = $33/day
Audit subs $200 + latte $150 + no spend $300 + sell stuff $350 = $1k.

| Week | Action | Savings |
|------|--------|---------|
| W1 | Audit subs cancel 2 | $100 |
| W2 | No eating out cook | $250 |
| W3 | Sell 5 items $50 avg | $250 |
| W4 | Latte cut $15/day | $400 |

$1k @ $25/hr =40h work. Saving $1k =40h freedom.

Live: ${SITE}/guides/how-long-save-1000/`
  }
];

fs.mkdirSync('articles', {recursive:true});
for(const a of articles){
  const md = `---
title: "${a.title}"
description: "${a.description}"
keyword: "${a.keyword}"
search_volume: "${a.searchVolume}"
type: "${a.type}"
slug: "${a.slug}"
github: "https://github.com/njohn931d-dotcom/bbbh"
live_url: "${SITE}/${a.type === 'calculator' ? 'calculators' : 'guides'}/${a.slug}/"
date: "2025-01-15"
author: "Worth - Open Source on GitHub"
---

# ${a.title}

> **TL;DR:** ${a.description} Search volume: ${a.searchVolume}. Open source calculator on GitHub.

**GitHub SEO Strategy:** This article targets "${a.keyword}" (${a.searchVolume}) + "github" modifier. GitHub domain authority (DA 96) helps rank. Our MIT-licensed calculator code is indexed by Google when searching \`site:github.com ${a.keyword}\`.

**Live Calculator:** [${SITE}/${a.type === 'calculator' ? 'calculators' : 'guides'}/${a.slug}/](${SITE}/${a.type === 'calculator' ? 'calculators' : 'guides'}/${a.slug}/)

**Open Source:** [View source on GitHub](https://github.com/njohn931d-dotcom/bbbh) - Star us if useful! No tracking, runs in browser.

${a.body}

---

## GitHub SEO Checklist for This Article

- [x] Keyword in title, H1, first 100 words
- [x] Keyword + "calculator github" in content
- [x] Open source code snippet in repo (JS formula)
- [x] Internal links to 3+ other calculators
- [x] External link to GitHub repo (DA 96 backlink)
- [x] Table with data (Google loves tables)
- [x] FAQ schema (in HTML version)
- [x] Markdown version for github.com indexing
- [x] Live demo link

## Related Calculators (Internal Linking)

- [Cost of Time Calculator](${SITE}/calculators/cost-of-time/) - Convert purchases to work hours
- [Salary to Hourly](${SITE}/calculators/salary-to-hourly/) - Salary ÷ 2080
- [Subscription Cost](${SITE}/calculators/subscription-cost/) - Monthly ×12
- [Daily Savings](${SITE}/calculators/daily-savings/) - Daily ×365
- [All 46 calculators & guides](${SITE}/)

## Why GitHub Ranks

1. **Domain Authority 96** - github.com outranks most blogs
2. **Code = Trust** - Google E-E-A-T: open source formula = Expertise
3. **Stars = Social Proof** - 100+ stars signals authority
4. **Markdown Indexed** - This file is indexed when searching site:github.com
5. **Backlinks** - GitHub repo links to live site, live site links to GitHub = loop

---

*Worth is free, private (browser-only), open source on GitHub. MIT License. No sign-up, no tracking.*
`;

  fs.writeFileSync(`articles/${a.slug}.md`, md);
}

console.log(`Generated ${articles.length} markdown articles in /articles/`);
