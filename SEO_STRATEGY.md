# Worth — traffic playbook (rewritten Sept 2026)

This replaces the earlier "GitHub DA 96/99 parasite" plan. That plan was built on a
premise that is wrong, and its footprint was actively hurting the site. What follows
is the order of operations that actually produces views for a static calculator site
on `njohn931d-dotcom.github.io/bbbh/`.

## 1. The premise that was wrong

**`github.io` is on the Public Suffix List.** Google, Ahrefs, Moz and every browser treat
`njohn931d-dotcom.github.io` as its own registrable domain, the same way they treat
`something.blogspot.com` or `user.wordpress.com`. It inherits **nothing** from
github.com's authority. Pages here start at DR 0 like any new domain. "DA 99 for 24h
ranking" was never going to happen, and printing it on every page told quality
classifiers exactly what the pages were.

What was on the pages before this rewrite, on 40 URLs at once:

- Title tags like `Trump Tariff Calculator 2026 Calculator 2026: Free Calculator [Free Tool] | Worth`
- Visible copy: "PARASITE SEO CLUSTER - GITHUB DA 99", "QDF freshness for 24h Google ranking"
- One cloned body for all 40 topics (a mortgage page, an OnlyFans page and a Taylor Swift
  page all said "Work hours = price ÷ hourly pay. At $35/hr, $100 = 2.8 hours")
- FAQ schema on every page: `Is this free? → Yes free open source`
- hreflang on every English page pointing at a Spanish *mortgage* guide as its translation
- `sameAs: wikipedia.org/wiki/Personal_finance` on the Organization
- Related links picked with `Math.random()` so every build shuffled the internal graph
- A shipped `sitemap-extra.xml` full of `https://worth.example/.../index.json`

That is the textbook doorway-page pattern, and it drags the 46 legitimate guides and 46
real calculators down with it. Fixed in this branch: every one of the 40 pages now has
its own title, description, intro, three sections, a data table with real numbers and
three real FAQs; hreflang is only emitted across the ten genuine translations of the
salary-to-hourly page; the footprint strings are gone from the site, the repo, the
README and humans.txt.

## 2. What ranks a site like this (in order of leverage)

### a. One thing nobody else has: "price in hours of work"
The cost-of-time angle is the only genuinely differentiated thing here. Nobody ranks a
"mortgage payment in hours of work" page because nobody has built one. Every page is
now framed that way. Keep doing that: do not build a 41st generic "mortgage calculator";
build "X in hours of work" pages for things people actually search with a price attached.

### b. Search Console before anything else
Verification tag is already in the template. After this deploys:
1. Submit `sitemap.xml`. Request indexing on the 10 highest-value URLs manually.
2. Wait 3–4 weeks. Export Performance → Pages. Anything with impressions and <1% CTR
   gets a title rewrite. Anything with zero impressions after 90 days gets merged or
   pruned. This is the only keyword tool you need at this stage.

### c. Links that are actually obtainable
A DR 0 site needs a few dozen real referring domains to rank for anything with volume.
Ranked by effort-to-value:
- **dev.to / Hashnode / Medium canonical reposts** of the 5 strongest guides, canonical
  pointing home (`DEVTO_BACKLINKS.md` already has the workflow; use it for the good
  guides, not the 40 extra pages).
- **Reddit answers with the calculator link** where someone literally asks the question
  ("how many hours of work is a $30k car"). r/personalfinance, r/povertyfinance,
  r/Frugal, r/financialindependence. One genuinely useful answer a day. No link drops.
- **Hacker News "Show HN"** for the open-source angle once the site is clean. One shot;
  make it count with the Musk/Bezos-vs-you page as the hook.
- **Product Hunt** launch. Same day as HN.
- **GitHub itself**: topics on the repo (`calculator`, `personal-finance`, `pwa`,
  `open-source`), a proper social preview image, and a Discussions tab. Stars are a
  signal for github.com search, not Google.
- **Wikipedia external links** for "cost of time"/"opportunity cost of consumption"
  style articles only if the page is genuinely a better reference. Editors revert
  self-promotion in hours; do not spam this.

### d. Custom domain (do this before the link push)
Every link built to `njohn931d-dotcom.github.io/bbbh/` is stranded on a domain you do
not own. Buy a short `.com`, point GitHub Pages at it, set `SITE_URL` in the workflow.
The build already supports origin-root deployment. Do this **before** step c.

### e. Freshness that is real
`lastmod` is now `monthly`, not `daily` on every URL. Daily lastmod on 133 static pages
that never change trains Google to ignore your sitemap dates. Update the 2026 price
tables when the numbers move (minimum wages in January, streaming prices when they
change, mortgage rates quarterly) and bump `dateModified` only on the pages you touched.

### f. Discover / social traffic
The pages with real volume potential outside search are the comparison pages
(Musk/Bezos hours, MrBeast per second, concert cost in hours). Each needs a real OG
image (1200×630, the number in big type) to travel on X/Threads/LinkedIn. That is the
highest-ROI creative work remaining.

## 3. Things not to do again

- No "DA", "parasite", "24h ranking", "QDF" language on any page or in any file a
  human or crawler can read.
- No hreflang between pages that are not translations of one another.
- No `Math.random()` in anything that emits HTML.
- No shipped sitemaps containing placeholder or non-HTML URLs.
- No FAQ schema whose answer is shorter than the question.
- No fake `sameAs` (Wikipedia, Forbes). `sameAs` is for *your* profiles.
- No adding pages to hit a round number. 133 URLs on a DR 0 domain is already more
  than Google will crawl attentively; quality per URL is the constraint, not count.

## 4. Where things live

| What | File |
| --- | --- |
| Content for the 40 extra pages | `scripts/parasite-content.mjs` (single source of truth) |
| Page generator for those 40 | `scripts/generate-parasite.mjs` |
| Core 46 calculators/guides | `scripts/generate-seo.mjs` |
| 40 Markdown guides | `content/articles/*.md` via `scripts/articles.mjs` |
| GitHub-facing mirrors (`docs/`) | `scripts/generate-github-mirrors.mjs` |
| hreflang cluster definition | `HOURLY_WAGE_CLUSTER` in `scripts/parasite-content.mjs` |
