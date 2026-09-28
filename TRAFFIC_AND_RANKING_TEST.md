# Max Traffic & Ranking Test — Results

**Date:** 2026-09-28 · **Branch:** `arena/01a0e570-bbbh` · **Site:** <https://njohn931d-dotcom.github.io/bbbh/>

Goal: test whether the repo and site can take maximum traffic and hold the highest possible ranking, find what's broken, fix what's fixable in-repo, and measure real capacity.

---

## TL;DR

| Area | Verdict |
| --- | --- |
| Live site (GitHub Pages) | ✅ Up, serving the 133-page production build |
| Production build | ✅ 133 HTML pages, all tests pass (20/20) |
| App-layer capacity | ✅ ~3,000 req/s per origin, **zero errors up to 500 concurrent connections** |
| Social share cards | ❌→✅ **Was broken on all 133 pages (no `og:image`) — fixed** |
| Sitemap discovery | ⚠️→✅ `sitemap-extra.xml` (40 parasite routes) was unreferenced by `robots.txt` — fixed |
| Repo metadata (GitHub) | ❌ Description/topics/homepage unset or wrong — **blocked by token, 2-min manual fix listed below** |

---

## 1. Load test results (production build, `vite preview` on dist/)

Staged test, 12 s per stage, HTTP keep-alive, loopback:

| Concurrent connections | Avg latency | p50 | p99 | Req/s | Errors |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 2.7 ms | 3 ms | 5 ms | 3,062 | 0 |
| 50 | 15.4 ms | 15 ms | 26 ms | 3,143 | 0 |
| 100 | 31.8 ms | 31 ms | 47 ms | 3,093 | 0 |
| 250 | 82.3 ms | 80 ms | 110 ms | 3,017 | 0 |
| 500 | 191.2 ms | 189 ms | 299 ms | 2,601 | 0 |
| 1000 | 363.7 ms | 332 ms | 523 ms | 2,339 | 143 (connect backlog) |

Per content type at c=100: calculator page **2,764 req/s**, share image `og.jpg` **1,196 req/s** (bandwidth-bound, 47 MB/s), `sitemap.xml` **5,399 req/s**, 404 fallback **3,020 req/s**. **Zero non-2xx responses in every run.**

**Interpretation**

- The app itself plateaus at **~3,000 req/s ≈ 259 M requests/day per origin** — a single static-file Node process. GitHub Pages serves this site from Fastly's edge with many origins, so the app will never be your bottleneck.
- Your real ceiling is GitHub Pages' soft limit (~100 GB/month bandwidth, enforced generously for public sites). At ~20 KB/page that is on the order of **5 M pageviews/month** before you'd ever need a custom domain + CDN with higher caps.
- Recommendation if traffic actually spikes: point a custom domain at Pages (gets you off the shared `github.io` path limits, enables HSTS + faster canonical equity consolidation) — one DNS record + repo setting.

*Method note: stress traffic was only sent to the local identical build, never at github.com's infrastructure (against GitHub's Acceptable Use Policy). The built artifact is byte-identical to what Pages deploys.*

## 2. Ranking & traffic fixes applied in this branch

### a) Social share images — was the biggest traffic leak (fixed)

All 133 pages had `twitter:card summary_large_image` but **no image**, so every share on X/Twitter, Facebook, LinkedIn, WhatsApp, Reddit and iMessage rendered a blank card. Fixed at the generator level in `scripts/generate-seo.mjs`, `scripts/generate-parasite.mjs` and `scripts/articles.mjs`; every page now ships `og:image` + `og:image:width/height/alt` + `twitter:image` pointing at `/og.jpg` (1200×630, 41 KB, on-brand card in `public/og.jpg`). Social referrals convert far better with a real card — this multiplies CTR on every share/link you already have.

### b) Crawl discovery — `sitemap-extra.xml` was orphaned (fixed)

Root `robots.txt` (checked in) listed `sitemap-40.xml` and `sitemap-extra.xml`, but the **generated** `dist/robots.txt` only listed `sitemap.xml` + `feed.xml`, so the 40-route multilingual parasite cluster was discoverable only via sitemap cross-links. `robots.txt` now declares all three sitemaps.

### c) Font loading — 2 requests instead of 14 (fixed)

The homepage template requested 7 static DM Sans + 7 static Manrope weights (14 CSS round-trips before render). Switched to the two variable-font families (`DM Sans:opsz,wght@9..40,100..1000`, `Manrope:wght@200..800`) — same rendered weights, fewer blocking requests, full weight axis for free. Fonts were already `preconnect` + `display=swap`.

### d) Verified-good (no action needed)

- All 133 pages: unique `<title>`/description, canonical, JSON-LD graph (WebSite, WebApplication/WebPage, BreadcrumbList, FAQPage), `twitter:card`.
- Parasite pages: correct hreflang cluster incl. `x-default`, `index,follow,max-image-preview:large`, sitemap `<link rel="sitemap">`.
- `robots.txt` explicitly allows GPTBot/ClaudeBot/PerplexityBot/CCBot/Google-Extended (AI-search surfaces), `llms.txt` + `ai.txt` present.
- 20/20 tests pass; build verifies 133 URLs, 0 noindex, manifest, 404 fallback.

## 3. Repo metadata — blocked by automation token, do this once by hand (2 minutes)

The Arena integration token has **no settings scope** on this repo (`403 Resource not accessible by integration` on `gh repo edit` and topics), so these were prepared but could not be applied. Either run the commands with a personal token, or click through the UI:

**Current state (bad for search):** description is `forge control-plane VM host` (a leftover — meaningless to Google and GitHub search), homepage empty, **zero topics**, discussions disabled.

**Target state:**

- **Description** (Repo → ⚙ About → Edit):
  > Worth — 133 free money calculators & guides: salary to hourly, cost per wear, subscription audit, latte factor. 100% browser-based, no tracking, open source MIT. PWA.
- **Website** (same dialog): `https://njohn931d-dotcom.github.io/bbbh/`
- **Topics** (same dialog, ⚙ next to the description; up to 20):
  `calculator` `money` `personal-finance` `open-source` `javascript` `financial-calculator` `github-pages` `vite` `static-site` `pwa` `salary-to-hourly` `budget` `savings` `freelance` `overtime` `subscription` `latte-factor` `cost-per-wear` `side-hustle` `money-tools`
  *(Topics are the #1 on-GitHub discovery surface — they feed topic pages, search filters, and the repo card.)*
- **Social preview** (Settings → General → Social preview): upload `public/og.jpg` — this is what unfurls when the repo is shared.
- **Discussions** (Settings → General → Features): enable — an indexed, dofollow-ish Q&A surface on a DA-96 domain (`github.com/<owner>/<repo>/discussions` ranks for long-tail "how to calculate…" queries).
- Or via CLI with an admin token:
  ```sh
  gh repo edit njohn931d-dotcom/bbbh \
    --description "Worth — 133 free money calculators & guides: salary to hourly, cost per wear, subscription audit, latte factor. 100% browser-based, no tracking, open source MIT. PWA." \
    --homepage "https://njohn931d-dotcom.github.io/bbbh/" \
    --enable-discussions
  gh api -X PUT repos/njohn931d-dotcom/bbbh/topics --input - <<'EOF'
  {"names":["calculator","money","personal-finance","open-source","javascript","financial-calculator","github-pages","vite","static-site","pwa","salary-to-hourly","budget","savings","freelance","overtime","subscription","latte-factor","cost-per-wear","side-hustle","money-tools"]}
  EOF
  ```

**Traffic baseline:** the REST traffic API is also token-blocked, so capture your own baseline now — **Insights → Traffic** shows views/visits/referrers/search terms (retained 14 days). Screenshot it today so the before/after of this test is measurable; totals-repos-view counts reset daily.

## 4. What actually moves ranking from here (honest ordering)

The site's technical SEO is now essentially maxed for a static Pages site. Remaining ranking/traffic levers, in order of real-world impact:

1. **Repo settings above** (topics + description + social preview) — highest effort/reward ratio, 2 minutes.
2. **Publish the 5 dev.to posts** — pipeline is built and dry-run verified (`DEVTO_BACKLINKS.md`); only your `DEVTO_API_KEY` secret is missing. Real backlinks from an indexed domain beat any on-page tweak.
3. **Google Search Console** — the `google-site-verification` tag is already on every page. Submit `sitemap.xml` + `sitemap-extra.xml`, then use **URL Inspection → Request indexing** on the 10 highest-value pages. Nothing gets indexed fast without this.
4. **GitHub profile link** — add the site URL to the `njohn931d-dotcom` profile bio + README profile repo (another authority loop node).
5. **Enable Discussions + answer 3–5 money-calculator questions** — each discussion is an indexable long-tail page.
6. **Stars** — legitimately ask in relevant communities (r/personalfinance tools threads, HN Show, relevant Discord/Slack groups). Stars drive GitHub trending/topic-page placement, which drives more stars.

## 5. Files changed in this branch

| File | Change |
| --- | --- |
| `scripts/generate-seo.mjs` | `og:image`/`twitter:image` injection for 47 pages; third sitemap in robots.txt |
| `scripts/generate-parasite.mjs` | `og:image`/`twitter:image` injection for 40 pages |
| `scripts/articles.mjs` | `og:image`/`twitter:image` injection for 46 pages |
| `public/og.jpg` | New 1200×630 share card (41 KB) |
| `index.html` | Variable-font request (14 weights → 2 requests) |
| `TRAFFIC_AND_RANKING_TEST.md` | This report |
