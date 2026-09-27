---
key: discovery-files-generator
order: 5
title: "Generating sitemap.xml, robots.txt and llms.txt from one list of routes"
description: "Three discovery files, one source of truth, and the two mistakes that hurt: shipping a preview origin into canonical tags, and trusting attributes that crawlers ignore."
tags: seo, node, webdev, github
canonical:
cover: devto/discovery-files-generator.jpg
---

Every static site ends up with the same three files, and they are all derived from the same list of routes. Generating them by hand is how you end up with a sitemap that lists pages you deleted in March.

Here is the whole approach, plus the two mistakes that actually cost me something.

## One route list, three outputs

```js
const routes = [...baseRoutes, ...articleRoutes];

const siteUrl = process.env.SITE_URL?.replace(/\/$/, '') || '';
if (!siteUrl) throw new Error('SITE_URL is required, refusing to guess your origin');

fs.writeFileSync('public/sitemap.xml', renderSitemap(siteUrl, routes));
fs.writeFileSync('public/robots.txt', renderRobots(siteUrl));
fs.writeFileSync('public/llms.txt', renderLlmsIndex(siteUrl, routes));
```

The important line is the one that throws. If the origin is missing, a build should fail loudly instead of emitting a sitemap full of relative URLs that nobody can use.

## mistake #1: the preview origin

I deployed a preview build once and every one of the 133 pages shipped with a canonical URL pointing at the preview host. In Google's words, all 133 pages were claiming to be duplicates of a site that only I could reach.

Two fixes, both cheap:

- Production builds require the origin explicitly: `SITE_URL=https://example.com npm run build`.
- A test parses every generated page and asserts `canonical === SITE_URL + path`.

It also pays to make preview builds harmless on purpose: the dev build writes a `robots.txt` containing `Disallow: /` so a stray preview deployment cannot compete with production even if someone links to it.

## mistake #2: trusting fields crawlers ignore

A sitemap I wrote early on had `<changefreq>daily</changefreq>` and `<priority>0.9</priority>` on every URL, because that is what every template does. Google's documentation is unambiguous that it **ignores both** — they are hints at best, and frequently just wrong. What remains useful is `<loc>`, and `<lastmod>` if you can produce it from real file changes rather than `new Date()`.

The honest version of a sitemap is boring:

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/calculators/cost-of-time/</loc></url>
</urlset>
```

Boring, and it does not lie about how often a page changes.

## llms.txt: cheap, unproven

`llms.txt` is a proposed convention for giving language models a clean index of a site. It is not a standard, and I have no evidence it changes anything in how assistants cite a page.

I generate it anyway, for one reason: it costs about twenty lines, it is derived from the same route list, and if the convention does take hold, the plumbing is already there. If you are deciding whether to spend an afternoon on it, spend the afternoon on your content instead.

## Wire it to the build, not to your memory

The failure mode of all three files is staleness: a page is removed, the sitemap keeps advertising it, and a crawler wastes its budget on a 404. Generate them in the build, keep them in `.gitignore`, and assert their contents in tests. In this project the check is:

- every URL in `sitemap.xml` resolves to a file the build produced
- every generated page has a unique title and description
- every canonical URL matches the deployment origin

Measured output from the last production build: 133 URLs in the sitemap, 133 HTML files on disk, 36 KB of JS and CSS total.

## See it working

- The sitemap: https://njohn931d-dotcom.github.io/bbbh/sitemap.xml
- The LLM index: https://njohn931d-dotcom.github.io/bbbh/llms.txt
- The generator: https://github.com/njohn931d-dotcom/bbbh/blob/main/scripts/generate-seo.mjs
- The site itself: https://njohn931d-dotcom.github.io/bbbh/

Disclosure: this is my own project. The only opinionated advice in here is the part about failing the build when the origin is missing — that one has earned its keep.
