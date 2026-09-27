# GitHub Pages deployment status

**Live site:** <https://njohn931d-dotcom.github.io/bbbh/>

**Status:** Published successfully from `main`. GitHub Pages is configured to use GitHub Actions.

The deployment workflow tests the project, generates the Markdown article mirrors, builds the static site with `SITE_URL=https://njohn931d-dotcom.github.io/bbbh`, and deploys the 133 sitemap URLs (homepage, 86 calculator/guide routes, and 46 guide-cluster pages rendered from `content/articles/*.md`). Future changes merged to `main` trigger a new deployment.

## Verify

- Home: <https://njohn931d-dotcom.github.io/bbbh/>
- Guides index: <https://njohn931d-dotcom.github.io/bbbh/articles/>
- Example guide: <https://njohn931d-dotcom.github.io/bbbh/articles/work-hours/price-to-hours-formula/>
- Sitemap: <https://njohn931d-dotcom.github.io/bbbh/sitemap.xml>
- Robots: <https://njohn931d-dotcom.github.io/bbbh/robots.txt>
- LLM index: <https://njohn931d-dotcom.github.io/bbbh/llms.txt>
- RSS feed: <https://njohn931d-dotcom.github.io/bbbh/feed.xml>

## Preview builds

A build without `SITE_URL` is a preview: pages are noindex, root-relative and robots-disallowed, and `sitemap.xml`, `feed.xml`, `llms.txt` and `ai.txt` are removed instead of shipped with placeholder URLs.

Search indexing and rankings are not automatic or guaranteed; Google Search Console ownership verification and sitemap submission remain separate webmaster tasks.
