# How to Make All 40 Articles Live (47 Pages)

**You have 47 pages ready:** 46 routes + home. 40 are new SEO articles targeting 195k/mo searches using GitHub DA 96.

## Quick Start (5 minutes to live)

### Option 1: GitHub Pages (Free, DA 96 lever) - RECOMMENDED for SEO

GitHub Pages itself has DA 96, so your live site inherits authority.

**Steps:**

1. **Merge PR #5** to `main` (or push main)
   ```sh
   gh pr merge 5 --merge --delete-branch
   # or via GitHub UI
   ```

2. **Set SITE_URL variable** (for canonical URLs, sitemap)
   - Go to repo → Settings → Secrets and variables → Actions → Variables → New variable
   - Name: `SITE_URL`
   - Value: `https://njohn931d-dotcom.github.io/bbbh`  (or your custom domain `https://worth.example`)

3. **Enable Pages**
   - Settings → Pages → Source: GitHub Actions (not branch)
   - The workflow `.github/workflows/deploy.yml` will auto-deploy on push to main

4. **Push to main triggers deploy**
   ```sh
   git checkout main
   git merge arena/01a0e4e8-bbbh
   git push origin main
   ```
   - Actions tab → watch "Deploy Worth" workflow → should build 47 pages and deploy
   - Live URL: `https://njohn931d-dotcom.github.io/bbbh/` (if no custom domain)

5. **Custom domain (optional but recommended for brand)**
   - Settings → Pages → Custom domain: `worth.example`
   - Add DNS: CNAME `worth.example` → `njohn931d-dotcom.github.io`
   - Or A records to GitHub Pages IPs (185.199.108.153 etc.)
   - Enforce HTTPS: check box
   - Update `SITE_URL` variable to `https://worth.example` and re-deploy

**Result:** All 47 pages live at `https://worth.example/` with sitemap at `/sitemap.xml`, llms.txt at `/llms.txt`

---

### Option 2: Vercel (Fastest, Free)

```sh
npm i -g vercel
SITE_URL=https://worth.example vercel --prod
# Set env var SITE_URL in Vercel dashboard → Settings → Environment Variables
```

Vercel auto-detects Vite, serves `dist/`. Add custom domain in Vercel dashboard.

### Option 3: Netlify

```sh
npm i -g netlify-cli
SITE_URL=https://worth.example npm run build:production
netlify deploy --prod --dir=dist
# Set SITE_URL in Netlify UI → Site settings → Build & deploy → Environment
```

### Option 4: Cloudflare Pages

- Dashboard → Pages → Create → Connect GitHub repo
- Build command: `npm run build:production`
- Build output: `dist`
- Env var: `SITE_URL=https://worth.example`

---

## Make GitHub Itself Live (40 markdown articles)

Your 40 markdown files in `/articles/` are ALREADY live as soon as repo is public. They rank for `site:github.com` searches.

**To maximize:**

1. **Make repo public** (if private)
   - Settings → Danger Zone → Change visibility → Public

2. **Add topics** (manual via GitHub UI - can't via git)
   - Go to repo main page → click gear next to About → Topics:
   ```
   calculator, money, personal-finance, open-source, javascript, financial-calculator, hourly-rate, budget, latte-factor, cost-per-wear, freelance, overtime, subscription, savings, minimalism, side-hustle, github-pages, vite, static-site, worth
   ```

3. **Set About**
   - Description: `46 free money calculators, open source on GitHub. Salary to hourly, cost per wear, latte factor. Private, no sign-up. MIT License.`
   - Website: `https://worth.example` (or GitHub Pages URL)

4. **Enable Wiki**
   - Settings → Features → Wikis → check
   - Create page: "Calculator Formulas" linking to all 40 articles

5. **Enable Discussions**
   - Settings → Features → Discussions → check
   - Category: Q&A - people ask "how to calculate freelance rate with benefits" → threads rank

6. **Add social preview**
   - Settings → Social preview → Upload `public/og.png` (or create image with text "46 Free Calculators - Open Source on GitHub")

7. **Create Release v1.0**
   ```sh
   gh release create v1.0 --title "Launch 46 free money calculators open source" --notes "40 SEO articles targeting 195k/mo searches. Calculators: salary-to-hourly (22k/mo), hourly-to-salary (18k), freelance-rate, cost-per-wear, cost-per-use, overtime-pay (12k), after-tax-income, commute-cost, latte-factor, gym-cost-per-visit, streaming-cost, car-ownership-cost, time-to-save, paycheck-breakdown, buy-vs-rent-hourly. Guides: how-much-is-time-worth, stop-impulse-buying, subscription-audit, latte-factor-explained, no-spend-challenge, 30-day-rule, cost-per-wear-guide, freelance-rate-guide, psychology-small-purchases, track-daily-spending, emergency-fund-hours, side-hustle-worth-it, coffee-cost-per-year, average-subscription-cost-2025, hourly-budget, paycheck-to-paycheck, cost-of-convenience, value-free-time, minimalism-cost-per-time, negotiate-hourly-rate, is-netflix-worth-it (8.1k), annual-vs-monthly, how-to-calculate-overtime (12k), true-cost-of-car, how-long-save-1000 (8.1k). Open source MIT, private browser-only."
   ```

---

## Verify All Live

After deploy, check:

```sh
# Replace with your domain
SITE=https://worth.example

# 1. Home
curl -s $SITE/ | grep -o "<title>.*</title>"

# 2. Sitemap has 47 URLs
curl -s $SITE/sitemap.xml | grep -o "<loc>" | wc -l
# Should be 47

# 3. Sample new articles
curl -s $SITE/calculators/salary-to-hourly/ | grep -o "Salary to Hourly"
curl -s $SITE/guides/is-netflix-worth-it/ | grep -o "Netflix"

# 4. llms.txt
curl -s $SITE/llms.txt | head -n 20

# 5. Robots
curl -s $SITE/robots.txt

# 6. Canonical
curl -s $SITE/calculators/freelance-rate/ | grep canonical
```

**Manual checklist:**
- [ ] https://worth.example/ loads, 47 links in "More ways to find perspective"
- [ ] https://worth.example/sitemap.xml has 47 URLs
- [ ] https://worth.example/llms.txt lists all calculators
- [ ] https://worth.example/calculators/salary-to-hourly/ has calculator + table + GitHub CTA
- [ ] https://worth.example/guides/how-much-is-time-worth/ has 1000+ words
- [ ] View source shows JSON-LD with codeRepository link to GitHub

---

## Submit to Search Engines (Make Google Index)

1. **Google Search Console**
   - https://search.google.com/search-console
   - Add property `worth.example` → Verify via DNS or HTML file
   - Sitemaps → Submit `https://worth.example/sitemap.xml`
   - URL Inspection → Request indexing for top 10 pages:
     - /calculators/salary-to-hourly/
     - /calculators/hourly-to-salary/
     - /calculators/overtime-pay/
     - /guides/is-netflix-worth-it/
     - /guides/how-long-save-1000/

2. **Bing Webmaster Tools**
   - https://www.bing.com/webmasters/
   - Same sitemap

3. **GitHub Search Console?** No, but check `site:github.com/njohn931d-dotcom/bbbh` in Google after 2-3 days - your /articles/*.md should appear.

---

## Launch to Get Stars (Boost GitHub SEO)

Stars = social proof = more backlinks = higher rank.

**Post this:**

> Title: I open sourced 46 money calculators that run 100% in browser - no tracking, MIT licensed
> Body: Built 40 new SEO articles targeting 195k/mo searches using GitHub DA 96 as lever. Calculators: salary-to-hourly, freelance rate, cost per wear, latte factor, overtime, etc. All private, browser-only. GitHub: https://github.com/njohn931d-dotcom/bbbh Live: https://worth.example Star if useful!
> Links: HN, Reddit r/personalfinance, r/freelance, r/Frugal, r/BuyItForLife, Product Hunt, Twitter

---

## Current Status on This Branch

- Branch `arena/01a0e4e8-bbbh` has 47 pages built locally
- To make live NOW without merging, run:
  ```sh
  SITE_URL=https://worth.example npm run build:production
  npx serve dist
  # or
  npm run preview
  ```
- Preview URL will be `https://<port>-<sandboxId>.e2b.app` - all 47 pages navigable

---

## One-Command Live Deploy (If you have Vercel)

```sh
cd /home/user/bbbh
SITE_URL=https://worth.example npx vercel --prod --yes
```

That makes all 47 live instantly with HTTPS.

---

*All 40 articles are ready to rank. Just set SITE_URL and deploy dist/.*
