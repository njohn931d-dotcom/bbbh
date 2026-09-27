# Content and keyword plan — 40 guides

Source of truth for the article set. Status: **live in `content/articles/`** (40 of 40 written, 46 routes generated).

## How targets were chosen

No keyword-volume tool was used, so **no search volumes are claimed anywhere in this repo**. Targets were selected on five criteria that do not require paid data:

1. **Clear single intent.** Each page answers one question, and the answer appears in the first two sentences.
2. **Computable content.** Every target can be answered with arithmetic the site already performs (price ÷ hourly pay, monthly × 12, daily × 365). That guarantees first-party tables rather than rewritten summaries.
3. **Long-tail specificity.** "$20 an hour is how much a year" and "car payment in hours of work" are narrower and less contested than "personal finance" or "how to save money".
4. **Clusterability.** Eight pages per cluster, each a distinct question, so internal links are semantically real rather than decorative.
5. **Existing topical relevance.** The site already ranks-relevant pages for cost-of-time, subscriptions and daily savings; the clusters extend those three tools.

Validate before scaling further: after deployment, open Search Console → Performance → Queries, keep pages with impressions and no clicks for title/description rewrites, and prune anything with zero impressions after 90 days. Do not add a 41st page on the strength of this document alone.

## Clusters

| Cluster | Route | Primary question | Pages | Calculator linked |
| --- | --- | --- | --- | --- |
| Money in hours | `/articles/work-hours/` | What does this cost in hours of work? | 8 | cost-of-time |
| Subscriptions | `/articles/subscriptions/` | What do recurring charges cost per year? | 8 | subscription |
| Saving habits | `/articles/saving-habits/` | What do small amounts add up to? | 8 | saving |
| Pay & rates | `/articles/pay-and-rates/` | How do hourly, annual and take-home convert? | 8 | cost-of-time |
| Spending decisions | `/articles/spending-decisions/` | How do I compare two bigger purchases? | 8 | cost-of-time |

## Page inventory

| # | Target query | Route | Cluster |
| --- | --- | --- | --- |
| 1 | what is an hour of your time worth | `/articles/work-hours/what-is-an-hour-of-your-time-worth/` | work-hours |
| 2 | how many hours of work is $1000 | `/articles/work-hours/how-many-hours-of-work-is-1000-dollars/` | work-hours |
| 3 | how many hours of work is a new phone | `/articles/work-hours/how-much-is-a-new-phone-in-work-hours/` | work-hours |
| 4 | coffee cost per year calculator | `/articles/work-hours/coffee-cost-per-year-calculator/` | work-hours |
| 5 | car payment in hours of work | `/articles/work-hours/how-many-hours-of-work-does-a-car-payment-cost/` | work-hours |
| 6 | vacation cost in work hours | `/articles/work-hours/vacation-cost-in-work-hours/` | work-hours |
| 7 | how many hours of work goes to rent | `/articles/work-hours/how-many-hours-of-work-goes-to-rent/` | work-hours |
| 8 | price to hours of work formula | `/articles/work-hours/price-to-hours-formula/` | work-hours |
| 9 | average monthly subscription spend | `/articles/subscriptions/average-monthly-subscription-spend/` | subscriptions |
| 10 | how to audit your subscriptions | `/articles/subscriptions/how-to-audit-your-subscriptions/` | subscriptions |
| 11 | annual vs monthly subscription | `/articles/subscriptions/annual-vs-monthly-subscription-plan/` | subscriptions |
| 12 | streaming service price comparison | `/articles/subscriptions/streaming-service-price-comparison/` | subscriptions |
| 13 | free trial turned into subscription | `/articles/subscriptions/free-trials-that-turn-into-subscriptions/` | subscriptions |
| 14 | how to cancel a subscription and get a refund | `/articles/subscriptions/how-to-cancel-a-subscription-and-get-a-refund/` | subscriptions |
| 15 | subscription price increase what to do | `/articles/subscriptions/subscription-price-increase-what-to-do/` | subscriptions |
| 16 | family plan vs individual subscription | `/articles/subscriptions/family-and-shared-plans-when-splitting-saves/` | subscriptions |
| 17 | $5 a day savings challenge | `/articles/saving-habits/five-dollars-a-day-savings-challenge/` | saving-habits |
| 18 | 52 week savings challenge | `/articles/saving-habits/52-week-savings-challenge/` | saving-habits |
| 19 | no spend challenge rules | `/articles/saving-habits/no-spend-challenge-rules/` | saving-habits |
| 20 | how much should i save each month | `/articles/saving-habits/how-much-should-i-save-each-month/` | saving-habits |
| 21 | sinking funds explained | `/articles/saving-habits/sinking-funds-explained/` | saving-habits |
| 22 | do round up savings apps work | `/articles/saving-habits/do-round-up-savings-apps-work/` | saving-habits |
| 23 | how to save $1000 fast | `/articles/saving-habits/how-to-save-1000-dollars-fast/` | saving-habits |
| 24 | how big should my emergency fund be | `/articles/saving-habits/how-big-should-my-emergency-fund-be/` | saving-habits |
| 25 | $20 an hour is how much a year | `/articles/pay-and-rates/20-dollars-an-hour-is-how-much-a-year/` | pay-and-rates |
| 26 | 60000 a year is how much an hour | `/articles/pay-and-rates/60000-a-year-is-how-much-an-hour/` | pay-and-rates |
| 27 | gross pay vs take home pay | `/articles/pay-and-rates/gross-pay-vs-take-home-pay/` | pay-and-rates |
| 28 | real hourly wage calculator | `/articles/pay-and-rates/your-real-hourly-wage/` | pay-and-rates |
| 29 | how to set a freelance day rate | `/articles/pay-and-rates/how-to-set-a-freelance-day-rate/` | pay-and-rates |
| 30 | how is overtime pay calculated | `/articles/pay-and-rates/how-overtime-pay-is-calculated/` | pay-and-rates |
| 31 | how many working hours in a year | `/articles/pay-and-rates/how-many-working-hours-in-a-year/` | pay-and-rates |
| 32 | budgeting on a biweekly paycheck | `/articles/pay-and-rates/budgeting-on-a-biweekly-paycheck/` | pay-and-rates |
| 33 | cost per use calculator | `/articles/spending-decisions/cost-per-use-how-to-compare-purchases/` | spending-decisions |
| 34 | how to stop impulse spending | `/articles/spending-decisions/why-you-impulse-spend-and-how-to-stop/` | spending-decisions |
| 35 | questions to ask before a big purchase | `/articles/spending-decisions/seven-questions-before-a-big-purchase/` | spending-decisions |
| 36 | true cost of car ownership | `/articles/spending-decisions/true-cost-of-car-ownership/` | spending-decisions |
| 37 | buy it nice or buy it twice | `/articles/spending-decisions/buy-it-nice-or-buy-it-twice/` | spending-decisions |
| 38 | lifestyle creep after a raise | `/articles/spending-decisions/lifestyle-creep-after-a-raise/` | spending-decisions |
| 39 | the latte factor | `/articles/spending-decisions/the-latte-factor-what-it-gets-right/` | spending-decisions |
| 40 | should you rent or buy | `/articles/spending-decisions/should-you-rent-or-buy/` | spending-decisions |

## On-page rules enforced by the build

Every article page ships (asserted in `tests/articles.test.cjs` and `tests/seo.test.cjs`):

- one `<h1>`, unique `<title>` (≤70 chars) and unique meta description (≤158 chars)
- self-referencing canonical and `og:url`, no `noindex` on production builds
- `Article` + `BreadcrumbList` JSON-LD describing visible content only (no FAQ rich-result claims, no fabricated authorship)
- a table of contents generated from H2s, at least two data blocks (table or list), and a stated methodology/assumptions block
- at least three internal links to sibling guides, plus a link to the matching calculator
- no orphan pages: each article is linked from its hub and at least one sibling page

## Freshness

Each article carries an `updated:` date in frontmatter, surfaced as visible text and `dateModified`-style metadata. Re-verify any page containing a price, a tax rate or a legal threshold at least every six months and bump the date. Pages that cannot be kept accurate (for example anything quoting a specific provider's live price) should be rewritten to teach the method instead — see `streaming-service-price-comparison.md`, which uses ranges and tells readers to verify.

## What is deliberately not done

- No doorway pages, no city/keyword variants of the same template.
- No scraped or spun content; every table is computed from the stated assumptions.
- No cloaking, no user-agent or referrer-based content switching.
- No paid or exchanged links, no private blog networks.
- No unverified statistics. Where an industry average would normally be quoted (average subscription spend, average car running costs), the page teaches readers to measure their own number and labels ranges as illustrative.

Rationale: Google's site reputation abuse and scaled content abuse policies target exactly the shortcut versions of these tactics, and enforcement has tightened through 2026 [3](https://bulkbase.ai/seo/understanding-googles-scaled-content-abuse-policy)[1](https://press.farm/google-spam-update-publishers/). Programmatic volume is safe when each page carries its own data and editorial accountability [2](https://www.nicodigital.com/digital-marketing/programmatic-seo-2026-playbook/).
