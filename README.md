# bbbh → RevenueKit

An **SEO-first static site + content engine** for RevenueKit — a digital-products
brand selling software, scripts and SaaS kits, fronted by data-backed guides on
ways to generate income online.

The generated HTML is **committed**, so any static host serves it with **no build
step**. The generator exists for maintenance, not deployment.

---

## Quick start

```bash
# Serve locally (any static server works — there is nothing to compile)
python3 -m http.server 8080 --bind 0.0.0.0
# → http://localhost:8080/

# Rebuild the site from content sources (only needed after editing content/)
node scripts/build-site.js

# Gate: on-page SEO + link/schema/integrity audit (exit 1 on any blocker)
node scripts/seo-audit.js

# Regenerate OG images / favicons (needs ImageMagick)
bash scripts/build-assets.sh

# Retarget canonicals to your own domain, then rebuild + audit
bash scripts/set-domain.sh https://revenuekit.dev ""
```

## What’s in the repo

```
index.html                      Landing page (hub) — generated, committed
ways-to-generate-income/        PILLAR article: 21 methods ranked (~5,000 words)
sell-digital-products/          Cluster guide (9-stage selling playbook)
passive-income-ideas/           Cluster guide (14 ideas, reality-scored)
micro-saas-ideas/               Cluster guide (23 ideas + validation gate)
digital-product-pricing/        Cluster guide (value-based pricing)
launch-kit/                     Free lead-magnet page (template, checklist, worksheet)
tools/                          Product catalogue (SoftwareApplication schema)
about/                          E-E-A-T: author, method, disclosure, corrections log
404.html                        Custom 404 that re-links the whole site
content/*.html                  SOURCE body fragments (edit these, not the output)
scripts/pages.js                SOURCE of truth: metadata, FAQs, products, JSON-LD
scripts/build-site.js           Zero-dependency static site generator
scripts/seo-audit.js            Zero-dependency SEO/integrity auditor (CI gate)
scripts/build-assets.sh         OG image + favicon rasterizer (ImageMagick)
scripts/set-domain.sh           Canonical/origin retarget + rebuild
assets/css/main.css             Design system: light/dark, AA contrast, print styles
assets/js/main.js               Progressive enhancement only (~4 KB, deferred)
assets/img/                     OG cards 1200×630, favicons, logo (committed PNGs)
.github/workflows/seo-audit.yml CI: rebuild, fail on drift, run the audit
```

**Content ↔ schema can never drift:** FAQs, products and article metadata live in
`scripts/pages.js`; the generator renders *both* the visible HTML and the JSON-LD
from those same objects. The audit then verifies FAQ answers appear verbatim on
the page.

## SEO implementation (the point of this repo)

- **Architecture:** pillar + cluster topic map, every page interlinked; relative
  internal links so the site works at a domain root, `/bbbh/` on GitHub Pages, or
  any sub-path/preview host.
- **On-page:** one `h1` per page, non-skipping heading order, ≤60-char titles,
  120–160-char descriptions, self-referential absolute canonicals, breadcrumb
  trails (visible + schema), TOC with anchor links, comparison tables with
  captions, FAQ accordions (`<details>`, works with JS off), dated bylines with
  author links, reading time and word count.
- **Structured data:** `WebSite`, `Organization`, `Person`, `WebPage/AboutPage`,
  `Article`+`TechArticle` (author, dates, wordCount, timeRequired), `BreadcrumbList`,
  `FAQPage`, `ItemList` + `SoftwareApplication`/`Offer` for every product,
  `CreativeWork` for the free kit.
- **Discovery:** `robots.txt` → `sitemap.xml` (lastmod/changefreq/priority),
  `.nojekyll`, custom 404, `site.webmanifest`, SVG+PNG favicons.
- **Social:** Open Graph + Twitter cards with per-page 1200×630 images and alt text.
- **Performance/CWV:** zero third-party requests, system font stack, one CSS file,
  deferred optional JS, inline SVG art, width/height on raster images, dark mode
  without a flash, print stylesheet, `prefers-reduced-motion` respected.
- **E-E-A-T:** named author with bio page, methodology section, corrections log,
  affiliate disclosure, conservative sourced ranges (Precedence Research,
  Goldman Sachs, platform fee pages), “not financial advice” labelling.
- **Audit gate:** `scripts/seo-audit.js` fails CI on broken links, dangling
  anchors, duplicate/long titles, missing canonicals, heading-order jumps,
  unparsable or page-inconsistent JSON-LD, missing OG images, sitemap drift.

## Deploy to GitHub Pages

The generated site is plain static files at the repo root.

1. **Make the repository public** (private repos only get Pages on paid plans,
   and private Pages URLs are not crawlable — which defeats the purpose).
2. *Settings → Pages → Source:* choose **Deploy from a branch**, branch
   `main` (after merging the PR) and folder `/ (root)`.
   Or via CLI once permissions allow:
   `gh api -X POST repos/<owner>/<repo>/pages -f source[branch]=main -f source[path]=/`
3. Your site is live at `https://<owner>.github.io/<repo>/`.
4. When you move to a custom domain:
   `bash scripts/set-domain.sh https://yourdomain.com ""` and commit —
   canonicals, OG URLs, sitemap and all JSON-LD retarget in one command.

Other hosts: `netlify.toml` is included (build command runs generator + audit);
Cloudflare Pages/S3/any nginx box can serve the root directory as-is.

## Editing content

1. Edit `content/<page>.html` (pure body fragments — headings need `id`s for the
   auto-TOC) or metadata/FAQs/products in `scripts/pages.js`.
2. `node scripts/build-site.js`
3. `node scripts/seo-audit.js` (must exit 0; CI enforces it and also fails if you
   forget to commit regenerated output).
4. Commit both sources **and** generated files.

Markers available inside content fragments: `{{WORDS}}`, `{{READ}}`,
`{{UPDATED}}`, `{{YEAR}}`, `{{READ_PILLAR}}`, `{{FAQ:<key>}}` (renders the same
data as the FAQPage schema) and `{{PRODUCTS}}` (same data as the Offer schema).

## Honesty policy baked into the content

No fabricated testimonials or review counts, no aggregateRating schema without
real reviews, ranges published at their conservative end, “passive” claims
labelled with true maintenance hours, and affiliate links disclosed in-line.
The audit enforces the mechanical half of this; the editorial half is written
into `content/about.html`.
