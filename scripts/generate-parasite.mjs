import fs from 'node:fs';
import { articleRoutes, articles as guideArticles } from './articles.mjs';
import { pages, extraRoutes as contentRoutes, HOURLY_WAGE_CLUSTER } from './parasite-content.mjs';

export const extraRoutes = contentRoutes;

export const routes = [...extraRoutes];

const baseRoutes = ['calculators/cost-of-time','calculators/subscription-cost','calculators/daily-savings','guides/hourly-pay','guides/small-purchases','guides/24-hour-rule'];
const mainRoutes = [
  'calculators/salary-to-hourly',
  'calculators/hourly-to-salary',
  'calculators/freelance-rate',
  'calculators/cost-per-wear',
  'calculators/cost-per-use',
  'calculators/overtime-pay',
  'calculators/after-tax-income',
  'calculators/commute-cost',
  'calculators/latte-factor',
  'calculators/gym-cost-per-visit',
  'calculators/streaming-cost',
  'calculators/car-ownership-cost',
  'calculators/time-to-save',
  'calculators/paycheck-breakdown',
  'calculators/buy-vs-rent-hourly',
  'guides/how-much-is-time-worth',
  'guides/stop-impulse-buying',
  'guides/subscription-audit',
  'guides/latte-factor-explained',
  'guides/no-spend-challenge',
  'guides/30-day-rule-spending',
  'guides/cost-per-wear-guide',
  'guides/freelance-rate-guide',
  'guides/psychology-small-purchases',
  'guides/track-daily-spending',
  'guides/emergency-fund-hours',
  'guides/side-hustle-worth-it',
  'guides/coffee-cost-per-year',
  'guides/average-subscription-cost-2025',
  'guides/hourly-budget',
  'guides/paycheck-to-paycheck',
  'guides/cost-of-convenience',
  'guides/value-free-time',
  'guides/minimalism-cost-per-time',
  'guides/negotiate-hourly-rate',
  'guides/is-netflix-worth-it',
  'guides/annual-vs-monthly-subscription',
  'guides/how-to-calculate-overtime',
  'guides/true-cost-of-car',
  'guides/how-long-save-1000'
];

const allRoutesForSitemap = [...baseRoutes, ...mainRoutes, ...extraRoutes, ...articleRoutes];


const TODAY = '2026-09-27';

function renderTable(t, escape) {
  if (!t) return '';
  return '<table><thead><tr>' + t.headers.map(h => '<th>' + escape(h) + '</th>').join('') + '</tr></thead><tbody>' +
    t.rows.map(r => '<tr>' + r.map(c => '<td>' + escape(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
}

function renderBody(p, escape) {
  const sections = p.sections.map(([h, html], i) => '<h2>' + h + '</h2>' + html + (i === 0 ? renderTable(p.table, escape) : '')).join('');
  return sections;
}

// Stable pseudo-random pick so builds are deterministic per route.
function relatedFor(route, all, n) {
  let h = 0;
  for (const ch of route) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const others = all.filter(r => r !== route);
  const out = [];
  for (let i = 0; i < n && others.length; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out.push(others.splice(h % others.length, 1)[0]);
  }
  return out;
}

export function generateParasiteSEO() {
  const raw = process.env.SITE_URL;
  let origin = '', basePath = '', siteUrl = '';
  if (raw) {
    const u = new URL(raw);
    if (!['https:', 'http:'].includes(u.protocol) || u.search || u.hash || u.username || u.password) throw Error('SITE_URL must be a public site URL without query or fragment, e.g. https://your-domain.com or https://username.github.io/repository');
    origin = u.origin;
    basePath = u.pathname.replace(/\/$/, '');
    siteUrl = origin + basePath;
  }
  const base = fs.readFileSync('index.html', 'utf8');
  const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  const prefixInternalLinks = html => basePath ? html.replace(/(<a\b[^>]*\bhref=")\/(?!\/)/g, (_, prefix) => prefix + basePath + '/') : html;

  const githubCTA = (calcName) => '<div class="github-cta" style="margin:24px 0;padding:16px 20px;border:1px solid #204f3c;border-radius:12px;background:#f6fbf0"><p><strong>Open source on GitHub</strong> — ' + escape(calcName) + ' runs entirely in your browser. Free, private, MIT licensed. <a href="https://github.com/njohn931d-dotcom/bbbh" target="_blank" rel="noopener">View source</a></p></div>';

  const allRoutes = [...baseRoutes, ...mainRoutes, ...extraRoutes];
  const label = r => r.split('/').pop().replace(/-/g, ' ');
  const linksAll = '<section class="seo-related"><div class="section-label">ALL CALCULATORS AND GUIDES</div><h2>Free calculators &amp; practical guides</h2><div>' + allRoutes.map(r => '<a href="/' + r + '/">' + escape(label(r)) + ' <span>↗</span></a>').join('') + '<a href="/articles/">All ' + guideArticles.length + ' money guides <span>↗</span></a></div></section>';

  const clusterLangs = Object.entries(HOURLY_WAGE_CLUSTER);

  function metadata(html, p) {
    const url = siteUrl + (p.route ? '/' + p.route + '/' : '/');
    const lang = p.lang || 'en';
    html = html.replace(/<html lang="[^"]*">/, '<html lang="' + lang + '"' + (lang === 'ar' ? ' dir="rtl"' : '') + '>');
    html = html.replace(/<title>.*?<\/title>/, '<title>' + escape(p.title) + '</title>').replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + escape(p.description) + '">').replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + escape(p.title) + '">').replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + escape(p.description) + '">');
    // hreflang only on the pages that are real translations of one another.
    const inCluster = clusterLangs.some(([, r]) => r === p.route);
    const hreflangs = siteUrl && inCluster ? clusterLangs.map(([l, r]) => '<link rel="alternate" hreflang="' + l + '" href="' + siteUrl + '/' + r + '/">').join('') + '<link rel="alternate" hreflang="x-default" href="' + siteUrl + '/' + HOURLY_WAGE_CLUSTER.en + '/">' : '';
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'Worth', ...(siteUrl ? { url: siteUrl + '/' } : {}), inLanguage: lang },
        { '@type': p.mode ? 'WebApplication' : 'WebPage', name: p.name, description: p.description, ...(siteUrl ? { url } : {}), ...(p.mode ? { applicationCategory: 'FinanceApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, isAccessibleForFree: true, codeRepository: 'https://github.com/njohn931d-dotcom/bbbh' } : {}), inLanguage: lang },
        ...(p.route ? [{ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', ...(siteUrl ? { item: siteUrl + '/' } : {}) }, { '@type': 'ListItem', position: 2, name: p.name, ...(siteUrl ? { item: url } : {}) }] }] : []),
        { '@type': 'Article', headline: p.title, description: p.description, inLanguage: lang, dateModified: TODAY, author: { '@type': 'Organization', name: 'Worth', url: 'https://github.com/njohn931d-dotcom/bbbh' }, publisher: { '@type': 'Organization', name: 'Worth' }, keywords: (p.keywords || []).join(', '), isAccessibleForFree: true },
        { '@type': 'FAQPage', mainEntity: p.faqs.map(([q, a]) => ({ '@type': 'Question', name: q.replace(/&rsquo;/g, '’'), acceptedAnswer: { '@type': 'Answer', text: a.replace(/&rsquo;/g, '’') } })) },
        { '@type': 'Organization', name: 'Worth', ...(siteUrl ? { url: siteUrl + '/' } : {}), sameAs: ['https://github.com/njohn931d-dotcom/bbbh'] }
      ]
    };
    html = html.replace(/<script type="application\/ld\+json">.*?<\/script>/s, '<script type="application/ld+json">' + JSON.stringify(schema).replaceAll('<', '\\u003c') + '</script>');
    const manifestLink = '<link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#204f3c"><meta name="apple-mobile-web-app-capable" content="yes"><link rel="author" href="/humans.txt">';
    return html.replace('</head>', (siteUrl ? '<link rel="canonical" href="' + escape(url) + '"><meta property="og:url" content="' + escape(url) + '"><meta name="robots" content="index, follow, max-image-preview:large">' : '<meta name="robots" content="noindex, nofollow">') + '<meta name="twitter:card" content="summary_large_image"><meta property="og:type" content="website"><meta property="og:site_name" content="Worth"><link rel="sitemap" type="application/xml" href="/sitemap.xml">' + hreflangs + manifestLink + '<meta name="keywords" content="' + escape((p.keywords || []).join(', ')) + '"></head>');
  }

  const data = extraRoutes.map(route => {
    const p = pages[route];
    const isCalc = route.startsWith('calculators/');
    return {
      route,
      name: p.name,
      title: p.title,
      description: p.description,
      mode: isCalc ? 'purchase' : null,
      lang: p.lang || 'en',
      keywords: p.keywords,
      intro: p.intro,
      body: renderBody(p, escape) + githubCTA(p.name),
      faqs: p.faqs
    };
  });

  for (const p of data) {
    const crumb = '<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>' + escape(p.name) + '</span></nav>';
    const eyebrow = p.mode ? 'FREE CALCULATOR • UPDATED SEP 2026' : 'GUIDE • UPDATED SEP 2026';
    const hero = crumb + '<section class="seo-hero"><div class="eyebrow">' + eyebrow + '</div><h1>' + escape(p.name) + '</h1><p>' + escape(p.intro) + '</p></section>';
    const calculator = p.mode ? base.match(/<section id="calculator"[\s\S]*?<\/section>/)[0] : '';
    const faq = '<section class="faq"><div class="section-label">FAQ</div><h2>Common questions</h2>' + p.faqs.map(([q, a]) => '<details><summary>' + q + '<span>+</span></summary><p>' + a + '</p></details>').join('') + '</section>';
    const relatedLinks = relatedFor(p.route, allRoutes, 8);
    const relatedHTML = '<section class="seo-related"><div class="section-label">RELATED</div><h2>More free calculators</h2><div>' + relatedLinks.map(r => '<a href="/' + r + '/">' + escape(label(r)) + ' <span>↗</span></a>').join('') + '</div></section>';
    let html = base.replace(/<main>[\s\S]*?<\/main>/, '<main>' + hero + calculator + '<article class="seo-article">' + p.body + '</article>' + relatedHTML + linksAll + faq + '</main>').replace('<body>', '<body data-mode="' + (p.mode || '') + '">').replace(/href="#(calculator|learn|how)"/g, 'href="/#$1"');
    if (!p.mode) html = html.replace(/<button class="saved-button"[\s\S]*?<\/button>/, '<a class="saved-button" href="/calculators/cost-of-time/">Try the calculator ↗</a>').replace('<script type="module" src="/app.js"></script>', '');
    html = prefixInternalLinks(metadata(html, p));
    fs.mkdirSync(p.route, { recursive: true });
    fs.writeFileSync(p.route + '/index.html', html);
  }

  fs.mkdirSync('public', { recursive: true });
  if (siteUrl) {
    const allUrls = ['', ...allRoutes, ...articleRoutes];
    const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + allUrls.map(r => '<url><loc>' + escape(siteUrl + (r ? '/' + r + '/' : '/')) + '</loc><lastmod>' + TODAY + '</lastmod><changefreq>' + (r ? 'monthly' : 'weekly') + '</changefreq><priority>' + (r ? (r.startsWith('calculators/') ? '0.8' : '0.6') : '1.0') + '</priority></url>').join('') + '\n</urlset>';
    fs.writeFileSync('public/sitemap.xml', sitemap);
  }
}

if (process.argv[1]?.endsWith('generate-parasite.mjs')) generateParasiteSEO();
