# Worth — Free Money Calculators

[![Deploy](https://github.com/njohn931d-dotcom/bbbh/actions/workflows/deploy.yml/badge.svg)](https://github.com/njohn931d-dotcom/bbbh/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://njohn931d-dotcom.github.io/bbbh/)
[![133 Pages](https://img.shields.io/badge/SEO%20Pages-133-blue)](https://njohn931d-dotcom.github.io/bbbh/sitemap.xml)

**Live site:** <https://njohn931d-dotcom.github.io/bbbh/>  
**Sitemap:** 133 URLs | **Guides:** 40 | **Calculators:** 86 | **PWA:** Yes | **Open Source:** MIT

Worth is a static site of browser-based money calculators and practical guides. It publishes **133 indexable URLs**: the homepage, 86 calculator and guide routes, and 46 guide-cluster pages (a guides index, five collection hubs and 40 long-form guides) rendered from Markdown sources at build time. All calculations run 100% in browser — private, no tracking, no sign-up.

## ✨ Features

- **46 calculators** — cost of time, subscription, daily savings, salary→hourly, freelance rate, cost-per-wear, overtime, etc.
- **40 guides** — hand-written, 5 clusters, tables with real math
- **40 extra calculators & guides** — mortgage, car loan, student loan, net worth, creator income, cost of living, plus the salary-to-hourly guide in 10 languages with proper hreflang; every page has its own copy, table and FAQ (`scripts/parasite-content.mjs`)
- **PWA ready** — manifest.json, 404.html fallback, offline-capable
- **SEO max** — canonical URLs, breadcrumbs, JSON-LD (WebSite, WebPage, WebApplication, BreadcrumbList, FAQPage, Organization), sitemap with priority/lastmod, robots.txt with LLM crawler allow, llms.txt, ai.txt, feed.xml
- **Privacy first** — no cookies, no analytics, localStorage only for saved thoughts
- **133 pages** — all static HTML, unique titles/descriptions, validated by 12 tests

## 🚀 Deployment

GitHub Pages is enabled and live. Workflow `.github/workflows/deploy.yml` runs:

1. `npm test` — 12 tests, 133 URL validation (serial, --test-concurrency=1 to avoid shared output race)
2. Generate Markdown mirrors (40 articles)
3. `build:production` with `SITE_URL=https://njohn931d-dotcom.github.io/bbbh`
4. Verify dist: 133 URLs, 46 guides, 86 feed, 0 noindex, manifest, 404.html, .nojekyll, humans.txt, security.txt, sitemap, robots, feed, llms, canonicals, OG tags
5. Deploy to GitHub Pages + verify + notify

For manual production build:

```sh
SITE_URL=https://njohn931d-dotcom.github.io/bbbh npm run build:production
```

`SITE_URL` may also be custom domain at origin root. Project-site paths supported: assets, internal links, canonicals, robots.txt, sitemap.xml, feed.xml, llms.txt resolve beneath `/bbbh/`.

Live discovery files:

- [Sitemap](https://njohn931d-dotcom.github.io/bbbh/sitemap.xml) — 133 URLs with priority & lastmod
- [Robots](https://njohn931d-dotcom.github.io/bbbh/robots.txt) — LLM crawler friendly
- [LLM index](https://njohn931d-dotcom.github.io/bbbh/llms.txt) — for AI search
- [AI index](https://njohn931d-dotcom.github.io/bbbh/ai.txt)
- [Guides index](https://njohn931d-dotcom.github.io/bbbh/articles/) — 40 guides
- [RSS feed](https://njohn931d-dotcom.github.io/bbbh/feed.xml) — 86+ items
- [Manifest](https://njohn931d-dotcom.github.io/bbbh/manifest.json) — PWA
- [Humans](https://njohn931d-dotcom.github.io/bbbh/humans.txt)
- [Security](https://njohn931d-dotcom.github.io/bbbh/.well-known/security.txt)

## 🛠 Development

```sh
npm ci
npm run dev          # http://localhost:5173
npm test             # 12 tests
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

- Static HTML for all 133 routes before JS
- Unique title/description, canonical, breadcrumbs, internal links
- 46 guide pages add `Article`/`CollectionPage` + `BreadcrumbList` JSON-LD
- `scripts/generate-seo.mjs` — base routes + guides, sitemap, robots, RSS, llms.txt, ai.txt
- `scripts/generate-parasite.mjs` — 40-route 2026 multilingual cluster
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

- **The GitHub Pages deploy publishes Worth only.** `vite build` emits exactly 133
  indexable pages and `deploy.yml` asserts that count, so the sibling projects stay
  outside `dist/`. Affiliate Income Lab targets its own domain (`affiliateincomelab.com`,
  set by the `SITE`/`BASE` constants in `affiliate-marketing/tools/build.py`); Forge
  Workspace is served from its own directory.
- **GitHub-facing mirrors** — `docs/*.md` and `40-articles-index.html` are generated
  by `scripts/generate-github-mirrors.mjs` from `scripts/parasite-content.mjs`, the same
  source the live pages use. Deployed discovery files come from `scripts/generate-seo.mjs`.
- **`affiliate-marketing/tools/build.py` writes its sitemap inside its own package**
  (`affiliate-marketing/sitemap.xml`) and never to the repository root, so a content
  rebuild cannot overwrite Worth's 133-URL sitemap.
- `server.js` and the root `404.html` exist to preview all four projects locally.

Before publishing Forge Workspace, set a real `contactEmail` in
`workspace-service/site-config.js`: in demo mode the inquiry form only copies the
request to the clipboard. Its devcontainer demo is not hardened for customer data.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — MIT license, vanilla JS, accessible, privacy-first.

## 📄 License

MIT — see [LICENSE](LICENSE)

## 🙏 Credits

Built with Vite, hosted on GitHub Pages, fonts DM Sans + Manrope, open source community.
