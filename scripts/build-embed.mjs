/**
 * Embed builder: turns every built calculator page into a chromeless widget
 * that any other site can put on a page, plus a copy-paste snippet for it.
 *
 * Why this exists instead of more "submit to directories" advice: a page on
 * someone else's site brings visitors today, from an audience that already
 * exists, and it does not wait on a ranking algorithm that has never heard of
 * a `github.io` project path. Every embed page carries a link back to the full
 * tool, so the widget is also the most natural backlink this project can earn.
 *
 * The widget is generated from the built page rather than from a second
 * template, so it can never drift out of sync with the real calculator: same
 * markup, same hashed CSS/JS assets, same numbers.
 */

import fs from 'node:fs';
import path from 'node:path';

const EMBED_CLASS = 'worth-embed-page';

/**
 * Absolute prefix to put in front of a site-relative path.
 *
 * `siteUrl` already contains the project path (`https://host/bbbh`), so the
 * base path must only be added when there is no absolute URL to carry it.
 * Getting this wrong produces `/bbbh/bbbh/...` links, which is the kind of
 * mistake that is invisible in a local preview and broken in production.
 */
const prefixOf = ({ siteUrl = '', base = '/' }) =>
  siteUrl ? siteUrl.replace(/\/$/, '') : base.replace(/\/$/, '');

/** `dist/calculators/cost-of-time/index.html` -> `cost-of-time`. */
export function toolSlugFromPath(file) {
  const parts = file.split(path.sep).join('/').split('/');
  const i = parts.indexOf('calculators');
  return i >= 0 && parts[i + 1] ? parts[i + 1] : null;
}

const titleOf = html => (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
const descOf = html => (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
const attrOf = (html, re) => (html.match(re) || [])[1] || '';

/**
 * Build the widget page for one calculator.
 *
 * Deliberately `noindex` with a canonical pointing at the real tool page: the
 * widget is a copy of the tool, and two identical indexable URLs would compete
 * with each other. Search interest is consolidated onto the tool, and the
 * visitor still arrives through the link the widget carries.
 */
export function renderEmbedPage(sourceHtml, { slug, siteUrl = '', base = '/' } = {}) {
  const calculator = sourceHtml.match(/<section id="calculator"[\s\S]*?<\/section>/);
  if (!calculator) throw new Error(`renderEmbedPage: no calculator section for ${slug}`);
  const css = attrOf(sourceHtml, /<link rel="stylesheet" href="([^"]+)"/);
  const js = attrOf(sourceHtml, /<script type="module" src="([^"]+)"/);
  const toolUrl = prefixOf({ siteUrl, base }) + '/calculators/' + slug + '/';
  const title = `Worth calculator widget: ${titleOf(sourceHtml).replace(/\s*\|\s*Worth$/, '')}`.trim();
  const desc = descOf(sourceHtml);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(desc)}">
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${escape(toolUrl)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(desc)}">
<meta property="og:url" content="${escape(toolUrl)}">
${css ? `<link rel="stylesheet" href="${escape(css)}">` : ''}
<style>
  /* Only what the widget needs: the host page's chrome is gone, the tool is not. */
  html,body{margin:0;padding:0;background:#fff}
  body.${EMBED_CLASS}{display:block;min-height:0}
  body.${EMBED_CLASS} main{padding:14px 14px 18px;max-width:760px;margin:0 auto}
  body.${EMBED_CLASS} .calculator-wrap{margin:0}
  body.${EMBED_CLASS} .tool-tabs{display:none}
  body.${EMBED_CLASS} .embed-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;
    margin:0 0 12px;padding:9px 12px;border:1px solid #e0e4d7;border-radius:10px;background:#f6fbf0;font-size:12px}
  body.${EMBED_CLASS} .embed-bar a{color:#204f3c;font-weight:650;text-decoration:none;white-space:nowrap}
  body.${EMBED_CLASS} .embed-bar span{color:#6c7760}
  @media (max-width:480px){body.${EMBED_CLASS} .embed-bar{flex-direction:column;align-items:flex-start}}
</style>
</head>
<body class="${EMBED_CLASS}" data-mode="purchase" data-embed="1" data-slug="${escape(slug)}">
<main>
<div class="embed-bar"><span>Free tool from <strong>Worth</strong> — runs in your browser, no sign-up</span><a href="${escape(toolUrl)}" target="_blank" rel="noopener">Open the full calculator ↗</a></div>
${calculator[0]}
</main>
${js ? `<script type="module" src="${escape(js)}"></script>` : ''}
<script>
/* Tell the parent page our height, so hosts never need to guess a pixel value. */
(function () {
  var send = function () {
    if (window.parent === window) return;
    try { parent.postMessage({ type: 'worth-embed-resize', slug: document.body.dataset.slug, height: Math.ceil(document.documentElement.getBoundingClientRect().height) }, '*'); } catch (e) {}
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(send);
  window.addEventListener('load', send);
  new ResizeObserver(send).observe(document.documentElement);
  send();
})();
</script>
</body>
</html>
`;
}

const escape = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** The one-liner a host pastes. `data-tool` selects the calculator. */
export function widgetSnippet(slug, { siteUrl = '', base = '/' } = {}) {
  const prefix = prefixOf({ siteUrl, base });
  return `<div data-worth-embed="${slug}"></div>\n<script async src="${prefix}/embed/widget.js" data-tool="${slug}"></script>`;
}

export function iframeSnippet(slug, { siteUrl = '', base = '/', params = '' } = {}) {
  const prefix = prefixOf({ siteUrl, base });
  return `<iframe src="${prefix}/embed/${slug}/${params}" title="Worth ${slug.replace(/-/g, ' ')} calculator" loading="lazy" style="width:100%;max-width:760px;min-height:520px;border:1px solid #e0e4d7;border-radius:14px;overflow:hidden" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}

/** The page people paste snippets from, and the page that gets linked to. */
function renderEmbedIndex(tools, { siteUrl, base, css = '' }) {
  // Built CSS is content-hashed (assets/style-<hash>.css), so the gallery links
  // whatever the widget pages link. A hardcoded /style.css would 404 in dist.
  const styleHref = css || base + 'style.css';
  const cards = tools.map(t =>
    `<section class="embed-card"><h2>${escape(t.title)}</h2><p>${escape(t.desc)}</p>` +
    `<p><a href="${escape(prefixOf({ siteUrl, base }) + '/calculators/' + t.slug + '/')}">Open the calculator ↗</a></p>` +
    `<pre><code>${escape(iframeSnippet(t.slug, { siteUrl, base }))}</code></pre>` +
    `<p><small>or one line, sized automatically:</small></p>` +
    `<pre><code>${escape(widgetSnippet(t.slug, { siteUrl, base }))}</code></pre>` +
    `<p><iframe src="${escape(prefixOf({ siteUrl, base }) + '/embed/' + t.slug + '/')}" title="Live preview" loading="lazy" style="width:100%;max-width:760px;min-height:560px;border:1px solid #e0e4d7;border-radius:14px"></iframe></p></section>`
  ).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Put a Worth calculator on your site — free embeds</title>
<meta name="description" content="${tools.length} free money calculators you can embed on any page in one line. No account, no API key, no tracking, MIT licensed.">
<link rel="canonical" href="${escape(prefixOf({ siteUrl, base }) + '/embed/')}">
<link rel="stylesheet" href="${escape(styleHref)}">
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#22331f;background:#fff;margin:0}
  main{max-width:880px;margin:0 auto;padding:32px 18px 64px}
  h1{font-size:30px;margin:0 0 8px}
  pre{background:#f6fbf0;border:1px solid #e0e4d7;border-radius:10px;padding:12px;overflow:auto;font-size:12px}
  .embed-card{border-top:1px solid #e0e4d7;margin-top:28px;padding-top:14px}
  a{color:#204f3c}
</style>
</head>
<body>
<main>
<h1>Embed a calculator. Keep the traffic.</h1>
<p>Every tool below runs entirely in the reader's browser: no API key, no account, no cookie, no data leaving the page. Copy one line into your post, docs, Notion page or README and the calculator appears, sized to fit, with a link back to the full tool. MIT licensed, so you can also <a href="https://github.com/njohn931d-dotcom/bbbh">read and fork the source</a>.</p>
${cards}
</main>
</body>
</html>
`;
}

/**
 * Generate `dist/embed/<slug>/index.html` for every built calculator, plus the
 * `/embed/` gallery.
 *
 * @param {string} distDir  absolute path to the built site
 * @param {{siteUrl?:string,base?:string}} opts
 * @returns {{slug:string,title:string,desc:string}[]}
 */
export function buildEmbedPages(distDir, { siteUrl = '', base = '/' } = {}) {
  const calcDir = path.join(distDir, 'calculators');
  if (!fs.existsSync(calcDir)) return [];
  const embedDir = path.join(distDir, 'embed');
  fs.mkdirSync(embedDir, { recursive: true });

  const tools = [];
  let firstCss = '';
  for (const slug of fs.readdirSync(calcDir).sort()) {
    const file = path.join(calcDir, slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    if (!/<section id="calculator"/.test(source)) continue;
    fs.mkdirSync(path.join(embedDir, slug), { recursive: true });
    const html = renderEmbedPage(source, { slug, siteUrl, base });
    fs.writeFileSync(path.join(embedDir, slug, 'index.html'), html);
    if (!firstCss) firstCss = attrOf(source, /<link rel="stylesheet" href="([^"]+)"/);
    tools.push({ slug, title: titleOf(source).replace(/\s*\|\s*Worth$/, ''), desc: descOf(source) });
  }

  fs.writeFileSync(path.join(embedDir, 'index.html'), renderEmbedIndex(tools, { siteUrl, base, css: firstCss }));
  return tools;
}

/**
 * The loader script: `<div data-worth-embed="cost-of-time"></div>` plus a
 * script tag becomes an iframe that resizes itself. Written into
 * `public/embed/widget.js` at build time so the URL is stable for hosts, and
 * into `dist/embed/widget.js` so the built site always matches.
 */
export const WIDGET_JS = `/*! Worth embed loader (MIT). One line, an iframe that sizes itself.
 * Usage:
 *   <div data-worth-embed="cost-of-time"></div>
 *   <script async src="https://<host>/bbbh/embed/widget.js" data-tool="cost-of-time"></script>
 * Optional: data-height (px floor), data-src (absolute widget URL override).
 */
(function () {
  var script = document.currentScript || (function () {
    var all = document.getElementsByTagName('script');
    for (var i = all.length - 1; i >= 0; i--) if (/embed\\/widget\\.js$/.test(all[i].src)) return all[i];
    return null;
  })();
  if (!script) return;
  var origin = script.src.replace(/\\/embed\\/widget\\.js.*$/, '');
  var slug = script.getAttribute('data-tool') || 'cost-of-time';
  var floor = parseInt(script.getAttribute('data-height') || '480', 10);
  var url = script.getAttribute('data-src') || (origin + '/embed/' + slug + '/');

  function mount(el) {
    if (el.getAttribute('data-worth-mounted')) return;
    el.setAttribute('data-worth-mounted', '1');
    var frame = document.createElement('iframe');
    frame.src = url;
    frame.title = 'Worth ' + slug.replace(/-/g, ' ') + ' calculator';
    frame.loading = 'lazy';
    frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    frame.style.cssText = 'width:100%;min-height:' + floor + 'px;border:1px solid #e0e4d7;border-radius:14px;overflow:hidden;display:block';
    el.appendChild(frame);
  }

  window.addEventListener('message', function (event) {
    var data = event.data || {};
    if (!data || data.type !== 'worth-embed-resize' || !data.height) return;
    var frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === event.source) {
        frames[i].style.minHeight = Math.max(floor, data.height) + 'px';
      }
    }
  });

  function scan() {
    var nodes = document.querySelectorAll('[data-worth-embed]');
    for (var i = 0; i < nodes.length; i++) {
      var want = nodes[i].getAttribute('data-worth-embed') || slug;
      if (want === slug) mount(nodes[i]);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
`;

// CLI: `node scripts/build-embed.mjs --sync-widget` writes the loader into
// public/embed/widget.js, the copy that ships. The loader lives in this file so
// the snippets the build prints and the script hosts load cannot drift apart;
// tests/schema-embed.test.cjs fails if the two differ.
if (process.argv[2] === '--sync-widget') {
  const target = 'public/embed/widget.js';
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const before = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (before === WIDGET_JS) console.log(`✓ ${target} is up to date`);
  else { fs.writeFileSync(target, WIDGET_JS); console.log(`✓ wrote ${target} (${WIDGET_JS.length} bytes)`); }
} else if (process.argv[2] === '--check-widget') {
  const target = 'public/embed/widget.js';
  const ok = fs.existsSync(target) && fs.readFileSync(target, 'utf8') === WIDGET_JS;
  console.log(ok ? `✓ ${target} matches the generator` : `✗ ${target} is stale or missing: npm run embed:sync`);
  if (!ok) process.exitCode = 1;
}
