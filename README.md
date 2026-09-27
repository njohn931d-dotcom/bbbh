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

## Content engine: 40 guides

Worth ships **40 hand-written guides** in five topical clusters, generated into static HTML at build time.

| Path | Contents |
| --- | --- |
| `content/articles/*.md` | 40 Markdown sources with front matter (tracked in Git) |
| `scripts/articles.mjs` | Front-matter parser, Markdown renderer, page/hub/index generator, RSS and llms.txt |
| `articles/` | Generated pages: index, 5 cluster hubs, 40 articles (ignored in Git) |
| `content/KEYWORD_PLAN.md` | Target queries, cluster map, on-page rules, freshness policy |
| `content/SYNDICATION.md` | Distribution playbook: legitimate syndication and what to avoid |

Clusters: **Money in hours**, **Subscriptions**, **Saving habits**, **Pay & rates**, **Spending decisions** — eight guides each at `/articles/<cluster>/<slug>/`, with hubs at `/articles/<cluster>/` and an index at `/articles/`.

Each guide answers its question in the first two sentences, then shows the arithmetic in tables computed from stated assumptions (take-home pay, 8-hour days, 2,080 hours a year). No volume figures are claimed: targets were chosen by intent specificity, computability and clusterability, not by paid keyword data. See `content/KEYWORD_PLAN.md`.

### Adding or editing a guide

```sh
cp content/articles/price-to-hours-formula.md content/articles/my-new-guide.md
# edit front matter (title, description ≤158 chars, slug, cluster, query, reading, updated) and body
npm run dev     # live at /articles/<cluster>/<slug>/
npm test        # validates metadata, uniqueness, internal links, orphans, canonicals
```

Supported Markdown: `##`/`###` headings (H2s become the on-page contents list), paragraphs, `-` and `1.` lists, pipe tables, `>` callouts, fenced code, plus `**bold**`, `*italic*`, `` `code` `` and `[link](/path/)`. Output is HTML-escaped and unsafe link schemes are stripped.

The build fails loudly on a missing field, a duplicate slug, an unknown cluster or an over-long description, and the test suite fails on thin pages, orphans, duplicate titles, or a missing table.

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

With SITE_URL configured, the build emits indexable HTML, absolute canonical URLs, Open Graph URLs, robots.txt, a 53-URL sitemap.xml (home, 3 calculators, 3 guides, guides index, 5 hubs, 40 articles), `feed.xml` and `llms.txt`. Never use the sandbox preview host as the production canonical domain.

### GitHub Pages

`.github/workflows/pages.yml` runs the tests and a production build on every push and pull request, then deploys `dist/` to GitHub Pages from `main`.

Before the first deploy, set a repository variable **`SITE_URL`** to your canonical origin (Settings → Secrets and variables → Actions → Variables), for example `https://www.your-domain.com`, and for a custom domain also set **`CNAME`** plus the required DNS records. Project Pages URLs such as `https://owner.github.io/repo/` are rejected, because the site emits root-absolute URLs. After deployment, submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

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

Every page has a unique title and description, one H1, a contents list on articles, related links, and JSON-LD describing only visible content. Article pages use `Article` + `BreadcrumbList`; calculators use `WebApplication`; hubs and the index use `CollectionPage`. Authorship is attributed to the organisation, not a fabricated individual, and no FAQ rich-result eligibility is claimed. Article bodies and formulas are crawlable without executing scripts.

`scripts/generate-seo.mjs` produces static route files and discovery metadata during Vite configuration and calls `scripts/articles.mjs` for the guide pages. Generated routes, metadata, and build output are ignored in Git; their source generator and Markdown sources are tracked. `index.html` is the homepage template. The Vite HTML transform applies generated homepage metadata and internal links.

## Privacy and assumptions

Calculations and saved thoughts run in the browser. Shared URL fragments contain entered numbers; the UI warns users before sharing. Google Fonts is the only external font service; system fallbacks are provided.

Pay conversions assume 2,080 hours per year. Subscriptions multiply monthly cost by 12; daily savings multiply by 365. No investment returns or inflation are assumed. These are perspective tools, not affordability assessments or financial advice.

## Verification

`npm test` runs ten DOM/static tests covering calculator modes, saving/deduplication, shared-input restoration, validation, SEO metadata, canonical links, sitemap coverage, crawlable article sections, internal links, preview/production indexing safeguards, Markdown rendering and escaping, content front-matter validation, orphan and hub-link coverage, and RSS/llms.txt output. A production build has also been checked using a reserved test origin; this does not mean the website is deployed.

Automated visual browser checks remain unverified because the Chromium download endpoint failed in the development environment. Search rankings, indexing, and traffic cannot be guaranteed.

## Merge validation

After separating the apps, all six Worth tests and both app production builds pass. `npm ci` for the preserved HOOKED dependency versions reports **one high and one critical vulnerability**. Those upstream dependency versions were not changed as part of this history-preserving merge; address them before deploying HOOKED.
