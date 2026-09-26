# bbbh

A Forge control-plane VM host with a Linux desktop and browser-accessible terminal, plus two
independent projects that live in this repository:

| Project | Lives at | What it is |
|---|---|---|
| **Forge Workspace** | `/` (repo root) | A static landing page for selling remote-workspace setup services. See [INCOME_PLAYBOOK.md](INCOME_PLAYBOOK.md). |
| **Affiliate Income Lab** | `/affiliate-marketing/` | A 13-page SEO content site about earning money with affiliate marketing. See [affiliate-marketing/README.md](affiliate-marketing/README.md). |

The two share a domain but nothing else — separate stylesheets, scripts and build steps. They do not
import from each other.

---

## 1. Forge Workspace (repo root)

A static landing page for the workspace setup service described in [INCOME_PLAYBOOK.md](INCOME_PLAYBOOK.md).

**Files:** `index.html`, `styles.css`, `app.js`, `site-config.js` — all referenced with relative paths,
so the page must stay at the repository root.

### Preview

```sh
python3 -m http.server 4173 --bind 0.0.0.0
```

Then open the page on port `4173`.

Before publishing, set a real `contactEmail` in `site-config.js`. In demo mode the inquiry form only
copies the request to the visitor's clipboard; it does not send or store leads. The page does not take
payments. Agree on a paid pilot and invoice/payment terms directly with a customer before beginning work.

### Security

The current devcontainer is demo-only: it exposes a writable shell and GUI on public ports and includes a
static demo GUI password. Do not use it to host customer workspaces or data as-is. The income playbook
describes the security work needed before offering anything to customers.

---

## 2. Affiliate Income Lab (`/affiliate-marketing/`)

An SEO-optimised affiliate marketing content site: a landing page with an interactive income calculator,
eight keyword-targeted long-form guides, a hub page, program comparisons and full SEO infrastructure.
Plain HTML, CSS and vanilla JavaScript — no build step required to deploy.

**Target keywords and volumes:**

| Page | Primary keywords | Volume/mo |
|---|---|---|
| `/affiliate-marketing/` | affiliate marketing for beginners, make money with affiliate marketing | 14,800 · 8,100 |
| `/affiliate-marketing/passive-income-ideas/` | passive income ideas | 74,000 |
| `/affiliate-marketing/affiliate-marketing-websites/` | affiliate marketing websites | 22,200 |
| `/affiliate-marketing/amazon-affiliate-commission-rates/` | amazon affiliate commission | 18,100 |
| `/affiliate-marketing/ways-to-generate-income-with-affiliate-marketing/` | ways to generate income with affiliate marketing | 12,100 |
| `/affiliate-marketing/best-affiliate-programs/` | best affiliate programs | 12,100 |
| `/affiliate-marketing/high-ticket-affiliate-marketing/` | high ticket affiliate marketing | 9,900 |
| `/affiliate-marketing/recurring-commission-affiliate-programs/` | recurring commission affiliate programs | 1,300 |
| `/affiliate-marketing/guides/` | hub page for the cluster | — |

Plus `/affiliate-marketing/about/` (E-E-A-T author page), `/affiliate-marketing/legal/privacy/` (FTC
disclosure and privacy policy) and `/affiliate-marketing/404.html`.

**Commands** (run from the repository root):

```bash
npm start                    # dev server on :3000, serves both projects
npm run build                # regenerate pages, sync nav/footer, rebuild sitemap + feed
npm run check                # validate SEO, JSON-LD, internal links, a11y basics
```

**Build system:** `affiliate-marketing/tools/build.py` — zero dependencies. It wraps article bodies from
`affiliate-marketing/content/*.html` in the shared head/header/footer, syncs the navigation and footer
into every page from a single definition, and regenerates `sitemap.xml` and `rss.xml`. Full details are
in [affiliate-marketing/README.md](affiliate-marketing/README.md).

---

## Shared files

| File | Purpose |
|---|---|
| `robots.txt` | Single root robots file, covers both projects, points to the root sitemap. Must stay at root. |
| `sitemap.xml` | Single root sitemap listing every URL in both projects. |
| `404.html` | Site-wide 404 page, links into both projects. |
| `server.js` | Zero-dependency dev server for the whole repository (clean URLs, gzip, caching). |
| `package.json` | Scripts for the dev server and the affiliate site's build/check steps. |

## Deploying

Deploy the repository root to any static host. Both projects are plain static files.

The affiliate site's canonical URLs and sitemap entries assume `https://affiliateincomelab.com` as the
host with a `/affiliate-marketing` path prefix. If you deploy it elsewhere — or promote it to its own
domain — change the `SITE` and `BASE` constants at the top of `affiliate-marketing/tools/build.py`, then
run `npm run build` and `npm run check`. The `BASE` constant exists precisely so the site can be moved
between a subpath and a domain root without rewriting every link by hand.
