#!/usr/bin/env node
/**
 * Set the GitHub identity of this repository.
 *
 * Read this first: the single cheapest reach lever the project has is GitHub
 * itself. The repo page at github.com/njohn931d-dotcom/bbbh is a DA-96 URL that
 * (a) GitHub search indexes, (b) Google crawls hourly, and (c) every visitor of
 * this repo sees. It was configured as a different project entirely: the
 * description said "forge control-plane VM host", the website field was empty,
 * and there were no topics. That is not a ranking problem, it is a "nobody can
 * find or click through to the thing" problem, and no amount of on-page schema
 * fixes it.
 *
 * This script needs a token with `Administration` scope on the repo, which the
 * CI token does not have. Run it locally:
 *
 *   node scripts/github-identity.mjs --check     # read-only: show what is set
 *   node scripts/github-identity.mjs             # apply description, homepage, topics
 *   node scripts/github-identity.mjs --dry-run   # print the exact PATCH payloads
 *
 * If it exits 4, authenticate as yourself first:
 *   gh auth refresh -s repo          # or: export GH_TOKEN=<token with repo admin>
 */

import { execFileSync } from 'node:child_process';

const OWNER = 'njohn931d-dotcom';
const REPO = 'bbbh';
const SITE = 'https://njohn931d-dotcom.github.io/bbbh/';

/** Kept in sync with the real page count by `npm run mirrors`. */
const DESCRIPTION =
  '142 free money calculators and guides that run entirely in your browser: cost of time, salary to hourly, ' +
  'mortgage, compound interest, subscription audit, freelance rate. No sign-up, no tracking, MIT licensed. ' +
  'Every calculator can be embedded on any site in one line.';

// GitHub allows 20 topics. These are the queries a person who wants this tool
// would actually type, in GitHub search and in Google's "site:github.com".
const TOPICS = [
  'calculator', 'personal-finance', 'money', 'finance-tools', 'cost-of-time',
  'salary-calculator', 'mortgage-calculator', 'compound-interest', 'hourly-rate',
  'freelance', 'subscription', 'budgeting', 'net-worth', 'financial-literacy',
  'open-source', 'vanilla-js', 'static-site', 'github-pages', 'pwa', 'privacy',
];

const gh = (args, input) =>
  execFileSync('gh', args, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] });

function current() {
  const raw = gh(['api', `repos/${OWNER}/${REPO}`, '--jq', '{description,homepage,topics:(.topics//[])}']);
  return JSON.parse(raw);
}

function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry-run');
  const check = args.includes('--check');

  let before;
  try {
    before = current();
  } catch (e) {
    console.error('✗ Could not read the repo. Are you logged in? Try: gh auth status');
    console.error(String(e.stderr || e.message).slice(0, 400));
    process.exitCode = 4;
    return;
  }

  const wantTopics = new Set(TOPICS);
  const haveTopics = new Set(before.topics || []);
  const missingTopics = TOPICS.filter(t => !haveTopics.has(t));
  const report = [
    ['description', before.description === DESCRIPTION ? 'ok' : 'wrong or empty'],
    ['homepage', before.homepage === SITE ? 'ok' : 'missing'],
    ['topics', missingTopics.length ? `${missingTopics.length} missing` : 'ok'],
  ];
  console.log(`github.com/${OWNER}/${REPO}`);
  for (const [field, state] of report) console.log(`  ${state === 'ok' ? '✓' : '✗'} ${field}: ${state}`);
  if (before.description !== DESCRIPTION) console.log(`    now: ${JSON.stringify(before.description)}\n    set: ${JSON.stringify(DESCRIPTION)}`);
  if (before.homepage !== SITE) console.log(`    homepage now: ${JSON.stringify(before.homepage)} → ${SITE}`);
  if (missingTopics.length) console.log(`    topics missing: ${missingTopics.join(', ')}`);

  if (check || dry) {
    if (check) { console.log('\n--check only reads. Re-run without it to apply.'); return; }
    console.log('\nPATCH /repos/%s/%s'.replace('%s', OWNER).replace('%s', REPO), JSON.stringify({ description: DESCRIPTION, homepage: SITE }, null, 2));
    console.log('PUT /repos/%s/%s/topics'.replace('%s', OWNER).replace('%s', REPO), JSON.stringify({ names: [...TOPICS] }, null, 2));
    return;
  }

  gh(['api', '-X', 'PATCH', `repos/${OWNER}/${REPO}`, '-f', `description=${DESCRIPTION}`, '-f', `homepage=${SITE}`]);
  console.log('✓ description and homepage set');
  const namesArgs = TOPICS.flatMap(name => ['-f', `names[]=${name}`]);
  gh(['api', '-X', 'PUT', `repos/${OWNER}/${REPO}/topics`, '-H', 'Accept: application/vnd.github.mercy-preview+json', ...namesArgs]);
  console.log(`✓ ${TOPICS.length} topics set`);

  const after = current();
  const ok = after.description === DESCRIPTION && after.homepage === SITE && (after.topics || []).length >= TOPICS.length;
  console.log(ok ? '\n✓ Repo identity now matches the site. GitHub search, Google and every visitor to the repo page can see it.'
    : '\n⚠ Applied, but the read-back differs. Check: gh api repos/' + OWNER + '/' + REPO);
  if (!ok) process.exitCode = 5;
}

main();
