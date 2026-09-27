# Deploy Worth to GitHub Pages

The site is built for the project URL `https://njohn931d-dotcom.github.io/bbbh/`. The workflow builds 47 indexable URLs (home + 46 static routes), runs tests, and deploys from `main` or `arena/01a0e4e8-bbbh`.

## One-time repository setup

GitHub Pages is not enabled yet. The first workflow run on the merged site failed in `actions/configure-pages` because there is no Pages site configured. I cannot enable repository Pages settings from this environment—the GitHub API integration returned 403 for that setting.

Please enable it once:

1. Open the repository’s **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Go to **Actions → Deploy Worth (47 SEO Pages) to GitHub Pages** and select **Run workflow** on `arena/01a0e4e8-bbbh` (or push a new commit to that branch).
4. Wait for both `build` and `deploy` jobs to pass. GitHub will show the published URL in the deployment environment.

The workflow sets `SITE_URL` to the GitHub Pages URL, including `/bbbh/`; generated HTML links, assets, canonicals, `robots.txt`, sitemap, and `llms.txt` use that path. No `worth.example` placeholder is used.

## Verify after deployment

- Home: `https://njohn931d-dotcom.github.io/bbbh/`
- Guide directory: `https://njohn931d-dotcom.github.io/bbbh/guides/`
- Sitemap: `https://njohn931d-dotcom.github.io/bbbh/sitemap.xml` (47 `<loc>` entries)
- Robots: `https://njohn931d-dotcom.github.io/bbbh/robots.txt`
- LLM index: `https://njohn931d-dotcom.github.io/bbbh/llms.txt`

Search indexing and rankings are not automatic or guaranteed. After it is public, add the deployed URL property in Google Search Console and submit the sitemap if you want Google to crawl it sooner.
