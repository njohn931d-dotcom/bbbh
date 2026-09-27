# SEO Strategy — Worth Guides on GitHub Pages

The sole goal of this system is search ranking (and AI-answer citation) for 40
personal-finance articles, hosted as a parasite-style site on GitHub's
`github.io` infrastructure, interlinked as a topical-authority cluster around
the Worth brand.

## 1. The host play (why GitHub)

- **GitHub Pages** serves `docs/` as static HTML at
  `https://njohn931d-dotcom.github.io/bbbh/`. Fast indexation, no hosting cost,
  HTTPS, custom 404, and the URL lives on a domain with enormous crawl history.
- **github.com counts too:** the repository itself is a second surface —
  keyword-optimized README, repository description, and up to 20 topics feed
  Google and LLM crawlers, and the repo About/README links to the live site.
  This is the classic GitHub parasite stack: *README ranks on github.com,
  Pages ranks on github.io, both funnel to the same content.*
- **No lock-in:** output is plain HTML with build-time relative links, so the
  same build works on a project page, a user page (`username.github.io`), a
  custom domain, or any other static host — canonical URLs just need a
  `SITE_URL` rebuild.

## 2. Topical architecture (the ranking core)

40 articles, 6 cluster (silo) pages, 1 hub — three link levels, every page
reachable from every other in ≤3 hops:

| Cluster | Articles | Intent targeted |
| --- | --- | --- |
| Budgeting (7) | 50/30/20, zero-based, envelopes, pay yourself first, cash stuffing, budget that sticks, weekly check-in | informational + method comparisons |
| Spending Psychology (7) | impulse buying, 30-day list, lifestyle creep, opportunity cost, sunk cost, retail therapy, buyer's remorse | question queries, PAA-box bait |
| Frugality & Challenges (8) | no-spend challenge, low-buy year, 52-week challenge, latte factor, subscription audit, spending freeze, one-in-one-out, frugal habits | challenge/list queries with strong seasonality |
| True Cost Math (7) | cost of time, coffee habit, eating out, small fees, phone upgrades, gym break-even, brand vs generic | comparison + calculator adjacent |
| Money Systems (6) | automate finances, sinking funds, money dates, 10/10/10, friction, savings goals | evergreen how-to |
| Bills & Savings (5) | electric bill, unit pricing, meal planning, negotiate bills, phone bill | high-intent practical queries |

Design principles behind the set:

- **Long-tail first.** Every title targets a specific query with winnable
  difficulty; the pillar-type queries (50/30/20, no-spend challenge) are
  supported by their cluster so the site competes as a *topical authority*, not
  as 40 disconnected pages.
- **Answer-first intros** (40–70 words containing the primary keyword) sized
  for featured snippets and AI Overview extraction.
- **FAQ section on every article** — 3–4 real questions in People-Also-Ask
  phrasing, rendered as crawlable HTML *and* `FAQPage` JSON-LD.
- **Freshness signal:** `datePublished`/`dateModified` in schema + `<lastmod>`
  in the sitemap; schedule quarterly content refreshes.
- **Google Search Console verification:** the `google-site-verification` meta
  tag is baked into the page template (constant in
  `scripts/build-articles.mjs`) so it ships with every build of the homepage —
  never remove it or verification lapses.

## 3. On-page mechanics (implemented in `scripts/build-articles.mjs`)

- Unique `<title>` (≤70 chars), meta description (≤165), single `<h1>`, semantic
  `h2`/`h3`, keyword in URL slug, first paragraph and eyebrow.
- `rel=canonical` per page == sitemap URL (no duplicate-content ambiguity).
- `index,follow,max-image-preview:large` robots meta; `404.html` is noindex.
- JSON-LD per page: `BlogPosting` + `FAQPage` (articles), `CollectionPage`
  (clusters), `WebSite` + `ItemList` (hub), `BreadcrumbList` (all inner pages).
- Open Graph + Twitter cards with a branded share image (`assets/og.png`).
- RSS (`feed.xml`, 20 latest), `robots.txt` with absolute sitemap pointer,
  `sitemap.xml` with `lastmod` on all 47 URLs, `.nojekyll` for raw serving.
- **`llms.txt`** — an AI-crawler-facing summary of the site with every article
  linked (generative engine optimization; ChatGPT/Perplexity/Perplexity-style
  crawlers read it).
- Mobile-first CSS, system fonts only (no render-blocking font request),
  crawlable HTML with zero JavaScript.

## 4. Internal-link graph (implemented in the builder)

- Hub → 40 articles + 6 clusters (the `ItemList` mirrors this for schema).
- Cluster → its members + sibling clusters.
- Article → hub + parent cluster (breadcrumb) + **3 deterministic related
  articles from its own cluster** + a "Keep reading" block.
- Result: every article has ≥5 internal inlinks, nothing orphaned, crawl
  verified end-to-end by `scripts/verify-seo.mjs` (broken-link crawler).

## 5. Indexing & distribution runbook (after go-live)

1. **Enable GitHub Pages:** Settings → Pages → Deploy from a branch →
   `main` (or your merge branch) → `/docs`. Confirm the site loads at
   `https://njohn931d-dotcom.github.io/bbbh/`.
2. **Rebuild canonicals if the URL differs:**
   `SITE_URL=https://your.host/path npm run articles && npm run articles:verify`.
3. **Google Search Console:** add the Pages property, submit
   `/sitemap.xml`, request indexing of the hub first, then 5–10 pillar URLs.
4. **Bing Webmaster Tools:** submit sitemap (Bing also feeds DuckDuckGo).
5. **IndexNow:** once live, `npm run articles:ping` (homepage) or
   `npm run articles:ping -- --all` (every sitemap URL). The key file
   `docs/<32-hex>.txt` is already deployed by the builder.
6. **GitHub surface:** repo About → homepage URL + description + topics;
   README → site link with keyword-rich anchors; cut a GitHub Release when
   publishing (releases are separately crawlable).
7. **Refresh quarterly:** re-verify, update `dateModified` on refreshed
   articles, re-ping IndexNow.

## 6. Deliberately NOT done (and why)

No hidden text, no cloaking, no fake authorship/credentials, no paid-link
schemes, no doorway pages, no scraped content. The 2024–2026 spam updates
penalize exactly those; what's built instead is fully renderable,
crawlable, schema-valid, genuinely useful content on a legitimately
indexable host — the "grey" part is only the *hosting choice and repo
optimization*, which GitHub explicitly permits for public content.

## Commands

```sh
npm run articles         # build docs/ from content/articles/*.md
npm run articles:verify  # full SEO + link-graph verification (must PASS)
npm run articles:ping    # IndexNow submit (after deploy)
```
