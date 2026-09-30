import { defineConfig } from 'vite';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { generateSEO, routes as mainRoutes, articleRoutes } from './scripts/generate-seo.mjs';
import { generateParasiteSEO, extraRoutes } from './scripts/generate-parasite.mjs';
import { HUB_ROUTES } from './scripts/generate-hubs.mjs';

const rawSiteURL = process.env.SITE_URL;
const base = rawSiteURL ? `${new URL(rawSiteURL).pathname.replace(/\/$/,'')}/` : '/';

// Generate all SEO pages before build
generateSEO();
generateParasiteSEO();

const routes = [...mainRoutes, ...extraRoutes, ...articleRoutes, ...HUB_ROUTES];

export default defineConfig({
  base,
  publicDir: 'public',
  plugins: [
    {
      name: 'static-seo-home',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          if (ctx.filename === resolve('index.html')) {
            return fs.readFileSync('.generated/home.html','utf8');
          }
          return html;
        }
      }
    },
    {
      name: 'generate-404-and-manifest',
      closeBundle() {
        // GitHub Pages needs 404.html for SPA fallback - copy home as 404 with noindex handling
        try {
          /*
           * A real 404, not a copy of the homepage.
           *
           * The previous build wrote dist/404.html as a byte-identical copy of
           * the homepage, canonical to the homepage. GitHub Pages serves that
           * file with a 404 status for every unknown URL, so the site was
           * offering crawlers a second, duplicate homepage at an unlimited
           * number of addresses. This version keeps the shell, replaces the
           * content with a short apology and the two browse hubs, and marks
           * itself noindex as a second line of defence.
           */
          const distIndex = resolve('dist/index.html');
          const dist404 = resolve('dist/404.html');
          if (fs.existsSync(distIndex)) {
            const shell = fs.readFileSync(distIndex, 'utf8');
            const notFound =
              '<main><section class="seo-hero"><div class="eyebrow">ERROR 404</div>' +
              '<h1>That page is not here</h1>' +
              '<p>The link may be old, or the address may have a typo in it. Everything the site publishes is one of these two pages away.</p></section>' +
              '<section class="seo-related"><div class="section-label">WHERE TO GO NEXT</div><h2>Start from the index</h2><div>' +
              '<a href="/calculators/">All ' + routes.filter(r => r.startsWith('calculators/')).length + ' calculators <span>↗</span></a>' +
              '<a href="/guides/">All ' + routes.filter(r => r.startsWith('guides/')).length + ' guides <span>↗</span></a>' +
              '<a href="/articles/">The money edit <span>↗</span></a>' +
              '<a href="/">Home <span>↗</span></a>' +
              '</div></section></main>';
            let html404 = shell
              .replace(/<main>[\s\S]*?<\/main>/, notFound)
              .replace(/<link rel="canonical" href="[^"]*">/, '')
              .replace(/<meta property="og:url" content="[^"]*">/, '')
              .replace('</head>', '<meta name="robots" content="noindex, follow"></head>');
            if (html404.includes('That page is not here') && !html404.includes('rel="canonical"')) {
              fs.writeFileSync(dist404, html404);
              console.log('✓ Generated a real dist/404.html (noindex, no canonical)');
            } else {
              throw new Error('404 generation failed: the shell did not contain the expected shape');
            }
          }
          // Ensure .nojekyll exists in dist
          const nojekyll = resolve('dist/.nojekyll');
          if (!fs.existsSync(nojekyll)) {
            fs.writeFileSync(nojekyll, '');
            console.log('✓ Ensured dist/.nojekyll');
          }
          // Scope the PWA manifest to the site's base path. public/manifest.json is
          // written root-relative so preview builds at "/" stay correct, but on a
          // project path (e.g. /bbbh/) an unscoped start_url, scope and shortcut
          // would resolve to the domain root instead of the site.
          const manifestPath = resolve('dist/manifest.json');
          if (fs.existsSync(manifestPath) && base !== '/') {
            const original = fs.readFileSync(manifestPath, 'utf8');
            const scoped = original.replace(
              /("(?:start_url|scope|url|src)"\s*:\s*")\/(?!\/)/g,
              `$1${base}`
            );
            if (scoped !== original) {
              JSON.parse(scoped); // fail the build rather than emit invalid JSON
              fs.writeFileSync(manifestPath, scoped);
              console.log(`✓ Scoped dist/manifest.json to ${base}`);
            }
          }
          // Verify critical files
          const checks = [
            'dist/sitemap.xml',
            'dist/robots.txt',
            'dist/feed.xml',
            'dist/llms.txt',
            'dist/manifest.json',
            'dist/index.html'
          ];
          for (const file of checks) {
            if (fs.existsSync(resolve(file))) {
              const size = fs.statSync(resolve(file)).size;
              console.log(`✓ ${file} (${size} bytes)`);
            } else if (file.includes('sitemap') || file.includes('robots') || file.includes('feed') || file.includes('llms')) {
              // These only exist in production builds
              if (process.env.SITE_URL) {
                console.warn(`⚠ Missing expected file: ${file}`);
              }
            }
          }
          // Count generated pages
          try {
            const { execSync } = require('node:child_process');
            const count = execSync('find dist -name index.html | wc -l', { encoding: 'utf8' }).trim();
            console.log(`✓ Total HTML pages in dist: ${count}`);
          } catch {}
        } catch (e) {
          console.warn('Post-build hook warning:', e.message);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
    rollupOptions: {
      input: {
        home: resolve('index.html'),
        ...Object.fromEntries(routes.map(r => [r, resolve(r,'index.html')]))
      },
      output: {
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          // Keep asset names stable for caching
          if (assetInfo.name === 'style.css') return 'assets/style-[hash].css';
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Optimize for production
    minify: 'esbuild',
    cssMinify: true,
    target: 'es2022',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.e2b.app'],
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['.e2b.app']
  }
});
