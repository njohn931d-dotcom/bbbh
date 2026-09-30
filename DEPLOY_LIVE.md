# GitHub Pages deployment status

**Live site:** <https://njohn931d-dotcom.github.io/bbbh/>

**Status:** Published successfully from `main`. GitHub Pages is configured to use GitHub Actions.

The deployment workflow tests the project, builds with `SITE_URL=https://njohn931d-dotcom.github.io/bbbh`, and deploys 142 sitemap URLs (homepage, 95 distinct calculator/guide routes, and 46 Markdown-guide index/hub/article pages). Changes on this branch are **not live until merged into `main`**. After deployment, CI now checks the actual public HTML, structured data, calculator JavaScript, sitemap, image and manifest rather than treating a successful HTTP connection as a successful deployment.

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

The live pages already have JSON-LD, but it must match the page people can use. This build now checks that the page/entity URL matches its canonical, every advertised tool has a working form, and social images resolve under `/bbbh/`. The income-percentile route remains a guide because we do not have a verified current distribution dataset; we will not invent a score.

Run `SITE_URL=https://njohn931d-dotcom.github.io/bbbh npm run check:live` to test the public deployment yourself. The Pages workflow runs the same check after merging/deploying, then attempts an IndexNow notification for the site's URLs using a key file under the `/bbbh/` project path. A successful IndexNow response means receipt, **not** indexing, visibility on any particular engine, or visitors. Google Search Console ownership, sitemap submission and actual traffic data still require access to the site's webmaster account. We do not simulate visits or claim a result we cannot measure.
