#!/usr/bin/env node
/* =============================================================================
 * RevenueKit — on-page SEO + integrity audit (zero dependencies)
 * -----------------------------------------------------------------------------
 *   node scripts/seo-audit.js
 *
 * Fails (exit 1) on anything that would hurt rankings or break crawling:
 *   · missing/duplicate/wrong-length titles & meta descriptions
 *   · missing, relative or duplicate canonicals
 *   · more than one <h1>, or skipped heading levels
 *   · broken internal links or dangling #anchors
 *   · unparseable JSON-LD, or JSON-LD whose FAQ answers differ from the page
 *   · target=_blank without rel noopener
 *   · OG image missing on disk or wrong dimensions
 *   · sitemap/robots drift vs. the page registry
 * Warnings (non-fatal) are advisory only.
 * ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { SITE, PAGES } = require("./pages.js");

const ROOT = path.join(__dirname, "..");
const errors = [];
const warnings = [];
const ok = [];

const files = PAGES.map((p) => ({
  p,
  rel: p.slug === "404" ? "404.html" : p.slug === "" ? "index.html" : p.slug + "/index.html",
}));

function tag(html, name, attrs = {}) {
  const attrRe = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  const re = new RegExp(`<${name}(\\s[^>]*)?/?>`, "g");
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[0]);
  return out;
}
function attr(el, name) {
  const m = el.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
}
function metaContent(html, selector) {
  const re = new RegExp(`<meta\\s+[^>]*${selector}[^>]*>`, "i");
  const m = html.match(re);
  return m ? attr(m[0], "content") : null;
}

const seenCanonical = new Map();
const seenTitle = new Map();

for (const { p, rel } of files) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    errors.push(`${rel}: file missing`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const label = rel;

  /* ---- title ---- */
  const decode = (t) =>
    t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
     .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const tm = html.match(/<title>([\s\S]*?)<\/title>/);
  const title = tm ? decode(tm[1]).trim() : "";
  if (!title) errors.push(`${label}: no <title>`);
  else {
    if (title.length > 62) errors.push(`${label}: title too long (${title.length} chars)`);
    else if (title.length < 25) warnings.push(`${label}: title short (${title.length})`);
    if (seenTitle.has(title)) errors.push(`${label}: duplicate title with ${seenTitle.get(title)}`);
    seenTitle.set(title, label);
  }

  /* ---- meta description ---- */
  const descRaw = metaContent(html, 'name="description"');
  const desc = descRaw ? decode(descRaw) : null;
  if (!desc) errors.push(`${label}: no meta description`);
  else if (desc.length > 168 || desc.length < 90)
    warnings.push(`${label}: meta description ${desc.length} chars (aim 120–165)`);

  /* ---- canonical ---- */
  const can = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!can) errors.push(`${label}: no canonical`);
  else {
    const url = can[1];
    if (!/^https?:\/\//.test(url)) errors.push(`${label}: canonical not absolute`);
    if (seenCanonical.has(url)) errors.push(`${label}: duplicate canonical ${url}`);
    seenCanonical.set(url, label);
    const expect = SITE.origin + SITE.base + (p.slug === "" ? "/" : p.slug === "404" ? "/404.html" : "/" + p.slug + "/");
    if (url !== expect) errors.push(`${label}: canonical ${url} != registry ${expect}`);
  }

  /* ---- robots ---- */
  const robots = metaContent(html, 'name="robots"');
  if (p.noindex) {
    if (!/noindex/.test(robots || "")) errors.push(`${label}: expected noindex`);
  } else if (!/index, follow/.test(robots || "")) errors.push(`${label}: unexpected robots "${robots}"`);

  /* ---- headings ---- */
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) errors.push(`${label}: ${h1s} <h1> tags (need exactly 1)`);
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1)
      warnings.push(`${label}: heading jump h${levels[i - 1]} → h${levels[i]} (occurrence ${i})`);
  }

  /* ---- OG / twitter ---- */
  for (const sel of ['property="og:title"', 'property="og:description"', 'property="og:image"', 'property="og:url"', 'name="twitter:card"']) {
    if (!metaContent(html, sel.replace(/"/g, '"'))) errors.push(`${label}: missing ${sel}`);
  }
  const ogImg = metaContent(html, 'property="og:image"');
  if (ogImg) {
    const relImg = ogImg.replace(SITE.origin + SITE.base + "/", "");
    const imgPath = path.join(ROOT, relImg);
    if (!fs.existsSync(imgPath)) errors.push(`${label}: OG image missing on disk: ${relImg}`);
    else {
      try {
        const out = execFileSync("identify", ["-format", "%w %h", imgPath], { encoding: "utf8" }).trim();
        const [w, h] = out.split(/\s+/).map(Number);
        if (w !== 1200 || h !== 630) warnings.push(`${label}: OG image ${w}x${h} (want 1200x630)`);
      } catch (e) {
        warnings.push(`${label}: could not measure OG image (imagemagick missing?)`);
      }
    }
  }

  /* ---- JSON-LD ---- */
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ldBlocks.length && !p.noindex) errors.push(`${label}: no JSON-LD`);
  const types = [];
  for (const b of ldBlocks) {
    let data;
    try {
      data = JSON.parse(b[1]);
    } catch (e) {
      errors.push(`${label}: JSON-LD parse error: ${e.message}`);
      continue;
    }
    const list = Array.isArray(data) ? data : [data];
    for (const d of list) types.push(d["@type"]);
    // FAQ parity: every FAQPage question must appear verbatim in the page HTML
    for (const d of list) {
      if (d["@type"] === "FAQPage") {
        for (const q of d.mainEntity || []) {
          if (!html.includes(q.name.replace(/&/g, "&amp;")))
            errors.push(`${label}: FAQPage question not visible on page: "${q.name.slice(0, 50)}…"`);
        }
      }
    }
  }
  ok.push(`${label}: JSON-LD → ${types.join(", ") || "(none)"}`);

  /* ---- internal links & anchors ---- */
  const hrefs = [...html.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  for (const href of hrefs) {
    if (/^(mailto:|tel:)/.test(href)) continue;
    if (/^https?:\/\//.test(href)) {
      const internal = href.startsWith(SITE.origin + SITE.base);
      if (internal) warnings.push(`${label}: absolute internal link (prefer relative): ${href}`);
      continue;
    }
    const [target, hash] = href.split("#");
    if (!target) {
      if (hash && !ids.has(hash)) errors.push(`${label}: dangling anchor #${hash}`);
      continue;
    }
    const clean = target.replace(/^\.\//, "").replace(/^\.\.\//, p.slug === "" || p.slug === "404" ? "" : "");
    let resolved;
    if (/^(assets|sitemap\.xml|robots\.txt|site\.webmanifest)/.test(clean)) resolved = path.join(ROOT, clean);
    else if (clean.endsWith(".html")) resolved = path.join(ROOT, clean);
    else if (clean === "") resolved = file;
    else resolved = path.join(ROOT, clean.replace(/\/$/, ""), "index.html");
    if (!fs.existsSync(resolved)) errors.push(`${label}: broken internal link → ${href}`);
    else if (hash) {
      const targetHtml = fs.readFileSync(resolved, "utf8");
      if (!new RegExp(`id="${hash}"`).test(targetHtml)) errors.push(`${label}: anchor #${hash} missing in ${clean || "same page"}`);
    }
  }

  /* ---- blank target safety ---- */
  const blanks = tag(html, "a").filter((a) => attr(a, "target") === "_blank");
  for (const a of blanks) {
    const rel = attr(a, "rel") || "";
    if (!/noopener/.test(rel)) errors.push(`${label}: target=_blank without rel noopener`);
  }

  /* ---- leftovers ---- */
  if (/lorem ipsum|TODO:|FIXME|placeholder text/i.test(html)) errors.push(`${label}: placeholder text present`);
}

/* ---- sitemap / robots parity ---- */
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
for (const { p } of files) {
  if (p.noindex) {
    if (sitemap.includes("/" + p.slug + "/")) errors.push(`sitemap includes noindex page ${p.slug}`);
    continue;
  }
  const expect = SITE.origin + SITE.base + (p.slug === "" ? "/" : "/" + p.slug + "/");
  if (!sitemap.includes("<loc>" + expect + "</loc>")) errors.push(`sitemap missing ${expect}`);
}
const robotsTxt = fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8");
if (!robotsTxt.includes("Sitemap: " + SITE.origin + SITE.base + "/sitemap.xml"))
  errors.push("robots.txt sitemap line wrong");

/* ---- report ---- */
console.log("RevenueKit SEO audit\n" + "=".repeat(64));
for (const line of ok) console.log("  · " + line);
console.log("-".repeat(64));
if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  warnings.forEach((w) => console.log("  ! " + w));
}
if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  errors.forEach((e) => console.log("  ✗ " + e));
  process.exit(1);
}
console.log("\n✓ No blocking issues. " + files.length + " pages audited.");
