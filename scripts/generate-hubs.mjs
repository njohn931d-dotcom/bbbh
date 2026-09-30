/**
 * Hub pages: /calculators/ and /guides/.
 *
 * The site had 160 indexable pages and no index page for any of them. Every
 * tool was reachable only from the "all tools" link list at the bottom of
 * other tool pages, so the collection had no page that could rank for the
 * query the collection actually answers — "free money calculators" — and the
 * crawl path to a tool depended on a long alphabetical block.
 *
 * These two pages fix both: they are the canonical browse entry points, they
 * carry ItemList markup so a search engine can read the collection as a set,
 * and they give every tool a strong inbound link from a page that is itself
 * linked from the homepage.
 *
 * Called from generateParasiteSEO() so that `node scripts/generate-parasite.mjs`
 * alone produces the whole site — which is what the test suite runs.
 */

import fs from 'node:fs';
import { CLUSTER_ROUTES, getContent, REPO_URL } from './cluster-content.mjs';
import { routes as seoRoutes, articleRoutes } from './generate-seo.mjs';
import { articles as guideArticles, clusters as guideClusters } from './articles.mjs';
import { GROUPS, GUIDE_GROUPS, siteFooter, HUB_ROUTES as HUB_ROUTE_LIST } from './tool-groups.mjs';

/**
 * Every URL this module generates. Re-exported from tool-groups.mjs so callers
 * that already import this module keep working.
 */
export { HUB_ROUTES } from './tool-groups.mjs';

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Read the label and description a generated page already carries. */
function infoFromBuiltPage(route) {
  const file = `${route}/index.html`;
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  const title = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] || '';
  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] || '';
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1]?.replace(/<[^>]+>/g, '') || '';
  return { label: title.replace(/\s*\|\s*Worth\s*$/, ''), h1: h1.trim(), desc };
}

/** Label, headline and one-line summary for any route. */
function toolInfo(route) {
  const entry = getContent(route);
  if (entry) return { label: entry.h1, h1: entry.h1, desc: entry.desc, kind: entry.intent === 'tool' ? 'Tool' : 'Guide' };
  const built = infoFromBuiltPage(route);
  if (built) return { ...built, label: built.h1 || built.label, kind: route.startsWith('calculators/') ? 'Tool' : 'Guide' };
  return { label: route.split('/').pop().replace(/-/g, ' '), h1: route, desc: '', kind: 'Guide' };
}



export function generateHubs() {
  const raw = process.env.SITE_URL;
  let origin = '', basePath = '', siteUrl = '';
  if (raw) {
    const u = new URL(raw);
    if (!['https:', 'http:'].includes(u.protocol) || u.search || u.hash || u.username || u.password) throw Error('SITE_URL must be a public site URL without query or fragment');
    origin = u.origin;
    basePath = u.pathname.replace(/\/$/, '');
    siteUrl = origin + basePath;
  }
  const base = fs.readFileSync('index.html', 'utf8');
  const prefix = html => (basePath ? html.replace(/(<a\b[^>]*\bhref=")\/(?!\/)/g, (_, p) => p + basePath + '/') : html);

  const calculators = seoRoutes
    .filter(r => r.startsWith('calculators/'))
    .concat(CLUSTER_ROUTES.filter(r => r.startsWith('calculators/')))
    .filter((r, i, a) => a.indexOf(r) === i);
  const guides = seoRoutes.filter(r => r.startsWith('guides/'))
    .concat(CLUSTER_ROUTES.filter(r => r.startsWith('guides/')))
    .filter((r, i, a) => a.indexOf(r) === i);

  const card = route => {
    const info = toolInfo(route);
    const short = info.desc.length > 132 ? info.desc.slice(0, 129).replace(/\s+\S*$/, '') + '…' : info.desc;
    return `<a class="hub-card" href="/${route}/"><span class="hub-kicker">${esc(info.kind.toUpperCase())}</span><h3>${esc(info.label)}</h3><p>${esc(short)}</p><span class="hub-more">Open <span>→</span></span></a>`;
  };

  /** Nothing is dropped: unnamed routes land in a final group rather than nowhere. */
  const named = new Set(GROUPS.flatMap(g => g.routes));
  const rest = calculators.filter(r => !named.has(r));
  const groups = rest.length ? [...GROUPS, { name: 'More tools', blurb: 'Everything else worth calculating.', routes: rest }] : GROUPS;

  const calcSections = groups.map(g => {
    const routes = g.routes.filter(r => calculators.includes(r));
    if (!routes.length) return '';
    return `<section class="hub-block"><div class="section-label">${routes.length} TOOL${routes.length === 1 ? '' : 'S'}</div><h2>${esc(g.name)}</h2><p class="cluster-blurb">${esc(g.blurb)}</p><div class="hub-grid">${routes.map(card).join('')}</div></section>`;
  }).join('');

  const guideSections = (() => {
    const used = new Set();
    const parts = GUIDE_GROUPS.map(g => {
      const list = guides.filter(r => !used.has(r) && g.match(r));
      list.forEach(r => used.add(r));
      if (!list.length) return '';
      return `<section class="hub-block"><div class="section-label">${list.length} GUIDE${list.length === 1 ? '' : 'S'}</div><h2>${esc(g.name)}</h2><p class="cluster-blurb">${esc(g.blurb)}</p><div class="hub-grid">${list.map(card).join('')}</div></section>`;
    }).join('');
    const leftovers = guides.filter(r => !used.has(r));
    const more = leftovers.length
      ? `<section class="hub-block"><div class="section-label">${leftovers.length} MORE</div><h2>More guides</h2><p class="cluster-blurb">Everything else in the guide library.</p><div class="hub-grid">${leftovers.map(card).join('')}</div></section>`
      : '';
    return parts + more;
  })();

  const articlesBlock = `<section class="hub-block"><div class="section-label">THE MONEY EDIT</div><h2>${guideArticles.length} long-form articles</h2><p class="cluster-blurb">Five collections of eight, written as answers to a single question each.</p><div class="hub-grid">${guideClusters.map(c => `<a class="hub-card" href="/articles/${c.slug}/"><span class="hub-kicker">${esc(c.label)}</span><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p><span class="hub-more">${guideArticles.filter(a => a.cluster === c.slug).length} articles <span>→</span></span></a>`).join('')}</div></section>`;

  const pages = [
    {
      route: 'calculators',
      title: `Free Money Calculators: ${calculators.length} Free Tools | Worth`,
      desc: `All ${calculators.length} Worth calculators on one page: pay, borrowing, saving, housing, cars and everyday spending. Free, private, and running entirely in your browser.`,
      h1: 'Free Money Calculators',
      intro: `Every calculator on Worth, in one place. Each one has its own formula, worked examples and assumptions stated on the page, and every calculation runs in your browser — nothing you type is sent anywhere.`,
      body: calcSections +
        `<section class="hub-block"><div class="section-label">HOW TO USE THIS INDEX</div><h2>Where to start</h2><ul>` +
        `<li><strong>If you are deciding whether to buy something,</strong> start with the cost of time calculator, then check the unit price or cost per use of the alternative.</li>` +
        `<li><strong>If you are looking at a loan,</strong> compare the monthly payment and the total interest together. The cheaper month is often the more expensive loan.</li>` +
        `<li><strong>If you are trying to save,</strong> set the emergency fund target first, then the goal you are saving towards. Money with no destination gets spent.</li>` +
        `<li><strong>If a figure here disagrees with your paperwork,</strong> trust your paperwork and treat the calculator as a prompt to check the assumption behind the difference.</li>` +
        `</ul></section>`,
      listName: 'Free money calculators',
    },
    {
      route: 'guides',
      title: `Money Guides: ${guides.length} Short, Practical Answers | Worth`,
      desc: `What things really cost, written as short answers: ${guides.length} plain-English guides with the arithmetic, the assumptions and what each figure leaves out.`,
      h1: 'Money Guides',
      intro: `Short answers to specific money questions. Every guide shows the arithmetic, states its assumptions and says what the number leaves out — including the ones where the honest answer is that the calculation cannot tell you.`,
      body: guideSections +
        `<section class="hub-block"><div class="section-label">HOW THESE ARE WRITTEN</div><h2>What makes a guide worth reading</h2><ul>` +
        `<li><strong>One question per page.</strong> If a guide needs a second question to make sense, it becomes a second page.</li>` +
        `<li><strong>The answer is in the first two sentences.</strong> Anything that buries the number under three paragraphs of context is a rewrite of someone else's article.</li>` +
        `<li><strong>Assumptions are stated.</strong> A rate that changes — tax bands, statutory minimums, subscription prices — is named as a variable rather than presented as a fact.</li>` +
        `<li><strong>Limits are admitted.</strong> Every page has a section on what the calculation does not capture. That section is usually the most useful one.</li>` +
        `</ul></section>` + articlesBlock,
      listName: 'Money guides',
    },
  ];

  pages.push(...sitePages());

  /**
   * The pages a money site is judged on and this one did not have: who is
   * behind it, how the numbers are produced and checked, and what happens to
   * what you type. They are short, plain and true rather than marketing copy —
   * an "about" page that says nothing verifiable is worse than none.
   */
  function sitePages() {
    return [
      {
        route: 'about',
        title: 'About Worth: Who Builds It and How It Is Paid For',
        desc: 'Worth is an open-source collection of money calculators. Who builds it, how it is funded, what it refuses to do, and how to report a wrong number.',
        h1: 'About Worth',
        intro: 'Worth is a free, open-source set of money calculators and guides. There is no company behind it, no advertising, no account and no analytics.',
        body:
          `<h2>What this is</h2><p>Worth answers one class of question: what does this cost me, in money and in hours of work. It started as a single cost-of-time calculator — converting a price tag into the hours it took to earn — and grew into ${calculators.length} calculators and ${guides.length} guides that all rest on the same idea.</p>` +
          `<h2>Who builds it</h2><p>Worth is maintained in the open at <a href="${REPO_URL}" rel="noopener">github.com/njohn931d-dotcom/bbbh</a> under the MIT licence. Every calculator, every guide and every line of the build lives in that repository, including the tests that check the pages before they are published. There is no separate editorial team and no anonymous content operation: the history of every change is public.</p>` +
          `<h2>How it is funded</h2><p>It is not. There are no advertisements, no affiliate links in the calculators, no sponsored tools and no data sold to anyone. The site is static files served by GitHub Pages, which is why there is no server to pay for and no reason to want your attention.</p>` +
          `<h2>What it will not do</h2><ul>` +
          `<li>It will not ask you to create an account or give an email address.</li>` +
          `<li>It will not send what you type anywhere. Every calculation runs in your browser — you can disconnect from the internet and the calculators still work.</li>` +
          `<li>It will not give personalised financial advice, recommend a specific product, or pretend a rule of thumb is a plan.</li>` +
          `<li>It will not quote a figure without stating the assumption behind it.</li>` +
          `</ul>` +
          `<h2>Found a wrong number?</h2><p>That matters more than anything else here. Open an issue or a pull request at <a href="${REPO_URL}" rel="noopener">the repository</a>, or read <a href="/methodology/">how the numbers are made</a> first to see whether the assumption behind the figure is stated.</p>`,
        listName: 'About',
      },
      {
        route: 'methodology',
        title: 'Methodology: How the Calculators Are Built and Checked',
        desc: 'How Worth calculators are written, tested and reviewed, what the limits of a rule of thumb are, and how corrections are handled.',
        h1: 'How the Numbers Are Made',
        intro: 'Every figure on this site comes from a formula stated on the page, a set of assumptions named next to it, and a test that fails the build if the two ever drift apart.',
        body:
          `<h2>One formula per page, stated in the open</h2><p>Each calculator names its formula and explains it in plain words — the amortisation equation for a mortgage, the 2,080-hour divisor for a salary, the 30% ratio for rent. Nothing is calculated by a hidden model and no figure is quoted without the arithmetic behind it.</p>` +
          `<h2>Assumptions are named, not buried</h2><p>Where a figure depends on something that changes — tax bands, statutory minimum hours, subscription prices, interest rates — the page says so and says what it means. A worked example with stated assumptions is a claim you can check; a headline number without them is not.</p>` +
          `<h2>The browser and the server run the same arithmetic</h2><p>The printed figure and the interactive widget are produced by the same function. The page is rendered with it at build time, and the same source runs in your browser when you change an input. That is deliberate: two implementations of one formula drift, and a calculator that disagrees with its own article loses the reader's trust in both.</p>` +
          `<h2>What gets checked before publication</h2><ul>` +
          `<li>Every page loads, carries a unique title and description, and has one heading in the right place.</li>` +
          `<li>Every internal link resolves to a page that exists.</li>` +
          `<li>No two pages share the same worked-example table, so a page cannot look distinct by renumbering one number.</li>` +
          `<li>Every page is readable without JavaScript, and every calculator produces its result on the server before the script runs.</li>` +
          `<li>Translated pages are checked for mixed-script copy, which is what machine-translation damage looks like.</li>` +
          `</ul>` +
          `<h2>What a calculator here is not</h2><p>It is a model, not a quote. A mortgage payment from a calculator is not an offer, a tax estimate is not a return, and an investment projection is arithmetic applied to a return that has never been constant. Where a page cannot answer the question honestly, it says so instead of guessing.</p>` +
          `<h2>Corrections</h2><p>If a figure is wrong, the fix and the reason are recorded publicly in the repository history. Nothing on this site is a permanent claim, and a correction that makes a page less flattering to the site is still a correction.</p>`,
        listName: 'Methodology',
      },
      {
        route: 'privacy',
        title: 'Privacy: What Happens to What You Type',
        desc: 'No accounts, no analytics, no cookies. What you enter into a Worth calculator stays in your browser, and here is exactly how.',
        h1: 'Privacy',
        intro: 'Nothing you type into this site is sent anywhere. There is no server to send it to, no account, and no analytics code on any page.',
        body:
          `<h2>Where your numbers go</h2><p>Nowhere. Every calculation happens in your browser using a script that ships with the page. You can open a calculator, disconnect from the internet entirely, and it will still work. There is no API call, no logging endpoint and no third-party script receiving your inputs.</p>` +
          `<h2>What is stored, and where</h2><p>If you choose to save something, it is written to your browser's own local storage — a file on your device, tied to this site. It is not uploaded, not synced and not readable by anyone else. Clearing your browser data deletes it. Nothing is stored unless you press save.</p>` +
          `<h2>Cookies and analytics</h2><p>None. There is no cookie, no tracking pixel, no session recorder and no third-party analytics. The site is static files served by GitHub Pages; GitHub itself may keep standard access logs as part of serving any website, which is outside this project's control and not something it can read.</p>` +
          `<h2>Links you share</h2><p>If you use a share button, the inputs you entered are placed in the link itself — the part after the # symbol, which browsers do not send to a web server. Anyone you give the link to can see those numbers, and nobody else can.</p>` +
          `<h2>Why it is built this way</h2><p>Personal finance questions are personal. The only way to be certain that what you type stays yours is to build a site that has nowhere to send it, which is what this is. The whole implementation is public at <a href="${REPO_URL}" rel="noopener">the repository</a> if you would like to check.</p>`,
        listName: 'Privacy',
      },
    ];
  }

  for (const p of pages) {
    const url = siteUrl + '/' + p.route + '/';
    const items = (p.route === 'calculators' ? calculators : p.route === 'guides' ? guides : []).map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: toolInfo(r).label,
      url: siteUrl + '/' + r + '/',
    }));

    const graph = [
      { '@type': 'WebSite', name: 'Worth', ...(siteUrl ? { url: siteUrl + '/', potentialAction: { '@type': 'SearchAction', target: siteUrl + '/?q={search_term_string}', 'query-input': 'required name=search_term_string' } } : {}) },
      { '@type': 'CollectionPage', name: p.h1, description: p.desc, ...(siteUrl ? { url } : {}), inLanguage: 'en', isAccessibleForFree: true },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', ...(siteUrl ? { item: siteUrl + '/' } : {}) },
          { '@type': 'ListItem', position: 2, name: p.h1, ...(siteUrl ? { item: url } : {}) },
        ],
      },
      ...(items.length ? [{ '@type': 'ItemList', name: p.listName, numberOfItems: items.length, itemListElement: items }] : []),
      { '@type': 'Organization', name: 'Worth', ...(siteUrl ? { url: siteUrl + '/' } : {}), sameAs: [REPO_URL] },
    ];

    const crumb = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>${esc(p.h1)}</span></nav>`;
    const hero = `${crumb}<section class="seo-hero"><div class="eyebrow">${esc(p.listName.toUpperCase())} - OPEN SOURCE ON GITHUB</div><h1>${esc(p.h1)}</h1><p>${esc(p.intro)}</p><div style="font-size:11px;color:#8a9a7a;margin-top:10px">${items.length} pages in this collection</div></section>`;

    let html = base
      .replace(/<nav aria-label="Main navigation">[\s\S]*?<\/nav>/, '<nav aria-label="Main navigation"><a href="/calculators/">Calculators</a><a href="/guides/">Guides</a><a href="/articles/">The money edit</a></nav>')
      .replace(/<main>[\s\S]*?<\/main>/, `<main>${hero}<article class="seo-article">${p.body}</article></main>`)
      .replace('<body>', '<body>')
      .replace(/href="#(calculator|learn|how)"/g, 'href="/#$1"')
      // The homepage widget has no meaning on an index page.
      .replace(/<button class="saved-button"[\s\S]*?<\/button>/, '<a class="saved-button" href="/calculators/cost-of-time/">Try a calculator ↗</a>')
      .replace('</footer>', siteFooter() + '</footer>');

    html = html
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(p.desc)}">`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(p.title)}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(p.desc)}">`)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`);

    const head = siteUrl
      ? `<link rel="canonical" href="${esc(url)}"><meta property="og:url" content="${esc(url)}">` +
        `<meta property="og:image" content="${esc(siteUrl + '/og-image.png')}"><meta name="twitter:image" content="${esc(siteUrl + '/og-image.png')}">`
      : '<meta name="robots" content="noindex, nofollow">';

    html = html.replace('</head>',
      head +
      '<meta name="twitter:card" content="summary_large_image">' +
      '<meta property="og:type" content="website">' +
      '<meta property="og:site_name" content="Worth">' +
      '<meta property="og:locale" content="en">' +
      '<meta name="robots" content="index, follow, max-image-preview:large">' +
      '<link rel="alternate" type="application/rss+xml" title="Worth - new guides" href="/feed.xml">' +
      '<link rel="manifest" href="/manifest.json">' +
      '<meta name="theme-color" content="#204f3c">' +
      '<link rel="author" href="/humans.txt">' +
      '<link rel="alternate" type="application/rss+xml" title="Worth - new guides" href="/feed.xml">' +
      '</head>');

    fs.mkdirSync(p.route, { recursive: true });
    fs.writeFileSync(p.route + '/index.html', prefix(html));
  }
}

if (process.argv[1]?.endsWith('generate-hubs.mjs')) generateHubs();
