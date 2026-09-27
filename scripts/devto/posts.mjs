// Loader for the curated dev.to cross-posts in scripts/devto/posts/*.md
//
// Each post is a markdown file with a small front-matter block so the content
// stays editable without touching code:
//
//   ---
//   key: url-fragment-state
//   order: 4
//   title: Shareable calculator state with no backend
//   description: One-sentence summary (dev.to meta description, <= 200 chars)
//   tags: javascript, webdev, frontend
//   canonical: https://example.com/original-page/   (optional, blank = original on dev.to)
//   cover: devto/url-fragment-state.png             (optional, path under public/)
//   ---
//   Body markdown...
//
// Inline HTML in the body is allowed (dev.to renders it). Relative cover paths
// are resolved against SITE_URL at publish time.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE_URL = (process.env.SITE_URL || 'https://njohn931d-dotcom.github.io/bbbh').replace(/\/$/, '');
export const REPO_URL = 'https://github.com/njohn931d-dotcom/bbbh';
export const POSTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'posts');

const MAX_TAGS = 4;

export function parseFrontMatter(raw, filename = 'post') {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: missing front matter block (--- ... ---)`);

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const sep = line.indexOf(':');
    if (sep === -1) throw new Error(`${filename}: front matter line without ":" -> ${line}`);
    meta[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
  }

  return { meta, body: match[2].trim() };
}

export function postFromFile(file) {
  const full = path.join(POSTS_DIR, file);
  const { meta, body } = parseFrontMatter(fs.readFileSync(full, 'utf8'), file);

  const tags = (meta.tags || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const post = {
    key: meta.key || path.basename(file, '.md'),
    order: Number(meta.order || 999),
    title: meta.title || '',
    description: meta.description || '',
    tags,
    canonicalUrl: meta.canonical ? meta.canonical.replace(/\/$/, '') + '/' : null,
    coverPath: meta.cover || null,
    coverUrl: meta.cover ? `${SITE_URL}/${meta.cover.replace(/^\//, '')}` : null,
    body,
    file,
  };

  validatePost(post);
  return post;
}

// URLs in prose only: fenced code blocks and inline code spans are excluded, so
// XML namespaces and example hosts inside snippets do not trip link checks.
export function extractLinks(markdown) {
  const prose = markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const urls = [...prose.matchAll(/https?:\/\/[^\s)>,]+/g)]
    .map((m) => m[0].replace(/[.,;:]+$/, '').replace(/["']$/, ''));
  return { urls, siteLinks: urls.filter((url) => url.startsWith(SITE_URL)) };
}

export function validatePost(post) {
  const where = post.file || post.key;
  const fail = (msg) => {
    throw new Error(`${where}: ${msg}`);
  };

  if (!post.key) fail('missing key');
  if (!post.title) fail('missing title');
  if (post.title.length > 128) fail(`title is ${post.title.length} chars (dev.to limit is 128)`);
  if (!post.description) fail('missing description');
  if (post.description.length > 200) fail(`description is ${post.description.length} chars (dev.to limit is 200)`);
  if (!post.tags.length) fail('missing tags');
  if (post.tags.length > MAX_TAGS) fail(`${post.tags.length} tags, dev.to allows ${MAX_TAGS}`);
  for (const tag of post.tags) {
    if (!/^[a-z0-9]+$/.test(tag)) fail(`tag "${tag}" must be lowercase alphanumeric`);
  }
  if (post.canonicalUrl && !post.canonicalUrl.startsWith('https://')) fail(`canonical must be https: ${post.canonicalUrl}`);
  if (post.body.length < 400) fail(`body is only ${post.body.length} chars; dev.to posts this thin read as spam`);
  if (post.body.length > 100000) fail('body exceeds the dev.to markdown limit (100k chars)');

  const { urls, siteLinks } = extractLinks(post.body);
  if (siteLinks.length < 2) fail(`body links to ${SITE_URL} only ${siteLinks.length} time(s); expected at least 2`);

  for (const url of urls) {
    if (url.startsWith('http://')) fail(`insecure link in body: ${url}`);
  }

  return post;
}

export function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) throw new Error(`No posts directory at ${POSTS_DIR}`);
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const posts = files.map(postFromFile).sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));

  const seen = new Set();
  for (const post of posts) {
    if (seen.has(post.key)) throw new Error(`duplicate post key: ${post.key}`);
    seen.add(post.key);
    const clash = posts.find((p) => p !== post && p.title.toLowerCase() === post.title.toLowerCase());
    if (clash) throw new Error(`duplicate title between ${post.file} and ${clash.file}`);
  }

  return posts;
}

export function findPost(posts, key) {
  const post = posts.find((p) => p.key === key);
  if (!post) throw new Error(`Unknown post key "${key}". Known keys: ${posts.map((p) => p.key).join(', ')}`);
  return post;
}
