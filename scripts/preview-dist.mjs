#!/usr/bin/env node
/**
 * Serve `dist/` exactly the way GitHub Pages serves it: under the project path.
 *
 * `vite preview` cannot do this. The build writes pages to `dist/calculators/...`
 * while `base` is `/bbbh/`, so every preview URL comes back as the homepage
 * fallback and an embed page looks broken when it is fine. This maps the base
 * path onto `dist/` and does nothing else, so a local check of /embed/, the
 * widget loader or a badge means the same thing as the deployed URL.
 *
 *   npm run preview:dist      # http://localhost:4173/bbbh/
 *   PORT=8000 node scripts/preview-dist.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const DIST = path.resolve('dist');
const BASE = process.env.BASE_PATH || '/bbbh/';
const PORT = Number(process.env.PORT || 4173);
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8', '.webmanifest':'application/manifest+json' };
http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (p.startsWith(BASE)) p = p.slice(BASE.length - 1) || '/';
  let file = path.join(DIST, p);
  if (file.endsWith('/')) file += 'index.html';
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404,{'content-type':'text/plain'}); return res.end('404 ' + p); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '0.0.0.0', () => console.log(`serving ${DIST} at http://0.0.0.0:${PORT}${BASE}`));
