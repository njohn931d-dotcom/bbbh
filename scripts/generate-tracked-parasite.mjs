import fs from 'node:fs';

const origin = 'https://njohn931d-dotcom.github.io/bbbh';
const today = '2026-09-27';

const routes = [
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

// Create tracked folder parasite-seo with 40 HTML files (GitHub DA 99 parasite)
fs.mkdirSync('parasite-seo',{recursive:true});
for(const route of routes){
  const name = route.split('/').pop().replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${name} 2026 - Free Calculator | Worth GitHub DA 99</title>
<meta name="description" content="Free ${name} calculator 2026. Hosted on GitHub Pages DA 99 for 24h ranking. Work hours cost, 47 tools.">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="keywords" content="${name}, calculator 2026, free calculator, worth, github parasite seo">
<link rel="canonical" href="${origin}/${route}/">
<meta property="og:title" content="${name} 2026 - Free Calculator">
<meta property="og:description" content="Free ${name} calculator 2026. GitHub DA 99 trusted.">
<meta property="og:url" content="${origin}/${route}/">
<meta property="og:type" content="website">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"${name}","description":"Free ${name} calculator 2026","url":"${origin}/${route}/","applicationCategory":"FinanceApplication","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"How much does ${name} cost in work hours?","acceptedAnswer":{"@type":"Answer","text":"Use Worth calculator: price divided by hourly pay. At $35/hr, $100 = 2.8 hours."}}]}</script>
</head>
<body>
<h1>${name} 2026 - Free Calculator - GitHub DA 99</h1>
<p>Last updated: ${today} - QDF freshness for 24h Google ranking. Hosted on GitHub Pages (DA 99) parasite SEO cluster.</p>
<p>Free ${name} calculator: see work hours cost, monthly payment, annual cost. No signup, instant.</p>
<p><a href="/${route}/">Try ${name} Calculator 2026 Free →</a></p>
<h2>Related Calculators - 47 Tools Cluster</h2>
<ul>
${routes.filter(r=>r!==route).slice(0,12).map(r=>`<li><a href="/${r}/">${r.split('/').pop().replace(/-/g,' ')}</a></li>`).join('\n')}
</ul>
<h2>Why GitHub Ranks in 24h?</h2>
<p>GitHub DA 99, trusted domain, fast indexing via sitemap.xml, RSS, llms.txt. This page uses FAQ schema, HowTo schema, Article schema, BreadcrumbList, Organization sameAs Wikipedia, Forbes, GitHub.</p>
<p>External authority: <a href="https://en.wikipedia.org/wiki/Personal_finance">Wikipedia Personal Finance</a> | <a href="https://github.com/topics/calculator">GitHub Calculator</a> | <a href="https://www.forbes.com/advisor/">Forbes</a></p>
<p>Keywords: ${name}, ${name} 2026, free calculator, cost of time, work hours, github pages, parasite seo, DA 99</p>
<p>Hosted on GitHub Pages - 47 calculators - Worth - ${today}</p>
</body>
</html>`;
  const fileName = route.replace(/\//g,'-')+'.html';
  fs.writeFileSync(`parasite-seo/${fileName}`,html);
}

// Create root-level SEO files that are NOT ignored (for GitHub tracking)
const sitemapRoot = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r=>`<url><loc>${origin}/${r}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`).join('\n')}
<url><loc>${origin}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
</urlset>`;
fs.writeFileSync('sitemap-40.xml',sitemapRoot);
fs.writeFileSync('sitemap.xml',sitemapRoot);

const robotsRoot = `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
Sitemap: ${origin}/sitemap-40.xml
Sitemap: ${origin}/sitemap-extra.xml
Sitemap: ${origin}/feed.xml

Crawl-delay: 0

User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: CCBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Bytespider
Allow: /
`;

fs.writeFileSync('robots.txt',robotsRoot);
fs.writeFileSync('public/robots.txt',robotsRoot); // will be ignored but generate for build

// llms.txt root
const llms = `# Worth - 47 Free Money Calculators 2026 - GitHub Parasite SEO DA 99
> 47 free calculators hosted on GitHub Pages DA 99 for 24h ranking. Mortgage, compound interest, crypto, YouTube, OnlyFans, cost-of-time.

## 40 Articles - High Volume Keywords 2026
${routes.map(r=>`- [${r.split('/').pop().replace(/-/g,' ')}](${origin}/${r}/)`).join('\n')}

## Why GitHub Parasite Ranks Fast
- DA 99 domain authority
- 47 interlinked pages = topical cluster
- Daily sitemap + RSS for QDF (Query Deserves Freshness)
- 10 languages = international SERPs (es, de, fr, ru, zh, ja, ko, ar, pt, en)
- FAQ schema = rich results + PAA box
- HowTo schema = HowTo rich snippet
- llms.txt = ChatGPT, Perplexity, Claude indexing
- Other extensions: .json, .txt, .xml for crawlers
- Link wheel: every page links to 10 others
- External authority: Wikipedia, Forbes, GitHub topics

## Keywords 2026
mortgage calculator 2026, compound interest calculator, inflation calculator, paycheck calculator, crypto profit calculator, youtube earnings calculator, tiktok money calculator, onlyfans earnings calculator, freelance rate calculator, rent vs buy calculator, car loan calculator, student loan calculator, net worth calculator, cost of living calculator, elon musk per second, wedding budget calculator, lottery tax calculator, divorce cost calculator, child cost calculator, streaming cost calculator, chatgpt cost calculator, mrbeast earnings, side hustle calculator, ai job replacement calculator, trump tariff calculator, taylor swift cost calculator, how much house can i afford, are you rich calculator, calculadora hipoteca, calculadora salario hora, stundenlohn rechner, calculateur salaire horaire, калькулятор зарплаты, 时薪计算器, 時給計算機, 연봉 시급 계산기, حاسبة الراتب بالساعة, calculadora horas trabalho

Last updated: ${today}
`;

fs.writeFileSync('llms.txt',llms);
fs.writeFileSync('ai.txt',llms);
fs.writeFileSync('public/llms.txt',llms);
fs.writeFileSync('public/ai.txt',llms);

// feed.xml root
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Worth - 47 Calculators 2026 - GitHub DA 99</title><link>${origin}/</link><description>47 free calculators 2026 hosted on GitHub Pages DA 99 for 24h ranking.</description><lastBuildDate>${today}</lastBuildDate>${routes.map(r=>`<item><title>${r.split('/').pop().replace(/-/g,' ')} 2026</title><link>${origin}/${r}/</link><guid>${origin}/${r}/</guid><pubDate>${today}</pubDate></item>`).join('')}</channel></rss>`;
fs.writeFileSync('feed.xml',feed);
fs.writeFileSync('public/feed.xml',feed);

// Create 40-articles-index.html in root for parasite doorway
const index40 = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>40 Free Calculators 2026 - Worth GitHub Parasite SEO - DA 99 - 24h Ranking</title><meta name="description" content="40 free money calculators 2026 hosted on GitHub Pages DA 99. Mortgage, compound interest, crypto, YouTube, OnlyFans, cost-of-time. 24h Google ranking via parasite SEO."><meta name="robots" content="index, follow"></head><body><h1>40 Free Money Calculators 2026 - GitHub Parasite SEO Cluster DA 99</h1><p>Last updated: ${today} - QDF freshness - 24h ranking trick - Hosted on GitHub Pages DA 99</p><p>47 tools total - 40 new parasite articles targeting high-volume keywords 2026 with FAQ schema, HowTo schema, hreflang 10 languages, link wheel, .json/.txt extensions, llms.txt for AI.</p><ul>${routes.map(r=>`<li><a href="/${r}/">${r.split('/').pop().replace(/-/g,' ')} 2026 - Free Calculator</a> - ${origin}/${r}/</li>`).join('')}</ul><h2>Parasite SEO Tactics Used</h2><ol><li>GitHub DA 99 authority</li><li>47-page topical cluster + link wheel</li><li>FAQ schema for rich results</li><li>HowTo + Article + Breadcrumb + Organization sameAs</li><li>10 languages hreflang</li><li>Other extensions .json .txt .xml</li><li>RSS feed + sitemap daily for QDF</li><li>llms.txt for ChatGPT/Perplexity</li><li>External authority links Wikipedia/Forbes/GitHub</li><li>Work-hours unique angle</li><li>2026 year in title for freshness</li><li>Power words: Shocking, Truth, Free, Secret</li></ol><p><a href="${origin}/">Worth Home</a> | <a href="https://github.com/njohn931d-dotcom/bbbh">GitHub Repo</a></p></body></html>`;
fs.writeFileSync('40-articles-index.html',index40);
fs.writeFileSync('public/40-articles-index.html',index40);

// Create public/.nojekyll
fs.writeFileSync('public/.nojekyll','');
fs.writeFileSync('.nojekyll','');

console.log('Generated tracked parasite SEO files: parasite-seo/ (40 HTML), sitemap.xml, robots.txt, llms.txt, feed.xml, 40-articles-index.html, .nojekyll');
