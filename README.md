# Worth — Free Money Calculators

Worth is a static site of browser-based money calculators and practical guides. It contains 47 indexable URLs when built with a production `SITE_URL`: the home page, 46 route pages, including 40 added SEO articles. Search visibility is a goal, not a guaranteed outcome; the search-volume estimates in planning documents have not been independently verified.

**GitHub Pages target:** <https://njohn931d-dotcom.github.io/bbbh/>

**Deployment status:** GitHub Pages is not enabled for this repository yet. Enable it under **Settings → Pages → Build and deployment → GitHub Actions**, then rerun the `Deploy Worth (47 SEO Pages) to GitHub Pages` workflow. The repository’s existing workflow run failed at its Pages setup step because the Pages site has not been initialized.

## Development

```sh
npm ci
npm run dev
npm test
npm run build
```

Preview builds are noindex and robots-disallowed. Do not deploy those as production. A production build requires the actual public site URL:

```sh
SITE_URL=https://njohn931d-dotcom.github.io/bbbh npm run build:production
```

`SITE_URL` may also be a custom domain at the origin root. The project-site path is supported: generated assets and internal links, canonical URLs, `robots.txt`, `sitemap.xml`, and `llms.txt` are all rooted under `/bbbh/` for GitHub Pages.

The Pages workflow in `.github/workflows/deploy.yml` runs tests, generates the markdown article mirrors, builds the static site, and deploys from `main` or this Arena branch. After enabling Pages, a push or manual workflow run publishes the 47 URLs.

## Search architecture

- Static HTML is generated for all 46 routes before JavaScript runs.
- Each route has unique title and description metadata, canonical URL, breadcrumbs, and internal links.
- The sitemap lists the home page plus 46 routes.
- `scripts/generate-seo.mjs` creates the routes, sitemap, robots file, and LLM index.
- `scripts/generate-articles-md.mjs` creates Markdown mirrors under `articles/`.
- `40_ARTICLES_INDEX.md`, `SEO_STRATEGY.md`, and `GITHUB_SEO.md` document the article plan. Treat projected keyword volumes and ranking outcomes in planning docs as unverified hypotheses, not measured traffic or guarantees.

## Privacy and assumptions

Calculations run in the browser. Shared URL fragments include entered numbers; the UI warns before sharing. Pay conversions assume 2,080 hours per year; subscription estimates multiply monthly cost by 12; daily savings multiply by 365. These are perspective tools, not affordability assessments or financial advice.

The separate HOOKED Next.js application remains under `hooked/` and is not deployed by this Pages workflow.
