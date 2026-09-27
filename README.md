# Worth — Free Money Calculators

**Live site:** <https://njohn931d-dotcom.github.io/bbbh/>

Worth is a static site of browser-based money calculators and practical guides. It currently publishes 47 indexable URLs: the homepage and 46 route pages, including 40 added SEO articles. Search visibility is a goal, not a guaranteed outcome; search-volume estimates in planning documents have not been independently verified.

## Deployment

GitHub Pages is enabled and the site is live at the URL above. The workflow at `.github/workflows/deploy.yml` runs tests, generates the Markdown article mirrors, builds the static site, and deploys after changes are merged to `main`.

For a manual production build:

```sh
SITE_URL=https://njohn931d-dotcom.github.io/bbbh npm run build:production
```

`SITE_URL` may also be a custom domain at the origin root. Project-site paths are supported: assets, internal links, canonical URLs, `robots.txt`, `sitemap.xml`, and `llms.txt` resolve beneath `/bbbh/` on GitHub Pages.

Live discovery files:

- [Sitemap](https://njohn931d-dotcom.github.io/bbbh/sitemap.xml) — 47 URLs
- [Robots](https://njohn931d-dotcom.github.io/bbbh/robots.txt)
- [LLM index](https://njohn931d-dotcom.github.io/bbbh/llms.txt)
- [Guide directory](https://njohn931d-dotcom.github.io/bbbh/guides/)

## Development

```sh
npm ci
npm run dev
npm test
npm run build
```

Preview builds are noindex and robots-disallowed; do not deploy those as production. The separate HOOKED Next.js application under `hooked/` is not deployed by this Pages workflow.

## Search architecture

- Static HTML is generated for all 46 routes before JavaScript runs.
- Each route has unique title and description metadata, canonical URL, breadcrumbs, and internal links.
- `scripts/generate-seo.mjs` creates the routes, sitemap, robots file, and LLM index.
- `scripts/generate-articles-md.mjs` creates Markdown mirrors under `articles/`.
- `40_ARTICLES_INDEX.md`, `SEO_STRATEGY.md`, and `GITHUB_SEO.md` document the article plan. Treat projected keyword volumes and ranking outcomes in planning docs as unverified hypotheses, not measured traffic or guarantees.

## Privacy and assumptions

Calculations run in the browser. Shared URL fragments include entered numbers; the UI warns before sharing. Pay conversions assume 2,080 hours per year; subscription estimates multiply monthly cost by 12; daily savings multiply by 365. These are perspective tools, not affordability assessments or financial advice.
