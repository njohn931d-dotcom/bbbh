# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Worth is a static site — all calculations run in your browser. No server-side data processing.

If you find a security issue:

1. **Do NOT open a public issue** for sensitive vulnerabilities
2. Go to https://github.com/njohn931d-dotcom/bbbh/security/advisories/new
3. Or open an issue at https://github.com/njohn931d-dotcom/bbbh/issues for non-sensitive issues

We will respond within 48 hours.

## Scope

- `index.html`, `app.js`, `style.css` — main calculator
- `scripts/generate-seo.mjs`, `scripts/generate-parasite.mjs`, `scripts/articles.mjs` — build pipeline
- `content/articles/*.md` — guide content
- GitHub Pages deployment

## What is NOT in scope

- GitHub Pages infrastructure (report to GitHub)
- Browser localStorage (client-side only)
- Third-party fonts (Google Fonts)

## Privacy

- No tracking, no cookies, no analytics
- Calculator inputs stay in browser
- Saved thoughts in localStorage only
- Share links include values in URL fragment (user-controlled)
