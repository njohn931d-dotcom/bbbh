# Affiliate Income Lab

An SEO-optimised affiliate marketing content site: a conversion-focused landing page, a long-form
pillar article, and a program comparison page — all built around high-volume, buyer-intent keywords.

Plain HTML, CSS and vanilla JavaScript. **No build step, no dependencies, no framework.**

---

## Quick start

```bash
npm start          # http://localhost:3000
npm run check      # validate SEO, JSON-LD, internal links, a11y basics
```

The preview server (`server.js`) serves clean directory URLs (`/best-affiliate-programs/`), gzips
text responses, sets correct MIME types and cache headers, and returns a real `404.html`.

For production, deploy the repository root to any static host (Netlify, Cloudflare Pages, Vercel,
S3 + CloudFront, Nginx). Nothing here requires a runtime.

---

## Site structure

| Path | Target keywords | Volume |
|---|---|---|
| `/` | affiliate marketing for beginners, make money with affiliate marketing | 14,800 · 8,100 |
| `/ways-to-generate-income-with-affiliate-marketing/` | ways to generate income with affiliate marketing, affiliate marketing income ideas | 12,100 · 8,100 |
| `/best-affiliate-programs/` | best affiliate programs, best affiliate programs for beginners, recurring commission affiliate programs | 12,100 · 2,400 · 1,300 |
| `/about/` | E-E-A-T signal — author, methodology, editorial policy | — |
| `/legal/privacy/` | FTC affiliate disclosure + privacy policy | — |
| `/404.html` | Custom 404 with internal-link recovery | — |

Supporting files: `robots.txt`, `sitemap.xml`, `site.webmanifest`, `llms.txt` (for AI/answer-engine
citations), `assets/`.

---

## What makes this SEO-optimised

**Technical**
- Semantic HTML5, one `<h1>` per page, logical heading order
- Canonical URLs, `hreflang` (en + x-default), Open Graph and Twitter Card tags
- `robots` meta with `max-image-preview:large` and `max-snippet:-1`
- XML sitemap with image sitemap extensions; `robots.txt` explicitly allows major and AI crawlers
- Zero render-blocking resources besides one ~24 KB stylesheet; deferred JS; no web fonts
- Every `<img>` has `width`/`height` and `alt`; hero image is `fetchpriority="high"` — no CLS
- `prefers-color-scheme` dark mode and `prefers-reduced-motion` support

**Structured data (JSON-LD)**
- `Organization`, `WebSite`, `WebPage`, `BreadcrumbList`, `WebApplication`
- `BlogPosting` with full author/publisher linkage and `datePublished`/`dateModified`
- `FAQPage` (9 questions on the homepage, 8 on each article page)
- `ItemList` (the 17 ways), `HowTo` (the 90-day roadmap), `Person` (author entity)

**Content**
- Direct answer box at the top of each page — the format AI Overviews and featured snippets pull from
- Comparison tables with `<caption>`, `<thead>`/`<tbody>`/`<tfoot>` and `scope` attributes
- Real keyword volumes with intent and difficulty, plus a keyword-to-income-model map
- Inline FAQ with anchor-linked deep links; table of contents with scrollspy
- Visible author byline, publication and modified dates, methodology page, disclosure on every page

---

## Interactive features

| Feature | Implementation |
|---|---|
| **Affiliate income calculator** | `traffic × CTR × CVR × commission`, plus a recurring-commission layer, earnings-per-1,000-visitors, and a compounding month-12 projection. Runs entirely client-side. |
| Table of contents | IntersectionObserver scrollspy with `aria-current` |
| Reading progress bar | `requestAnimationFrame`-throttled |
| FAQ accordions | Native `<details>`/`<summary>` — works with JS disabled |
| Deep links | `#faq-...` URLs auto-expand the matching `<details>` |
| Mobile nav | CSS-driven, `aria-expanded` managed |

---

## Customising

**1. Set your domain.** Replace `https://affiliateincomelab.com` everywhere:

```bash
grep -rl "affiliateincomelab.com" --include="*.html" --include="*.xml" --include="*.txt" . \
  | xargs sed -i 's|https://affiliateincomelab.com|https://YOURDOMAIN.com|g'
```

**2. Add your affiliate links.** Search for the CTA anchors and insert your tracking URLs.

**3. Connect the email form.** `#cta-email` posts nowhere by default — the JS confirms locally rather
than pretending to succeed. Point `action` at your provider (ConvertKit, Beehiiv, Mailchimp) or
handle the submit inside `initForms()` in `assets/js/main.js`.

**4. Replace the author.** Update the `Person` schema and byline in the article and `about/` pages.

**5. Verify the numbers.** Search volumes are directional aggregates of public keyword-tool
estimates and change monthly. Commission ranges are typical published rates that vendors change
often — confirm both before you build content around them.

---

## Regenerating images

`assets/img/` holds generated assets: `favicon.svg`, `icon-192.png`, `icon-512.png`,
`hero-affiliate-income.png` (the 12-month revenue chart), and three 1200×630 OG cards. The OG cards
are PNG rather than SVG because most social platforms do not render SVG previews.

---

## Pre-launch checklist

- [ ] Replace the placeholder domain and `hello [at] affiliateincomelab.com` contact address
- [ ] Insert real affiliate links and confirm each program's current terms
- [ ] Wire the email form to your provider
- [ ] Add your real author bio, credentials and photo to `about/`
- [ ] Verify search volumes in your own keyword tool
- [ ] Run `npm run check`
- [ ] Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools
- [ ] Validate structured data with the [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Test Core Web Vitals with PageSpeed Insights on the deployed URL
- [ ] Replace the illustrative income figures with your own data once you have it

---

## Compliance notes

Affiliate content is regulated. This repo ships the pieces you need, but you are responsible for
accuracy:

- **FTC disclosure** (16 CFR Part 255) appears inline on every page, above the affiliate links —
  not buried in the footer. EU, UK and other jurisdictions have equivalents.
- **Amazon's operating agreement** requires its own specific disclosure wording if you join.
- **Financial and insurance offers** are regulated in most jurisdictions. Never give regulated
  advice without a licence, and keep the disclaimers this repo includes.
- **Earnings claims** are modelled benchmarks, labelled as such. Do not present them as guarantees.

See `/legal/privacy/` for the full disclosure text.

---

## Performance budget

| Asset | Size |
|---|---|
| `assets/css/styles.css` | ~24 KB (≈6 KB gzipped) |
| `assets/js/main.js` | ~8 KB (≈3 KB gzipped) |
| Homepage HTML | ~45 KB (≈12 KB gzipped) |
| Web fonts | none |
| Third-party scripts | none |

## License

UNLICENSED — proprietary. All rights reserved.
