#!/usr/bin/env node
/**
 * Prints the number of URLs the site should contain, derived from the content
 * model rather than hardcoded.
 *
 * The deploy workflow used to assert "133 pages" as a literal. Every page added
 * or removed afterwards had to be found and edited in two places, and a missed
 * edit either broke the deploy or, worse, let the real count drift. Deriving it
 * means the assertion tracks the content automatically.
 *
 * The Affiliate Income Lab package is counted from the <loc> entries in the
 * sitemap its own builder generates, so this stays in step with that package's
 * PAGES registry without importing it.
 *
 *   node scripts/expected-urls.mjs
 */
import fs from 'node:fs';
import { extraRoutes } from './generate-parasite.mjs';
import { routes, articleRoutes } from './generate-seo.mjs';

const all = new Set(['', ...routes, ...extraRoutes, ...articleRoutes]);

// The affiliate package's sitemap is written by tools/build.py, which the Vite
// build runs before this script's value is consumed. It is only present after a
// production build, so fall back to counting its committed index.html files.
const affSitemap = new URL('../affiliate-marketing/sitemap.xml', import.meta.url);
let affiliate = 0;
if (fs.existsSync(affSitemap)) {
  const xml = fs.readFileSync(affSitemap, 'utf8');
  affiliate = [...xml.matchAll(/<loc>/g)].length;
} else {
  const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['content', 'tools', '__pycache__'].includes(e.name)) continue;
      const full = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(full, out);
      else if (e.name === 'index.html') out.push(full);
    }
    return out;
  };
  affiliate = walk(new URL('../affiliate-marketing/', import.meta.url).pathname).length;
}

console.log(all.size + affiliate);
