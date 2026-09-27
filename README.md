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
- **40-tool 2026 cluster** — multilingual (EN, ES, DE, FR, RU, ZH, JA, KO, AR, PT) parasite SEO on GitHub Pages DA 99
- **PWA ready** — manifest.json, 404.html fallback, offline-capable
- **SEO max** — canonical URLs, breadcrumbs, JSON-LD (WebSite, WebPage, WebApplication, BreadcrumbList, FAQPage, Organization), sitemap with priority/lastmod, robots.txt with LLM crawler allow, llms.txt, ai.txt, feed.xml
- **Privacy first** — no cookies, no analytics, localStorage only for saved thoughts
- **133 pages** — all static HTML, unique titles/descriptions, validated by 12 tests

## 🚀 Deployment

GitHub Pages is enabled and live. Workflow `.github/workflows/deploy.yml` runs:

1. `npm test` — 12 tests, 133 URL validation
2. Generate Markdown mirrors (40 articles)
3. `build:production` with `SITE_URL=https://njohn931d-dotcom.github.io/bbbh`
4. Verify dist: 133 URLs, 46 guides, manifest, 404.html, .nojekyll, humans.txt, security.txt, sitemap, robots, feed, llms
5. Deploy to GitHub Pages + verify

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

`npm run dev` and `npm test` regenerate guide pages from `content/articles/*.md`. Preview builds are noindex and drop discovery files. The HOOKED Next.js app under `hooked/` is separate (not deployed by Pages workflow) — run `npm --prefix hooked run dev` for it.

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
- `vite.config.js` — generates 404.html SPA fallback, verifies dist, PWA manifest
- `40_ARTICLES_INDEX.md`, `SEO_STRATEGY.md`, `GITHUB_SEO.md` — article plan (treat volumes as hypotheses)

## 🔒 Privacy & Assumptions

- Calculations in browser, no server
- Shared URL fragments include numbers; UI warns before sharing
- Pay conversions: 2,080 hrs/year, 173.33 hrs/month, monthly×12, daily×365
- Perspective tools, not affordability assessments or financial advice
- No tracking, no cookies, MIT licensed

## 📦 PWA & Performance

- `public/manifest.json` — standalone, theme_color #204f3c, shortcuts to 3 calculators
- `dist/404.html` — GitHub Pages SPA fallback (copied from index)
- `dist/.nojekyll` — bypass Jekyll
- Vite: esbuild minify, cssMinify, hashed assets, 500kb warning limit
- Preconnect to Google Fonts, optimized images via data URI icons

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — MIT license, vanilla JS, accessible, privacy-first.

## 📄 License

MIT — see [LICENSE](LICENSE)

## 🙏 Credits

Built with Vite, hosted on GitHub Pages DA 99, fonts DM Sans + Manrope, open source community.
