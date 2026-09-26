#!/usr/bin/env bash
# =============================================================================
# RevenueKit — raster asset builder
# -----------------------------------------------------------------------------
# The repo ships pre-rendered PNGs so it deploys with ZERO build step
# (GitHub Pages / Netlify / Cloudflare / S3 all work as-is).
# Re-run this only when you change brand copy, colors or OG headlines.
#
#   Requires: ImageMagick 6.9+ (convert), DejaVu fonts
#   Usage:    bash scripts/build-assets.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/assets/img"
mkdir -p "$OUT"

FONT_BOLD="DejaVu-Sans-Bold"
FONT_REG="DejaVu-Sans"

W=1200; H=630

# Brand palette (keep in sync with assets/css/main.css)
C_TOP="#5b4bff"
C_BOT="#080d1c"
C_MINT="#31d3ab"
C_TEXT="#ffffff"
C_SUB="#c6cde3"
C_URL="#8f9ab8"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> Building OG images (1200x630) + favicons into assets/img/"

# ---------------------------------------------------------------------------
# Layered background: vertical gradient + two soft radial glows + dot texture
# ---------------------------------------------------------------------------
build_bg() {
  convert -size ${W}x${H} gradient:"$C_TOP"-"$C_BOT" "$TMP/base.png"

  convert -size 900x900 radial-gradient:"#ffffff"-"#ffffff00" "$TMP/glowA.png"
  convert -size 820x820 radial-gradient:"$C_MINT"-"${C_MINT}00" "$TMP/glowB.png"

  # Subtle dot grid, drawn explicitly (IM6's `tile:` operator drops the alpha
  # channel, which would paint an opaque black layer over the artwork).
  local dots=""
  local x y
  for ((y = 13; y < H; y += 26)); do
    for ((x = 13; x < W; x += 26)); do
      dots+="circle ${x},${y} ${x},$((y - 1)) "
    done
  done

  convert "$TMP/base.png" \
    \( "$TMP/glowA.png" -alpha set -channel A -evaluate multiply 0.34 +channel \) \
      -geometry +40-260 -compose screen -composite \
    \( "$TMP/glowB.png" -alpha set -channel A -evaluate multiply 0.30 +channel \) \
      -geometry +520+250 -compose screen -composite \
    \( -size ${W}x${H} xc:none -fill "#ffffff1f" -draw "$dots" \) \
      -compose over -composite \
    "$TMP/bg.png"
}

# ---------------------------------------------------------------------------
# Brand mark: rounded translucent tile + three ascending bars
# ---------------------------------------------------------------------------
build_mark() {
  local size=${1:-74}
  convert -size ${size}x${size} xc:none \
    -fill "#ffffff26" -stroke "#ffffff55" -strokewidth 2 \
    -draw "roundrectangle 1,1 $((size-2)),$((size-2)) 18,18" \
    -stroke none -fill "$C_TEXT" \
    -draw "roundrectangle $((size*19/100)),$((size*56/100)) $((size*31/100)),$((size*78/100)) 4,4" \
    -draw "roundrectangle $((size*42/100)),$((size*38/100)) $((size*54/100)),$((size*78/100)) 4,4" \
    -draw "roundrectangle $((size*65/100)),$((size*20/100)) $((size*77/100)),$((size*78/100)) 4,4" \
    "$TMP/mark.png"
}

# ---------------------------------------------------------------------------
# make_og <outfile> <eyebrow> <headline-line1> <headline-line2> <subline>
# ---------------------------------------------------------------------------
make_og() {
  local file="$1" eyebrow="$2" l1="$3" l2="$4" sub="$5"

  build_bg
  build_mark 74

  convert "$TMP/bg.png" \
    "$TMP/mark.png" -geometry +76+66 -composite \
    -font "$FONT_BOLD" -fill "$C_TEXT" -pointsize 30 -annotate +172+112 "RevenueKit" \
    -font "$FONT_REG"  -fill "$C_SUB"  -pointsize 16 -annotate +172+140 "SOFTWARE  ·  SCRIPTS  ·  SAAS TOOLS" \
    -font "$FONT_BOLD" -fill "$C_MINT" -pointsize 21 -annotate +78+252 "$eyebrow" \
    -font "$FONT_BOLD" -fill "$C_TEXT" -pointsize 62 -annotate +76+322 "$l1" \
    -font "$FONT_BOLD" -fill "$C_TEXT" -pointsize 62 -annotate +76+398 "$l2" \
    -font "$FONT_REG"  -fill "$C_SUB"  -pointsize 25 -annotate +78+470 "$sub" \
    -stroke "#ffffff33" -strokewidth 2 -draw "line 76,536 1124,536" -stroke none \
    -font "$FONT_REG"  -fill "$C_URL"  -pointsize 19 -annotate +78+576 "revenuekit.dev" \
    -font "$FONT_BOLD" -fill "$C_URL"  -pointsize 19 -annotate +900+576 "UPDATED 2026" \
    "$OUT/$file"

  # Twitter/LinkedIn also like a 1:1 crop for small previews — not required, skipped.
  echo "    ✓ $file"
}

make_og "og-home.png" \
  "DIGITAL PRODUCTS THAT PAY YOU BACK" \
  "Sell software." \
  "Stack income." \
  "Scripts, plugins and micro-SaaS kits — built to be sold."

make_og "og-ways-to-generate-income.png" \
  "THE COMPLETE 2026 GUIDE  ·  21 METHODS RANKED" \
  "Ways to Generate" \
  "Income Online" \
  "Startup cost, time to first dollar and realistic earnings — compared."

make_og "og-sell-digital-products.png" \
  "STEP-BY-STEP  ·  9 STAGES" \
  "How to Sell" \
  "Digital Products" \
  "From niche research to automated delivery and repeat revenue."

make_og "og-passive-income-ideas.png" \
  "14 IDEAS  ·  RANKED BY REALITY" \
  "Passive Income" \
  "Ideas That Work" \
  "What is actually passive — and what is just unpaid overtime."

make_og "og-micro-saas-ideas.png" \
  "23 IDEAS  ·  VALIDATION PLAYBOOK" \
  "Micro-SaaS Ideas" \
  "Worth Building" \
  "Narrow problems, professional buyers, \$19–\$99 per month."

make_og "og-digital-product-pricing.png" \
  "PRICING FRAMEWORK  ·  BENCHMARKS INSIDE" \
  "How to Price" \
  "Digital Products" \
  "Value-based tiers, price tests and the psychology that lifts AOV."

# ---------------------------------------------------------------------------
# Favicons / PWA icons from the same mark
# ---------------------------------------------------------------------------
build_icon() {
  local size="$1" out="$2"
  local r=$(( size * 22 / 100 ))
  local br=$(( size * 4 / 100 )); [ "$br" -lt 1 ] && br=1

  # rounded gradient tile = gradient with the roundrect's alpha copied in
  convert -size ${size}x${size} gradient:"$C_TOP"-"$C_MINT" \
    \( -size ${size}x${size} xc:none -fill "#fff" \
       -draw "roundrectangle 0,0 $((size-1)),$((size-1)) $r,$r" \) \
    -alpha set -compose CopyOpacity -composite "$TMP/icon-bg.png"

  convert "$TMP/icon-bg.png" -fill "#ffffff" \
    -draw "roundrectangle $((size*19/100)),$((size*56/100)) $((size*31/100)),$((size*78/100)) $br,$br" \
    -draw "roundrectangle $((size*42/100)),$((size*38/100)) $((size*54/100)),$((size*78/100)) $br,$br" \
    -draw "roundrectangle $((size*65/100)),$((size*20/100)) $((size*77/100)),$((size*78/100)) $br,$br" \
    "$OUT/$out"
  echo "    ✓ $out"
}

build_icon 180 "apple-touch-icon.png"
build_icon 192 "icon-192.png"
build_icon 512 "icon-512.png"

convert "$OUT/icon-512.png" -resize 32x32 "$OUT/favicon-32.png"
convert "$OUT/icon-512.png" -resize 16x16 "$OUT/favicon-16.png"
echo "    ✓ favicon-32.png / favicon-16.png"

# Multi-size .ico for legacy browsers / crawlers that still request it
convert "$OUT/icon-512.png" -define icon:auto-resize=48,32,16 "$OUT/favicon.ico" 2>/dev/null \
  && echo "    ✓ favicon.ico" \
  || echo "    ! favicon.ico skipped (ico delegate unavailable) — PNG favicons are enough"

echo "==> Done. Files:"
ls -1 "$OUT" | sed 's/^/    /'
