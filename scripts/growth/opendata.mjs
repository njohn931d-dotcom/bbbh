/**
 * /open-data/: documentation for the static JSON and CSV files the site
 * publishes under /api/v1/. The files themselves are built into dist/ by the
 * growth Vite plugin (see index.mjs, growthArtifacts).
 */
import { esc, longDate, writePage, rmGenerated, fileHref } from './util.mjs';
import { renderPage, breadcrumbHtml, faqHtml } from './shell.mjs';
import { buildGraph } from './jsonld.mjs';
import { WAGE_DATA, WAGE_LICENSE } from './wages.mjs';
import { MOVIE_DATA } from './movies.mjs';
import { NEWS } from './news.mjs';

export const OPEN_DATA_ROUTE = 'open-data';
export const OPEN_DATA_LABELS = { [OPEN_DATA_ROUTE]: 'Open data and free JSON API' };

export const DATASETS = [
  { id: 'minimum-wage', title: 'U.S. minimum wage by state', files: [['json', 'api/v1/minimum-wage.json'], ['csv', 'api/v1/minimum-wage.csv']], updated: WAGE_DATA.asOf, page: 'minimum-wage', what: 'State and federal minimum wage, overtime rule, tiered rates and scheduled changes for the 50 states and DC.' },
  { id: 'news', title: 'Worth News index', files: [['json', 'api/v1/news.json'], ['atom', 'news/feed.xml']], updated: NEWS[0].updated, page: 'news', what: 'Every news explainer with its date, topic, description and sources.' },
  { id: 'movies', title: 'Fall 2026 movies and ticket prices', files: [['json', 'api/v1/movies.json']], updated: MOVIE_DATA.asOf, page: 'movies', what: 'Release dates, distributors, official trailer ids and the 2026 average ticket prices.' },
];

export function generateOpenData(ctx) {
  rmGenerated(OPEN_DATA_ROUTE);
  const base = ctx.siteUrl || 'https://YOUR-SITE';
  const title = 'Free Money Data API: Minimum Wage, News and Movies as JSON';
  const description = 'Free JSON and CSV datasets from Worth: U.S. minimum wage by state, news explainers and movie data. CC BY 4.0, no API key, browser-friendly.';
  const faqs = [
    ['Is the Worth data API free?', 'Yes. The datasets are static JSON and CSV files that anyone can download, with no account and no API key. They are licensed CC BY 4.0, so please credit Worth with a link.'],
    ['Can I call it from a browser app?', 'Yes. The files are served as static content, and GitHub Pages sends permissive CORS headers, so a web app can fetch them directly.'],
    ['How often is the data updated?', 'Each file carries an as_of date. The minimum wage file is checked against the U.S. Department of Labor table and updated when rates change, typically on January 1 and July 1.'],
    ['Where does the minimum wage data come from?', `The U.S. Department of Labor state minimum wage table, updated ${longDate(WAGE_DATA.source.updated)}, plus scheduled changes that at least two sources agree on. Each source is listed on the dataset page.`],
  ];
  const rows = DATASETS.map(d => `<tr><td><a href="/${d.page}/">${esc(d.title)}</a><br><small>${esc(d.what)}</small></td><td>${d.files.map(([f, p]) => `<a href="${fileHref(ctx, p)}">${f.toUpperCase()}</a>`).join(' · ')}</td><td>${esc(longDate(d.updated))}</td></tr>`).join('');
  const main = [
    breadcrumbHtml([{ name: 'Open data' }]),
    `<section class="seo-hero"><div class="eyebrow"><span></span> OPEN DATA · CC BY 4.0</div><h1>Free money data and JSON API</h1><p class="gx-lead">Plain files, no key, no sign-up. Use the minimum wage table, the news index or the movie data in your own app, spreadsheet or article. Please link back to Worth when you do.</p></section>`,
    `<article class="seo-article">`,
    `<h2>Datasets</h2><div class="gx-table-wrap"><table class="gx-wide"><thead><tr><th>Dataset</th><th>Files</th><th>As of</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    `<h2>Quick start</h2><p>Fetch the minimum wage file from any browser or server:</p>`,
    `<pre><code>curl ${esc(base)}/api/v1/minimum-wage.json\n\nfetch('${esc(base)}/api/v1/minimum-wage.json')\n  .then(r => r.json())\n  .then(d => console.log(d.jurisdictions[0]))</code></pre>`,
    `<h2>Minimum wage fields</h2><div class="gx-table-wrap"><table class="gx-wide"><thead><tr><th>Field</th><th>Meaning</th></tr></thead><tbody>` +
      [['code, name', 'Two-letter postal code and name of the state or DC.'], ['state_rate', 'The state\'s own basic minimum per hour in USD, or null if it has no law.'], ['effective_rate', 'The higher of the state and federal rate for a typical covered employer.'], ['federal_applies', 'True when the federal minimum is the rate that applies.'], ['full_time_annual_2080h', 'effective_rate × 2,080 hours, before tax.'], ['overtime_rule', 'The Department of Labor\'s premium-pay rule, or the federal default.'], ['other_rates', 'Tiered rates, such as New York City or small employers.'], ['upcoming_change', 'Scheduled or announced change with rate, date and basis; rate is null when the amount is not yet published.'], ['page', 'The Worth page for that state.']].map(([f, m]) => `<tr><td><code>${esc(f)}</code></td><td>${esc(m)}</td></tr>`).join('') +
      `</tbody></table></div>`,
    `<h2>Attribution</h2><p>The data is licensed <a href="${WAGE_LICENSE}" rel="license noopener">CC BY 4.0</a>. A credit line like the one below is enough:</p><pre><code>Data: Worth (${esc(base)}/minimum-wage/)</code></pre>`,
    `<h2>Corrections</h2><p>Found a wrong number? <a href="https://github.com/njohn931d-dotcom/bbbh/issues/new" rel="noopener">Open an issue</a> with a link to the source and it will be fixed and dated.</p>`,
    faqHtml(faqs),
    `</article>`,
  ].join('');
  const schema = buildGraph(ctx, {
    route: OPEN_DATA_ROUTE, name: 'Free money data and JSON API', description, kind: 'hub', published: '2026-09-30', modified: WAGE_DATA.asOf,
    crumbs: [{ name: 'Open data' }], faqs,
  });
  writePage(OPEN_DATA_ROUTE, renderPage(ctx, { route: OPEN_DATA_ROUTE, title, description, socialTitle: `🧩 ${title}`, main, schema }));
}
