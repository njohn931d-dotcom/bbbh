# SEO Strategy: 40 Articles to Rank Using GitHub

**Goal:** Rank #1 for 40 money calculator keywords using GitHub's Domain Authority 96 as primary lever.

## Why GitHub?

- **DA 96** - github.com outranks most finance blogs (DA 40-70)
- **Trust** - Open source code = E-E-A-T (Expertise, Experience, Authority, Trust) signal to Google
- **Indexing** - GitHub markdown files are indexed for `site:github.com` searches
- **Backlinks** - Every GitHub repo linking to your site passes authority
- **Stars** - Social proof, correlates with ranking for "calculator github" queries
- **Code search** - Developers search "salary to hourly calculator github" → find repo → star → boost

## Keyword Research (40 keywords, 100k+ combined monthly searches)

### Tier 1: High volume, low competition (calculator + github modifier)

| Keyword | Volume | KD | Current top | Why we can win |
|---------|--------|----|-------------|----------------|
| salary to hourly calculator | 22k | 35 | Nerdwallet | Add "github" → 1.8k vol, KD 10, we rank |
| hourly to salary calculator | 18k | 32 | Calculator.net | Open source angle |
| overtime calculator | 12k | 40 | ADP | GitHub code transparency |
| how to calculate overtime | 12k | 38 | Indeed | Same |
| is netflix worth it | 8.1k | 45 | Reddit | Cost per hour calculator unique |
| how to save $1000 fast | 8.1k | 50 | Dave Ramsey | Daily habit calculator |
| freelance rate calculator | 8.1k | 28 | Freelancermap | Open source formula |

### Tier 2: Medium volume, informational (guides)

Target "how to" + money + github. Example: "how to audit subscriptions github template" - our markdown checklist ranks.

### Tier 3: Long-tail (cost per X)

Cost per wear, per use, per visit - low volume (1-3k) but high intent, easy to rank, high conversion to main calculator.

## Content Architecture: 47 Pages

- **Home** `/` - Hub, links to all 46, targets "free money calculators"
- **Calculators** 18 pages (3 original + 15 new) - Tool intent, embed JS calculator, tables, FAQ
- **Guides** 28 pages (3 original + 25 new) - Info intent, 1000+ words, tables, internal links to calculators

Every page:
- Title: Keyword first, 60 chars, includes year (2025) for freshness
- Description: 155 chars, includes keyword + value prop + "Free, open source on GitHub"
- H1: Same as title without branding
- Intro: 2 sentences, keyword in first 100 chars
- Body: 1000-1500 words, 2-4 H2s, 1 table minimum, 3+ internal links, GitHub CTA box
- FAQ: 2 questions minimum (FAQPage schema)
- Schema: WebSite, WebPage/WebApplication, BreadcrumbList, FAQPage, codeRepository link to GitHub
- Keywords meta: keyword, calculator, github, open source, worth

## GitHub Lever Tactics (10)

### 1. Markdown mirrors in /articles/
40 markdown files with frontmatter. Each targets same keyword as HTML but optimized for GitHub search. Contains live URL → drives traffic. Google indexes github.com files.

### 2. README keyword hub
README lists all 40 keywords with volumes in table. GitHub README is indexed, ranks for "money calculator github". Natural keyword stuffing.

### 3. Code comments with keywords
`app.js` contains comments like `// salary to hourly formula: annual ÷ 2080 - open source calculator github`. GitHub code search indexes comments.

### 4. Topics and About
Add 10 topics via GitHub UI: `calculator`, `money`, `personal-finance`, `open-source`, `javascript`, `financial-calculator`, `hourly-rate`, `budget`, `latte-factor`, `cost-per-wear`. About description includes keywords.

### 5. Release notes with keywords
Create release v1.0: "Release 40 free money calculators open source on GitHub - salary to hourly, freelance rate, cost per wear..."

### 6. Social preview image
`public/og.png` with text overlay "46 Free Calculators - Open Source on GitHub" - increases CTR from GitHub social.

### 7. Backlink loop
- HTML pages → link to GitHub repo (footer CTA)
- README → links to live site (worth.example)
- Articles/*.md → link to live calculators
- GitHub profile → link to live site

### 8. Stars campaign
Ask in each calculator: "Star on GitHub if useful". 100 stars = authority signal. GitHub trending for JavaScript if 50 stars in week → more visibility.

### 9. Forks and PRs
Encourage forks: "Fork and customize for your niche". Each fork creates backlink to original? GitHub shows fork network, increases repo visibility.

### 10. Wiki and Discussions
Enable Wiki: create page "Calculator Formulas" linking to all calculators. Enable Discussions: Q&A about formulas, each thread indexed.

## Technical SEO (Already Implemented)

- Static HTML before JS (crawlable without JS)
- Canonical URLs absolute (SITE_URL)
- Sitemap.xml with 47 URLs, priorities (home 1.0, calculators 0.9, guides 0.8), weekly changefreq
- Robots.txt allows all, points to sitemap
- Open Graph + Twitter card
- JSON-LD with codeRepository
- Internal linking: 47 links per page (hub)
- Noindex guard for previews
- Vite build emits directory index.html (clean URLs)
- Performance: static, no server, <20kB CSS, <12kB JS

## Content Velocity Plan

- **Week 1:** Publish 40 articles (done via generate-seo.mjs)
- **Week 2:** Submit sitemap to GSC, Bing, request indexing for 10 high-volume pages
- **Week 3:** Post on Hacker News: "I open sourced 46 money calculators that run in browser - GitHub", Product Hunt, Reddit r/personalfinance, r/freelance
- **Week 4:** Reach out to 20 finance blogs: "Free open source alternative to Calculator.net - embed our calculators"
- **Ongoing:** Update 1 article/week with fresh data (2025 → 2026), add to changelog

## Measurement

- GSC: Track impressions for "calculator github" queries
- GitHub: Stars, forks, traffic → clones graph
- Plausible (privacy): Pageviews per calculator, top 5
- Ranking: Check weekly for 40 keywords using SERP API

## Risks and Mitigations

- **Thin content?** Each article 1000+ words, unique tables, FAQs, not spun.
- **Duplicate?** Markdown mirrors canonical to HTML via live_url frontmatter, not indexed as duplicate because different domain (github.com vs worth.example) but same content - add note "Original at worth.example" to avoid.
- **GitHub spam?** Don't keyword stuff unnaturally, provide real value (open source code).

## Next Steps

- [x] 40 HTML pages generated
- [x] 40 markdown mirrors
- [x] README hub
- [ ] Add GitHub topics via UI (manual)
- [ ] Create release v1.0
- [ ] Submit sitemap
- [ ] Post launch

---

*This strategy uses GitHub as SEO lever, not just hosting. DA 96 + open source trust = ranking advantage over traditional blogs.*
