# Archived: the original "parasite SEO" plan

> **This document is historical.** It records what was originally attempted and
> what actually happened to it, so the reasoning behind the current strategy is
> not lost. For the live plan see [SEO_STRATEGY.md](SEO_STRATEGY.md).

The short version: most of the tactics in this file either did not work or
worked against the site, and they have been removed.

## What was claimed

The original plan asserted that hosting on `njohn931d-dotcom.github.io` would
confer "DA 99" from GitHub, that a 47-page topical cluster would therefore rank
page-one in 24 hours, and that this would be achieved through link wheels, a
visible PBN footer, `sameAs` authority injection against Wikipedia, `.json` and
`.txt` URL duplicates, a "QDF" freshness manipulation, and clickbait titles
containing the word "Shocking".

It concluded: *"All implemented tactics are within Google guidelines except
parasite SEO."*

## What was actually true

| Claim | Reality |
|---|---|
| `github.io` confers DA 99 | No. GitHub Pages is hosting. A subdomain of a high-authority domain does not inherit its authority for a third party's content. |
| 24-hour page-one rankings | No page reached page one. 46 of the 133 URLs were byte-identical clones, which is the textbook doorway-page pattern Google is built to collapse. |
| Link wheel across 47 pages | Internal links do not pass authority the way external links do, and the related links were chosen with `sort(() => 0.5 - Math.random())` — random, and different on every build. |
| 10 hreflang languages = 10× SERPs | The alternates were invalid (they pointed every page at the same ten unrelated URLs) and the pages themselves were English with a foreign `lang` attribute. Google discarded the whole set. |
| `sameAs` authority injection | Claiming a Wikipedia page as an identity reference is a false statement about who publishes the site, and is a manual-action risk. |
| `.json`/`.txt` "other extensions" | Created near-duplicate URLs competing with the canonical page in the index, for no benefit. |
| `dateModified: today` on every page | Setting every page to "updated today" is a freshness signal Google is explicit about discounting. The dates were also hardcoded and would have silently rotted. |
| Clickbait titles | Misleading titles are a manual-action trigger and suppress the very CTR they were meant to raise. |
| "Crawled currently not indexed" avoided | Adding 46 clones makes this *more* likely, not less. |

## What survived

These parts of the plan were sound and are still in the codebase:

- **The work-hours differentiator** — converting a price into hours of life.
  It is the one genuinely distinctive idea on the site and the most likely to
  be cited by someone else.
- **Open source as a trust signal** — the MIT-licensed source is a real asset.
- **Real multilingual expansion** — now done properly, with ten genuine
  translations and reciprocal hreflang.
- **Earning links by being useful** — still the only durable link strategy.

## What replaced it

`scripts/cluster-content.mjs` holds real per-page content: a formula, a worked
example, notes on what the numbers do not show, and real FAQs. The cluster
generator renders it, and `scripts/seo-audit.mjs` fails the deploy if a page
ever goes thin, duplicates another page, or ships a broken title again.

The rule now is: **a new page requires new writing.** That is slower than
generating 40 pages in a script, and it is the only version of this that is
likely to rank.
