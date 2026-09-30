/**
 * One JSON-LD @graph per page for the growth surfaces.
 *
 * The node ids (#organization, #website, #primary, #breadcrumb, #article,
 * #faq) and the Organization/WebSite shape deliberately mirror the site's
 * shared builder, so the two can be merged into one implementation without
 * changing what crawlers see. Markup describes only what the page shows:
 * FAQPage only when the questions are rendered, no ratings, no reviews, and no
 * VideoObject for videos this site does not host.
 */
import fs from 'node:fs';
import { SITE_NAME, REPO_URL } from './util.mjs';

const LICENSE_URL = 'https://opensource.org/licenses/MIT';

const strip = html => String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Drop undefined values so the JSON stays clean. */
const clean = o => JSON.parse(JSON.stringify(o));

/**
 * @param {{siteUrl:string}} ctx
 * @param {object} p
 * @param {string} p.route            route without slashes at the ends ('' for home)
 * @param {string} p.name             page name
 * @param {string} p.description
 * @param {'article'|'hub'|'dataset'|'page'|'tool'} p.kind
 * @param {string} [p.lang]
 * @param {{name:string, route?:string}[]} [p.crumbs]  trail after Home
 * @param {string} [p.published] ISO date
 * @param {string} [p.modified]  ISO date
 * @param {[string,string][]} [p.faqs]   [question, answerHtml] pairs, all visible on the page
 * @param {object} [p.dataset]       {name, description, license, distribution:[{url,format}], temporalCoverage, spatialCoverage, variableMeasured[], creator, isBasedOn[]}
 * @param {string[]} [p.keywords]
 * @param {string} [p.section]
 * @param {{name:string, url:string}[]} [p.citations]
 * @param {{lang:string, route:string}[]} [p.alternates]
 */
export function buildGraph(ctx, p) {
  const site = ctx.siteUrl;
  const abs = r => (site ? `${site}/${r ? r + '/' : ''}` : undefined);
  const url = abs(p.route);
  const home = abs('');
  const lang = p.lang || 'en';
  const orgId = home && home + '#organization';
  const siteId = home && home + '#website';
  const id = frag => url && url + frag;

  const nodes = [];
  // The logo is included only when the file exists, so the markup never points at a missing image.
  const logo = site && fs.existsSync('public/logo.svg') ? `${site}/logo.svg` : undefined;
  nodes.push({
    '@type': 'Organization', '@id': orgId, name: SITE_NAME, url: home, logo, sameAs: [REPO_URL],
  });
  nodes.push({
    '@type': 'WebSite', '@id': siteId, name: SITE_NAME, url: home,
    publisher: orgId && { '@id': orgId },
  });

  const crumbs = p.crumbs || [];
  if (crumbs.length) {
    nodes.push({
      '@type': 'BreadcrumbList', '@id': id('#breadcrumb'),
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: home },
        ...crumbs.map((c, i) => ({
          '@type': 'ListItem', position: i + 2, name: c.name,
          item: c.route !== undefined ? abs(c.route) : (i === crumbs.length - 1 ? url : undefined),
        })),
      ],
    });
  }

  const primaryTypes = {
    hub: 'CollectionPage',
    dataset: 'WebPage',
    tool: 'WebApplication',
    article: 'WebPage',
    page: 'WebPage',
  };
  const primary = {
    '@type': primaryTypes[p.kind] || 'WebPage', '@id': id('#primary'), url,
    name: p.name, description: p.description, inLanguage: lang,
    isPartOf: siteId && { '@id': siteId },
    breadcrumb: crumbs.length ? { '@id': id('#breadcrumb') } : undefined,
    datePublished: p.published, dateModified: p.modified,
    primaryImageOfPage: site ? { '@type': 'ImageObject', url: `${site}/og-image.png`, width: 1200, height: 630 } : undefined,
  };
  if (p.kind === 'tool') {
    Object.assign(primary, {
      applicationCategory: 'FinanceApplication', operatingSystem: 'Any', isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    });
  }
  nodes.push(primary);

  if (p.kind === 'article') {
    nodes.push({
      '@type': 'Article', '@id': id('#article'), headline: p.name, description: p.description, inLanguage: lang,
      datePublished: p.published, dateModified: p.modified || p.published,
      author: orgId && { '@id': orgId }, publisher: orgId && { '@id': orgId },
      mainEntityOfPage: url && { '@id': id('#primary') },
      image: site ? [`${site}/og-image.png`] : undefined,
      articleSection: p.section, keywords: p.keywords && p.keywords.join(', '),
      isAccessibleForFree: true, license: LICENSE_URL,
      citation: p.citations && p.citations.map(c => ({ '@type': 'CreativeWork', name: c.name, url: c.url })),
    });
  }

  if (p.kind === 'dataset' && p.dataset) {
    const d = p.dataset;
    nodes.push({
      '@type': 'Dataset', '@id': id('#dataset'), name: d.name, description: d.description, url,
      inLanguage: 'en', license: d.license, isAccessibleForFree: true,
      creator: orgId && { '@id': orgId }, publisher: orgId && { '@id': orgId },
      datePublished: p.published, dateModified: p.modified,
      temporalCoverage: d.temporalCoverage, spatialCoverage: d.spatialCoverage,
      variableMeasured: d.variableMeasured, keywords: d.keywords,
      isBasedOn: d.isBasedOn && d.isBasedOn.map(u => ({ '@type': 'CreativeWork', url: u })),
      distribution: site && d.distribution && d.distribution.map(x => ({
        '@type': 'DataDownload', encodingFormat: x.format, contentUrl: x.url,
      })),
    });
  }

  if (p.faqs && p.faqs.length) {
    nodes.push({
      '@type': 'FAQPage', '@id': id('#faq'),
      mainEntity: p.faqs.map(([q, a]) => ({
        '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) },
      })),
    });
  }

  return clean({ '@context': 'https://schema.org', '@graph': nodes });
}

export const jsonLdTag = graph =>
  `<script type="application/ld+json">${JSON.stringify(graph).replaceAll('<', '\\u003c')}</script>`;
