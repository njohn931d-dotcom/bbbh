# Affiliate Income Lab

> Mounted at `/affiliate-marketing/` on a shared host. The repository root is occupied by a
> separate project (the Forge Workspace landing page) — see the [root README](../README.md).

An SEO-optimised affiliate marketing content site: a conversion-focused landing page, a long-form
pillar article, and a program comparison page — all built around high-volume, buyer-intent keywords.

Plain HTML, CSS and vanilla JavaScript. **No build step, no dependencies, no framework.**

---

## Quick start

```bash
npm start          # http://localhost:3000 (serves both projects)
npm run build      # regenerate pages, sync nav + footer, rebuild sitemap.xml + rss.xml
npm run check      # validate SEO, JSON-LD, internal links, a11y basics
```

The preview server (`server.js`) serves clean directory URLs (`/best-affiliate-programs/`), gzips
text responses, sets correct MIME types and cache headers, and returns a real `404.html`.

For production, deploy the repository root to any static host (Netlify, Cloudflare Pages, Vercel,
S3 + CloudFront, Nginx). Nothing here requires a runtime.

---

## Site structure

A hub-and-spoke content cluster: one hub (`/guides/`) linking to eight articles, each cross-linking
to the others by topic.

| Path | Primary target keywords | Volume/mo |
|---|---|---|
| `/` | affiliate marketing for beginners, make money with affiliate marketing | 14,800 · 8,100 |
| `/guides/` | affiliate marketing guides (hub page) | — |
| `/affiliate-marketing-for-beginners/` | affiliate marketing for beginners, how to start affiliate marketing | 14,800 · 8,100 |
| `/ways-to-generate-income-with-affiliate-marketing/` | ways to generate income with affiliate marketing | 12,100 · 8,100 |
| `/affiliate-marketing-websites/` | affiliate marketing websites, affiliate website examples | 22,200 · 5,400 |
| `/high-ticket-affiliate-marketing/` | high ticket affiliate marketing | 9,900 |
| `/passive-income-ideas/` | passive income ideas, passive income streams | 74,000 |
| `/amazon-affiliate-commission-rates/` | amazon affiliate commission rates, amazon affiliate commission | 9,900 · 18,100 |
| `/best-affiliate-programs/` | best affiliate programs, best affiliate programs for beginners | 12,100 · 2,400 |
| `/recurring-commission-affiliate-programs/` | recurring commission affiliate programs | 1,300 |
| `/about/` | E-E-A-T signal — author, methodology, editorial policy | — |
| `/legal/privacy/` | FTC affiliate disclosure + privacy policy | — |
| `/404.html` | Custom 404 with internal-link recovery | — |

Supporting files inside this package: `rss.xml`, `site.webmanifest`, `llms.txt` (for AI and answer-engine
citations), `assets/`. The `robots.txt` and `sitemap.xml` shared with the sibling project live at the
**repository root**, because crawlers only read them from the domain root.

### Content cluster architecture

```
/guides/  (hub)
├── /affiliate-marketing-for-beginners/          beginner path
├── /ways-to-generate-income-with-affiliate-marketing/   pillar
├── /affiliate-marketing-websites/               strategy
├── /high-ticket-affiliate-marketing/            premium models
├── /recurring-commission-affiliate-programs/    premium models
├── /amazon-affiliate-commission-rates/          program data
├── /best-affiliate-programs/                    program data
└── /passive-income-ideas/                       broad intent
```

Every article links to at least three siblings in-content (not just in the footer), which is what
distributes authority through the cluster. The global footer is synced from one definition in
`tools/build.py`, so all pages share an identical internal-link map.

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

## How the build works

There is no bundler, no framework and no dependency tree. `tools/build.py` is the entire pipeline
and it is only needed when you change content — the committed HTML is deployable as-is.

```bash
python3 tools/build.py          # build pages, sync nav/footer, write sitemap.xml + rss.xml
python3 tools/build.py --check  # report which generated pages are stale
```

What it does:

1. **Generates article pages** from `content/*.html` partials. Each partial starts with a
   `<!--META {json} META-->` front-matter block carrying keywords, the OG image and any page-specific
   JSON-LD. The builder wraps it in the shared head, header, breadcrumbs and footer.
2. **Syncs the navigation** into every `.html` file from a single `NAV` definition, setting
   `aria-current` per page automatically.
3. **Syncs the footer** into every page that uses the `.footer-grid` layout, so the internal-link map
   is identical sitewide and cannot drift.
4. **Regenerates `sitemap.xml`** (with image sitemap extensions) and **`rss.xml`** from the `PAGES`
   registry.

To add an article: create `content/your-slug.html` with a META block, add an entry to `PAGES` in
`tools/build.py`, then run the build. The nav, footer, sitemap and feed all update themselves.

Hand-written pages (`index.html`, `best-affiliate-programs/`, `ways-to-generate-income-with-affiliate-marketing/`)
are marked `"partial": None` in the registry — the builder still syncs their nav and footer and includes
them in the sitemap, but leaves their content alone.

## Moving this site (subpath vs domain root)

Everything is prefix-aware. `SITE` and `BASE` at the top of `tools/build.py` control every URL in the
build — canonical tags, Open Graph URLs, JSON-LD `@id` values, internal links, the sitemap and the feed.

| Scenario | `SITE` | `BASE` |
|---|---|---|
| Current (subpath on a shared host) | `https://affiliateincomelab.com` | `/affiliate-marketing` |
| Promoted to its own domain root | `https://yourdomain.com` | `""` (empty) |

Change the two constants, run `npm run build`, then `npm run check`. Nothing else needs editing — this is
why the site was written with a `BASE` constant rather than hardcoded absolute paths.

Note that `robots.txt` and `sitemap.xml` live at the **repository root**, not in this package, because
crawlers only read them from the domain root. The builder writes the root sitemap for you and includes
the sibling project's URL in it.

## Customising

**1. Set your domain and base path.** Change `SITE` and `BASE` in `tools/build.py`, then rebuild:

```bash
# edit SITE / BASE at the top of tools/build.py
npm run build
npm run check
```

The builder rewrites canonical tags, OG URLs, JSON-LD identifiers, internal links, `sitemap.xml` and
`rss.xml` for you. Do not hand-edit URLs in the generated pages — they will be overwritten.

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

- [ ] Set `SITE` and `BASE` in `tools/build.py` to your real host and path, then rebuild
- [ ] Replace the `hello [at] affiliateincomelab.com` contact address
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
| `assets/css/styles.css` | 24 KB (≈6 KB gzipped) |
| `assets/js/main.js` | 8 KB (≈3 KB gzipped) |
| Heaviest page HTML (passive income guide) | ≈48 KB (≈15 KB gzipped) |
| Lightest page (guides hub) | ≈15 KB (≈4.7 KB gzipped) |
| Images | WebP served first, PNG fallback — 78% smaller |
| Web fonts | none |
| Third-party scripts | none |
| Total requests, first view (homepage) | 6 |

Images use `<picture>` with a WebP `<source>` and a PNG fallback, cutting image weight from 388 KB to
87 KB. Every `<img>` carries explicit `width`/`height` so there is no layout shift, and the hero image
uses `fetchpriority="high"` for LCP.

## License

UNLICENSED — proprietary. All rights reserved.
