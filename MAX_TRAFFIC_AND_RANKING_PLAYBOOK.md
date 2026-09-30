# Organic Search Growth Playbook

> **Goal:** earn qualified search traffic for Worth's real subject—turning prices,
> pay, recurring charges and money decisions into useful calculations. Rankings
> and traffic cannot be guaranteed. This plan prioritizes evidence, usefulness,
> and repeatable measurement over publishing more URLs for their own sake.

## The operating principle

Worth is a private, browser-based money-calculator project. Its strongest
editorial distinction is the **work-hours perspective**: translate a price or
recurring charge into the time required to earn it, while explaining the
assumptions and limits. Protect that subject focus. Search volume alone is not
an editorial reason to create a page.

Do not use doorway pages, mass-generated near-duplicates, keyword stuffing,
misleading dates, fake reviews, fake authors, link farms, purchased links,
cloaking, parasitic hosting claims, or automated news publishing. These tactics
are not reliable ranking levers and can make the site less useful or harder to
trust. There is no honest trick that guarantees a top position.

## 1. Measure real demand before choosing work

### Search Console is the source of truth

Use the private weekly Search Console report added to this repository. It
compares the last two settled 28-day windows and groups search data by query,
landing page and country. It highlights:

- queries with impressions at average positions 4–20;
- newly rising queries that may indicate changing demand;
- queries losing impressions;
- queries receiving impressions on multiple Worth URLs;
- countries with enough impressions to justify localization research.

The report is an opportunity shortlist, not complete property totals: Search
Console may omit anonymized queries and the API response is capped. Average
position and CTR are descriptive signals, not a promise that changing a title
will improve a result. Review the actual query, page, current search result and
reader intent before editing.

### Set up the optional API report

1. In Google Cloud, enable the **Google Search Console API** and create a service
   account. Keep its JSON private; do not commit it.
2. Add the service-account email as a restricted/read-only user on the verified
   Worth URL-prefix property in Search Console.
3. Add the full service-account JSON as the repository Actions secret
   `GSC_SERVICE_ACCOUNT_JSON`.
4. Run **Actions → Private Search Console opportunity report → Run workflow**
   to test it. The same workflow runs weekly and stores a private artifact for
   14 days. No report or credentials are published to the website.

For a local report, set `GSC_SERVICE_ACCOUNT_JSON` in the shell and run:

```sh
npm run gsc:opportunities -- --out=seo-reports/search-opportunities.md
```

A credential-free example against a fixed date window can be run with a fixture containing
`current` and `previous` arrays of Search Console API rows:

```sh
node scripts/gsc-opportunities.mjs --fixture=fixture.json --as-of=2026-08-31
```

### How to prioritize

1. Start with high-impression pages around positions 4–20 where the page can be
   materially clearer or more complete.
2. Improve the best existing page before creating another URL for the same
   intent. Add a genuinely useful tool, worked example, transparent assumptions,
   trustworthy citations and relevant internal links—not keyword variants.
3. Investigate losses against the page's own history and current results.
   Distinguish seasonality, a changed result page, an outdated fact, a technical
   issue and an intent mismatch before making changes.
4. Use country signals as evidence for translation research, not as a reason to
   machine-translate dozens of pages.
5. Check Search Console's indexing and performance reports after meaningful
   changes. A sitemap submission helps discovery; it does not force indexing.

## 2. Build topic depth, not a page-count target

The existing clusters—pay and rates, subscription costs, saving habits,
spending decisions, and money in work hours—are coherent. For a new page, require
all of the following before adding a route:

- a distinct query intent that is not already served;
- an original calculation, decision aid, comparison or source-based answer;
- clear formulas, units, worked examples and visible assumptions;
- sources for changeable or regulated facts, with a jurisdiction and date;
- a real next step in the existing topic cluster;
- an owner and update plan if the information can go stale.

If a page cannot meet that bar, improve an existing page or do not publish it.
A large sitemap is not itself a traffic strategy.

## 3. Localize the experience, not just the keyword

Worth already has a small set of genuine translations. Grow it only where search
impressions and editorial capacity support it. A useful localized page needs:

- a native-language title, explanation, UI and FAQs—not translated keyword
  fragments in English copy;
- local currency, pay periods, date/number formatting and terminology;
- correct local assumptions for taxes, employment law or housing, with primary
  sources and a prominent estimate disclaimer;
- a fluent human review of both the copy and the arithmetic;
- reciprocal `hreflang` links only between real equivalents, plus a self
  canonical to the localized URL.

Use Search Console country/query data to choose markets. A country is not a
language, and `hreflang` is not a substitute for local usefulness.

## 4. Use timely events selectively

A news or event angle is appropriate only when it naturally changes a money
question Worth can answer. Good candidates include a verified streaming-price
change, a statutory pay/tax update for a market the site serves, or the total
cost of attending a major event. The page must add original math or research,
name its sources and assumptions, distinguish estimates from facts, and say
what will be updated or archived when the event passes.

The Search Console report can surface queries that are newly appearing on Worth,
but a spike alone does not establish a trend or justify an article. Verify
release dates, prices and policy details with the primary source. Do not
manufacture an article for every headline, and do not automatically publish
content from an API.

Movie trailers are generally outside Worth's topic. Do not create unrelated
trailer pages to borrow entertainment searches. If a film or release creates a
real money question—ticket, travel, merchandise or streaming-plan cost—answer
that narrow question with original calculations. Link to an official trailer
only when genuinely relevant; do not copy or rehost copyrighted footage.

Use emojis sparingly in social copy when they improve readability. Avoid emoji
and keyword piles in page titles, headings, URLs, structured data or repeated
body text. The search result should explain the page in plain language.

## 5. Earn attention by making something citeable

The best link opportunity is a tool or dataset another writer, educator or
community can independently verify and recommend. Continue to:

- make the formulas and assumptions inspectable in the open-source code;
- publish useful examples or a small, original and documented dataset when one
  exists;
- offer an embeddable calculator only when it is genuinely useful and credits
  the source clearly;
- share a tool with relevant communities only when it answers the discussion;
- write platform-specific material for partner publications and use a canonical
  URL when syndicating, rather than posting duplicate backlink bait.

Do not promise a backlink, ask for irrelevant links, or measure success by a
spike of low-intent referrals. GitHub hosting and a `github.io` address do not
confer a guaranteed ranking advantage.

## 6. Technical search hygiene

The build and SEO audit are quality gates, not ranking predictors. Keep them
focused on:

- crawlable static HTML, valid status codes and usable mobile pages;
- unique, accurate titles, descriptions, headings, canonical URLs and JSON-LD;
- working internal links, a coherent discovery path and a complete sitemap;
- real, reciprocal alternate-language annotations;
- accessible, fast calculator interactions and readable source attribution;
- only accurate sitemap freshness data. A build date is not a content update;
  this site's sitemap therefore lists URLs without manufactured `lastmod`,
  `changefreq` or `priority` hints.

`llms.txt`, `ai.txt`, RSS, emoji, schema markup and indexing APIs can support
discovery or sharing; none guarantees rankings, inclusion in an AI answer,
rich results or a traffic increase. Use structured data to describe visible,
accurate content—not to claim a result the page does not provide.

## A practical 90-day cycle

- **Week 1:** verify the Google Search Console property and sitemap; configure the
  optional report; record baseline clicks, impressions and conversions by
  country and page.
- **Weeks 2–4:** improve the three best supported query/page opportunities.
  Fix inaccurate facts, clarify the direct answer, test the tool and add
  genuinely relevant links from cluster hubs.
- **Weeks 5–8:** review query changes and technical/indexing issues. If a market
  has sustained demand, localize one complete high-value experience with human
  review.
- **Weeks 9–12:** evaluate outcomes against the baseline. Keep what helps
  qualified readers; revert changes that reduce clarity or performance. Plan
  the next cycle from observed demand, not a guessed search-volume spreadsheet.

Track clicks, impressions, meaningful calculator interactions, country and
query mix, indexing exclusions, Core Web Vitals where available, and quality
referrals. Do not report ranking promises or claim that a traffic result is
caused by one metadata change without evidence.
