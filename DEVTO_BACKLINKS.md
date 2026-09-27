# dev.to backlink pipeline

Publishes curated cross-posts to dev.to that link back to
`https://njohn931d-dotcom.github.io/bbbh/`, and audits the dev.to links you
already have.

Status: **built and dry-run verified; nothing has been published to dev.to yet.**
The first live run needs one manual step from you (the API key secret, below),
because a repository secret cannot be created by an automation token — GitHub
returns `403 Resource not accessible by integration` for the bot that built this.

## What is in the repo

| File | Purpose |
| --- | --- |
| `scripts/devto-publish.mjs` | Publisher CLI: key check, dedupe, publish, audit |
| `scripts/devto/posts/*.md` | The 5 posts, markdown + front matter — edit these, not code |
| `.github/workflows/devto-publish.yml` | Manual GitHub Actions runner for the publisher |
| `public/devto/*.jpg` | Cover images served from the site (1200×630, 27–59 KB each) |
| `tests/devto.test.cjs` | Content contract: links, tags, covers, canonical, idempotency |

## Step 1 — add the API key (the only manual step)

Your key is a password: never commit it, never paste it into a markdown file.
The pipeline only ever reads it from an environment variable or a GitHub secret.

1. Create or copy the key at <https://dev.to/settings/extensions> → *DEV API Keys*.
2. Add it to the repo: <https://github.com/njohn931d-dotcom/bbbh/settings/secrets/actions/new>
   - Name: `DEVTO_API_KEY`
   - Value: the key
3. Optional but worth 30 seconds: set your dev.to profile **website URL** to
   `https://njohn931d-dotcom.github.io/bbbh/` at <https://dev.to/settings/profile>.
   That is a permanent profile-level link, independent of any post.

If a key is ever exposed, revoke it on the same dev.to page and add a new one.
`.env` is already gitignored; there is no other place a key can land in this repo.

## Step 2 — publish

### Path A: GitHub Actions (recommended, runs on GitHub's network)

1. Actions → **Publish dev.to backlink posts** → *Run workflow*.
2. Leave `state: published`, `dry_run: false`, `limit` blank for all 5.
3. Check the run summary: created URLs, skipped posts, failures.

From the command line (works from any machine with `gh` authenticated):

```sh
gh workflow run devto-publish.yml --ref main -f state=published -f dry_run=false
gh run watch
```

Do a `dry_run=true` run first if you want to see the exact payloads without
creating anything.

### Path B: local

```sh
DEVTO_API_KEY=your_key node scripts/devto-publish.mjs --check    # verify key
DEVTO_API_KEY=your_key node scripts/devto-publish.mjs --dry-run  # print payloads
DEVTO_API_KEY=your_key node scripts/devto-publish.mjs            # publish live
```

No dependencies, Node 18+, nothing to install.

Useful flags:

```sh
--state draft                 # create unpublished drafts instead
--only url-fragment-state     # one specific post
--limit 2                     # cap this run
--delay 8000                  # slower spacing between posts
--report run.json             # machine-readable run report
node scripts/devto-publish.mjs --offline        # no network, no key: content smoke test
DEVTO_API_KEY=... node scripts/devto-publish.mjs --audit   # backlink inventory
```

## The 5 posts

All 3,242 words were written for dev.to's audience — build write-ups, cost math,
and implementation notes — not republished SEO filler. Two are canonicalized to
the matching page on the site; three are originals that link back in the body.

| # | Post | Tags | Canonical | Site links |
| --- | --- | --- | --- | --- |
| 1 | No framework, no database, 87 static pages | webdev, javascript, node, showdev | — (original) | 2 |
| 2 | Your salary is not your hourly rate | freelance, career, productivity, money | freelance-rate-calculator-2026 | 3 |
| 3 | Pricing your AI subscriptions in billable hours | ai, productivity, devtools, money | chatgpt-cost-calculator-2026 | 3 |
| 4 | Shareable calculator state with no backend | javascript, webdev, frontend, web | — (original) | 2 |
| 5 | Generating sitemap.xml, robots.txt and llms.txt | seo, node, webdev, github | — (original) | 3 |

Each post also carries a cover image hosted on the site
(`.../bbbh/devto/<key>.jpg`) and a plain disclosure that the tools are the
author's own. Posts 2 and 3 additionally get a "originally published at" line
linking to the site, because dev.to renders `canonical_url` that way.

## What these backlinks actually are

Be precise about the value, because the honest version is smaller than the sales
pitch:

- **Links inside the article body** are rendered as ordinary anchors — followed
  links, not `nofollow`. That is the real backlink and the reason this pipeline
  exists. Platform policies change, so verify once in Search Console after the
  first posts go live.
- **`canonical_url`** produces a visible "originally published" link and tells
  Google the site copy is the original. It consolidates rather than adds equity.
- **Your dev.to profile URL** is a standalone link, worth setting regardless.
- What you do **not** get: a guarantee of ranking, or any control over how much
  dev.to's own authority flows through. Treat this as distribution plus a
  citation, not as a ranking lever you can pull.

Also worth knowing: a dev.to API key has **authoring scope only**. It cannot
list third-party backlinks pointing at your domain — `--audit` reports on your
own articles. For the full picture use Search Console → Links, or a backlink
tool; there is no API that hands you the list.

## Cadence (this is what keeps the account alive)

dev.to treats bulk promotional posting as spam and does suspend accounts for it.
The 47-article library is **not** meant to be posted as 47 dev.to articles —
only these 5 curated posts exist for that platform, and the pipeline publishes
them one at a time with a 4-second floor between them.

Sensible pace:

- Publish the first 1–2, then wait and see how they are received.
- Post at most a few per week, ideally one every few days.
- Reply to comments. Engagement is the thing that separates a participant from a
  link dropper, and it is also the thing that gets you followers who click.
- If a post flops, do not repost it with a new title.

## Re-running, editing, adding

- **Re-running is safe.** Posts already on dev.to are skipped, matched by
  canonical URL *and* by normalized title, so an edited headline does not create
  a second copy. `--force` overrides this and will create a duplicate — don't.
- **Edit a post** by editing its markdown in `scripts/devto/posts/`. Front matter
  is `key, order, title, description, tags, canonical, cover`.
- **Add a post**: drop a new `.md` file in `scripts/devto/posts/` with front
  matter, then run `node scripts/devto-publish.mjs --offline` to check it (it
  enforces the dev.to limits: 128-char title, 4 tags, ≥2 links back to the site,
  no `http://` links, no thin bodies) and `npm test` before publishing.
- **Cover images**: put them in `public/devto/` and reference them as
  `cover: devto/<file>.jpg`. Covers are optional; if a cover URL is not live
  yet, the publisher drops the image with a warning and publishes the text
  rather than shipping a broken image.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `no dev.to API key` | env var not set in this shell | export `DEVTO_API_KEY`, or run via Actions |
| `the dev.to API rejected the key` (401) | key wrong/revoked, or pasted with whitespace | re-copy from dev.to settings, re-add the secret |
| `422` from `/api/articles` | payload rejected (title/tag/body limits, duplicate) | the error body is printed verbatim; fix the post front matter |
| `429` | rate limited | the script backs off and retries automatically, up to 4 times |
| Posts published without covers | site deploy not finished, so the image URL 404s | let the Pages deploy finish, then re-run — text is not re-created |
| `Missing secret` in Actions | `DEVTO_API_KEY` not added to the repo | Step 1 above |

## Honest framing

This gets you real, followed links from a high-traffic developer platform, at a
cadence that will not get the account banned, with the payloads verified before
anything goes out. It does not guarantee rankings, and the two canonicalized
posts deliberately trade dev.to ranking for pointing the original at the site.
If the goal ever becomes "maximum dev.to traffic" instead of "maximum backlinks",
flip those two `canonical:` lines to blank and this pipeline optimizes the other
way.
