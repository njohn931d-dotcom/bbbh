# SEO strategy

This is the current, accurate strategy. It replaced an earlier document that
described tactics which turned out to be either broken or counterproductive;
those notes are summarised in [What changed and why](#what-changed-and-why)
so the reasoning is not lost.

## The core finding

The site previously had **133 URLs but roughly 87 distinct pages**. Forty-six of
them — the entire "parasite cluster", plus the homepage and the hub pages — were
rendered from one shared template. A mortgage calculator, a divorce-cost
calculator and a Chinese hourly-wage calculator shipped the same body text, the
same table of `$100 / $500 / hours at $35/hr`, and the same two FAQs, differing
only in the keyword spliced into the title.

That is a doorway-page pattern. Search engines are explicitly built to collapse
it: pages that differ only in a keyword produce no more value than one of them,
so the cluster earns roughly one page's worth of rankings spread across 46 URLs.
It also risks a "scaled content abuse" classification, which is a demotion, not
just a lost opportunity.

**The number of URLs was never the constraint. Distinctness was.** Adding more
template pages makes this worse, not better.

## What the site is now

| | |
|---|---|
| Indexable pages | 142 |
| Hand-written tools (English) | 46 |
| Generated cluster pages, each with its own formula, worked example and FAQ | 49 |
| Real translations | 10 across 9 languages |
| SEO audit errors | 0 |
| hreflang annotations | 70, all reciprocal |
| Broken internal links | 0 |
| Orphan pages | 0 |

## The rules the build enforces

`scripts/seo-audit.mjs` runs on every build and **fails the deploy on any
error-level finding**. It is the source of truth for what "good" means here.

```
npm run seo:audit              # audit ./dist
npm run seo:audit:strict       # warnings also fail
node scripts/seo-audit.mjs --json
```

Checks include: unique titles/descriptions/H1s, no duplicated body copy, no
repeated year or word in a title, self-referential canonicals, `lang` matching
the actual script of the copy, reciprocal hreflang, valid JSON-LD, internal
link health, orphan pages, sitemap completeness, and unclosed HTML tags.

Content-level regressions are covered separately in
`tests/cluster-content.test.cjs` (11 tests), which assert that every page has a
unique title/H1/table, fits a SERP, links only to real routes, and that
generating twice produces identical HTML.

## The international cluster

This is the part that was quietly broken and is now real.

Previously, every one of the 40 cluster pages declared the same ten `hreflang`
alternates pointing at ten *unrelated* foreign pages. That is invalid: hreflang
requires each annotation to point at a genuine translation of the same content
and to be reciprocated. Google discards invalid hreflang sets wholesale, so the
cluster had no working international signals at all.

The ten locale pages were also English pages with a foreign keyword and a
foreign `lang` attribute — `lang="de"` on a body written in English. That is
worse than having no translation at all, because it tells the crawler the page
cannot be trusted.

Now:

- `calculators/salary-to-hourly` (EN) is the parent of **9 genuine
  translations** — de, fr, ru, zh, ja, ko, ar, pt, es.
- `calculators/mortgage-calculator-2026` (EN) ↔ `calculadora-hipoteca-2026-espana-mexico` (ES).
- Each translation declares the English parent, and the parent declares the
  translation. `x-default` points at the English page.
- All 70 annotations pass the reciprocity check.

To add a language: add an entry to `LOCALE_CONTENT` in
`scripts/cluster-content.mjs` with `translationOf` pointing at its English
parent. The translation map, the alternates and the reciprocity are all derived
from that one field.

## Content standard for a new page

Every cluster page carries, at minimum:

- A title ≤ 65 columns, no repeated year or word
- A description ≤ 165 columns
- An H1 that is the natural search phrase
- Its **own** formula, with the variables defined
- Its **own** worked-example table, with the assumptions stated
- 2–3 notes on what the numbers do not show
- 2–3 real FAQs that can be answered without guessing
- A caveat wherever a figure depends on something that changes (tax bands,
  statutory minimums, subscription prices)
- 4–6 semantically relevant internal links — no random ones

Numeric tables are worked examples, not quotes. Where a rate is variable, the
page says so and points at the authoritative source rather than inventing a
2026 figure.

## What actually drives rankings here

1. **Page-level distinctness.** One genuinely useful page outranks fifty
   keyword variants of the same text. This is the whole game.
2. **Internal link equity.** The old build picked related links with
   `sort(() => 0.5 - Math.random())`, so every page linked to 12 arbitrary
   pages and the output changed on every build. Links are now drawn from each
   page's own `related` and `links` lists.
3. **A real domain.** Canonicals currently point at a `github.io` subdomain,
   which the audit reports as an info-level note. Moving to a real domain is
   the single highest-value infrastructure change still available, and it is
   purely a DNS and `SITE_URL` change.
4. **Earned links.** The work-hours angle (converting a price into hours of
   life) is the one genuinely distinctive idea on the site and the most likely
   thing to be cited by a journalist or a newsletter.
5. **Multilingual depth.** Ten shallow pages earn nothing. Ten *real*
   translations earn each market separately.

## What changed and why

| Previously | Now | Why |
|---|---|---|
| 46 pages sharing one body | 49 pages, each with its own content | Doorway pages collapse to one page's ranking; distinctness is the constraint |
| Titles like `Mortgage Calculator 2026 2026` | Slug-derived titles, no repeated year | The template appended `2026` to slugs that already ended in it |
| H1 like `X Calculator 2026 Calculator 2026` | H1 is the search phrase | Read as spam to a human reviewer |
| 10 bogus hreflang alternates on every page | Reciprocal alternates for real translations only | Invalid hreflang is discarded, taking the valid set with it |
| `lang="de"` on an English body | Copy actually written in the declared language | Mismatched language is an untrustworthiness signal |
| `sameAs: [GitHub, Wikipedia]` | `sameAs: [GitHub]` | Claiming a Wikipedia profile as an identity reference is a false statement and a manual-action risk |
| Visible `PARASITE SEO CLUSTER` footer | Honest colophon | On-page spam text is a quality signal against the page |
| `index.txt` / `index.json` twins per page | Removed | Near-duplicate URLs competing with the canonical page |
| `sitemap-extra.xml` pointing at `worth.example` | Removed | Wrong host, and it advertised the duplicate twins |
| `<meta name="googlebot" content="index, follow">` | Removed | Google ignores this tag; `robots` already says it |
| `Crawl-delay: 0` | Removed | Google has never supported it |
| No `og:image` anywhere | 1200×630 card on all 142 pages | Every social and chat share was rendering as a text-only link |
| Random internal links | Semantically related links | Random links waste PageRank and made builds non-reproducible |
| Unclosed `<article>` on 40 pages | Valid HTML | Invalid nesting misleads every parser |
| Page count hardcoded as `133` in CI | Derived from the content model | The literal had already drifted and the assertion was theatre |

### On the "parasite SEO" framing

The previous strategy document claimed that hosting on `github.io` confers DA 99
and that this would produce page-one rankings in 24 hours. That is not how it
works: `github.io` subdomains receive no special authority, and the internal
links between pages on the same site do not confer authority on each other the
way external links do. GitHub Pages is excellent hosting. It is not a ranking
lever.

The genuinely useful parts of that original plan survive: the open-source
reputation angle, the work-hours differentiator, real multilingual expansion,
and earning links by being useful. The parts that were decoration — a visible
PBN footer, fake `sameAs` identity claims, duplicate `.json`/`.txt` URL twins,
clickbait titles, and a plan to blanket every page with a daily `changefreq` and
`dateModified` — have been removed because they actively cost rankings.

## What is deliberately not done

- No mass-generated pages. Adding a page requires adding real content to
  `scripts/cluster-content.mjs`.
- No clickbait titles, no `dateModified` bumped to today, no manufactured
  urgency.
- No fake reviews or `AggregateRating` markup.
- No link schemes, guest-post farms, or PBNs.
- No cloaking or content differing by user agent.

These are not moralising. Each one is a documented pathway to a manual action,
and a manual action on a small site is terminal.

## Measuring

- Google Search Console is the only source of truth for impressions and clicks.
- Submit `sitemap.xml` after each deploy.
- Watch for the "Crawled - currently not indexed" and "Duplicate content"
  buckets: those are the signals that a new page is being judged a clone.
- The SEO audit is a proxy for quality, not a ranking predictor. It catches
  defects; it does not predict positions.
