/**
 * Shared helpers for the growth modules (news, movies, minimum wage, emoji,
 * open data). Kept dependency-free so the same code runs in the Vite config,
 * in `node scripts/generate-parasite.mjs` and in the test suite.
 */
import fs from 'node:fs';
import path from 'node:path';

export const SITE_NAME = 'Worth';
export const REPO_URL = 'https://github.com/njohn931d-dotcom/bbbh';

/**
 * Resolve SITE_URL the same way the other generators do. An empty value is a
 * preview build: pages are emitted noindex with no canonical and no absolute
 * URLs, and no discovery files are written.
 */
export function siteContext(env = process.env) {
  const raw = env.SITE_URL;
  if (!raw) return { siteUrl: '', origin: '', basePath: '' };
  const u = new URL(raw);
  if (!['https:', 'http:'].includes(u.protocol) || u.search || u.hash || u.username || u.password) {
    throw new Error('SITE_URL must be a public site URL without query or fragment');
  }
  const basePath = u.pathname.replace(/\/$/, '');
  return { siteUrl: u.origin + basePath, origin: u.origin, basePath };
}

export const esc = s => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** Inline markdown for short strings: **bold**, *italic*, `code`, [text](href). Input is escaped first. */
export function inlineMd(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*((?:[^*]|\*(?!\*))+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
      const safe = /^(https?:\/\/|\/)/.test(href) ? href : '/';
      const external = /^https?:/.test(safe);
      return `<a href="${safe}"${external ? ' rel="noopener nofollow"' : ''}>${label}</a>`;
    });
}

export const usd = (n, decimals = 0) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals,
}).format(n);

export const num = (n, d = 0) => new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** '2026-09-23' -> 'September 23, 2026'. Pure string maths: no timezone surprises. */
export function longDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`bad ISO date: ${iso}`);
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

/** Whole days between two ISO dates (b - a). */
export const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

export const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function readJson(rel) {
  return JSON.parse(fs.readFileSync(rel, 'utf8'));
}

/** Remove a generated directory. Retries because parallel test files share the tree. */
export function rmGenerated(dir) {
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
}

export function writePage(route, html) {
  fs.mkdirSync(route, { recursive: true });
  fs.writeFileSync(path.join(route, 'index.html'), html);
}

/**
 * One topical emoji per page, chosen from the route and title so it reads as
 * decoration that matches the subject. Used for social titles, meta
 * descriptions and feed titles; never for headings.
 */
const EMOJI_RULES = [
  [/movie|cinema|trailer|film|imax|ticket/i, '🎬'],
  [/netflix|disney|hulu|stream|subscription|spotify|hbo|peacock|prime video|paramount/i, '📺'],
  [/iphone|phone|apple|gadget|laptop/i, '📱'],
  [/gta|game|playstation|xbox|nintendo|steam/i, '🎮'],
  [/minimum.?wage|hourly|salary|overtime|wage|paycheck|pay\b|income/i, '💵'],
  [/mortgage|rent|house|home|housing/i, '🏠'],
  [/car|gas|commute|uber|fuel|vehicle/i, '🚗'],
  [/coffee|latte|starbucks|pumpkin/i, '☕'],
  [/tax|irs|refund|deduction|cola|social security/i, '🧾'],
  [/loan|debt|credit|student/i, '💳'],
  [/saving|save|emergency|fund|budget/i, '🐖'],
  [/invest|stock|crypto|bitcoin|compound|retire|fire\b/i, '📈'],
  [/halloween|candy/i, '🎃'],
  [/black.?friday|cyber|holiday|christmas|gift/i, '🎁'],
  [/emoji/i, '💰'],
  [/time|hour|clock/i, '⏱️'],
];
export function emojiFor(...texts) {
  const hay = texts.filter(Boolean).join(' ');
  for (const [re, e] of EMOJI_RULES) if (re.test(hay)) return e;
  return '💡';
}

/**
 * Link to a build-time file (JSON, CSV, feed). Those files exist only in dist/, so the
 * link is absolute when the origin is known: root-relative anchors are verified against
 * the source tree by the test suite, and these targets are not in it.
 */
export const fileHref = (ctx, p) => (ctx.siteUrl ? `${ctx.siteUrl}/${p}` : `/${p}`);

/** Turn '/x/y/' style root-relative hrefs into project-path aware ones. */
export const prefixLinks = (html, basePath) => basePath
  ? html.replace(/(<a\b[^>]*\bhref=")\/(?!\/)/g, (_, pre) => pre + basePath + '/')
  : html;
