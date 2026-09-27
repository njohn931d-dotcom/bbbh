# GitHub SEO: How to Rank Using GitHub

GitHub is not just for code. It's a DA 96 domain that Google trusts. Here's how to use it to rank your money calculators.

## 1. GitHub Domain Authority

- github.com DA 96 (Moz), DR 94 (Ahrefs)
- Any public repo, README, markdown file, wiki, gist, profile can rank
- Search `site:github.com calculator` → 2M results, but long-tails easy

## 2. Keywords That Include "github"

People search:
- "salary to hourly calculator github" - 1,800/mo
- "freelance rate calculator github" - 1,200/mo
- "cost per wear calculator github" - 400/mo
- "open source budget calculator" - 900/mo

Low competition because most finance blogs don't have GitHub presence.

## 3. What Google Sees on GitHub

### README.md
- Indexed as page title = repo name
- First 155 chars = meta description
- H1, H2s, tables, links all parsed
- Our README lists 40 keywords in table → ranks for "money calculator github"

### /articles/*.md
- Each markdown file is its own URL: `github.com/user/repo/blob/main/articles/salary-to-hourly.md`
- Google indexes blob pages
- Frontmatter not needed, but we include keyword, description
- Each file links to live site → passes juice

### Code Search
- `app.js` contains formulas with comments
- GitHub code search indexes comments
- Search "hourly to salary formula javascript" → our repo

### Wiki
- Enable wiki, create page "Formulas" linking to all calculators
- Wiki pages also DA 96, indexed

### Gists
- Create gist for each calculator formula, link to repo
- Gists rank for "javascript calculator gist"

## 4. On-Page SEO for GitHub Repo

### About Section (Edit via UI)
- **Website:** https://worth.example
- **Description:** "46 free money calculators, open source on GitHub. Salary to hourly, cost per wear, latte factor. Private, no sign-up, browser-only. MIT License."
- Includes keywords: calculators, open source, salary to hourly, etc.

### Topics (Add 20 via UI)
`calculator`, `money`, `personal-finance`, `open-source`, `javascript`, `financial-calculator`, `hourly-rate`, `budget`, `latte-factor`, `cost-per-wear`, `freelance`, `overtime`, `subscription`, `savings`, `minimalism`, `side-hustle`, `github-pages`, `vite`, `static-site`

Topics are searchable on GitHub, and Google indexes topic pages.

### Social Preview
Upload `public/og.png` as social preview in repo settings → shows on Twitter, etc.

### FUNDING.yml
Create `.github/FUNDING.yml` with GitHub sponsors → authority signal.

## 5. Backlink Loop (Most Important)

```
Live Site (worth.example) 
   → links to GitHub repo (every page footer "View source on GitHub")
   → GitHub repo README links to Live Site
   → /articles/*.md link to Live Site calculators
   → GitHub profile links to Live Site
```

This loop tells Google: GitHub repo and live site are same entity, share authority.

## 6. Stars, Forks, Watchers = Social Proof

- Google doesn't directly use stars, but correlates: popular GitHub repos get more backlinks, mentions, traffic → rank better
- Ask users: "Star if useful" in calculator UI
- Goal: 100 stars first month, 500 first year
- How: Post on HN, Reddit, Product Hunt, Twitter

## 7. Release Strategy

Create releases with keyword-rich notes:

**v1.0:** "Launch 46 free money calculators open source - salary to hourly, freelance rate, cost per wear, latte factor, overtime, subscription audit, 30-day no spend challenge"

Releases are indexed, create new URLs: `github.com/user/repo/releases/tag/v1.0`

## 8. GitHub Pages SEO

Even though we deploy to custom domain, GitHub Pages (if enabled) creates `username.github.io/repo` which also has DA 96 and can rank. Could enable Pages from `dist/` branch as secondary.

## 9. Measuring GitHub SEO

- **GitHub Traffic:** Insights → Traffic → Views, clones (shows if GitHub search drives)
- **Google Search Console:** Add both worth.example and github.com/user/repo? No, GSC only for your domain, but you can search `site:github.com/user/repo` in Google to see indexed pages
- **SERP check:** Search "salary to hourly calculator github" weekly, track position
- **Ahrefs:** Check backlinks to repo and live site

## 10. Advanced: GitHub as CDN for SEO Content

- Host calculators JSON data in repo, fetch via raw.githubusercontent.com (fast, free CDN)
- Use GitHub Actions to generate sitemap daily, commit to repo (shows freshness)
- Use GitHub Discussions for Q&A: each discussion thread can rank for long-tail questions like "how to calculate freelance rate with benefits"

## Checklist for This Repo

- [x] 40 markdown articles in /articles/
- [x] README with 40 keywords table
- [x] app.js comments with keywords
- [x] Every HTML page links to GitHub repo
- [x] og.png exists
- [ ] Add topics via GitHub UI (manual, can't via git)
- [ ] Set About website and description via UI
- [ ] Enable Wiki and create Formulas page
- [ ] Create FUNDING.yml
- [ ] Create release v1.0 with keywords
- [ ] Post launch to HN, Reddit
- [ ] Ask for stars in UI

## Example Search Queries We Target

- `salary to hourly calculator github` → articles/salary-to-hourly.md should rank
- `open source money calculator` → README should rank
- `cost per wear calculator javascript` → code search → app.js
- `free freelance rate calculator` → live site via backlink from GitHub

---

*GitHub SEO is white-hat: provide real open source value, get ranking as side effect.*
