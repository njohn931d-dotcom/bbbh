# Worth + HOOKED

## Repository layout after merge

Both implementations and their Git histories are preserved. **Worth** remains the default root application. The remote **HOOKED** Next.js application lives independently in `hooked/`, with its original README, SEO audit, assets, and dependency lockfile. The apps are not served together or deployed to the same origin automatically.

To work on HOOKED:

```sh
npm --prefix hooked ci
npm run dev:hooked   # port 3000
npm run build:hooked
```

Its original documentation and marketing/SEO claims are preserved as received, not independently verified by the merge. Review its production configuration and dependency security before deploying.

## Worth

Responsive, static money calculators and practical guides. Purchase-to-work-hours calculator, subscription annualization, daily savings, browser-local saved thoughts, and shareable inputs.

## Development

```sh
npm install
npm run dev
npm test
npm run build
```

Development serves on port 5173. Default builds are **noindex** and robots-disallowed: do not deploy them as the public production site.

## Production launch

```sh
SITE_URL=https://YOUR-PRODUCTION-DOMAIN npm run build:production
```

Replace the example with the actual site origin (no subdirectory). This command refuses to build without a domain. Deploy `dist/` to a static host that serves directory `index.html` files. Configure HTTPS and redirect alternate hosts to the same canonical origin. Use actual 404 responses for missing pages, not a blanket SPA fallback.

With SITE_URL configured, the build emits indexable HTML, absolute canonical URLs, Open Graph URLs, robots.txt, and a seven-URL sitemap.xml. Never use the sandbox preview host as the production canonical domain.

### Before announcing the launch

- Verify production status codes, redirects, canonical tags, robots.txt, sitemap.xml, and mobile rendering.
- Verify ownership in Google Search Console and Bing Webmaster Tools; submit `/sitemap.xml` and inspect the main URLs. This requires the domain owner's access; it is not done automatically.
- Measure real deployed performance and Core Web Vitals. No Lighthouse score or ranking improvement is claimed.
- Develop and validate a content strategy using actual query/impression data. The starting search intents below are hypotheses, not measured keyword volumes.
- Consider consent-aware analytics if engagement measurement is needed; none is installed by default.

## Search architecture

All seven pages ship substantive HTML before JavaScript runs:

| Route | Starting intent |
| --- | --- |
| `/` | Free money calculators |
| `/calculators/cost-of-time/` | Convert purchase cost to work hours |
| `/calculators/subscription-cost/` | Monthly subscription to annual cost |
| `/calculators/daily-savings/` | Daily amount to yearly savings |
| `/guides/hourly-pay/` | Calculate take-home hourly pay |
| `/guides/small-purchases/` | Understand recurring small expenses |
| `/guides/24-hour-rule/` | Pause before impulse purchases |

Each page has a unique title and description, one H1, related-page links, and JSON-LD appropriate to its visible content. Detail pages include breadcrumbs; calculators include WebApplication data. Guides use WebPage data without fabricated authorship or review claims. No FAQ rich-result eligibility is assumed. Article bodies and formulas are crawlable without executing scripts.

`scripts/generate-seo.mjs` produces static route files and discovery metadata during Vite configuration. Generated routes, metadata, and build output are ignored in Git; their source generator is tracked. `index.html` is the homepage template. The Vite HTML transform applies generated homepage metadata and internal links.

## Privacy and assumptions

Calculations and saved thoughts run in the browser. Shared URL fragments contain entered numbers; the UI warns users before sharing. Google Fonts is the only external font service; system fallbacks are provided.

Pay conversions assume 2,080 hours per year. Subscriptions multiply monthly cost by 12; daily savings multiply by 365. No investment returns or inflation are assumed. These are perspective tools, not affordability assessments or financial advice.

## Verification

`npm test` runs six DOM/static tests covering calculator modes, saving/deduplication, shared-input restoration, validation, SEO metadata, canonical links, sitemap coverage, crawlable article sections, internal links, and preview/production indexing safeguards. A production build has also been checked using a reserved test origin; this does not mean the website is deployed.

Automated visual browser checks remain unverified because the Chromium download endpoint failed in the development environment. Search rankings, indexing, and traffic cannot be guaranteed.

## Merge validation

After separating the apps, all six Worth tests and both app production builds pass. `npm ci` for the preserved HOOKED dependency versions reports **one high and one critical vulnerability**. Those upstream dependency versions were not changed as part of this history-preserving merge; address them before deploying HOOKED.
