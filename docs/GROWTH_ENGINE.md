# Growth engine: news, movies, open data, languages and emoji

The content surfaces added to Worth to earn search traffic from things people
actually look up: a new price, a new wage rate, a release date, a number in
their own language. Everything here is static HTML produced at build time.

| Surface | Route | Source of truth | Why it exists |
| --- | --- | --- | --- |
| News explainers | `/news/`, `/news/<slug>/`, `/news/feed.xml` | `content/news/*.md` | Fresh, dated pages on new prices and events, each answering "what does it cost in hours of work?" |
| Movies | `/movies/`, `/movies/<film>/`, `/movies/movie-night-cost-calculator/` | `datasets/movies.json` | Trailer and ticket-price queries, with click-to-load official trailers |
| Minimum wage | `/minimum-wage/`, `/minimum-wage/<state>/` (51) | `datasets/minimum-wage.json` | One of the most searched finance topics; unique per-state data |
| Open data | `/open-data/`, `/api/v1/*.json\|csv` | generated at build | Linkable, citable datasets (CC BY 4.0), static so no server is needed |
| Languages | `/guides/<local-slug>/` for it, nl, pl, tr, id, vi, hi | `scripts/locale-extra.mjs` | Localized calculators using each country's own hourly-pay convention |
| Money emoji | `/emoji/money-emoji/` | `scripts/growth/emoji.mjs` | A real utility page for a high-volume query |

## How it plugs into the build

Code lives in `scripts/growth/`, `widgets/`, `content/news/`, `datasets/`,
`scripts/locale-extra.mjs`. Shared files carry only small hooks:

- `scripts/generate-parasite.mjs`: `GROWTH_ROUTES` joins `extraRoutes` (Vite inputs and the
  derived URL count), `generateGrowth()` is called at the end, localized pages render a converter.
- `scripts/generate-seo.mjs`: `GROWTH_ROUTES` joins the sitemap union.
- `scripts/cluster-content.mjs`: appends `EXTRA_LOCALE_CONTENT` to `LOCALE_CONTENT`.
- `vite.config.js`: `growthPlugin()` writes the JSON/CSV/Atom files into `dist/` and runs the head clean-up.
- `index.html` and `style.css`: footer "Explore" links, a homepage "New on Worth" block.

`deploy.yml` and `scripts/expected-urls.mjs` are untouched: the expected page count is derived from
the route lists, so adding a page cannot desynchronise the deploy check.

The post-build pass (`scripts/growth/postprocess.mjs`) fixes head tags on every page regardless of
which generator made it: one og:type/twitter:card/theme-color, an absolute og:image (the template's
relative one was ignored by link unfurlers), non-blocking Google Fonts, twitter:title/description,
feed autodiscovery, and a topical emoji in the social titles and meta description. It leaves `<title>`
elements of existing pages alone. `/embed/` and `/affiliate-marketing/` are skipped.

## Adding things

**A news explainer.** Copy a file in `content/news/`. Required: title (max 62 chars), slug, description
(60-158), published date, topic, at least two `source:` lines with URLs, at least two `faq:` lines. The
build throws if any is missing. Put arithmetic in directives, not prose:

```
::hours 79.99 | GTA VI standard edition     hours of work at five wages
::wagestep 14 15                            before/after table for a wage change
::overtime                                  worked examples for the overtime deduction
::trailer avengers-doomsday                 click-to-load trailer from datasets/movies.json
::note text                                 callout
{{wages.at15States}}                        counts derived from the dataset
```

**The minimum wage dataset.** Edit `datasets/minimum-wage.json`: bump `asOf`, change rates from the
Department of Labor table, and move a scheduled step into force by setting its date on or before `asOf`.
Only add an upcoming change when it is in law or two sources agree. `npm test` checks counts and dates.

**A film.** Add it to `datasets/movies.json`. Get the trailer id from the studio's official channel and
verify it: `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json` must return
the expected title and channel (a non-embeddable video returns an error).

**A language.** Add an entry to `scripts/locale-extra.mjs`. Use the convention the country actually uses
(`hoursPerMonth` for a monthly divisor), compute the table with `table()`, and do not quote statutory
minimums that change yearly. The FAQ examples are verified by `tests/growth.test.cjs`.

## Rules this code enforces, and why

- **No invented figures.** Prices live in `scripts/growth/prices.mjs` with a source and date; hours-of-work
  tables come from `tax.mjs`. Take-home is labelled an estimate (single filer, 2026 federal tax, no state tax).
- **One JSON-LD graph per page**, FAQPage only when the questions are visible, no ratings or reviews, no
  VideoObject for videos this site does not host. Node ids mirror the shared schema builder's.
- **No fake freshness.** The sitemap carries no `lastmod`; real dates live on the pages and in the Atom feed.
- **Third parties load on click.** Trailers are a button until pressed, then `youtube-nocookie.com`.
- **Emoji are decoration**: one per title at most, never a heading, never carrying meaning.
- **Preview builds stay inert**: without `SITE_URL` the pages are noindex and no data files are written.

## Automation

- `.github/workflows/trend-radar.yml` runs `scripts/trend-radar.mjs` daily (Google Trends RSS, Wikimedia
  most-read, Hacker News) and keeps one issue current with explainer candidates and data-freshness checks.
  It opens no PRs and publishes nothing. Run it by hand: `node scripts/trend-radar.mjs`.
- IndexNow already submits every sitemap URL after each deploy, so new pages reach Bing, Yandex and others.
- Search Console reporting (`scripts/gsc-opportunities.mjs`) shows which queries the new pages rank for.

## Things not done on purpose

Keyword-stuffed or near-duplicate city/number pages, fabricated or AI-invented news, scraping other
publishers, off-topic trailer or celebrity pages, hidden text, and using Google's Indexing API for
pages it is not meant for. They risk a scaled-content or spam demotion, and the audit's duplicate checks would fail them.

## Still needs a human

Submit `sitemap.xml` in Search Console and Bing Webmaster Tools (a github.io project path cannot serve a
root robots.txt), and watch the trend radar issue to keep the news hub moving. The minimum wage dataset
needs a check on January 1 and July 1; the radar will say when it is due.
