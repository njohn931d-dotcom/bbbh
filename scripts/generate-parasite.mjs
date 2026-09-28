import fs from 'node:fs';
import { articleRoutes, articles as guideArticles } from './articles.mjs';

export const extraRoutes = [
  'calculators/mortgage-calculator-2026',
  'calculators/compound-interest-calculator',
  'calculators/inflation-calculator-2026',
  'calculators/paycheck-calculator-2026',
  'calculators/crypto-profit-calculator-2026',
  'calculators/youtube-earnings-calculator-2026',
  'calculators/tiktok-money-calculator-2026',
  'calculators/onlyfans-earnings-calculator-2026',
  'calculators/freelance-rate-calculator-2026',
  'calculators/rent-vs-buy-calculator-2026',
  'calculators/car-loan-calculator-2026',
  'calculators/student-loan-calculator-2026',
  'calculators/net-worth-calculator-2026',
  'calculators/cost-of-living-calculator-2026',
  'calculators/salary-in-hours-elon-musk-calculator',
  'calculators/wedding-budget-calculator-2026',
  'calculators/lottery-tax-calculator-2026',
  'calculators/divorce-cost-calculator-2026',
  'calculators/child-cost-calculator-2026',
  'calculators/streaming-cost-calculator-2026',
  'calculators/chatgpt-cost-calculator-2026',
  'calculators/mrbeast-earnings-per-second-calculator',
  'calculators/side-hustle-calculator-2026',
  'calculators/ai-job-replacement-calculator-2026',
  'calculators/trump-tariff-calculator-2026',
  'calculators/taylor-swift-concert-cost-calculator',
  'guides/how-much-house-can-i-afford-2026',
  'guides/are-you-rich-net-worth-percentile-2026',
  'guides/calculadora-hipoteca-2026-espana-mexico',
  'guides/calculadora-salario-hora-2026-latam',
  'guides/stundenlohn-rechner-deutschland-2026',
  'guides/calculateur-salaire-horaire-france-2026',
  'guides/калькулятор-зарплаты-час-россия-2026',
  'guides/时薪计算器-中国-2026',
  'guides/時給計算機-日本-2026',
  'guides/연봉-시급-계산기-한국-2026',
  'guides/حاسبة-الراتب-بالساعة-السعودية-2026',
  'guides/calculadora-horas-trabalho-brasil-2026',
  'guides/how-much-youtubers-make-2026-shocking-truth',
  'guides/cost-of-time-elon-musk-jeff-bezos-2026',
];

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

function buildSimpleBody(name, desc) {
  const today = '2026-09-27';
  return '<h2>What is ' + name + '?</h2><p>' + desc + ' Last updated: ' + today + ' - 2026 edition. Hosted on GitHub Pages DA 99.</p><h2>Formula</h2><p>Work hours = price divided by hourly pay. At $35/hr, $100 = 2.8 hours. This calculator shows monthly, yearly, and work hours cost.</p><h2>2026 Table</h2><table><thead><tr><th>Amount</th><th>Monthly</th><th>Yearly</th><th>Hours at $35/hr</th></tr></thead><tbody><tr><td>$100</td><td>$100</td><td>$1200</td><td>34h</td></tr><tr><td>$500</td><td>$500</td><td>$6000</td><td>171h</td></tr></tbody></table><h2>FAQ</h2><h3>Is this free?</h3><p>Yes, free, no signup, open source on GitHub.</p><h3>How many hours does it cost?</h3><p>Use calculator: price divided by hourly pay.</p>';
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

  const githubCTA = (calcName) => '<div class="github-cta" style="margin:24px 0;padding:16px 20px;border:1px solid #204f3c;border-radius:12px;background:#f6fbf0"><p><strong>Open source on GitHub</strong> — This ' + calcName + ' calculator is free, private, and open source. <a href="https://github.com/njohn931d-dotcom/bbbh" target="_blank" rel="noopener">View source</a></p></div>';

  const allRoutes = [...baseRoutes, ...mainRoutes, ...extraRoutes];
  const linksAll = '<section class="seo-related"><div class="section-label">MORE WAYS TO FIND PERSPECTIVE - ' + (allRoutes.length+1) + ' TOOLS</div><h2>Free calculators & practical guides - ' + (allRoutes.length+1) + ' tools</h2><div>' + allRoutes.map(r => '<a href="/' + r + '/">' + escape(r.split('/').pop().replace(/-/g, ' ')) + ' <span>↗</span></a>').join('') + '<a href="/articles/">All ' + guideArticles.length + ' money guides <span>↗</span></a></div></section>';

  function metadata(html, p) {
    const url = siteUrl + (p.route ? '/' + p.route + '/' : '/');
    const lang = p.lang || 'en';
    html = html.replace(/<html lang="[^"]*">/, '<html lang="' + lang + '">');
    html = html.replace(/<title>.*?<\/title>/, '<title>' + escape(p.title) + '</title>').replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + escape(p.description) + '">').replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + escape(p.title) + '">').replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + escape(p.description) + '">');
    const hreflangs = siteUrl ? [
      '<link rel="alternate" hreflang="en" href="' + siteUrl + '/' + p.route + '/">',
      '<link rel="alternate" hreflang="es" href="' + siteUrl + '/guides/calculadora-hipoteca-2026-espana-mexico/">',
      '<link rel="alternate" hreflang="de" href="' + siteUrl + '/guides/stundenlohn-rechner-deutschland-2026/">',
      '<link rel="alternate" hreflang="fr" href="' + siteUrl + '/guides/calculateur-salaire-horaire-france-2026/">',
      '<link rel="alternate" hreflang="ru" href="' + siteUrl + '/guides/калькулятор-зарплаты-час-россия-2026/">',
      '<link rel="alternate" hreflang="zh" href="' + siteUrl + '/guides/时薪计算器-中国-2026/">',
      '<link rel="alternate" hreflang="ja" href="' + siteUrl + '/guides/時給計算機-日本-2026/">',
      '<link rel="alternate" hreflang="ko" href="' + siteUrl + '/guides/연봉-시급-계산기-한국-2026/">',
      '<link rel="alternate" hreflang="ar" href="' + siteUrl + '/guides/حاسبة-الراتب-بالساعة-السعودية-2026/">',
      '<link rel="alternate" hreflang="pt" href="' + siteUrl + '/guides/calculadora-horas-trabalho-brasil-2026/">',
      '<link rel="alternate" hreflang="x-default" href="' + siteUrl + '/' + p.route + '/">',
    ].join('') : '';
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'Worth', ...(siteUrl ? { url: siteUrl + '/' } : {}), inLanguage: lang },
        { '@type': p.mode ? 'WebApplication' : 'WebPage', name: p.name, description: p.description, ...(siteUrl ? { url } : {}), ...(p.mode ? { applicationCategory: 'FinanceApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, codeRepository: 'https://github.com/njohn931d-dotcom/bbbh' } : {}), inLanguage: lang },
        ...(p.route ? [{ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', ...(siteUrl ? { item: siteUrl + '/' } : {}) }, { '@type': 'ListItem', position: 2, name: p.name, ...(siteUrl ? { item: url } : {}) }] }] : []),
        { '@type': p.mode ? 'TechArticle' : 'Article', headline: p.title, description: p.description, inLanguage: lang, datePublished: '2026-01-15', dateModified: '2026-09-27', author: { '@type': 'Organization', name: 'Worth' }, publisher: { '@type': 'Organization', name: 'Worth' }, keywords: (p.keywords || []).join(', '), isAccessibleForFree: true, codeRepository: 'https://github.com/njohn931d-dotcom/bbbh' },
        { '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Is this free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes free open source' } }] },
        { '@type': 'Organization', name: 'Worth', url: siteUrl || 'https://worth.example', sameAs: ['https://github.com/njohn931d-dotcom/bbbh', 'https://en.wikipedia.org/wiki/Personal_finance'] }
      ]
    };
    html = html.replace(/<script type="application\/ld\+json">.*?<\/script>/s, '<script type="application/ld+json">' + JSON.stringify(schema).replaceAll('<', '\\u003c') + '</script>');
    const manifestLink = '<link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#204f3c"><meta name="apple-mobile-web-app-capable" content="yes"><link rel="author" href="/humans.txt">';
    return html.replace('</head>', (siteUrl ? '<link rel="canonical" href="' + escape(url) + '"><meta property="og:url" content="' + escape(url) + '">' : '<meta name="robots" content="noindex, nofollow">') + '<meta name="twitter:card" content="summary_large_image">' + (siteUrl ? '<meta property="og:image" content="' + siteUrl + '/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Worth — free money calculators that show what things cost in hours of your life"><meta name="twitter:image" content="' + siteUrl + '/og.jpg">' : '') + '<meta property="og:type" content="website"><meta property="og:site_name" content="Worth"><meta name="robots" content="index, follow, max-image-preview:large"><meta name="googlebot" content="index, follow"><link rel="sitemap" type="application/xml" href="/sitemap.xml">' + hreflangs + manifestLink + '<meta name="keywords" content="' + escape((p.keywords || []).join(', ')) + '"></head>');
  }

  const data = extraRoutes.map(route => {
    const name = route.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const title = name + ' 2026: Free Calculator [Free Tool] | Worth';
    const desc = 'Free ' + name + ' calculator 2026: monthly, yearly, work hours cost. Open source on GitHub DA 99. No signup.';
    const isCalc = route.startsWith('calculators/');
    return {
      route,
      name: name + ' Calculator 2026',
      title,
      description: desc,
      mode: isCalc ? 'purchase' : null,
      lang: route.includes('calculadora-hipoteca') || route.includes('calculadora-salario') ? 'es' : route.includes('stundenlohn') ? 'de' : route.includes('calculateur') ? 'fr' : route.includes('калькулятор') ? 'ru' : route.includes('时薪') ? 'zh' : route.includes('時給') ? 'ja' : route.includes('연봉') ? 'ko' : route.includes('حاسبة') ? 'ar' : route.includes('horas-trabalho') ? 'pt' : 'en',
      keywords: [name.toLowerCase(), name.toLowerCase() + ' 2026', 'free calculator', 'github'],
      intro: desc,
      body: buildSimpleBody(name, desc) + githubCTA(name),
      faqs: [['Is this free?', 'Yes free open source'], ['How many hours?', 'Price divided by hourly pay']]
    };
  });

  for (const p of data) {
    const crumb = '<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>' + escape(p.name) + '</span></nav>';
    const hero = crumb + '<section class="seo-hero"><div class="eyebrow">FREE MONEY CALCULATOR 2026 - OPEN SOURCE • Updated Sep 27, 2026</div><h1>' + escape(p.name) + '</h1><p>' + escape(p.intro) + '</p><div style="font-size:11px;color:#8a9a7a;margin-top:10px;">Last updated: 2026-09-27 • ' + allRoutes.length + ' calculators • GitHub DA 99</div></section>';
    let calculator = p.mode ? base.match(/<section id="calculator"[\s\S]*?<\/section>/)[0] : '';
    const faq = p.mode ? base.match(/<section class="faq"[\s\S]*?<\/section>/)[0] : '';
    const relatedLinks = allRoutes.filter(r => r !== p.route).sort(() => 0.5 - Math.random()).slice(0, 12);
    const relatedHTML = '<section class="seo-related"><div class="section-label">RELATED CALCULATORS - ' + allRoutes.length + ' TOOLS</div><h2>More free calculators</h2><div>' + relatedLinks.map(r => '<a href="/' + r + '/">' + escape(r.split('/').pop().replace(/-/g, ' ')) + ' <span>↗</span></a>').join('') + '</div></section>';
    const pbnFooter = '<section style="margin-top:40px;padding:20px;background:#f5f5ef;border-radius:8px;border:1px solid #e0e4d7"><div class="section-label">PARASITE SEO CLUSTER - GITHUB DA 99 - ' + allRoutes.length + ' TOOLS</div><p style="font-size:11px;color:#7a8470">Part of Worth ' + allRoutes.length + '-tool cluster hosted on GitHub Pages DA 99. Open source MIT. External: <a href="https://en.wikipedia.org/wiki/Personal_finance">Wikipedia</a> • <a href="https://github.com/topics/calculator">GitHub Calculator</a> • <a href="https://github.com/njohn931d-dotcom/bbbh">GitHub Source</a></p></section>';
    let html = base.replace(/<main>[\s\S]*?<\/main>/, '<main>' + hero + calculator + '<article class="seo-article"><div style="background:#eef0e5;padding:12px 16px;border-radius:6px;font-size:11px;margin-bottom:20px;">Free 2026 • GitHub DA 99 • ' + escape(p.name) + '</div>' + p.body + relatedHTML + linksAll + pbnFooter + faq + '</main>').replace('<body>', '<body data-mode="' + (p.mode || '') + '">').replace(/href="#(calculator|learn|how)"/g, 'href="/#$1"');
    if (!p.mode) html = html.replace(/<button class="saved-button"[\s\S]*?<\/button>/, '<a class="saved-button" href="/calculators/cost-of-time/">Try the calculator ↗</a>').replace('<script type="module" src="/app.js"></script>', '');
    html = prefixInternalLinks(metadata(html, p));
    fs.mkdirSync(p.route, { recursive: true });
    fs.writeFileSync(p.route + '/index.html', html);
    fs.writeFileSync(p.route + '/index.txt', p.title + '\n' + p.description + '\n');
    fs.writeFileSync(p.route + '/index.json', JSON.stringify({ title: p.title, route: p.route }, null, 2));
  }

  fs.mkdirSync('public', { recursive: true });
  if (siteUrl) {
    const allUrls = ['', ...allRoutes, ...articleRoutes];
    const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + allUrls.map(r => '<url><loc>' + escape(siteUrl + (r ? '/' + r + '/' : '/')) + '</loc><lastmod>2026-09-27</lastmod><changefreq>daily</changefreq></url>').join('') + '\n</urlset>';
    fs.writeFileSync('public/sitemap.xml', sitemap);
  }
}

if (process.argv[1]?.endsWith('generate-parasite.mjs')) generateParasiteSEO();
