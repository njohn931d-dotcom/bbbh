# Worth — Free Money Calculators (Open Source on GitHub)

**Live:** https://worth.example | **GitHub:** This repo | **47 SEO pages** | **40 new articles targeting high-intent keywords**

> **SEO Goal:** Rank #1 for money calculator keywords using GitHub's DA 96 authority. Every calculator is MIT-licensed open source, private (browser-only), no sign-up.

## Why GitHub Ranks

GitHub has Domain Authority 96. Google trusts open-source code as E-E-A-T signal (Expertise). Strategy:

1. **Keyword + "github" modifier** - 40 articles target `calculator github` long-tails (1k-22k searches, low competition)
2. **Code = Trust** - Formula in JS, auditable, forkable
3. **Markdown indexed** - `/articles/*.md` files rank on `site:github.com`
4. **Backlink loop** - Live site ↔ GitHub repo ↔ Articles
5. **Stars = Social proof** - Star this repo to boost authority

## 40 SEO Articles (New) — Sole Goal to Rank

### Calculators Cluster (15) — High intent, tool queries

| # | Route | Target Keyword | Volume | Intent |
|---|-------|----------------|--------|--------|
| 1 | `/calculators/salary-to-hourly/` | salary to hourly calculator | 22k/mo | Convert salary to hourly |
| 2 | `/calculators/hourly-to-salary/` | hourly to salary calculator | 18k/mo | Hourly to annual |
| 3 | `/calculators/freelance-rate/` | freelance rate calculator | 8.1k | What to charge |
| 4 | `/calculators/cost-per-wear/` | cost per wear calculator | 3.6k | Is jacket worth it? |
| 5 | `/calculators/cost-per-use/` | cost per use calculator | 2.4k | True cost anything |
| 6 | `/calculators/overtime-pay/` | overtime pay calculator | 12k | Time and half |
| 7 | `/calculators/after-tax-income/` | after tax income calculator | 9.9k | Take-home pay |
| 8 | `/calculators/commute-cost/` | cost of commuting calculator | 2.9k | True commute cost |
| 9 | `/calculators/latte-factor/` | latte factor calculator | 4.4k | Daily habit yearly |
| 10 | `/calculators/gym-cost-per-visit/` | gym cost per visit | 1.6k | Is gym worth it? |
| 11 | `/calculators/streaming-cost/` | streaming cost calculator | 1.3k | Annual streaming |
| 12 | `/calculators/car-ownership-cost/` | true cost car ownership | 2.9k | $12k/yr reality |
| 13 | `/calculators/time-to-save/` | how long to save calculator | 1k | Days to goal |
| 14 | `/calculators/paycheck-breakdown/` | paycheck breakdown | 800 | Where hours go |
| 15 | `/calculators/buy-vs-rent-hourly/` | buy vs rent calculator | 6.6k | Cost per hour lived |

### Guides Cluster (25) — Informational, high volume

| # | Route | Target Keyword | Volume |
|---|-------|----------------|--------|
| 16 | `/guides/how-much-is-time-worth/` | how much is my time worth | 5.4k |
| 17 | `/guides/stop-impulse-buying/` | how to stop impulse buying | 4.4k |
| 18 | `/guides/subscription-audit/` | how to audit subscriptions | 1k |
| 19 | `/guides/latte-factor-explained/` | latte factor explained | 2.9k |
| 20 | `/guides/no-spend-challenge/` | no spend challenge | 6.6k |
| 21 | `/guides/30-day-rule-spending/` | 30 day rule spending | 1.6k |
| 22 | `/guides/cost-per-wear-guide/` | cost per wear wardrobe | 1.9k |
| 23 | `/guides/freelance-rate-guide/` | how to set freelance rates | 2.4k |
| 24 | `/guides/psychology-small-purchases/` | why small purchases add up | 1.3k |
| 25 | `/guides/track-daily-spending/` | how to track daily spending | 1.9k |
| 26 | `/guides/emergency-fund-hours/` | emergency fund calculator | 6.6k |
| 27 | `/guides/side-hustle-worth-it/` | is side hustle worth it | 2.4k |
| 28 | `/guides/coffee-cost-per-year/` | how much does coffee cost per year | 1.6k |
| 29 | `/guides/average-subscription-cost-2025/` | average subscription cost | 2.9k |
| 30 | `/guides/hourly-budget/` | how to budget hourly wage | 1.6k |
| 31 | `/guides/paycheck-to-paycheck/` | paycheck to paycheck calculator | 3.6k |
| 32 | `/guides/cost-of-convenience/` | cost of convenience | 1k |
| 33 | `/guides/value-free-time/` | how to value free time | 1.3k |
| 34 | `/guides/minimalism-cost-per-time/` | minimalism cost per time | 1k |
| 35 | `/guides/negotiate-hourly-rate/` | how to negotiate hourly rate | 2.4k |
| 36 | `/guides/is-netflix-worth-it/` | is netflix worth it | 8.1k |
| 37 | `/guides/annual-vs-monthly-subscription/` | annual vs monthly subscription | 1.3k |
| 38 | `/guides/how-to-calculate-overtime/` | how to calculate overtime | 12k |
| 39 | `/guides/true-cost-of-car/` | true cost of owning a car | 4.4k |
| 40 | `/guides/how-long-save-1000/` | how to save $1000 fast | 8.1k |

**Original 6:**
- `/calculators/cost-of-time/` - Convert purchase to work hours
- `/calculators/subscription-cost/` - Monthly to yearly
- `/calculators/daily-savings/` - Daily to yearly
- `/guides/hourly-pay/` - Calculate hourly pay
- `/guides/small-purchases/` - Small purchases add up
- `/guides/24-hour-rule/` - Pause before impulse

**Total: 47 URLs** (46 routes + home) in `public/sitemap.xml` when `SITE_URL` set.

### GitHub Markdown Mirrors

40 markdown files in `/articles/` mirror HTML for GitHub indexing:

```
articles/salary-to-hourly.md
articles/hourly-to-salary.md
... (40 total)
```

Each includes frontmatter, keyword, search volume, live URL, GitHub CTA, tables, internal links. Google indexes `site:github.com "salary to hourly calculator"` → finds markdown → follows link to live site.

## Repository layout after merge

Both implementations and their Git histories are preserved. **Worth** remains default root application. HOOKED Next.js app lives in `hooked/`.

```sh
npm --prefix hooked ci
npm run dev:hooked   # port 3000
```

## Development

```sh
npm install
npm run dev          # 5173
npm test             # 6 tests, 47 URLs
npm run build:production  # needs SITE_URL
```

Dev serves on 5173. Default builds are **noindex**. Production build requires domain:

```sh
SITE_URL=https://YOUR-DOMAIN npm run build:production
```

Generates 47 indexable HTML files, canonical URLs, OG, robots.txt, sitemap.xml with priorities.

## Search architecture (47 pages)

All pages ship substantive HTML before JS:

- Unique title (60 chars, keyword first) + description (155 chars)
- One H1, breadcrumbs, related links hub (47 links)
- JSON-LD: WebSite, WebApplication/WebPage, BreadcrumbList, FAQPage
- Calculator pages embed interactive tool (browser-only)
- Tables, FAQs, GitHub CTA ("View source on GitHub")
- Keywords meta includes "calculator, github, open source, worth"
- Internal linking: every page links to all 46 others (link equity)

Generator: `scripts/generate-seo.mjs` produces static route files. `scripts/generate-articles-md.mjs` produces markdown mirrors.

`index.html` is homepage template. Vite HTML transform applies generated homepage metadata and internal links.

## GitHub SEO Tactics Implemented

1. **README keyword stuffing (natural)** - Title includes "Free Money Calculators (Open Source on GitHub)", lists 40 keywords with volumes
2. **Topics** - Add via GitHub UI: `calculator`, `money`, `personal-finance`, `open-source`, `javascript`, `financial-calculator`, `hourly-rate`, `budget`, `github-pages`
3. **About section** - Website: https://worth.example, Description: "46 free money calculators, open source on GitHub. Salary to hourly, cost per wear, latte factor. Private, no sign-up."
4. **Markdown articles** - 40 files in `/articles/` indexed by GitHub search + Google `site:github.com`
5. **Code comments** - Formulas in `app.js` include keywords for GitHub code search
6. **Release tags** - Tag v1.0 with notes containing keywords
7. **Wiki disabled? Enable** - Add wiki page linking to calculators
8. **Sponsor button** - .github/FUNDING.yml for authority signal
9. **Social preview** - og.png with text "Free Calculators - Open Source"
10. **Backlink loop** - Every HTML page links to GitHub repo, README links to live site

See `SEO_STRATEGY.md` and `GITHUB_SEO.md` for full playbook.

## Privacy and assumptions

Calculations run in browser. Shared URL fragments contain numbers; UI warns before sharing. Google Fonts only external font. Pay conversions assume 2080h/year. Subscriptions ×12, daily ×365. No investment returns. Perspective tools, not financial advice.

## Verification

`npm test` runs 6 tests: calculator modes, saved thoughts, shared inputs, validation, SEO metadata (47 URLs unique titles/descriptions), canonical, sitemap, crawlable article, internal links, noindex guard.

Production build checked with reserved test origin.

## SEO Strategy Docs

- `SEO_STRATEGY.md` - 40-article ranking plan using GitHub DA 96
- `GITHUB_SEO.md` - GitHub-specific ranking tactics
- `articles/README.md` - Markdown hub for GitHub indexing
- `hooked/SEO_AUDIT.md` - Original audit preserved
