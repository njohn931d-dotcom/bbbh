// Wage & salary programmatic cluster generator.
// Runs LAST in the build chain (after generate-seo.mjs and generate-parasite.mjs)
// so it can write the merged master sitemap and extend llms.txt / ai.txt / feed.xml.
import fs from 'node:fs';
import { routes as seoRoutes, articleRoutes } from './generate-seo.mjs';
import { extraRoutes } from './generate-parasite.mjs';
import { LOCALES, LANG_ORDER } from './wages/i18n.mjs';

const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

// ── 2026 US federal estimate (used by en + es pages) ─────────────────────────
const STD_DEDUCTION = { single: 15750, married: 31500 };
const BRACKETS = {
  single: [[12400, .10], [50400, .12], [105700, .22], [201775, .24], [256225, .32], [640600, .35], [Infinity, .37]],
  married: [[24800, .10], [100800, .12], [211400, .22], [403550, .24], [512450, .32], [768700, .35], [Infinity, .37]],
};
const SS_WAGE_BASE_2026 = 184500;
function usNet(grossAnnual) {
  const calc = (filing) => {
    const taxable = Math.max(0, grossAnnual - STD_DEDUCTION[filing]);
    let tax = 0, prev = 0;
    for (const [cap, rate] of BRACKETS[filing]) {
      if (taxable > prev) { tax += (Math.min(taxable, cap) - prev) * rate; prev = cap; } else break;
    }
    const fica = Math.min(grossAnnual, SS_WAGE_BASE_2026) * 0.062 + grossAnnual * 0.0145;
    return { fed: Math.round(tax), fica: Math.round(fica), net: Math.round(grossAnnual - tax - fica) };
  };
  return { single: calc('single'), married: calc('married') };
}

// ── Route definitions ────────────────────────────────────────────────────────
function buildDefs() {
  const defs = [];
  const en = LOCALES.en;
  defs.push({ lang: 'en', kind: 'hub', route: en.hub.slug });
  for (const v of en.pages.hourly) defs.push({ lang: 'en', kind: 'hourly', v, route: `wages/${en.slugFor('hourly', v)}` });
  for (const v of en.pages.annual) defs.push({ lang: 'en', kind: 'annual', v, route: `wages/${en.slugFor('annual', v)}` });
  for (const code of LANG_ORDER) {
    if (code === 'en') continue;
    const L = LOCALES[code];
    defs.push({ lang: code, kind: 'hub', route: L.hub.slug });
    for (const v of L.pages.hourly || []) defs.push({ lang: code, kind: 'hourly', v, route: `${L.hub.slug}/${L.slugFor('hourly', v)}` });
    for (const v of L.pages.monthly || []) defs.push({ lang: code, kind: 'monthly', v, route: `${L.hub.slug}/${L.slugFor('monthly', v)}` });
    for (const v of L.pages.annual || []) defs.push({ lang: code, kind: 'annual', v, route: `${L.hub.slug}/${L.slugFor('annual', v)}` });
  }
  return defs;
}
export const wageDefs = buildDefs();
export const wageRoutes = wageDefs.map((d) => d.route);

// Localized long-form guides that already exist in the parasite cluster —
// perfect topical neighbours for cross-linking.
const LOCAL_GUIDE = {
  es: 'guides/calculadora-salario-hora-2026-latam',
  de: 'guides/stundenlohn-rechner-deutschland-2026',
  fr: 'guides/calculateur-salaire-horaire-france-2026',
  ru: 'guides/калькулятор-зарплаты-час-россия-2026',
  zh: 'guides/时薪计算器-中国-2026',
  ja: 'guides/時給計算機-日本-2026',
  ko: 'guides/연봉-시급-계산기-한국-2026',
  ar: 'guides/حاسبة-الراتب-بالساعة-السعودية-2026',
  pt: 'guides/calculadora-horas-trabalho-brasil-2026',
};

const AFTER_TAX_LABELS = {
  en: ['After tax (est. single)', 'Take-home per month (est.)'],
  es: ['Después de impuestos (soltero, est.)', 'Neto al mes (est.)'],
  pt: ['Líquido estimado (ano)', 'Líquido por mês (est.)'],
  de: ['Netto geschätzt (Jahr)', 'Netto pro Monat (ca.)'],
  fr: ['Net estimé (an)', 'Net par mois (est.)'],
  ja: ['手取り目安（年）', '手取り目安（月）'],
  ko: ['실수령액 추정(연)', '월 실수령 추정'],
  ar: ['الصافي التقديري سنوياً', 'الصافي الشهري التقديري'],
  id: ['Perkiraan bersih (tahun)', 'Bersih per bulan'],
  tr: ['Net tahmini (yıl)', 'Aylık net tahmini'],
  ru: ['На руки за год (оценка)', 'На руки в месяц (оценка)'],
  zh: ['税后估算（年）', '每月到手（估算）'],
  hi: ['टैक्स के बाद (साल)', 'हर महीने हाथ में'],
};

// hreflang pairs: Spanish pages describe the same USD math as their English
// twins, so they are true language alternates of each other.
function hreflangPairs() {
  const pairs = [];
  const enHourly = new Set(LOCALES.en.pages.hourly.map((v) => String(v)));
  for (const v of LOCALES.es.pages.hourly) {
    if (enHourly.has(String(v))) {
      pairs.push({
        v,
        en: `wages/${LOCALES.en.slugFor('hourly', v)}`,
        es: `${LOCALES.es.hub.slug}/${LOCALES.es.slugFor('hourly', v)}`,
      });
    }
  }
  return pairs;
}
export const wageHreflangPairs = hreflangPairs();

function context(L, def) {
  const money = (n) => {
    try {
      return new Intl.NumberFormat(L.numberLocale, { style: 'currency', currency: L.currency, maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(n);
    } catch {
      return `${L.currency} ${Math.round(n)}`;
    }
  };
  const money2 = (n) => {
    try {
      return new Intl.NumberFormat(L.numberLocale, { style: 'currency', currency: L.currency, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n);
    } catch {
      return `${L.currency} ${n.toFixed(2)}`;
    }
  };
  const num = (n) => new Intl.NumberFormat(L.numberLocale, { maximumFractionDigits: 2 }).format(n);
  const man = L.code === 'ko'
    ? (n) => `${Math.round(n / 10000).toLocaleString('ko-KR')}만원`
    : (n) => `${Math.round(n / 10000)}万円`;
  const man0 = (n) => n.toLocaleString('ko-KR');
  const g = {};
  if (def.kind === 'hourly') {
    g.hour = def.v; g.day = def.v * L.hours.day; g.week = def.v * L.hours.week; g.biweek = g.week * 2;
    g.month = def.v * L.hours.month; g.quarter = g.month * 3; g.year = def.v * L.hours.year;
  } else if (def.kind === 'monthly') {
    g.month = def.v; g.hour = def.v / L.hours.month; g.day = g.hour * L.hours.day;
    g.week = (def.v * 12) / 52; g.biweek = g.week * 2; g.quarter = def.v * 3; g.year = def.v * 12;
  } else {
    g.year = def.v; g.hour = def.v / L.hours.year; g.month = def.v / 12;
    g.day = g.hour * L.hours.day; g.week = def.v / 52; g.biweek = g.week * 2; g.quarter = def.v / 4;
  }
  for (const k of Object.keys(g)) g[k] = Math.round(g[k] * 100) / 100;
  let net;
  if (L.eff === null) {
    const n = usNet(g.year).single;
    net = { year: n.net, month: n.net / 12, week: n.net / 52, hour: n.net / L.hours.year, fed: n.fed, fica: n.fica };
  } else {
    const rate = L.eff({ v: def.v, kind: def.kind, gross: g, num });
    net = { year: g.year * (1 - rate / 100), month: g.month * (1 - rate / 100), rate };
  }
  return { v: def.v, kind: def.kind, money, money2, num, man, man0, gross: g, net, effPct: net.rate ?? null, hours: L.hours };
}

// ── Page body builders ───────────────────────────────────────────────────────
function conversionTable(L, c) {
  const rows = [
    ['hour', c.gross.hour], ['day', c.gross.day], ['week', c.gross.week],
    ['biweek', c.gross.biweek], ['month', c.gross.month], ['quarter', c.gross.quarter], ['year', c.gross.year],
  ];
  const trs = rows.map(([k, v]) => `<tr><td>${L.labels[k]}</td><td><strong>${c.money2(v)}</strong></td></tr>`).join('');
  const netYear = AFTER_TAX_LABELS[L.code][0];
  const netMonth = AFTER_TAX_LABELS[L.code][1];
  const netRows = `<tr><td>${netYear}</td><td>${c.money(c.net.year)}</td></tr><tr><td>${netMonth}</td><td>${c.money(c.net.month)}</td></tr>`;
  return `<table><thead><tr><th>${c.kind === 'hourly' ? L.labels.hour : c.kind === 'monthly' ? L.labels.month : L.labels.year}</th><th>${c.kind === 'hourly' ? L.labels.year : L.labels.hour}</th></tr></thead><tbody>${trs}${netRows}</tbody></table>`;
}

function enTaxTable(c) {
  const m = usNet(c.gross.year);
  const row = (label, s, j) => `<tr><td>${label}</td><td>${c.money(s)}</td><td>${c.money(j)}</td></tr>`;
  return `<table><thead><tr><th>&nbsp;</th><th>Single</th><th>Married filing jointly</th></tr></thead><tbody>`
    + row('Gross annual', c.gross.year, c.gross.year)
    + row('Federal income tax (2026 est.)', m.single.fed, m.married.fed)
    + row('FICA (7.65%)', m.single.fica, m.married.fica)
    + row('Take-home per year', m.single.net, m.married.net)
    + row('Take-home per month', m.single.net / 12, m.married.net / 12)
    + row('Effective total rate', `${Math.round((1 - m.single.net / c.gross.year) * 100)}%`, `${Math.round((1 - m.married.net / c.gross.year) * 100)}%`)
    + `</tbody></table>`;
}

function faqHtml(L, c, faqs) {
  return faqs.map(([q, a]) => `<details><summary>${q}<span>+</span></summary><p>${a}</p></details>`).join('');
}

function faqJson(L, c, faqs) {
  return faqs.map(([q, a]) => ({
    '@type': 'Question', name: q.replace(/<[^>]+>/g, ''),
    acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
  }));
}

function pageBody(L, def, c, related) {
  const copy = L.copy;
  const secs = L.sec;
  const parts = [];
  parts.push(`<h2 id="table">${secs.table}</h2>`);
  parts.push(conversionTable(L, c));
  parts.push(`<h2 id="tax">${secs.tax}</h2>`);
  parts.push(`<p>${copy.taxIntro}</p>`);
  parts.push(L.eff === null ? enTaxTable(c) : `<p><strong>${AFTER_TAX_LABELS[L.code][0]}: ${c.money(c.net.year)}</strong> · ${AFTER_TAX_LABELS[L.code][1]}: ${c.money(c.net.month)}${c.effPct != null ? ` (≈${c.effPct}%)` : ''}</p>`);
  parts.push(`<h2 id="compare">${secs.compare}</h2><p>${copy.compare(c)}</p>`);
  parts.push(`<p>${copy.timeBlock(c)}</p>`);
  parts.push(`<h2 id="method">${secs.method}</h2><p>${copy.method(c)}</p>`);
  parts.push(`<p style="font-size:12px;color:#7a8470">${L.hours.note}. ${new Date().toISOString().slice(0, 10)} · Estimates only — not financial advice. <a href="https://github.com/njohn931d-dotcom/bbbh">Open-source math on GitHub</a>.</p>`);
  parts.push(`<h2 id="faq">${secs.faq}</h2>`);
  const faqs = copy.faqs(c);
  parts.push(faqHtml(L, c, faqs));
  parts.push(related);
  return { html: `<article class="seo-article">${parts.join('')}</article>`, faqs };
}

function hubBody(L, defsForLang, localeRoutesInfo, related) {
  const groups = { hourly: [], monthly: [], annual: [] };
  for (const info of localeRoutesInfo) groups[info.kind].push(info);
  const groupTitle = { hourly: L.labels.hour, monthly: L.labels.month, annual: L.labels.year };
  let html = `<article class="seo-article"><p>${L.hub.intro}</p>`;
  // Cheat sheet: first 8 hourly/annual values
  const sample = [...(groups.hourly.slice(0, 5)), ...[...groups.annual, ...groups.monthly].slice(0, 5)];
  if (sample.length) {
    html += `<h2 id="top">${L.hub.compareHead}</h2><div class="hub-grid">${sample.map((info) => `<a class="hub-card" href="/${info.route}/"><span class="hub-kicker">${info.kind === 'hourly' ? groupTitle.hourly : info.kind === 'monthly' ? groupTitle.monthly : groupTitle.annual}</span><h3>${escape(info.h1)}</h3><span class="hub-more">${info.kind === 'hourly' ? '→' : '→'}</span></a>`).join('')}</div>`;
  }
  for (const kind of ['hourly', 'monthly', 'annual']) {
    if (!groups[kind].length) continue;
    html += `<h2 id="${kind}">${kind === 'hourly' ? `${groupTitle.hourly} → ${L.labels.year}` : kind === 'monthly' ? `${groupTitle.monthly} → ${L.labels.hour}` : `${groupTitle.annual} → ${L.labels.hour}`}</h2><div class="hub-grid">${groups[kind].map((info) => `<a href="/${info.route}/">${escape(info.h1)}</a>`).join('')}</div>`;
  }
  html += `<p style="font-size:12px;color:#7a8470">${L.hours.note}. ${new Date().toISOString().slice(0, 10)} · Estimates only — not financial advice. <a href="https://github.com/njohn931d-dotcom/bbbh">Open-source math on GitHub</a>.</p>`;
  html += related;
  return { html: `<article class="seo-article">${html}</article>`, faqs: [] };
}

// ── Renderer ─────────────────────────────────────────────────────────────────
export function generateWages() {
  const raw = process.env.SITE_URL;
  let origin = '', basePath = '', siteUrl = '';
  if (raw) {
    const u = new URL(raw);
    if (!['https:', 'http:'].includes(u.protocol) || u.search || u.hash || u.username || u.password) throw Error('SITE_URL must be a public site URL without query or fragment.');
    origin = u.origin; basePath = u.pathname.replace(/\/$/, ''); siteUrl = origin + basePath;
  }
  const prefixInternalLinks = (html) => basePath ? html.replace(/(<a\b[^>]*\bhref=")\/(?!\/)/g, (_, p) => p + basePath + '/') : html;
  const base = fs.readFileSync('index.html', 'utf8');
  const calculatorSection = base.match(/<section id="calculator"[\s\S]*?<\/section>/)[0];
  const pairs = hreflangPairs();
  const pairByEs = new Map(pairs.map((p) => [p.es, p]));
  const enByV = new Map(pairs.map((p) => [String(p.v), p]));

  const today = new Date().toISOString().slice(0, 10);

  for (const def of wageDefs) {
    const L = LOCALES[def.lang];
    const isHub = def.kind === 'hub';
    const c = isHub ? null : context(L, def);

    // Titles / descriptions / H1
    let title, description, h1, intro;
    if (isHub) {
      title = L.hub.title; description = L.hub.desc; h1 = L.hub.h1; intro = L.hub.intro;
    } else {
      title = L.copy.title(c); description = L.copy.desc(c); h1 = L.copy.h1(c); intro = null;
    }

    // Related links (siblings ±2 in the same locale + always-useful links)
    const sameLang = wageDefs.filter((d) => d.lang === def.lang);
    const pos = sameLang.findIndex((d) => d.route === def.route);
    const near = sameLang.filter((_, i) => Math.abs(i - pos) <= 2 && sameLang[i].route !== def.route).slice(0, 4);
    const shortH1 = (d) => d.kind === 'hub' ? LOCALES[d.lang].hub.h1.split(':')[0].split('—')[0] : LOCALES[d.lang].copy.h1(context(LOCALES[d.lang], d));
    const rel = [];
    for (const n of near) rel.push(`<a href="/${n.route}/">${escape(shortH1(n))} <span>↗</span></a>`);
    rel.push(`<a href="/${L.hub.slug}/">${escape(L.hub.h1.split(':')[0].split('—')[0])} — ${L.labels.year} <span>↗</span></a>`);
    rel.push('<a href="/calculators/salary-to-hourly/">Salary to hourly calculator <span>↗</span></a>');
    rel.push('<a href="/calculators/hourly-to-salary/">Hourly to salary calculator <span>↗</span></a>');
    rel.push('<a href="/calculators/cost-of-time/">Cost of time calculator <span>↗</span></a>');
    rel.push('<a href="/calculators/after-tax-income/">After-tax income calculator <span>↗</span></a>');
    rel.push('<a href="/guides/how-much-is-time-worth/">How much is your time worth? <span>↗</span></a>');
    if (LOCAL_GUIDE[def.lang]) rel.push(`<a href="/${LOCAL_GUIDE[def.lang]}/">${escape(L.hub.h1.split(':')[0])} <span>↗</span></a>`);
    rel.push('<a href="/articles/">All money guides <span>↗</span></a>');
    const related = `<section class="seo-related"><div class="section-label">RELATED</div><h2>Keep the math going</h2><div>${rel.join('')}</div></section>`;

    // Body
    let bodyHtml, faqs;
    if (isHub) {
      const infos = wageDefs.filter((d) => d.lang === def.lang && d.kind !== 'hub').map((d) => ({ ...d, h1: LOCALES[d.lang].copy.h1(context(LOCALES[d.lang], d)) }));
      ({ html: bodyHtml, faqs } = hubBody(L, wageDefs, infos, related));
    } else {
      ({ html: bodyHtml, faqs } = pageBody(L, def, c, related));
    }

    // Hero + optional prefilled calculator (EN pages only)
    const crumbLabel = isHub ? h1 : h1;
    const crumb = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/${L.hub.slug}/">${escape(L.hub.h1.split(':')[0].split('—')[0])}</a><span>/</span><span>${escape(crumbLabel)}</span></nav>`;
    const hero = `${crumb}<section class="seo-hero"><div class="eyebrow">FREE WAGE CALCULATIONS — OPEN SOURCE ON GITHUB · ${today}</div><h1>${escape(h1)}</h1>${isHub ? `<p>${escape(intro)}</p>` : `<div class="quick-answer" style="background:#f6fbf0;border:1px solid #d9e8c8;border-radius:12px;padding:16px 20px;margin:18px 0;font-size:17px;line-height:1.6">${L.copy.answer(c)}</div>`}</section>`;
    let calculator = '';
    if (def.lang === 'en' && !isHub) {
      calculator = calculatorSection;
      if (def.kind === 'hourly') {
        calculator = calculator
          .replace('value="150"', `value="${Math.round(c.gross.week)}"`)
          .replace('id="income" type="number" min="0.01" max="1000000000" step="any" value="25"', `id="income" type="number" min="0.01" max="1000000000" step="any" value="${def.v}"`)
          .replace('<span id="hours">6</span>', `<span id="hours">40</span>`)
          .replace('¾ of a workday', 'one full work week')
          .replace('Not good. Not bad. Just perspective.<br>Only you can decide if it’s worth it.', `That is your $${def.v}/hour stretched across a standard week. Change the numbers — the math stays honest.`);
      } else {
        calculator = calculator
          .replace('value="150"', 'value="1000"')
          .replace('id="income" type="number" min="0.01" max="1000000000" step="any" value="25"', `id="income" type="number" min="0.01" max="1000000000" step="any" value="${def.v}"`)
          .replace('<option value="year">/ year</option>', '<option value="year" selected>/ year</option>')
          .replace('<span id="hours">6</span>', `<span id="hours">${Math.round(1000 / (def.v / 2080))}</span>`)
          .replace('¾ of a workday', `what $1,000 costs at ${c.money2(c.gross.hour)}/hour`)
          .replace('Not good. Not bad. Just perspective.<br>Only you can decide if it’s worth it.', `Every $1,000 of this salary is real work hours. Spend both well.`);
      }
    }

    // hreflang alternates (only true es↔en twins)
    let hreflang = '';
    if (siteUrl) {
      const pair = !isHub && def.lang === 'es' ? pairByEs.get(def.route) : (!isHub && def.lang === 'en' ? enByV.get(String(def.v)) : null);
      if (pair) {
        const enU = `${siteUrl}/${pair.en}/`;
        const esU = `${siteUrl}/${pair.es}/`;
        hreflang = `<link rel="alternate" hreflang="en" href="${enU}"><link rel="alternate" hreflang="es" href="${esU}"><link rel="alternate" hreflang="x-default" href="${enU}">`;
      }
    }

    // JSON-LD
    const url = siteUrl + '/' + def.route + '/';
    const graph = [
      { '@type': 'WebSite', name: 'Worth', ...(siteUrl ? { url: siteUrl + '/' } : {}) },
      { '@type': 'WebPage', name: h1, description, ...(siteUrl ? { url } : {}), inLanguage: L.htmlLang, isPartOf: { '@type': 'WebSite', name: 'Worth' }, about: { '@type': 'Thing', name: def.kind === 'hourly' ? 'Hourly to annual salary conversion' : 'Annual salary to hourly conversion' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', ...(siteUrl ? { item: siteUrl + '/' } : {}) },
        { '@type': 'ListItem', position: 2, name: L.hub.h1.split(':')[0].split('—')[0], ...(siteUrl ? { item: siteUrl + '/' + L.hub.slug + '/' } : {}) },
        { '@type': 'ListItem', position: 3, name: h1, ...(siteUrl ? { item: url } : {}) },
      ] },
      { '@type': 'Article', headline: title, description, inLanguage: L.htmlLang, datePublished: '2026-09-01', dateModified: today, author: { '@type': 'Organization', name: 'Worth' }, publisher: { '@type': 'Organization', name: 'Worth' }, isAccessibleForFree: true, codeRepository: 'https://github.com/njohn931d-dotcom/bbbh' },
    ];
    if (faqs.length) graph.push({ '@type': 'FAQPage', mainEntity: faqJson(L, c, faqs) });
    const schema = { '@context': 'https://schema.org', '@graph': graph };

    let html = base
      .replace(/<main>[\s\S]*?<\/main>/, `<main>${hero}${calculator}${bodyHtml}</main>`)
      .replace('<body>', `<body data-mode="${def.lang === 'en' && !isHub ? 'purchase' : ''}">`)
      .replace(/href="#(calculator|learn|how)"/g, 'href="/#$1"');
    if (!(def.lang === 'en' && !isHub)) {
      html = html
        .replace(/<button class="saved-button"[\s\S]*?<\/button>/, `<a class="saved-button" href="/${L.hub.slug}/">${escape(L.hub.h1.split(':')[0].split('—')[0])} ↗</a>`)
        .replace('<script type="module" src="/app.js"></script>', '');
    }
    html = html
      .replace(/<html lang="[^"]*">/, `<html lang="${L.htmlLang}">`)
      .replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escape(description)}">`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escape(title)}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escape(description)}">`)
      .replace(/<script type="application\/ld\+json">.*?<\/script>/s, `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`);
    const manifestLink = '<link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#204f3c"><meta name="apple-mobile-web-app-capable" content="yes"><link rel="author" href="/humans.txt">';
    html = html.replace('</head>',
      (siteUrl
        ? `<link rel="canonical" href="${escape(url)}"><meta property="og:url" content="${escape(url)}">`
        : '<meta name="robots" content="noindex, nofollow">')
      + '<meta name="twitter:card" content="summary_large_image"><meta property="og:type" content="website"><meta property="og:site_name" content="Worth">'
      + (siteUrl ? '<meta name="robots" content="index, follow, max-image-preview:large"><link rel="sitemap" type="application/xml" href="/sitemap.xml">' : '')
      + hreflang + manifestLink + '</head>');
    html = prefixInternalLinks(html);
    fs.mkdirSync(def.route, { recursive: true });
    fs.writeFileSync(def.route + '/index.html', html);
  }

  // ── Discovery files ────────────────────────────────────────────────────────
  fs.mkdirSync('public', { recursive: true });
  if (siteUrl) {
    // Master sitemap: everything, with hreflang annotations for the es↔en twins.
    const pairs = hreflangPairs();
    const pairByRoute = new Map();
    for (const p of pairs) { pairByRoute.set(p.en, p); pairByRoute.set(p.es, p); }
    const all = ['', ...seoRoutes, ...extraRoutes, ...articleRoutes, ...wageRoutes];
    const seen = new Set();
    const entries = [];
    for (const r of all) {
      if (seen.has(r)) continue;
      seen.add(r);
      const loc = escape(siteUrl + (r ? '/' + r + '/' : '/'));
      const prio = r === '' ? '1.0' : r.startsWith('calculators/') ? '0.9' : r.startsWith('articles/') ? '0.7' : '0.8';
      const pair = pairByRoute.get(r);
      const alts = pair ? `<xhtml:link rel="alternate" hreflang="en" href="${escape(siteUrl + '/' + pair.en + '/')}"/><xhtml:link rel="alternate" hreflang="es" href="${escape(siteUrl + '/' + pair.es + '/')}"/><xhtml:link rel="alternate" hreflang="x-default" href="${escape(siteUrl + '/' + pair.en + '/')}"/>` : '';
      entries.push(`<url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${prio}</priority>${alts}</url>`);
    }
    fs.writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`);

    // llms.txt / ai.txt additions
    const wageLines = [];
    wageLines.push('');
    wageLines.push('## Wage & salary conversion tables (235 pages, 13 languages)');
    wageLines.push('Definitive answers to "X an hour is how much a year" and "Y a year is how much an hour" — full-time conversions with 2026 after-tax estimates.');
    wageLines.push(`- ${siteUrl}/wages/ - Wage conversion tables hub (English)`);
    for (const code of LANG_ORDER) {
      if (code === 'en') continue;
      wageLines.push(`- ${siteUrl}/${LOCALES[code].hub.slug}/ - ${LOCALES[code].hub.h1}`);
    }
    for (const v of [15, 20, 25, 30]) wageLines.push(`- ${siteUrl}/wages/${LOCALES.en.slugFor('hourly', v)}/ - $${v} an hour is $${(v * 2080).toLocaleString('en-US')} a year (2026 table)`);
    for (const v of [40000, 60000, 100000]) wageLines.push(`- ${siteUrl}/wages/${LOCALES.en.slugFor('annual', v)}/ - $${v.toLocaleString('en-US')} a year is $${Math.round(v / 2080)} an hour`);
    wageLines.push('Method: annual = hourly × 2,080 (40 h/week × 52 weeks). Localized pages use local conventions (FR 35 h, TR 45 h, KR 209 h/month, BR 220 h divisor). After-tax figures are estimates.');
    const llmsAdd = wageLines.join('\n') + '\n';
    for (const f of ['public/llms.txt', 'public/ai.txt']) {
      if (fs.existsSync(f)) fs.appendFileSync(f, llmsAdd);
    }

    // RSS additions
    if (fs.existsSync('public/feed.xml')) {
      const items = wageDefs.filter((d) => d.kind !== 'hub').map((d) => {
        const L = LOCALES[d.lang];
        const cc = context(L, d);
        return `\n  <item><title>${escape(L.copy.title(cc))}</title><link>${siteUrl}/${d.route}/</link><guid>${siteUrl}/${d.route}/</guid><description>${escape(L.copy.desc(cc))}</description><pubDate>${new Date().toUTCString()}</pubDate></item>`;
      }).join('');
      let feed = fs.readFileSync('public/feed.xml', 'utf8');
      feed = feed.replace('</channel></rss>', `${items}\n</channel></rss>`);
      fs.writeFileSync('public/feed.xml', feed);
    }
  }
  return wageRoutes;
}

if (process.argv[1]?.endsWith('generate-wages.mjs')) generateWages();
