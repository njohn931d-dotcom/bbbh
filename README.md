# bbbh

A Forge control-plane VM host repository that currently hosts **four independent projects**.
They share a domain but nothing else — separate stylesheets, scripts, build steps and dependency
trees. None of them import from another.

| Project | Lives at | Stack | What it is |
|---|---|---|---|
| **Worth** | `/` | Vite + vanilla JS | Money calculators and practical guides. The default root application. |
| **HOOKED** | `/hooked/` | Next.js 15 + React | Traffic-engine / content generation app. |
| **Affiliate Income Lab** | `/affiliate-marketing/` | Static HTML/CSS/JS | A 13-page SEO content site about earning money with affiliate marketing. |
| **Forge Workspace** | `/workspace-service/` | Static HTML/CSS/JS | Landing page for selling remote-workspace setup services. See [INCOME_PLAYBOOK.md](workspace-service/INCOME_PLAYBOOK.md). |

Shared files at the repository root: `robots.txt`, `sitemap.xml`, `404.html`, `server.js`,
`package.json`, `.gitignore`.

---

## Worth (root)

Responsive static money calculators and practical guides: purchase-to-work-hours calculator,
subscription annualization, daily savings, browser-local saved thoughts, shareable inputs.

```sh
npm install
npm run dev       # http://localhost:5173
npm test
npm run build
```

Development serves on port 5173. Default builds are **noindex** and robots-disallowed — do not deploy
them as the public production site. Use `npm run build:production` for that.

## HOOKED (`/hooked/`)

A separate Next.js application with its own README, SEO audit, assets and dependency lockfile.

```sh
npm --prefix hooked ci
npm run dev:hooked     # port 3000
npm run build:hooked
```

Its original documentation and marketing/SEO claims are preserved as received, not independently
verified. Review its production configuration and dependency security before deploying.

## Affiliate Income Lab (`/affiliate-marketing/`)

An SEO-optimised affiliate marketing content site: a landing page with an interactive income
calculator, eight keyword-targeted long-form guides, a hub page, program comparisons and full SEO
infrastructure. Plain HTML, CSS and vanilla JavaScript — no build step required to deploy.

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
disclosure and privacy policy) and a site-wide `404.html`.

```sh
npm run affiliate:build   # regenerate pages, sync nav/footer, rebuild sitemap + feed
npm run affiliate:check   # validate SEO, JSON-LD, internal links, a11y basics
```

`affiliate-marketing/tools/build.py` is zero-dependency. It wraps article bodies from
`affiliate-marketing/content/*.html` in the shared head/header/footer, syncs the navigation and footer
into every page from a single definition, and regenerates the root `sitemap.xml` and
`affiliate-marketing/rss.xml`. It is **prefix-aware**: the `SITE` and `BASE` constants control every
generated URL, so the site can move between a subpath and a domain root without editing links by hand.
Full details: [affiliate-marketing/README.md](affiliate-marketing/README.md).

## Forge Workspace (`/workspace-service/`)

A static landing page for the workspace setup service described in
[INCOME_PLAYBOOK.md](workspace-service/INCOME_PLAYBOOK.md). All asset references are relative, so the
page must be served from its own directory.

```sh
python3 -m http.server 4173 --bind 0.0.0.0   # then open /workspace-service/
```

Before publishing, set a real `contactEmail` in `workspace-service/site-config.js`. In demo mode the
inquiry form only copies the request to the visitor's clipboard; it does not send or store leads. The
page does not take payments. Agree on a paid pilot and invoice/payment terms directly with a customer
before beginning work.

### Security

The devcontainer is demo-only: it exposes a writable shell and GUI on public ports and includes a
static demo GUI password. Do not use it to host customer workspaces or data as-is. The income playbook
describes the security work needed before offering anything to customers.

---

## Shared files

| File | Purpose |
|---|---|
| `robots.txt` | One root robots file covering all projects, pointing at the root sitemap. Must stay at the domain root. |
| `sitemap.xml` | Root sitemap. Written by the affiliate builder; currently lists the affiliate pages plus the workspace landing page. |
| `404.html` | Site-wide 404 page, linking into the projects. |
| `server.js` | Zero-dependency static dev server for the whole repository (clean URLs, gzip, caching). |
| `package.json` | Scripts for all four projects, namespaced. |

### Previewing the static projects together

```sh
npm run serve:static    # http://localhost:3000
```

Serves the repository root so you can browse Worth at `/`, Affiliate Income Lab at
`/affiliate-marketing/` and Forge Workspace at `/workspace-service/`. This is a convenience server for
the static projects only — it does not run Vite or Next.js. Use `npm run dev` and
`npm run dev:hooked` for those.

## Deploying

Each project deploys independently. Worth and HOOKED have their own build pipelines
(`npm run build`, `npm run build:hooked`). Affiliate Income Lab and Forge Workspace are plain static
files requiring no build step.

The affiliate site's canonical URLs assume `https://affiliateincomelab.com` with a
`/affiliate-marketing` path prefix. If you deploy it elsewhere — or promote it to its own domain —
change the `SITE` and `BASE` constants at the top of `affiliate-marketing/tools/build.py` and rebuild.
