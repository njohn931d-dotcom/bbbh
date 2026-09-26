#!/usr/bin/env node
/**
 * Zero-dependency static server for Affiliate Income Lab.
 *
 * Purpose: let you preview the site exactly as it will behave on a real host,
 * including "clean" directory URLs (/best-affiliate-programs/ -> index.html),
 * correct MIME types, compression, cache headers and a real 404 page.
 *
 *   node server.js            # http://0.0.0.0:3000
 *   PORT=8080 node server.js
 *
 * This is a preview/development server only. For production, deploy the folder
 * to any static host (Netlify, Cloudflare Pages, Vercel, S3, Nginx) — the site
 * is plain HTML/CSS/JS with no build step and no server-side code required.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf'
};

const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest\+json)|image\/svg)/;

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const resolved = path.normalize(path.join(root, decoded));
  // Prevent path traversal outside the site root.
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function statFile(p) {
  try {
    const s = fs.statSync(p);
    return s.isFile() ? s : null;
  } catch {
    return null;
  }
}

/** Resolve a URL to a real file, trying directory and extensionless forms. */
function resolveFile(urlPath) {
  const target = safeJoin(ROOT, urlPath);
  if (!target) return { file: null };

  if (statFile(target)) return { file: target };

  // /path -> /path/index.html
  const withIndex = path.join(target, 'index.html');
  if (statFile(withIndex)) return { file: withIndex };

  // /path -> /path.html  (extensionless URLs)
  const withHtml = target + '.html';
  if (statFile(withHtml)) return { file: withHtml };

  return { file: null };
}

function send(req, res, status, body, headers) {
  const h = Object.assign({ 'Vary': 'Accept-Encoding' }, headers);
  const type = h['Content-Type'] || '';
  const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  let buf = Buffer.isBuffer(body) ? body : Buffer.from(body);

  if (acceptsGzip && COMPRESSIBLE.test(type) && buf.length > 512) {
    buf = zlib.gzipSync(buf, { level: 6 });
    h['Content-Encoding'] = 'gzip';
  }
  h['Content-Length'] = buf.length;
  res.writeHead(status, h);
  if (req.method === 'HEAD') return res.end();
  res.end(buf);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(req, res, 405, 'Method Not Allowed\n', { 'Content-Type': 'text/plain; charset=utf-8', 'Allow': 'GET, HEAD' });
  }

  const urlPath = req.url === '/' ? '/' : req.url;
  const { file } = resolveFile(urlPath);

  if (!file) {
    const custom = path.join(ROOT, '404.html');
    if (statFile(custom)) {
      return send(req, res, 404, fs.readFileSync(custom), {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
    }
    return send(req, res, 404, 'Not found\n', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const isHtml = ext === '.html';
  const isHashed = /\.[0-9a-f]{8,}\./.test(path.basename(file));

  // Redirect /foo/index.html -> /foo/ so the canonical URL is the only one served.
  if (isHtml && path.basename(file) === 'index.html' && !/\/$/.test(urlPath.split('?')[0])) {
    const clean = urlPath.split('?')[0].replace(/\/index\.html$/, '/');
    return send(req, res, 301, 'Moved Permanently\n', { 'Location': clean, 'Content-Type': 'text/plain; charset=utf-8' });
  }

  let body;
  try {
    body = fs.readFileSync(file);
  } catch {
    return send(req, res, 500, 'Read error\n', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  const cache = isHtml ? 'no-cache'
    : isHashed ? 'public, max-age=31536000, immutable'
    : 'public, max-age=3600';

  send(req, res, 200, body, {
    'Content-Type': type,
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff'
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Affiliate Income Lab preview: http://${HOST}:${PORT}`);
  console.log(`Serving: ${ROOT}`);
});
