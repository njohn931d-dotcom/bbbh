#!/usr/bin/env node
/* =============================================================================
 * RevenueKit — static site generator (zero dependencies)
 * -----------------------------------------------------------------------------
 *   node scripts/build-site.js
 *
 * Reads  content/*.html  (pure body fragments) + scripts/pages.js (metadata),
 * writes the deployable static site to the repo root, plus robots.txt and
 * sitemap.xml. The generated HTML is COMMITTED, so hosts like GitHub Pages,
 * Netlify, Cloudflare Pages or plain S3 need no build step at all.
 *
 * Every internal link is relative ("../sell-digital-products/") so the same
 * output works at a domain root, at /bbbh/ on GitHub Pages, or in a preview.
 * ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const { SITE, PAGES, PRODUCTS, attachArticleSchema } = require("./pages.js");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const OUT = ROOT;

/* ---------------------------------------------------------------- helpers -- */
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const rootPrefix = (depth) => (depth === 0 ? "" : "../".repeat(depth));

const depthOf = (slug) => (slug === "" || slug === "404" ? 0 : 1);

const pageUrl = (slug) => (slug === "" ? "/" : slug === "404" ? "/404.html" : "/" + slug + "/");

function absUrl(slug) {
  return SITE.origin + SITE.base + pageUrl(slug);
}

function relTo(fromDepth, slug) {
  return rootPrefix(fromDepth) + (slug === "" ? "" : slug + "/");
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(html) {
  return stripTags(html).split(/\s+/).filter(Boolean).length;
}

/* Parse h2/h3 with ids into a table of contents tree. */
function buildToc(body) {
  const re = /<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  const items = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    items.push({ level: +m[1], id: m[2], text: stripTags(m[3]).replace(/#$/, "").trim() });
  }
  // nest h3 under the preceding h2
  const tree = [];
  for (const it of items) {
    if (it.level === 2) tree.push({ ...it, children: [] });
    else if (tree.length) tree[tree.length - 1].children.push(it);
  }
  return tree;
}

/* ------------------------------------------------------------------ head -- */
function headTags(p, depth) {
  const base = rootPrefix(depth);
  const canonical = absUrl(p.slug);
  const ogImage = absUrl("") + (p.ogImage || SITE.ogImage).replace(/^\//, "");
  const isArticle = p.type === "article";

  const t = [];
  t.push(`<meta charset="utf-8">`);
  t.push(`<meta name="viewport" content="width=device-width, initial-scale=1">`);
  t.push(`<title>${esc(p.title)}</title>`);
  t.push(`<meta name="description" content="${esc(p.description)}">`);
  t.push(`<link rel="canonical" href="${esc(canonical)}">`);
  t.push(
    p.noindex
      ? `<meta name="robots" content="noindex, follow">`
      : `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`
  );
  if (p.keywords) t.push(`<meta name="keywords" content="${esc(p.keywords)}">`);
  t.push(`<meta name="author" content="${esc(p.author || SITE.author.name)}">`);
  if (isArticle && p.section) t.push(`<meta name="section" content="${esc(p.section)}">`);
  t.push(`<meta name="color-scheme" content="light dark">`);
  t.push(`<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">`);
  t.push(`<meta name="theme-color" content="#0b1020" media="(prefers-color-scheme: dark)">`);
  t.push(`<meta name="format-detection" content="telephone=no">`);

  /* Open Graph */
  t.push(`<meta property="og:site_name" content="${esc(SITE.name)}">`);
  t.push(`<meta property="og:type" content="${isArticle ? "article" : "website"}">`);
  t.push(`<meta property="og:locale" content="en_US">`);
  t.push(`<meta property="og:url" content="${esc(canonical)}">`);
  t.push(`<meta property="og:title" content="${esc(p.ogTitle || p.title)}">`);
  t.push(`<meta property="og:description" content="${esc(p.ogDescription || p.description)}">`);
  t.push(`<meta property="og:image" content="${esc(ogImage)}">`);
  t.push(`<meta property="og:image:width" content="1200">`);
  t.push(`<meta property="og:image:height" content="630">`);
  t.push(`<meta property="og:image:alt" content="${esc(p.ogAlt || p.ogTitle || p.title)}">`);
  if (isArticle) {
    if (p.published) t.push(`<meta property="article:published_time" content="${p.published}">`);
    if (p.modified) t.push(`<meta property="article:modified_time" content="${p.modified}">`);
    if (p.section) t.push(`<meta property="article:section" content="${esc(p.section)}">`);
    (p.tags || []).forEach((tag) => t.push(`<meta property="article:tag" content="${esc(tag)}">`));
    t.push(`<meta property="article:author" content="${absUrl("about")}">`);
  }

  /* Twitter / X */
  t.push(`<meta name="twitter:card" content="summary_large_image">`);
  t.push(`<meta name="twitter:site" content="${esc(SITE.twitter)}">`);
  t.push(`<meta name="twitter:creator" content="${esc(SITE.twitter)}">`);
  t.push(`<meta name="twitter:title" content="${esc(p.ogTitle || p.title)}">`);
  t.push(`<meta name="twitter:description" content="${esc(p.ogDescription || p.description)}">`);
  t.push(`<meta name="twitter:image" content="${esc(ogImage)}">`);
  t.push(`<meta name="twitter:image:alt" content="${esc(p.ogAlt || p.ogTitle || p.title)}">`);

  /* Icons / manifests */
  t.push(`<link rel="icon" href="${base}assets/img/favicon.svg" type="image/svg+xml">`);
  t.push(`<link rel="icon" href="${base}assets/img/favicon-32.png" type="image/png" sizes="32x32">`);
  t.push(`<link rel="icon" href="${base}assets/img/favicon-16.png" type="image/png" sizes="16x16">`);
  t.push(`<link rel="apple-touch-icon" href="${base}assets/img/apple-touch-icon.png">`);
  t.push(`<link rel="manifest" href="${base}site.webmanifest">`);

  /* Feeds + discovery */
  t.push(`<link rel="sitemap" type="application/xml" href="${base}sitemap.xml">`);

  /* Styles */
  t.push(`<link rel="stylesheet" href="${base}assets/css/main.css">`);

  /* Structured data */
  (p.schema || []).forEach((block) => {
    t.push(`<script type="application/ld+json">${JSON.stringify(block)}</script>`);
  });

  return t.join("\n    ");
}

/* ---------------------------------------------------------------- header -- */
function headerHtml(p, depth) {
  const base = rootPrefix(depth);
  const navItems = [
    { slug: "", label: "Home" },
    { slug: "ways-to-generate-income", label: "Income Guide" },
    { slug: "tools", label: "Tools & Kits" },
    { slug: "about", label: "About" },
  ];
  const links = navItems
    .map((n) => {
      const cur = p.slug === n.slug ? ` aria-current="page"` : "";
      return `<li><a href="${relTo(depth, n.slug)}"${cur}>${esc(n.label)}</a></li>`;
    })
    .join("\n          ");
  const cta = `<li class="nav-cta"><a class="btn btn--primary btn--sm" href="${relTo(depth, "tools")}">Get the free kit</a></li>`;

  return `
  <a class="skip-link" href="#main">Skip to main content</a>
  <div id="progress" aria-hidden="true"></div>
  <header class="site-header">
    <div class="wrap site-header__in">
      <a class="brand" href="${relTo(depth, "")}" aria-label="${esc(SITE.name)} — home">
        <svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <defs><linearGradient id="lg${depth}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a5cff"/><stop offset="1" stop-color="#00b392"/></linearGradient></defs>
          <rect width="32" height="32" rx="8" fill="url(#lg${depth})"/>
          <g fill="#fff"><rect x="7" y="18" width="4" height="7" rx="1.4"/><rect x="14" y="13" width="4" height="12" rx="1.4"/><rect x="21" y="7" width="4" height="18" rx="1.4"/></g>
        </svg>
        <span>${esc(SITE.name)}<small>${esc(SITE.tagline)}</small></span>
      </a>
      <nav id="site-nav" class="site-nav" aria-label="Primary">
        <ul>
          ${links}
          ${cta}
        </ul>
      </nav>
      <div class="header-tools">
        <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle color theme">
          <svg data-icon-sun viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>
          <svg data-icon-moon viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        </button>
        <button class="icon-btn nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </div>
    </div>
  </header>`;
}

/* ------------------------------------------------------------ breadcrumbs -- */
function breadcrumbHtml(p, depth) {
  if (!p.breadcrumbs || !p.breadcrumbs.length) return "";
  const items = [{ name: "Home", slug: "" }, ...p.breadcrumbs];
  const lis = items
    .map((b, i) => {
      const last = i === items.length - 1;
      return last
        ? `<li aria-current="page">${esc(b.name)}</li>`
        : `<li><a href="${relTo(depth, b.slug)}">${esc(b.name)}</a></li>`;
    })
    .join("");
  return `
    <nav class="wrap breadcrumbs" aria-label="Breadcrumb">
      <ol>${lis}</ol>
    </nav>`;
}

/* ------------------------------------------------------------------- TOC -- */
function tocHtml(tree, cls) {
  if (!tree.length) return "";
  const inner = (nodes) =>
    nodes
      .map(
        (n) =>
          `<li><a href="#${n.id}">${esc(n.text)}</a>${
            n.children && n.children.length ? `<ol>${inner(n.children)}</ol>` : ""
          }</li>`
      )
      .join("");
  return `<nav class="toc ${cls}" aria-label="On this page">
        <p class="toc__title">On this page</p>
        <ol>${inner(tree)}</ol>
      </nav>`;
}

/* ------------------------------------------------------------ FAQ block -- */
/* Rendered from the SAME data that feeds the FAQPage JSON-LD, so the visible
   answers and the structured answers are guaranteed identical.             */
function faqHtml(p, key) {
  const items = (p.faq && p.faq[key]) || (p.faqKey && p.faq) || [];
  const list = Array.isArray(items) ? items : [];
  const scope = "#faq-" + key;
  return `
      <section class="faq" id="${scope.replace("#", "")}" aria-labelledby="${scope.replace("#", "")}-h">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:1rem;flex-wrap:wrap">
          <h2 id="${scope.replace("#", "")}-h" style="margin-top:0">Frequently asked questions</h2>
          <button class="btn btn--ghost btn--sm" type="button" data-faq-all="${scope}">Expand all</button>
        </div>
        ${list
          .map(
            (f) => `
        <details>
          <summary>${esc(f.q)}</summary>
          <div class="faq__body"><p>${f.a}</p></div>
        </details>`
          )
          .join("")}
      </section>`;
}

/* --------------------------------------------------------- product grid -- */
function productsHtml(depth) {
  return `
      <div class="grid grid--2" id="catalogue">
        ${PRODUCTS.map(
          (pr) => `
        <article class="card card--hover product" id="${pr.id}">
          ${pr.ribbon ? `<span class="ribbon">${esc(pr.ribbon)}</span>` : ""}
          <div class="product__top">
            <span class="card__ico${pr.price === 0 ? " card__ico--mint" : ""}" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>
            </span>
            <div>
              <p class="product__cat">${esc(pr.category)}</p>
              <h3 class="product__name">${esc(pr.name)}</h3>
            </div>
          </div>
          <p class="product__desc">${esc(pr.desc)}</p>
          <div class="product__foot">
            <p class="price">
              ${pr.compareAt ? `<s>$${pr.compareAt}</s>` : ""}${pr.price === 0 ? "Free" : "$" + pr.price}
              <small>${esc(pr.priceNote)}</small>
            </p>
            <a class="btn ${pr.price === 0 ? "btn--mint" : "btn--primary"} btn--sm" href="${pr.price === 0 ? relTo(depth, "launch-kit") : relTo(depth, "tools") + "#how-to-buy"}" aria-label="${esc(pr.price === 0 ? "Download" : "How to buy") + " " + esc(pr.name)}">${pr.price === 0 ? "Download free" : "Get " + esc(pr.name)}</a>
          </div>
        </article>`
        ).join("")}
      </div>`;
}

/* ---------------------------------------------------------------- footer -- */
function footerHtml(depth) {
  const base = rootPrefix(depth);
  const guideLinks = [
    ["ways-to-generate-income", "Ways to Generate Income (guide)"],
    ["sell-digital-products", "How to Sell Digital Products"],
    ["passive-income-ideas", "Passive Income Ideas That Work"],
    ["micro-saas-ideas", "Micro-SaaS Ideas Worth Building"],
    ["digital-product-pricing", "How to Price Digital Products"],
    ["launch-kit", "Free Launch Kit"],
  ]
    .map(([s, l]) => `<li><a href="${relTo(depth, s)}">${esc(l)}</a></li>`)
    .join("");
  const toolLinks = [
    ["tools", "All tools & kits"],
    ["tools#launch-kit", "Launch Kit (free)"],
    ["tools#saas-starter", "SaaS Starter"],
    ["tools#pricing-engine", "Pricing Engine"],
  ]
    .map(([s, l]) => {
      const [slug, hash] = s.split("#");
      return `<li><a href="${relTo(depth, slug)}${hash ? "#" + hash : ""}">${esc(l)}</a></li>`;
    })
    .join("");
  return `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <a class="brand" href="${relTo(depth, "")}">
            <svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
              <rect width="32" height="32" rx="8" fill="url(#lgf${depth})" style="display:none"/><rect width="32" height="32" rx="8" fill="#4b3fe4"/>
              <g fill="#fff"><rect x="7" y="18" width="4" height="7" rx="1.4"/><rect x="14" y="13" width="4" height="12" rx="1.4"/><rect x="21" y="7" width="4" height="18" rx="1.4"/></g>
            </svg>
            <span>${esc(SITE.name)}</span>
          </a>
          <p style="margin-top:.9rem;color:var(--fg-muted);max-width:24rem">${esc(
            SITE.footerBlurb
          )}</p>
          <p style="margin-top:.6rem;font-size:.82rem;color:var(--fg-faint)">Independent publisher. No sponsored rankings. When a method underperforms we say so.</p>
        </div>
        <div>
          <h3>Guides</h3>
          <ul>${guideLinks}</ul>
        </div>
        <div>
          <h3>Tools &amp; kits</h3>
          <ul>${toolLinks}</ul>
        </div>
        <div>
          <h3>Site</h3>
          <ul>
            <li><a href="${relTo(depth, "about")}">About &amp; editorial policy</a></li>
            <li><a href="${base}sitemap.xml">Sitemap</a></li>
            <li><a href="mailto:${SITE.email}">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© <span data-year>2026</span> ${esc(SITE.name)}. Educational content — not financial advice.</p>
        <nav aria-label="Legal">
          <ul>
            <li><a href="${relTo(depth, "about")}#privacy">Privacy</a></li>
            <li><a href="${relTo(depth, "about")}#disclosure">Disclosure</a></li>
            <li><a href="${relTo(depth, "about")}#terms">Terms</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </footer>
  <button class="back-top" type="button" aria-label="Back to top">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
  </button>`;
}

/* ------------------------------------------------------------------- page -- */
function renderPage(p) {
  const depth = depthOf(p.slug);
  const base = rootPrefix(depth);
  const bodyFile = path.join(CONTENT, p.bodyFile);
  let body = fs.readFileSync(bodyFile, "utf8").trim();

  const words = wordCount(body);
  const readMins = Math.max(1, Math.round(words / 235));
  const toc = buildToc(body);

  /* Inject reading-time placeholder */
  body = body.replace(/\{\{WORDS\}\}/g, words.toLocaleString("en-US"));
  body = body.replace(/\{\{READ\}\}/g, String(readMins));
  body = body.replace(/\{\{UPDATED\}\}/g, p.modifiedPretty || "");
  body = body.replace(/\{\{YEAR\}\}/g, String(new Date().getFullYear()));

  /* Cross-page placeholder: reading time of the pillar guide */
  if (body.includes("{{READ_PILLAR}}")) {
    const pillarFile = path.join(CONTENT, "ways-to-generate-income.html");
    const pw = wordCount(fs.readFileSync(pillarFile, "utf8"));
    body = body.replace(/\{\{READ_PILLAR\}\}/g, String(Math.max(1, Math.round(pw / 235))));
  }

  /* Data-driven blocks: rendered from the same objects as the JSON-LD */
  body = body.replace(/\{\{FAQ:([a-zA-Z0-9_-]+)\}\}/g, (m, k) => faqHtml(p, k));
  body = body.replace(/\{\{PRODUCTS\}\}/g, () => productsHtml(depth));

  /* Article schema needs real word counts, so it is attached post-parse */
  if (p.type === "article") {
    p._words = words;
    p._read = readMins;
    attachArticleSchema(p);
  }

  const isArticle = p.type === "article";

  let main;
  if (isArticle) {
    main = `
    <article class="article" itemscope itemtype="https://schema.org/Article">
      <header class="wrap article-head">
        ${breadcrumbHtml(p, depth)}
        <p class="pill">${esc(p.eyebrow || "Guide")}</p>
        <h1 itemprop="headline">${esc(p.h1 || p.title)}</h1>
        <p class="hero__lead" itemprop="description">${esc(p.lede)}</p>
        <div class="byline">
          <span class="avatar" aria-hidden="true">${esc(SITE.author.initials)}</span>
          <div class="byline__txt">
            <a href="${relTo(depth, "about")}" rel="author">${esc(SITE.author.name)}</a>
            <div class="byline__meta">
              <time datetime="${p.published}" itemprop="datePublished">${esc(p.publishedPretty)}</time>
              · Updated <time datetime="${p.modified}" itemprop="dateModified">${esc(p.modifiedPretty)}</time>
              · ${readMins} min read · ${words.toLocaleString("en-US")} words
            </div>
          </div>
          <div class="byline__share">
            <a class="icon-btn" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(p.title)}&url=${encodeURIComponent(absUrl(p.slug))}" rel="noopener noreferrer nofollow" target="_blank" aria-label="Share on X">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1.6 2h6.4l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z"/></svg>
            </a>
            <a class="icon-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absUrl(p.slug))}" rel="noopener noreferrer nofollow" target="_blank" aria-label="Share on LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.2 8h4.6v14H.2V8zm7.4 0h4.4v1.9h.1c.6-1.1 2.1-2.3 4.3-2.3 4.6 0 5.5 3 5.5 7V22h-4.6v-6.6c0-1.6 0-3.6-2.2-3.6s-2.6 1.7-2.6 3.5V22H7.6V8z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <div class="wrap article-layout">
        <div class="prose" id="main" tabindex="-1">
          ${tocHtml(toc, "toc-inline panel")}
          ${body}
        </div>
        <aside class="rail" aria-label="Table of contents and related">
          ${tocHtml(toc, "")}
          <div class="panel" style="margin-top:1.2rem">
            <p class="toc__title">Related guides</p>
            <ul style="list-style:none;padding:0;margin:0;font-size:.875rem">
              ${PAGES.filter((x) => x.type === "article" && x.slug !== p.slug)
                .slice(0, 4)
                .map((x) => `<li style="margin-bottom:.55rem"><a href="${relTo(depth, x.slug)}">${esc(x.shortTitle || x.title)}</a></li>`)
                .join("")}
            </ul>
          </div>
        </aside>
      </div>
    </article>`;
  } else {
    main = `
    <main id="main" tabindex="-1">
      ${breadcrumbHtml(p, depth)}
      ${body}
    </main>`;
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    ${headTags(p, depth)}
  </head>
  <body>
    ${headerHtml(p, depth)}
    ${main}
    ${footerHtml(depth)}
    <script src="${base}assets/js/main.js" defer></script>
  </body>
</html>
`;

  const outFile =
    p.slug === "404"
      ? path.join(OUT, "404.html")
      : p.slug === ""
      ? path.join(OUT, "index.html")
      : path.join(OUT, p.slug, "index.html");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  return { file: path.relative(ROOT, outFile), words, readMins, toc: toc.length };
}

/* ----------------------------------------------------------- robots/sitemaps -- */
function writeAux() {
  const base = SITE.base === "/" ? "" : SITE.base;
  const robots = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${SITE.origin}${SITE.base}/sitemap.xml`,
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "robots.txt"), robots);

  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.filter((p) => !p.noindex)
    .map((p) => {
    const lastmod = p.modified || today;
    const prio = p.slug === "" ? "1.0" : p.type === "article" && p.pillar ? "0.9" : "0.7";
    const freq = p.pillar ? "weekly" : "monthly";
    return `  <url>
    <loc>${absUrl(p.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`;
  }).join("\n");
  fs.writeFileSync(
    path.join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
  );

  const manifest = {
    name: SITE.name + " — " + SITE.tagline,
    short_name: SITE.name,
    description: SITE.description,
    start_url: SITE.base + "/",
    scope: SITE.base + "/",
    display: "minimal-ui",
    background_color: "#0b1020",
    theme_color: "#4b3fe4",
    icons: [
      { src: SITE.base + "/assets/img/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: SITE.base + "/assets/img/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: SITE.base + "/assets/img/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  fs.writeFileSync(path.join(OUT, "site.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");
}

/* ------------------------------------------------------------------ main -- */
function main() {
  const report = PAGES.map(renderPage);
  writeAux();
  console.log("Built %d pages:", report.length);
  for (const r of report) {
    console.log(
      "  " + r.file.padEnd(46) + String(r.words).padStart(5) + " words  " +
        String(r.readMins).padStart(2) + " min read  " + String(r.toc).padStart(2) + " TOC sections"
    );
  }
  console.log("Plus robots.txt, sitemap.xml, site.webmanifest");
}

main();
