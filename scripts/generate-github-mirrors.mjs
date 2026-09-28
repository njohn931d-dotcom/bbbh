// Writes GitHub-facing Markdown mirrors of the 40 extra pages into docs/ and a
// plain HTML index into public/40-articles-index.html. These exist so the
// repository itself reads well (README, docs/) and so every page has a
// readable text version; they are not a ranking trick. Titles, descriptions
// and body copy come from scripts/parasite-content.mjs, the single source.
import fs from 'node:fs';
import { pages, extraRoutes } from './parasite-content.mjs';

const origin = 'https://njohn931d-dotcom.github.io/bbbh';
const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/&rsquo;/g, '’').replace(/&ldquo;|&rdquo;/g, '"').replace(/&amp;/g, '&');
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

fs.rmSync('docs', { recursive: true, force: true });
fs.mkdirSync('docs', { recursive: true });

const mdTable = t => !t ? '' : '\n| ' + t.headers.join(' | ') + ' |\n| ' + t.headers.map(() => '---').join(' | ') + ' |\n' + t.rows.map(r => '| ' + r.join(' | ') + ' |').join('\n') + '\n';

for (const route of extraRoutes) {
  const p = pages[route];
  const url = `${origin}/${route}/`;
  const md = [
    `# ${p.name}`,
    '',
    `> ${p.description}`,
    '',
    `Live page: ${url}`,
    '',
    ...p.sections.flatMap(([h, html], i) => [`## ${strip(h)}`, '', strip(html), i === 0 ? mdTable(p.table) : '']),
    '## FAQ',
    '',
    ...p.faqs.flatMap(([q, a]) => [`**${strip(q)}**`, '', strip(a), '']),
    '---',
    `Part of [Worth](${origin}/), free open-source money calculators. Source: https://github.com/njohn931d-dotcom/bbbh`,
    '',
  ].join('\n');
  fs.writeFileSync(`docs/${route.replace(/\//g, '-')}.md`, md);
}

fs.writeFileSync('docs/README.md', [
  '# Worth — page mirrors',
  '',
  `Markdown versions of the calculator and guide pages published at ${origin}/. Each file links to its live page.`,
  '',
  ...extraRoutes.map(r => `- [${pages[r].name}](${r.replace(/\//g, '-')}.md) — ${pages[r].description}`),
  '',
].join('\n'));

const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="google-site-verification" content="sEQ7B0Jr4_LTKoRdaLwvcSx25iX5ZvZ-LMwB1EZODnY"><meta name="viewport" content="width=device-width,initial-scale=1"><title>All Calculators and Guides | Worth</title><meta name="description" content="Index of Worth's free money calculators and guides: mortgage, car loan, student loan, net worth, creator income, and salary-to-hourly in ten languages."><link rel="canonical" href="${origin}/40-articles-index.html"><meta name="robots" content="index, follow"><link rel="stylesheet" href="/style.css"></head><body><main class="seo-article" style="margin:40px auto"><h1>All calculators and guides</h1><p>Every page turns a price into hours of work at your take-home pay. Pick a topic:</p><ul>${extraRoutes.map(r => `<li><a href="/bbbh/${r}/" hreflang="${pages[r].lang || 'en'}">${esc(pages[r].name)}</a> — ${esc(pages[r].description)}</li>`).join('')}</ul><p><a href="/bbbh/">Home</a> · <a href="/bbbh/articles/">40 money guides</a> · <a href="https://github.com/njohn931d-dotcom/bbbh">Source on GitHub</a></p></main></body></html>`;
fs.writeFileSync('public/40-articles-index.html', index);
fs.writeFileSync('40-articles-index.html', index);
console.log(`Wrote docs/ (${extraRoutes.length} mirrors) and 40-articles-index.html`);
