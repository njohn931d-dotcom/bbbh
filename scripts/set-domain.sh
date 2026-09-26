#!/usr/bin/env bash
# =============================================================================
# Retarget the site to a new origin / base path, then rebuild.
#
#   bash scripts/set-domain.sh https://revenuekit.dev ""
#   bash scripts/set-domain.sh https://example.github.io "/bbbh"
#
# Rewrites SITE.origin and SITE.base in scripts/pages.js (single source of
# truth for canonicals, OG URLs, sitemap and JSON-LD), regenerates the site,
# then re-runs the audit. Commit the result.
# =============================================================================
set -euo pipefail

ORIGIN="${1:?usage: set-domain.sh <origin e.g. https://revenuekit.dev> [basePath e.g. /bbbh or \"\"]}"
BASE="${2-}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAGES="$ROOT/scripts/pages.js"

node -e '
const fs = require("fs");
const [file, origin, base] = process.argv.slice(1);
let s = fs.readFileSync(file, "utf8");
s = s.replace(/origin: "[^"]*",/, `origin: "${origin}",`);
s = s.replace(/base: "[^"]*",/, `base: "${base}",`);
fs.writeFileSync(file, s);
console.log("pages.js → origin:", origin, "| base:", JSON.stringify(base));
' "$PAGES" "$ORIGIN" "$BASE"

node "$ROOT/scripts/build-site.js"
node "$ROOT/scripts/seo-audit.js"
echo "Done. Review with: git diff -- scripts/pages.js && git status --short"
