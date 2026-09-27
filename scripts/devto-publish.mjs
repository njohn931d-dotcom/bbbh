#!/usr/bin/env node
//
// Publish the curated cross-posts in scripts/devto/posts/*.md to dev.to.
//
//   DEVTO_API_KEY=xxx node scripts/devto-publish.mjs --check
//   DEVTO_API_KEY=xxx node scripts/devto-publish.mjs --dry-run
//   DEVTO_API_KEY=xxx node scripts/devto-publish.mjs                      # live, published
//   DEVTO_API_KEY=xxx node scripts/devto-publish.mjs --state draft        # drafts instead
//   DEVTO_API_KEY=xxx node scripts/devto-publish.mjs --list               # what already exists
//
// Design rules:
//   - Idempotent: an article already on dev.to (matched by canonical URL or
//     normalized title) is skipped, never re-created.
//   - Never guesses: a missing API key, an unknown post key or an unreachable
//     key-check endpoint fails loudly before anything is written.
//   - Retries 429/5xx with backoff and respects Retry-After.
//   - A cover image that is not live yet is dropped with a warning instead of
//     shipping a broken image.
//
// Env:
//   DEVTO_API_KEY      dev.to (Forem) API key, required for anything but --help
//   DEVTO_API_BASE     override the API host (default https://dev.to/api)
//   GITHUB_STEP_SUMMARY  when set (GitHub Actions), a markdown summary is appended

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadPosts, findPost, validatePost, extractLinks, SITE_URL, REPO_URL } from './devto/posts.mjs';

const API_BASE = (process.env.DEVTO_API_BASE || 'https://dev.to/api').replace(/\/$/, '');
const USER_AGENT = 'worth-devto-publisher (github.com/njohn931d-dotcom/bbbh)';
const MAX_TAGS = 4;

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function parseArgs(argv) {
  const opts = {
    check: false,
    list: false,
    audit: false,
    offline: false,
    dryRun: false,
    force: false,
    help: false,
    state: 'published',
    limit: 0,
    only: [],
    delay: 4000,
    report: '',
    keyFile: '',
    apiKey: process.env.DEVTO_API_KEY || '',
  };

  const need = (flag, i) => {
    const value = argv[i];
    if (value === undefined || value.startsWith('--')) throw new Error(`${flag} requires a value`);
    return value;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--check': opts.check = true; break;
      case '--list': opts.list = true; break;
      case '--audit': opts.audit = true; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--offline': opts.offline = true; opts.dryRun = true; break;
      case '--force': opts.force = true; break;
      case '--help': case '-h': opts.help = true; break;
      case '--state': opts.state = need(arg, ++i); break;
      case '--limit': opts.limit = Number(need(arg, ++i)); break;
      case '--delay': opts.delay = Number(need(arg, ++i)); break;
      case '--report': opts.report = need(arg, ++i); break;
      case '--key-file': opts.keyFile = need(arg, ++i); break;
      case '--only': opts.only = need(arg, ++i).split(',').map((s) => s.trim()).filter(Boolean); break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!['published', 'draft'].includes(opts.state)) throw new Error(`--state must be "published" or "draft", got "${opts.state}"`);
  if (!Number.isFinite(opts.limit) || opts.limit < 0) throw new Error('--limit must be a non-negative number');
  if (!Number.isFinite(opts.delay) || opts.delay < 0) throw new Error('--delay must be a non-negative number of milliseconds');

  if (opts.offline) {
    if (opts.check || opts.list || opts.audit) throw new Error('--offline cannot be combined with --check, --list or --audit');
    if (opts.force) throw new Error('--offline cannot be combined with --force');
  }

  if (!opts.apiKey && opts.keyFile) {
    opts.apiKey = fs.readFileSync(opts.keyFile, 'utf8').trim();
  }

  return opts;
}

export function normalizeTitle(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// An existing dev.to article blocks a new one when either the canonical URL or
// the normalized title matches. Matching on title too means an edited headline
// does not silently create a second live copy of the same post.
export function dedupeKeys(article) {
  const keys = [];
  if (article.canonical_url) keys.push(`canonical:${String(article.canonical_url).replace(/\/$/, '')}`);
  if (article.title) keys.push(`title:${normalizeTitle(article.title)}`);
  return keys;
}

export function buildPayload(post, state, coverUrl) {
  validatePost(post);
  const article = {
    title: post.title,
    body_markdown: post.body,
    published: state === 'published',
    tags: post.tags.slice(0, MAX_TAGS),
    description: post.description,
  };
  if (post.canonicalUrl) article.canonical_url = post.canonicalUrl;
  if (coverUrl) article.main_image = coverUrl;
  return { article };
}

// Which of my own dev.to articles actually point at the site? A dev.to API key
// has authoring scope only, so this is the closest thing to a backlink audit
// the API allows: your posts, your links.
export function auditArticle(article, siteUrl) {
  const body = article.body_markdown || '';
  const { urls, siteLinks } = extractLinks(body);
  return {
    title: article.title,
    url: article.url || null,
    published: Boolean(article.published),
    bodyAvailable: Boolean(body),
    linkCount: urls.length,
    siteLinkCount: siteLinks.length,
    canonicalPointsAtSite: Boolean(article.canonical_url && String(article.canonical_url).startsWith(siteUrl)),
    siteLinks,
  };
}

async function api(pathname, { method = 'GET', apiKey, body, retries = 4, label = pathname } = {}) {
  const url = `${API_BASE}${pathname}`;

  for (let attempt = 0; ; attempt += 1) {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: {
          'api-key': apiKey,
          accept: 'application/json',
          'content-type': 'application/json',
          'user-agent': USER_AGENT,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (attempt >= retries) throw new ApiError(`Network failure calling ${label}: ${error.message}`, 0, null);
      await sleep(2000 * (attempt + 1));
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : Math.min(60000, 5000 * (attempt + 1));
      if (attempt >= retries) {
        const text = await res.text().catch(() => '');
        throw new ApiError(`${label} returned ${res.status} after ${attempt + 1} attempts: ${text.slice(0, 300)}`, res.status, null);
      }
      console.log(`  dev.to returned ${res.status}, retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1})`);
      await sleep(waitMs);
      continue;
    }

    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON error body */ }

    if (!res.ok) {
      throw new ApiError(`${label} returned ${res.status} ${res.statusText}: ${text.slice(0, 400)}`, res.status, json);
    }
    return json;
  }
}

export async function fetchMyArticles(apiKey) {
  const all = [];

  for (let page = 1; page <= 20; page += 1) {
    let batch;
    try {
      batch = await api(`/articles/me/all?per_page=100&page=${page}`, { apiKey, label: 'GET /articles/me/all' });
    } catch (error) {
      if (error.status !== 404) throw error;
      // Older Forem instances lack /articles/me/all; merge the two documented lists.
      const [published, unpublished] = await Promise.all([
        api('/articles/me/published?per_page=100', { apiKey, label: 'GET /articles/me/published' }),
        api('/articles/me/unpublished?per_page=100', { apiKey, label: 'GET /articles/me/unpublished' }),
      ]);
      return [...published, ...unpublished];
    }
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }

  return all;
}

async function coverIsLive(url) {
  try {
    const res = await fetch(url, { headers: { range: 'bytes=0-0', 'user-agent': USER_AGENT } });
    return res.ok || res.status === 206;
  } catch {
    return false;
  }
}

function appendStepSummary(markdown) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  try {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  } catch { /* summary is best-effort */ }
}

function help() {
  console.log(`Publish the curated dev.to backlink posts.

Usage:
  DEVTO_API_KEY=... node scripts/devto-publish.mjs [options]

Options:
  --check            verify the API key with GET /api/users/me, then exit
  --list             list articles already on the account, then exit
  --audit            report which of your dev.to articles link back to the
                     site (and how many links each one has), then exit
  --dry-run          print the payloads without calling POST /api/articles
  --offline          render the payloads with no network calls and no API key
                     (implies --dry-run); useful as a content smoke test
  --state <s>        "published" (default) or "draft"
  --only <keys>      comma-separated post keys (see scripts/devto/posts/)
  --limit <n>        publish at most n posts this run
  --delay <ms>       wait between posts (default 4000)
  --force            publish even if a matching post already exists (creates a duplicate)
  --report <path>    write a JSON run report to this path
  --key-file <path>  read the API key from a file instead of DEVTO_API_KEY
  --help             this text

Posts are matched against existing articles by canonical URL and by normalized
title, so re-running the command is safe: nothing is published twice.`);
}

function renderOffline(queue, posts) {
  console.log(`\nOffline render check: no network calls, no API key required.`);
  let chars = 0;
  let words = 0;
  for (const post of queue) {
    const payload = buildPayload(post, 'published', post.coverUrl);
    const bodyWords = payload.article.body_markdown.split(/\s+/).filter(Boolean).length;
    chars += payload.article.body_markdown.length;
    words += bodyWords;
    const { siteLinks } = extractLinks(post.body);
    console.log(`- ${post.key}`);
    console.log(`    title:     ${payload.article.title} (${payload.article.title.length} chars)`);
    console.log(`    tags:      ${payload.article.tags.join(', ')}`);
    console.log(`    canonical: ${payload.article.canonical_url || '(none: original on dev.to)'}`);
    console.log(`    cover:     ${payload.article.main_image || '(none)'}`);
    console.log(`    body:      ${bodyWords} words, ${siteLinks.length} link(s) to ${SITE_URL}`);
  }
  console.log(`\nTotal: ${queue.length} of ${posts.length} posts, ${words} words, ${chars} chars of markdown.`);
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`error: ${error.message}`);
    console.error('Run with --help for usage.');
    process.exitCode = 1;
    return;
  }

  if (opts.help) { help(); return; }

  if (!opts.apiKey && !opts.offline) {
    console.error('error: no dev.to API key.');
    console.error('Set DEVTO_API_KEY=... (or pass --key-file <path>). Get one at https://dev.to/settings/extensions -> "DEV API Keys".');
    process.exitCode = 1;
    return;
  }

  const posts = loadPosts();
  const selected = opts.only.length ? opts.only.map((key) => findPost(posts, key)) : posts;
  const queue = opts.limit ? selected.slice(0, opts.limit) : selected;

  console.log(`Origin: ${SITE_URL}`);
  console.log(`Repo:   ${REPO_URL}`);
  console.log(`Posts in library: ${posts.length}; selected: ${selected.length}; this run: ${queue.length}`);

  // 1. Verify the key before doing anything else.
  if (opts.offline) return renderOffline(queue, posts);
  let me;
  try {
    me = await api('/users/me', { apiKey: opts.apiKey, label: 'GET /users/me', retries: 1 });
  } catch (error) {
    console.error(`error: the dev.to API rejected the key: ${error.message}`);
    if (error.status === 401) console.error('A 401 usually means the key is wrong, revoked, or copied with trailing whitespace.');
    process.exitCode = 1;
    return;
  }
  console.log(`Authenticated as @${me.username} (${me.name || 'no name set'})`);

  if (me.website_url && !String(me.website_url).includes(new URL(SITE_URL).hostname)) {
    console.log(`note: your dev.to profile website is "${me.website_url}" — setting it to ${SITE_URL} adds a profile-level backlink.`);
  }

  if (opts.check) { console.log('Key is valid. Nothing else was changed.'); return; }

  // 2. Read what already exists so this stays idempotent.
  const existing = await fetchMyArticles(opts.apiKey);
  const taken = new Set();
  for (const article of existing) for (const key of dedupeKeys(article)) taken.add(key);
  console.log(`Existing dev.to articles: ${existing.length}`);

  if (opts.list) {
    for (const article of existing) {
      const state = article.published ? 'published' : 'draft';
      console.log(`- [${state}] ${article.title}\n    ${article.url || '(no url yet)'}${article.canonical_url ? `\n    canonical: ${article.canonical_url}` : ''}`);
    }
    return;
  }

  if (opts.audit) {
    const rows = [];
    for (const article of existing) {
      let full = article;
      if (!full.body_markdown && full.id) {
        full = await api(`/articles/${full.id}`, { apiKey: opts.apiKey, label: `GET /articles/${full.id}` }).catch(() => article);
      }
      rows.push(auditArticle(full, SITE_URL));
    }

    const linked = rows.filter((r) => r.siteLinkCount > 0);
    const totalLinks = rows.reduce((sum, r) => sum + r.siteLinkCount, 0);
    const canonical = rows.filter((r) => r.canonicalPointsAtSite);

    for (const row of linked) {
      console.log(`- ${row.siteLinkCount} link(s)${row.published ? '' : ' [draft]'}  ${row.title}\n    ${row.url || '(no url)'}`);
    }
    for (const row of rows) {
      if (row.siteLinkCount === 0 && !row.bodyAvailable) console.log(`? could not read the body of "${row.title}" (${row.url || row.id || 'unknown id'})`);
    }

    console.log(`\nBacklink inventory: ${linked.length} of ${rows.length} articles link to ${SITE_URL} (${totalLinks} links total).`);
    console.log(`Articles whose canonical points at the site: ${canonical.length}.`);
    appendStepSummary(`## dev.to backlink audit\n\n${linked.length} of ${rows.length} articles link to the site (${totalLinks} links). Canonical points at the site: ${canonical.length}.\n`);
    return;
  }

  // 3. Publish.
  const report = { startedAt: new Date().toISOString(), site: SITE_URL, state: opts.state, dryRun: opts.dryRun, created: [], skipped: [], failed: [] };

  for (let i = 0; i < queue.length; i += 1) {
    const post = queue[i];
    const label = `[${i + 1}/${queue.length}] ${post.key}`;

    const blocked = dedupeKeys({ title: post.title, canonical_url: post.canonicalUrl }).find((key) => taken.has(key));
    if (blocked && !opts.force) {
      const match = existing.find((a) => dedupeKeys(a).includes(blocked));
      console.log(`skip ${label}: already on dev.to (${match ? match.url || match.title : blocked})`);
      report.skipped.push({ key: post.key, reason: 'already-exists', match: match ? match.url : blocked });
      continue;
    }

    let coverUrl = post.coverUrl;
    if (coverUrl) {
      const live = await coverIsLive(coverUrl);
      if (!live) {
        console.log(`warn ${label}: cover ${coverUrl} is not reachable yet, publishing without main_image`);
        coverUrl = null;
      }
    }

    const payload = buildPayload(post, opts.state, coverUrl);
    if (opts.dryRun) {
      console.log(`\n${label} [dry-run] would create ${opts.state} post`);
      console.log(`  title:     ${payload.article.title}`);
      console.log(`  tags:      ${payload.article.tags.join(', ')}`);
      console.log(`  canonical: ${payload.article.canonical_url || '(none: original on dev.to)'}`);
      console.log(`  cover:     ${payload.article.main_image || '(none)'}`);
      console.log(`  body:      ${payload.article.body_markdown.length} chars, ${payload.article.body_markdown.split(/\s+/).length} words`);
      report.created.push({ key: post.key, dryRun: true, title: post.title });
      continue;
    }

    try {
      const created = await api('/articles', { method: 'POST', apiKey: opts.apiKey, body: payload, label: `POST /articles (${post.key})` });
      const line = `created ${label}: ${created.url || created.canonical_url || created.id}`;
      console.log(line);
      report.created.push({ key: post.key, id: created.id, url: created.url, title: created.title, tags: created.tag_list || post.tags, published: created.published });
      for (const key of dedupeKeys({ title: post.title, canonical_url: post.canonicalUrl })) taken.add(key);
    } catch (error) {
      console.error(`fail ${label}: ${error.message}`);
      report.failed.push({ key: post.key, error: error.message, status: error.status || 0 });
      if (error.status === 401 || error.status === 422) {
        console.error('Stopping: a 401 means the key is invalid, a 422 means dev.to rejected the article payload.');
        break;
      }
    }

    if (i < queue.length - 1) {
      const wait = opts.delay + Math.floor(Math.random() * 1500);
      if (wait > 0) await sleep(wait);
    }
  }

  report.finishedAt = new Date().toISOString();
  console.log(`\nSummary: ${report.created.length} created, ${report.skipped.length} skipped, ${report.failed.length} failed${opts.dryRun ? ' (dry run: nothing was sent)' : ''}`);

  const summaryRows = report.created
    .map((c) => `| ${c.key} | ${c.dryRun ? 'dry run' : `[${c.url ? c.title : c.id}](${c.url})`} |`)
    .join('\n');
  appendStepSummary(`## dev.to publish run (${opts.state}${opts.dryRun ? ', dry run' : ''})\n\n| post | result |\n| --- | --- |\n${summaryRows || '| — | nothing published |'}\n\nSkipped (already on dev.to): ${report.skipped.length}. Failed: ${report.failed.length}.\n`);

  if (opts.report) {
    fs.writeFileSync(opts.report, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Report written to ${opts.report}`);
  }

  if (report.failed.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`error: ${error.message}`);
    process.exitCode = 1;
  });
}
