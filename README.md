# Worth — Free Money Calculators

[![Deploy](https://github.com/njohn931d-dotcom/bbbh/actions/workflows/deploy.yml/badge.svg)](https://github.com/njohn931d-dotcom/bbbh/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://njohn931d-dotcom.github.io/bbbh/)
[![175 Pages](https://img.shields.io/badge/SEO%20Pages-175-blue)](https://njohn931d-dotcom.github.io/bbbh/sitemap.xml)

**Live site:** <https://njohn931d-dotcom.github.io/bbbh/>  
**Sitemap:** 175 URLs | **Tools:** 81 | **Guides:** 42 | **Articles:** 46 | **Languages:** 10 | **PWA:** Yes | **Open Source:** MIT

Worth is a static site of browser-based money calculators and practical guides. It publishes **175 indexable URLs**: the homepage, five hub and site pages, 81 calculators, 42 guides, 46 long-form articles and the three site pages. Every calculator runs on its own formula in the browser — private, no tracking, no sign-up.

Every page carries its own formula, worked example and FAQ. Ten pages are genuine translations (de, fr, ru, zh, ja, ko, ar, pt, es) with reciprocal `hreflang`.

## ✨ Features

- **One calculator per page** — 71 tools, each with its own inputs, formula, worked table and assumptions. The printed result and the live widget run the same function, so they cannot disagree

- **81 calculators** — each with its own inputs, formula, worked examples and assumptions, from cost of time and salary→hourly to mortgages, debt payoff, tips, unit prices and a 401(k) projection
- **Two browse hubs** — `/calculators/` and `/guides/` index every page by topic with `ItemList` markup, so the collection is crawlable as a set rather than through one alphabetical block
- **42 guides and 46 long-form articles** — hand-written, cluster-organised, tables with real math
- **10 real translations** — EN, ES, DE, FR, RU, ZH, JA, KO, AR, PT, wired with reciprocal hreflang
- **PWA ready** — manifest.json, 404.html fallback, offline-capable
- **SEO** — canonical URLs, breadcrumbs, JSON-LD (WebSite, WebPage, WebApplication, BreadcrumbList, TechArticle, FAQPage, Organization), sitemap with priority/lastmod, robots.txt with LLM crawler allow, llms.txt, ai.txt, feed.xml, and an Open Graph card on every page
- **Audited build** — `npm run seo:audit` checks all 175 pages for duplicate content, title/description quality, canonical correctness, hreflang reciprocity, link health and orphan pages, and **fails the deploy** on any error
- **Privacy first** — no cookies, no analytics, localStorage only for saved thoughts
- **175 pages** — all static HTML, unique titles/descriptions, validated by 37 tests

## 🚀 Deployment

GitHub Pages is enabled and live. Workflow `.github/workflows/deploy.yml` runs:

1. `npm test` — 37 tests, 175 URL validation (serial, --test-concurrency=1 to avoid shared output race)
2. Generate Markdown mirrors (40 articles)
3. `build:production` with `SITE_URL=https://njohn931d-dotcom.github.io/bbbh`
4. Verify dist: 175 URLs, 46 guide pages, 86 feed items, 0 noindex, manifest, a real 404.html, .nojekyll, sitemap, robots, feed, llms, canonicals, OG tags
5. `npm run seo:audit` — fails the deploy on any SEO error
5. Deploy to GitHub Pages + verify + notify

For manual production build:

```sh
SITE_URL=https://njohn931d-dotcom.github.io/bbbh npm run build:production
```

`SITE_URL` may also be custom domain at origin root. Project-site paths supported: assets, internal links, canonicals, robots.txt, sitemap.xml, feed.xml, llms.txt resolve beneath `/bbbh/`.

Live discovery files:

- [Sitemap](https://njohn931d-dotcom.github.io/bbbh/sitemap.xml) — 175 URLs with priority & lastmod
- [Calculators](https://njohn931d-dotcom.github.io/bbbh/calculators/) — every calculator indexed by topic
- [Guides](https://njohn931d-dotcom.github.io/bbbh/guides/) — every guide indexed by topic
- [Methodology](https://njohn931d-dotcom.github.io/bbbh/methodology/) — how the numbers are made and checked
- [Robots](https://njohn931d-dotcom.github.io/bbbh/robots.txt) — LLM crawler friendly
- [LLM index](https://njohn931d-dotcom.github.io/bbbh/llms.txt) — for AI search
- [AI index](https://njohn931d-dotcom.github.io/bbbh/ai.txt)
- [Guides index](https://njohn931d-dotcom.github.io/bbbh/articles/) — 46 guides
- [RSS feed](https://njohn931d-dotcom.github.io/bbbh/feed.xml) — 86+ items
- [Manifest](https://njohn931d-dotcom.github.io/bbbh/manifest.json) — PWA
- [Humans](https://njohn931d-dotcom.github.io/bbbh/humans.txt)
- [Security](https://njohn931d-dotcom.github.io/bbbh/.well-known/security.txt)

## 🛠 Development

```sh
npm ci
npm run dev          # http://localhost:5173
npm test             # 37 tests
npm run build        # preview (noindex)
SITE_URL=https://njohn931d-dotcom.github.io/bbbh npm run build:production  # production
```

`npm run dev` and `npm test` regenerate the guide pages from `content/articles/*.md`, so run them when the guide sources change. The test script pins `--test-concurrency=1`: the test files each regenerate the same shared output (`.generated/`, `public/sitemap.xml`, `public/robots.txt`, `public/feed.xml`, `public/llms.txt`, `public/ai.txt`) and a preview build deletes the discovery files, so running them in parallel makes the suite fail intermittently depending on the runner's CPU count. Keep it serial. Preview builds are noindex and robots-disallowed, and discovery files (`sitemap.xml`, `feed.xml`, `llms.txt`, `ai.txt`) are removed rather than shipped with placeholder URLs; do not deploy a preview as production. The separate HOOKED Next.js application under `hooked/` is not deployed by this Pages workflow.

## 📚 Content Engine: 40 Guides

| Path | Contents |
| --- | --- |
| `content/articles/*.md` | 40 Markdown sources with front matter (tracked) |
| `scripts/articles.mjs` | Front-matter parser, Markdown renderer, hub/index generator |
| `articles/` | Generated pages: index, 5 hubs, 40 guides (gitignored) |
| `content/KEYWORD_PLAN.md` | Target queries, cluster map, on-page rules |
| `content/SYNDICATION.md` | Distribution notes |

Clusters: **Money in hours**, **Subscriptions**, **Saving habits**, **Pay & rates**, **Spending decisions** — 8 guides each at `/articles/<cluster>/<slug>/`, hubs at `/articles/<cluster>/`, index at `/articles/`.

### Adding a Guide

```sh
cp content/articles/price-to-hours-formula.md content/articles/my-new-guide.md
# edit frontmatter: title, description ≤158 chars, slug, cluster, query, reading, updated
npm run dev     # live at /articles/<cluster>/<slug>/
npm test        # validates metadata, uniqueness, links, orphans, canonicals
```

Markdown: `##`/`###` headings (H2s become TOC), paragraphs, `-` and `1.` lists, pipe tables, `>` callouts, fenced code, `**bold**`, `*italic*`, `` `code` ``, `[link](/path/)`. Output HTML-escaped, unsafe schemes stripped.

## 🔍 Search Architecture

- Static HTML for all 175 routes before JS
- Unique title/description, canonical, breadcrumbs, internal links
- 46 guide pages add `Article`/`CollectionPage` + `BreadcrumbList` JSON-LD
- `scripts/generate-seo.mjs` — base routes + guides, sitemap, robots, RSS, llms.txt, ai.txt
- `scripts/cluster-content.mjs` — per-page formulas, worked examples and FAQs for the 49-page cluster
- `scripts/generate-parasite.mjs` — renders that cluster, plus 10 real translations with reciprocal hreflang
- `scripts/calculator-engines.mjs` — one calculator engine per tool route; the same function renders the printed result and runs in the browser
- `scripts/generate-hubs.mjs` — the `/calculators/`, `/guides/`, `/about/`, `/methodology/` and `/privacy/` pages
- `scripts/seo-audit.mjs` — audits `dist/`; exits non-zero on any error and gates the deploy
- `scripts/generate-articles-md.mjs` — Markdown mirrors under `articles/` for GitHub browsing
- `vite.config.js` — generates 404.html SPA fallback, verifies dist, PWA manifest, hashed assets, security headers
- `40_ARTICLES_INDEX.md`, `SEO_STRATEGY.md`, `GITHUB_SEO.md` — article plan (treat volumes as hypotheses)
- **Google Search Console verification** — `google-site-verification` meta tag lives in `index.html`, the single template every generated page is built from, so it ships on every built page (homepage, tools, guides, articles, helper pages). Verify the URL-prefix property `https://njohn931d-dotcom.github.io/bbbh/`; a test asserts the tag survives generation. One Google account per tag — a second needs its own `<meta>` line.

## 🔗 dev.to backlinks

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

## 🔒 Privacy & Assumptions

- Calculations in browser, no server
- Shared URL fragments include numbers; UI warns before sharing
- Pay conversions: 2,080 hrs/year, 173.33 hrs/month, monthly×12, daily×365
- Perspective tools, not affordability assessments or financial advice
- No tracking, no cookies, MIT licensed

## 📦 PWA & Performance

- `public/manifest.json` — standalone, theme_color #204f3c, shortcuts to 3 calculators, maskable icons
- `dist/404.html` — GitHub Pages SPA fallback (copied from index)
- `dist/.nojekyll` — bypass Jekyll
- Vite: esbuild minify, cssMinify, hashed assets, 500kb warning limit, security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Preconnect to Google Fonts, optimized images via data URI icons

## 🧭 Other projects in this repository

This repo also hosts three independent projects. They share a domain and deployment
plumbing — not code: separate stylesheets, scripts, build steps and dependency trees.

| Project | Lives at | Stack | What it is |
|---|---|---|---|
| **HOOKED** | `/hooked/` | Next.js 15 + React | Traffic-engine / content generation app with its own README, lockfile and SEO audit. |
| **Affiliate Income Lab** | `/affiliate-marketing/` | Static HTML/CSS/JS | 13-page affiliate-marketing content site with its own build and SEO validator. |
| **Forge Workspace** | `/workspace-service/` | Static HTML/CSS/JS | Landing page for the workspace-setup service in [INCOME_PLAYBOOK.md](workspace-service/INCOME_PLAYBOOK.md). |

```sh
npm run dev:hooked        # HOOKED on port 3000
npm run build:hooked
npm run affiliate:build   # regenerate Affiliate Income Lab pages, sitemap, feed
npm run affiliate:check   # validate its SEO, JSON-LD, links, a11y basics
npm run serve:static      # zero-dependency dev server for the static projects
```

Scope rules that keep the Pages deploy green:

- **The GitHub Pages deploy publishes Worth only.** `vite build` emits exactly 175
  indexable pages and `deploy.yml` asserts that derived count, so the sibling projects stay
  outside `dist/`. Affiliate Income Lab targets its own domain (`affiliateincomelab.com`,
  set by the `SITE`/`BASE` constants in `affiliate-marketing/tools/build.py`); Forge
  Workspace is served from its own directory.
- **Root discovery files belong to Worth** — `sitemap.xml`, `robots.txt`, `llms.txt`,
  `ai.txt` and `feed.xml` are generated by `scripts/generate-seo.mjs`.
- **`affiliate-marketing/tools/build.py` writes its sitemap inside its own package**
  (`affiliate-marketing/sitemap.xml`) and never to the repository root, so a content
  rebuild cannot overwrite Worth's 175-URL sitemap.
- `server.js` and the root `404.html` exist to preview all four projects locally.

Before publishing Forge Workspace, set a real `contactEmail` in
`workspace-service/site-config.js`: in demo mode the inquiry form only copies the
request to the clipboard. Its devcontainer demo is not hardened for customer data.

## 📚 Developer Cheatsheets & Reference Guides

High-volume reference material lives in [`docs/`](docs/README.md) alongside the calculators:

- **[Awesome Developer Cheatsheets](docs/awesome-developer-cheatsheets.md)** — Git undo operations, Docker lifecycle, Linux one-liners, regex, SQL indexing, HTTP status codes, Core Web Vitals.
- **[System Design Interview Cheatsheet](docs/system-design-interview-cheatsheet.md)** — latency numbers, back-of-envelope throughput math, rate limiting, caching, sharding, CAP/PACELC.
- **[AI Prompt Engineering & LLM Reference](docs/ai-prompt-engineering-reference.md)** — prompt patterns, system-prompt guardrails, token pricing, RAG chunking, AI ROI.
- **[Developer Salary, Equity & 1099 Contractor Guide](docs/developer-salary-equity-calculator.md)** — total compensation, RSUs vs options, the W2→1099 multiplier, overtime.
- **[FIRE Calculator & Handbook](docs/fire-financial-independence-retire-early.md)** — 4% rule math, Coast FIRE, Lean vs Fat FIRE, savings-rate tables.
- **[Awesome Open-Source Finance Directory](docs/open-source-finance-tools-directory.md)** — 50+ privacy-first, self-hosted and plain-text money tools.

See also the [Max Traffic & Ranking Playbook](MAX_TRAFFIC_AND_RANKING_PLAYBOOK.md) for how these pages are built to be found.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — MIT license, vanilla JS, accessible, privacy-first.

## 📄 License

MIT — see [LICENSE](LICENSE)

## 🙏 Credits

Built with Vite, hosted on GitHub Pages, fonts DM Sans + Manrope, open source community.
