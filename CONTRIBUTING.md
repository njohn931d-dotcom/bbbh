# Contributing to Worth

Worth is open source (MIT) — 133 SEO pages of free money calculators.

## Quick Start

```sh
npm ci
npm run dev    # http://localhost:5173
npm test       # 20 tests, 133 URL validation
SITE_URL=https://njohn931d-dotcom.github.io/bbbh npm run build:production
```

## Project Structure

- `index.html` — homepage shell
- `app.js` — vanilla JS calculator (purchase/subscription/saving modes)
- `style.css` — all styles, no framework
- `content/articles/*.md` — 40 Markdown guides (source of truth)
- `scripts/articles.mjs` — Markdown parser, hub/index generator
- `scripts/generate-seo.mjs` — 46 main SEO routes + sitemap/robots/feed/llms
- `scripts/generate-parasite.mjs` — 40-tool 2026 cluster (multilingual)
- `articles/` — generated guide HTML (gitignored, except mirrors)
- `public/` — static assets copied to dist

## Adding a Guide

```sh
cp content/articles/price-to-hours-formula.md content/articles/my-new-guide.md
# edit frontmatter: title, description ≤158 chars, slug, cluster, query, reading, updated
npm run dev     # live at /articles/<cluster>/<slug>/
npm test        # validates metadata, uniqueness, links, orphans, canonicals
```

Clusters: `work-hours`, `subscriptions`, `saving-habits`, `pay-and-rates`, `spending-decisions` — 8 guides each.

Markdown support: `##`/`###`, paragraphs, `-` and `1.` lists, pipe tables, `>` callouts, fenced code, `**bold**`, `*italic*`, `` `code` ``, `[link](/path/)`.

## Tests

- `tests/*.test.cjs` — 20 tests
- Validates: calculations, localStorage, frontmatter, HTML escaping, canonical URLs, unique metadata, internal links, orphans, sitemap coverage, preview noindex, project path prefixing
- Run `npm test` before PR

## Deployment

- GitHub Pages via `.github/workflows/deploy.yml`
- Push to `main` triggers: test → generate mirrors → build:production → verify the complete generated sitemap → deploy
- Preview builds (no SITE_URL) are noindex, robots-disallowed, no sitemap/feed/llms
- Production requires `SITE_URL=https://njohn931d-dotcom.github.io/bbbh`

## Code Style

- No frameworks for main site (vanilla JS)
- HTML-escaped output, unsafe link schemes stripped
- Accessible: keyboard nav, ARIA, focus-visible
- Privacy: no tracking, no cookies, browser-only calculations

## SEO Rules

- 1 H1 per page, unique title/description
- Canonical URLs, breadcrumbs, internal links
- `Article`/`CollectionPage` + `BreadcrumbList` JSON-LD for guides
- Sitemap: generated from the complete route model; omit synthetic lastmod/changefreq values
- No keyword volume claims — targets chosen by intent specificity, computability, clusterability

## License

MIT — see LICENSE
