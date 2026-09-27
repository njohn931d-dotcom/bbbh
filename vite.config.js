import { defineConfig } from 'vite';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { generateSEO, routes } from './scripts/generate-seo.mjs';
const rawSiteURL = process.env.SITE_URL;
const base = rawSiteURL ? `${new URL(rawSiteURL).pathname.replace(/\/$/,'')}/` : '/';
generateSEO();
export default defineConfig({
 base,
 plugins: [{ name: 'static-seo-home', transformIndexHtml: { order:'pre', handler(html, ctx) { return ctx.filename === resolve('index.html') ? fs.readFileSync('.generated/home.html','utf8') : html; } } }],
 build: {rollupOptions:{input:{home:resolve('index.html'),...Object.fromEntries(routes.map(r=>[r,resolve(r,'index.html')]))}}},
 server: {host:'0.0.0.0',allowedHosts:['.e2b.app']},preview:{host:'0.0.0.0',allowedHosts:['.e2b.app']}
});
