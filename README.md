# Worth — Free Money Calculators

**Live site:** <https://njohn931d-dotcom.github.io/bbbh/>

Worth is a static site of browser-based money calculators and practical guides. It publishes **133 indexable URLs**: the homepage, 86 calculator and guide routes, and 46 guide-cluster pages (a guides index, five collection hubs and 40 long-form guides) rendered from Markdown sources at build time. Search visibility is a goal, not a guaranteed outcome; search-volume estimates in planning documents have not been independently verified.

## Deployment

GitHub Pages is enabled and the site is live at the URL above. The workflow at `.github/workflows/deploy.yml` runs tests, generates the Markdown article mirrors, builds the static site, and deploys after changes are merged to `main`.

For a manual production build:

```sh
SITE_URL=https://njohn931d-dotcom.github.io/bbbh npm run build:production
```

`SITE_URL` may also be a custom domain at the origin root. Project-site paths are supported: assets, internal links, canonical URLs, `robots.txt`, `sitemap.xml`, `feed.xml`, and `llms.txt` resolve beneath `/bbbh/` on GitHub Pages.

Live discovery files:

- [Sitemap](https://njohn931d-dotcom.github.io/bbbh/sitemap.xml) — 133 URLs
- [Robots](https://njohn931d-dotcom.github.io/bbbh/robots.txt)
- [LLM index](https://njohn931d-dotcom.github.io/bbbh/llms.txt)
- [Guides index](https://njohn931d-dotcom.github.io/bbbh/articles/)
- [RSS feed](https://njohn931d-dotcom.github.io/bbbh/feed.xml)

## Development

```sh
npm ci
npm run dev
npm test
npm run build
```

`npm run dev` and `npm test` regenerate the guide pages from `content/articles/*.md`, so run them when the guide sources change. Preview builds are noindex and robots-disallowed, and discovery files (`sitemap.xml`, `feed.xml`, `llms.txt`, `ai.txt`) are removed rather than shipped with placeholder URLs; do not deploy a preview as production. The separate HOOKED Next.js application under `hooked/` is not deployed by this Pages workflow.

## Content engine: 40 guides

Worth ships **40 hand-written guides** in five topical clusters, rendered to static HTML at build time.

| Path | Contents |
| --- | --- |
| `content/articles/*.md` | 40 Markdown sources with front matter (tracked in Git) |
| `scripts/articles.mjs` | Front-matter parser, dependency-free Markdown renderer, page/hub/index generator |
| `articles/` | Generated pages: guides index, 5 collection hubs, 40 guides (ignored in Git) |
| `content/KEYWORD_PLAN.md` | Target queries, cluster map, on-page rules, freshness policy |
| `content/SYNDICATION.md` | Distribution notes: what legitimate syndication looks like and what to avoid |

Clusters: **Money in hours**, **Subscriptions**, **Saving habits**, **Pay & rates**, **Spending decisions** — eight guides each at `/articles/<cluster>/<slug>/`, with hubs at `/articles/<cluster>/` and an index at `/articles/`.

Each guide answers its question in the first two sentences, then shows the arithmetic in tables computed from stated assumptions (take-home pay, 8-hour days, 2,080 hours a year). No volume figures are claimed: targets were chosen by intent specificity, computability and clusterability, not from paid keyword data. See `content/KEYWORD_PLAN.md`.

### Adding or editing a guide

```sh
cp content/articles/price-to-hours-formula.md content/articles/my-new-guide.md
# edit front matter (title, description ≤158 chars, slug, cluster, query, reading, updated) and body
npm run dev     # live at /articles/<cluster>/<slug>/
npm test        # validates metadata, uniqueness, internal links, orphans, canonicals
```

Supported Markdown: `##`/`###` headings (H2s become the on-page contents list), paragraphs, `-` and `1.` lists, pipe tables, `>` callouts, fenced code, plus `**bold**`, `*italic*`, `` `code` `` and `[link](/path/)`. Output is HTML-escaped and unsafe link schemes are stripped.

The build fails loudly on a missing field, a duplicate slug, an unknown cluster or an over-long description, and the test suite fails on thin pages, orphans, duplicate titles, or a missing table. Generated guide pages are ignored by Git; the `articles/*.md` mirrors produced by `scripts/generate-articles-md.mjs` are separate tracked files kept for GitHub browsing.

## Search architecture

- Static HTML is generated for all 132 routes before JavaScript runs.
- Each route has unique title and description metadata, canonical URL, breadcrumbs, and internal links. The 46 guide pages add `Article`/`CollectionPage` and `BreadcrumbList` structured data describing visible content only.
- `scripts/generate-seo.mjs` creates the base routes plus the guides, and writes the sitemap, robots file, RSS feed, `llms.txt` and `ai.txt`.
- `scripts/generate-parasite.mjs` creates the 40-route 2026 tools cluster and includes it in the same sitemap.
- `scripts/generate-articles-md.mjs` creates Markdown mirrors under `articles/` for GitHub browsing.
- `40_ARTICLES_INDEX.md`, `SEO_STRATEGY.md`, and `GITHUB_SEO.md` document the article plan. Treat projected keyword volumes and ranking outcomes in planning docs as unverified hypotheses, not measured traffic or guarantees.
- Root-level `llms.txt`, `ai.txt`, `feed.xml` and `sitemap.xml` are GitHub-browsable copies of the files the production build generates into `public/`; refresh them from a production build when their content changes.
- **Google Search Console verification** uses the `google-site-verification` meta tag in `index.html`, the single template every generated page is built from. It therefore ships on all 135 built pages (homepage, calculators, guides, articles, helper pages). Verify the URL-prefix property `https://njohn931d-dotcom.github.io/bbbh/` in Search Console; a test asserts the tag survives generation so a template refactor cannot silently break verification. Only one Google account should hold it — a second tag would need a second `<meta>` line.

## dev.to backlinks

Five curated cross-posts (3,200 words, written for dev.to's audience) publish to
dev.to and link back to this site. See [DEVTO_BACKLINKS.md](DEVTO_BACKLINKS.md)
for the pipeline, the one-time `DEVTO_API_KEY` secret, and the cadence that keeps
the account safe.

```sh
node scripts/devto-publish.mjs --offline   # render check, no key needed
npm run devto:check                        # verify the key (needs DEVTO_API_KEY)
npm run devto:dry                          # print payloads, create nothing
npm run devto:publish                      # publish live (idempotent)
npm run devto:audit                        # which dev.to posts link back here
```

Re-running never creates a duplicate: posts already on dev.to are matched by
canonical URL and by normalized title. A dev.to API key has authoring scope only,
so it cannot enumerate third-party backlinks — `--audit` covers your own articles.

## Privacy and assumptions

Calculations run in the browser. Shared URL fragments include entered numbers; the UI warns before sharing. Pay conversions assume 2,080 hours per year; subscription estimates multiply monthly cost by 12; daily savings multiply by 365. These are perspective tools, not affordability assessments or financial advice.
