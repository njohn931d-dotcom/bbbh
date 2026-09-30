#!/usr/bin/env node
/**
 * Keep the repo-visible mirrors identical to what the site actually serves.
 *
 * GitHub renders and indexes the files in this repository: `parasite-seo/*.html`
 * is what a person browsing the repo sees when they click through from a search
 * result, and the root `sitemap.xml`, `robots.txt`, `feed.xml`, `llms.txt` and
 * `ai.txt` are the same discovery files the deployed site publishes.
 *
 * This replaces `generate-tracked-parasite.mjs`, which wrote those files from a
 * hardcoded snapshot and added a doorway page advertising "24h ranking trick",
 * "Power words: Shocking, Truth" and a "link wheel". That generator produced
 * mirrors that disagreed with the live site (different schema, 404 links, a
 * feed of titles nobody published) and left a page in the repo whose entire
 * content was a search-engine manipulation confession. Mirrors are copies now,
 * never second originals.
 *
 *   node scripts/sync-repo-mirrors.mjs            # copy from dist/, else from the generated routes
 *   node scripts/sync-repo-mirrors.mjs --check    # exit 1 if the mirrors are stale
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CHECK = process.argv.includes('--check');
const rel = p => path.relative(ROOT, p);

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
};

// Exactly the discovery files that are tracked at the repository root. `public/`
// also carries humans.txt and security.txt; those are not mirrored at the root
// on purpose, and copying them would add files nobody asked for.
const DISCOVERY = ['sitemap.xml', 'robots.txt', 'feed.xml', 'llms.txt', 'ai.txt'];

/** Where a file should be copied from: the built site first, then public/. */
function sourceFor(name) {
  for (const dir of [path.join(ROOT, 'dist'), path.join(ROOT, 'public')]) {
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function copyInto(target, source, changes) {
  const next = fs.readFileSync(source, 'utf8');
  let previous = null;
  try { previous = fs.readFileSync(target, 'utf8'); } catch { /* new file */ }
  if (previous === next) return false;
  changes.push(rel(target));
  if (!CHECK) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, next);
  }
  return true;
}

function main() {
  const distDir = path.join(ROOT, 'dist');
  const fromDist = fs.existsSync(distDir);
  // Only the route folders the generators own. Walking the repository root
  // instead would drag in node_modules and any other package's pages.
  const pageDirs = fromDist ? [distDir] : ['calculators', 'guides', 'articles'].map(d => path.join(ROOT, d));
  const mirrorDir = path.join(ROOT, 'parasite-seo');

  // 1. Page mirrors, named by route the way the existing files already are.
  let written = 0;
  const changes = [];
  const wanted = new Set();
  for (const dir of pageDirs) {
    for (const file of walk(dir)) {
      // Inside a route folder the relative path IS the route; inside dist/ the
      // route is the path minus `index.html`.
      const route = fromDist
        ? path.relative(dir, file).split(path.sep).join('/').replace(/\/?index\.html$/, '')
        : path.relative(dir, file).split(path.sep).join('/').replace(/\/index\.html$/, '');
      if (!/^(calculators|guides|articles)\//.test(route)) continue;
      const name = route.split('/').join('-') + '.html';
      wanted.add(name);
      if (copyInto(path.join(mirrorDir, name), file, changes)) written++;
    }
  }

  // 2. Drop mirrors for routes that no longer exist, so the repo cannot
  //    advertise pages the site does not serve.
  if (fs.existsSync(mirrorDir)) {
    for (const entry of fs.readdirSync(mirrorDir)) {
      if (wanted.has(entry)) continue;
      changes.push(`deleted ${entry}`);
      if (!CHECK) fs.rmSync(path.join(mirrorDir, entry), { force: true });
    }
  }

  // 3. Discovery files at the repo root.
  if (fromDist) {
    for (const name of DISCOVERY) {
      const source = sourceFor(name);
      if (source) copyInto(path.join(ROOT, name), source, changes);
    }
  }

  const label = CHECK ? 'would change' : 'synced';
  if (changes.length) console.log(`${CHECK ? '⚠' : '✓'} ${changes.length} mirror file(s) ${label}: ${written} page mirrors refreshed`);
  for (const change of changes.slice(0, 15)) console.log(`    ${change}`);
  if (changes.length > 15) console.log(`    …and ${changes.length - 15} more`);
  if (!changes.length) console.log(`✓ repo mirrors already match ${fromDist ? 'dist/' : 'the generated routes'}`);
  if (CHECK && changes.length) {
    console.error('\n✗ Mirrors are stale. Run: npm run mirrors');
    process.exitCode = 1;
  }
  if (!fromDist && !CHECK) {
    console.log('\nNote: no dist/ found, so page mirrors came from the generated route folders and the\nroot discovery files were left alone. Run after a production build for a full sync:\n  npm run build:verify && npm run mirrors');
  }
}

main();
