import fs from 'node:fs';
import { articleRoutes, articles as guideArticles } from './articles.mjs';
import { CLUSTER_ROUTES, LOCALE_ROUTES, getContent, TRANSLATION_MAP, REPO_URL } from './cluster-content.mjs';

/**
 * Renders the tool cluster: one page per route in cluster-content.mjs, each
 * with its own title, description, formula, worked example and FAQ.
 *
 * The previous implementation derived a page's name by title-casing its slug
 * and then appended "2026" to it, which produced titles like
 * "Mortgage Calculator 2026 2026" and H1s like
 * "Mortgage Calculator 2026 Calculator 2026". It also rendered every page from
 * one shared body template, gave all of them the same hreflang fan-out to ten
 * unrelated URLs, and asserted a Wikipedia sameAs the site does not own.
 * Those are fixed here; see scripts/seo-audit.mjs for the checks that catch
 * them if they ever come back.
 */

// Route lists come from generate-seo.mjs so the sitemap can never drift out of
// sync with the pages the build actually produces. Duplicating this list here
// previously left five built pages missing from sitemap.xml.
import { routes as seoRoutes } from './generate-seo.mjs';
import { GROWTH_ROUTES, generateGrowth } from './growth/index.mjs';
import { converterHtml, widgetAssetsHtml } from './growth/widget.mjs';

/** Pages that predate the cluster and already have hand-written content. */
const baseRoutes = seoRoutes;

/**
 * Every route this module is responsible for. Exported because vite.config.js
 * feeds it to the build as a rollup input — a route that renders a file but is
 * not in this list would never be built.
 */
export const extraRoutes = [...CLUSTER_ROUTES, ...GROWTH_ROUTES];

/** Date the cluster content was last genuinely revised. */
const CONTENT_UPDATED = '2026-09-27';
const CONTENT_PUBLISHED = '2026-01-15';

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

  /**
   * Append the brand name only when it does not collide with the last word of
   * the title. "…is worth | Worth" reads badly, and a title that stutters is a
   * small quality signal against the page for no gain in impressions.
   */
  const withBrand = title => {
    const words = title.toLowerCase().replace(/[^\p{L}\s\d]/gu, ' ').split(/\s+/).filter(Boolean);
    const last = words[words.length - 1];
    return last === 'worth' ? title : `${title} | Worth`;
  };

  const githubCTA = label => '<div class="github-cta" style="margin:24px 0;padding:16px 20px;border:1px solid #204f3c;border-radius:12px;background:#f6fbf0"><p><strong>Open source</strong> — this ' + escape(label) + ' runs entirely in your browser. No account, no tracking, no data leaves the page. <a href="' + REPO_URL + '" target="_blank" rel="noopener">Read the source</a></p></div>';

  /** All tools that exist site-wide, for the "everything else" link list. */
  // Calculators and guides only: the growth hubs are linked from the footer and homepage instead.
  const everyRoute = [...new Set([...baseRoutes, ...CLUSTER_ROUTES, ...articleRoutes])];

  /** Human label for a route, used as link text. */
  const labelFor = route => (getContent(route)?.h1) || route.split('/').pop().replace(/-/g, ' ');

  // ------------------------------------------------------------- page model

  const pages = CLUSTER_ROUTES.map(route => {
    const c = getContent(route);
    if (!c) throw new Error(`No content defined for route: ${route}`);
    return {
      route,
      content: c,
      lang: c.lang || 'en',
      dir: c.dir || null,
      h1: c.h1,
      title: withBrand(c.title),
      description: c.desc,
      isTool: c.intent === 'tool',
    };
  });

  // ---------------------------------------------------------------- helpers

  /** Render one content entry's body: formula, table, notes, FAQ. */
  function renderBody(c) {
    const parts = [];

    // Localized pages carry the interactive pay converter ahead of the formula.
    if (c.widget) parts.push(converterHtml(c.widget) + widgetAssetsHtml());

    parts.push(
      '<h2>' + escape(c.formula.name) + '</h2>' +
      '<p><strong>' + escape(c.formula.expr) + '</strong></p>' +
      '<p>' + c.formula.plain + '</p>'
    );

    if (c.assumptions) {
      parts.push('<h3>Worked example</h3><p><em>Assumptions: ' + escape(c.assumptions) + '</em></p>');
    }

    if (c.table) {
      parts.push(
        '<div style="overflow-x:auto"><table><thead><tr>' +
        c.table.head.map(h => '<th scope="col">' + escape(h) + '</th>').join('') +
        '</tr></thead><tbody>' +
        c.table.rows.map(row => '<tr>' + row.map(cell => '<td>' + escape(cell) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table></div>'
      );
    }

    if (c.notes?.length) {
      parts.push('<h2>What the numbers do not tell you</h2><ul>' +
        c.notes.map(n => '<li>' + n + '</li>').join('') + '</ul>');
    }

    if (c.caveat) {
      parts.push('<h3>Before you rely on this</h3><p>' + escape(c.caveat) + '</p>');
    }

    if (c.faqs?.length) {
      parts.push('<h2 id="faq">Frequently asked questions</h2>' +
        c.faqs.map(([q, a], i) => '<h3>' + escape(q) + '</h3><p>' + a + '</p>').join(''));
    }

    return parts.join('');
  }

  /**
   * Relevant links only. The old build picked 12 links at random with
   * `sort(() => 0.5 - Math.random())`, which made the output differ on every
   * build and put an arbitrary set of pages on every page.
   */
  function renderLinks(c) {
    const seen = new Set();
    const pick = [];
    for (const r of [...(c.related || []), ...(c.links || [])]) {
      if (seen.has(r) || r === c.route) continue;
      if (!everyRoute.includes(r)) continue;
      seen.add(r);
      pick.push(r);
      if (pick.length >= 6) break;
    }
    if (!pick.length) return '';
    return '<section class="seo-related"><h2>Related tools</h2><div>' +
      pick.map(r => '<a href="/' + r + '/">' + escape(labelFor(r)) + ' <span>↗</span></a>').join('') +
      '</div></section>';
  }

  /** The full "every tool" list, collapsed behind a heading. */
  function renderAllTools() {
    return '<section class="seo-related"><h2>All ' + everyRoute.length + ' calculators and guides</h2><div>' +
      everyRoute.map(r => '<a href="/' + r + '/">' + escape(labelFor(r)) + ' <span>↗</span></a>').join('') +
      '<a href="/articles/">All ' + guideArticles.length + ' money guides <span>↗</span></a>' +
      '</div></section>';
  }

  /** An honest footer. No link-wheel language, no borrowed-authority links. */
  function renderFooter() {
    return '<section class="colophon" style="margin-top:40px;padding:20px;background:#f5f5ef;border-radius:8px;border:1px solid #e0e4d7">' +
      '<div class="section-label">ABOUT THIS TOOL</div>' +
      '<p style="font-size:12px;color:#5c6650;margin:0">Worth is free, open source and runs entirely in your browser — no account, no tracking, and nothing you type is sent anywhere. ' +
      'Figures are worked examples, not quotes, and the <a href="' + REPO_URL + '" target="_blank" rel="noopener">source is on GitHub</a> under the MIT licence. ' +
      'Corrections are welcome as pull requests.</p></section>';
  }

  // --------------------------------------------------------------- metadata

  function metadata(html, p) {
    const url = siteUrl + '/' + p.route + '/';
    const lang = p.lang;

    // Document language and text direction. A page that declares lang="de"
    // while its body is English is a signal we were getting wrong, not right.
    html = html.replace(/<html lang="[^"]*"/, '<html lang="' + lang + '"' + (p.dir ? ' dir="' + p.dir + '"' : ''));

    html = html
      .replace(/<title>[\s\S]*?<\/title>/, '<title>' + escape(p.title) + '</title>')
      .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + escape(p.description) + '">')
      .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + escape(p.title) + '">')
      .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + escape(p.description) + '">');

    /*
     * hreflang: self, plus whichever real translations exist for this page.
     * Works in both directions — an English page lists its translations, and a
     * translated page lists the English page it is a translation of — so every
     * pair is reciprocal. The previous build pointed all 40 pages at the same
     * 10 unrelated foreign URLs, which is invalid and which Google discards
     * wholesale, taking the legitimate annotations down with it.
     */
    const hreflangs = siteUrl ? (() => {
      const links = [`<link rel="alternate" hreflang="${lang}" href="${siteUrl}/${p.route}/">`];
      for (const t of TRANSLATION_MAP[p.route] || []) {
        links.push(`<link rel="alternate" hreflang="${t.lang}" href="${siteUrl}/${t.route}/">`);
      }
      // Reverse direction: a translated page declares the page it translates,
      // and x-default points at the English original so a visitor with no
      // language preference is not dropped onto a translated page.
      const parent = p.content.translationOf;
      const isTranslation = parent && TRANSLATION_MAP[parent]?.some(t => t.route === p.route);
      if (isTranslation) {
        links.push(`<link rel="alternate" hreflang="en" href="${siteUrl}/${parent}/">`);
      }
      const xDefault = isTranslation ? parent : p.route;
      links.push(`<link rel="alternate" hreflang="x-default" href="${siteUrl}/${xDefault}/">`);
      return links.join('');
    })() : '';

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'Worth',
          ...(siteUrl ? { url: siteUrl + '/' } : {}),
          inLanguage: lang,
        },
        {
          '@type': p.isTool ? 'WebApplication' : 'WebPage',
          name: p.h1,
          description: p.description,
          ...(siteUrl ? { url } : {}),
          inLanguage: lang,
          ...(p.isTool ? {
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            isAccessibleForFree: true,
            codeRepository: REPO_URL,
          } : {}),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', ...(siteUrl ? { item: siteUrl + '/' } : {}) },
            { '@type': 'ListItem', position: 2, name: p.h1, ...(siteUrl ? { item: url } : {}) },
          ],
        },
        {
          '@type': 'TechArticle',
          headline: p.h1,
          description: p.description,
          inLanguage: lang,
          datePublished: CONTENT_PUBLISHED,
          dateModified: CONTENT_UPDATED,
          author: { '@type': 'Organization', name: 'Worth' },
          publisher: { '@type': 'Organization', name: 'Worth' },
          isAccessibleForFree: true,
          codeRepository: REPO_URL,
          license: 'https://opensource.org/licenses/MIT',
        },
        {
          '@type': 'FAQPage',
          mainEntity: p.content.faqs.map(([q, a]) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
          })),
        },
        {
          '@type': 'Organization',
          name: 'Worth',
          ...(siteUrl ? { url: siteUrl + '/' } : {}),
          // Only profiles this site actually controls. Claiming a Wikipedia
          // page as an identity reference is a false statement about who we
          // are, and it is the kind of thing that earns a manual action.
          sameAs: [REPO_URL],
        },
      ],
    };

    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      '<script type="application/ld+json">' + JSON.stringify(schema).replaceAll('<', '\\u003c') + '</script>');

    const head = siteUrl
      ? '<link rel="canonical" href="' + escape(url) + '"><meta property="og:url" content="' + escape(url) + '">' +
        // Absolute, so link unfurlers that refuse to resolve relative URLs
        // still render a card instead of a bare text link.
        '<meta property="og:image" content="' + escape(siteUrl + '/og-image.png') + '">' +
        '<meta name="twitter:image" content="' + escape(siteUrl + '/og-image.png') + '">'
      : '<meta name="robots" content="noindex, nofollow">';

    return html.replace('</head>',
      head +
      '<meta name="twitter:card" content="summary_large_image">' +
      '<meta property="og:type" content="website">' +
      '<meta property="og:site_name" content="Worth">' +
      '<meta property="og:locale" content="' + lang + '">' +
      '<meta name="robots" content="index, follow, max-image-preview:large">' +
      '<link rel="sitemap" type="application/xml" href="/sitemap.xml">' +
      hreflangs +
      '<link rel="manifest" href="/manifest.json">' +
      '<meta name="theme-color" content="#204f3c">' +
      '<meta name="apple-mobile-web-app-capable" content="yes">' +
      (siteUrl ? '<link rel="alternate" type="application/rss+xml" title="Worth money calculators and guides" href="' + escape(siteUrl + '/feed.xml') + '">' : '') +
      '<link rel="author" href="/humans.txt">' +
      '</head>');
  }

  // ----------------------------------------------------------------- render

  for (const p of pages) {
    const c = p.content;
    const crumbLabel = escape(p.h1);

    const crumb = '<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>' + crumbLabel + '</span></nav>';

    const hero = crumb +
      '<section class="seo-hero">' +
      '<h1>' + crumbLabel + '</h1>' +
      '<p>' + escape(c.intro) + '</p>' +
      '<div style="font-size:11px;color:#8a9a7a;margin-top:10px">Updated ' + CONTENT_UPDATED + ' · free, no sign-up</div>' +
      '</section>';

    // Reuse the real interactive calculator section on tool pages only.
    const calculator = p.isTool ? base.match(/<section id="calculator"[\s\S]*?<\/section>/)[0] : '';
    const faqSection = p.isTool ? base.match(/<section class="faq"[\s\S]*?<\/section>/)[0] : '';

    const body =
      '<article class="seo-article">' +
      renderBody(c) +
      githubCTA(p.h1.toLowerCase()) +
      renderLinks(c) +
      '</article>' +
      renderAllTools() +
      renderFooter() +
      faqSection;

    let html = base.replace(/<main>[\s\S]*?<\/main>/, '<main>' + hero + calculator + body + '</main>')
      .replace('<body>', '<body data-mode="' + (p.isTool ? 'purchase' : '') + '">')
      .replace(/href="#(calculator|learn|how)"/g, 'href="/#$1"');

    if (!p.isTool) {
      html = html.replace(/<button class="saved-button"[\s\S]*?<\/button>/, '<a class="saved-button" href="/calculators/cost-of-time/">Try the calculator ↗</a>')
        .replace('<script type="module" src="/app.js"></script>', '');
    }

    html = prefixInternalLinks(metadata(html, p));

    fs.mkdirSync(p.route, { recursive: true });
    // Note: no index.txt / index.json twins. They were near-duplicate URLs of
    // the same page competing with it in the index for no benefit.
    fs.writeFileSync(p.route + '/index.html', html);
  }

  // The site-wide sitemap is generated by scripts/generate-seo.mjs from the
  // combined route model. Keep this renderer focused on page output so it
  // cannot replace the complete sitemap with a partial or synthetic-date list.

  // News, movies, minimum wage, emoji and open-data pages. Their routes are in extraRoutes (build
  // inputs, expected URL count) and in the sitemap union in generate-seo.mjs.
  generateGrowth({ siteUrl, origin, basePath });
}

if (process.argv[1]?.endsWith('generate-parasite.mjs')) generateParasiteSEO();
