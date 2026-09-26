"""Validate the site: JSON-LD, internal links, head tags, a11y basics."""
import os, re, json, sys, html.parser

ROOT = "/home/user/bbbh"
HTML_FILES = []
# `content/` holds build partials (not full pages) and `tools/` holds scripts.
SKIP_DIRS = {".git", "node_modules", "content", "tools", ".devcontainer"}
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for f in filenames:
        if f.endswith(".html"):
            HTML_FILES.append(os.path.join(dirpath, f))

errors, warnings = [], []

def url_to_file(url):
    """Map a site-absolute URL path to a file on disk."""
    p = url.split("#")[0].split("?")[0]
    if not p.startswith("/"):
        return None
    cand = os.path.join(ROOT, p.lstrip("/"))
    if os.path.isfile(cand):
        return cand
    if os.path.isdir(cand) and os.path.isfile(os.path.join(cand, "index.html")):
        return os.path.join(cand, "index.html")
    if os.path.isfile(cand + ".html"):
        return cand + ".html"
    return None

ids_by_file = {}
anchors_by_file = {}

for f in HTML_FILES:
    rel = os.path.relpath(f, ROOT)
    src = open(f, encoding="utf-8").read()
    ids_by_file[rel] = set(re.findall(r'\bid="([^"]+)"', src))
    anchors_by_file.setdefault(rel, set())

# Pass 2: links + structure
for f in HTML_FILES:
    rel = os.path.relpath(f, ROOT)
    src = open(f, encoding="utf-8").read()

    # --- JSON-LD validity ---
    for i, block in enumerate(re.findall(r'<script type="application/ld\+json">(.*?)</script>', src, re.S)):
        try:
            data = json.loads(block)
        except json.JSONDecodeError as e:
            errors.append(f"{rel}: JSON-LD block {i} invalid: {e}")
            continue
        # check every @type present
        def walk(node, path_="$"):
            if isinstance(node, dict):
                if "@type" not in node and "@context" not in node and "@id" not in node:
                    warnings.append(f"{rel}: JSON-LD node {path_} missing @type")
                for k, v in node.items():
                    walk(v, f"{path_}.{k}")
            elif isinstance(node, list):
                for j, v in enumerate(node):
                    walk(v, f"{path_}[{j}]")
        walk(data)

    # --- title / meta ---
    t = re.search(r"<title>(.*?)</title>", src, re.S)
    if not t:
        errors.append(f"{rel}: missing <title>")
    else:
        tl = len(t.group(1))
        if tl > 62: warnings.append(f"{rel}: title {tl} chars (may truncate in SERP)")
        if tl < 20: warnings.append(f"{rel}: title only {tl} chars")
    d = re.search(r'<meta name="description" content="(.*?)">', src, re.S)
    if not d:
        errors.append(f"{rel}: missing meta description")
    else:
        dl = len(d.group(1))
        if dl > 165: warnings.append(f"{rel}: meta description {dl} chars (may truncate)")
        if dl < 70: warnings.append(f"{rel}: meta description only {dl} chars")
    if '<link rel="canonical"' not in src and "noindex" not in src:
        errors.append(f"{rel}: missing canonical")
    h1s = re.findall(r"<h1[^>]*>", src)
    if len(h1s) != 1:
        errors.append(f"{rel}: expected exactly 1 <h1>, found {len(h1s)}")
    if 'lang="' not in src.split(">", 2)[1]:
        errors.append(f"{rel}: missing lang attribute on <html>")
    for img in re.findall(r"<img\b[^>]*>", src):
        if 'alt=' not in img:
            errors.append(f"{rel}: <img> without alt: {img[:90]}")
        if 'width=' not in img or 'height=' not in img:
            warnings.append(f"{rel}: <img> without width/height (CLS risk): {img[:70]}")
    if "viewport" not in src:
        errors.append(f"{rel}: missing viewport meta")

    # --- internal link resolution ---
    for href in re.findall(r'href="([^"]+)"', src):
        if href.startswith(("http:", "https:", "mailto:", "tel:", "//")):
            continue
        if href.startswith("#"):
            if href != "#" and href[1:] not in ids_by_file[rel]:
                errors.append(f"{rel}: anchor #{href[1:]} not found on page")
            continue
        target = url_to_file(href)
        if target is None:
            errors.append(f"{rel}: broken internal link -> {href}")
            continue
        trel = os.path.relpath(target, ROOT)
        frag = href.split("#")[1] if "#" in href else None
        if frag and frag not in ids_by_file.get(trel, set()):
            errors.append(f"{rel}: link {href} -> #{frag} missing in {trel}")

    # --- external link hygiene ---
    for m in re.finditer(r'<a\b[^>]*href="(https?://[^"]+)"[^>]*>', src):
        tag = m.group(0)
        if 'rel=' not in tag:
            warnings.append(f"{rel}: external link without rel: {m.group(1)[:60]}")

    # --- a11y basics ---
    if 'class="skip-link"' not in src:
        warnings.append(f"{rel}: no skip link")

print(f"Scanned {len(HTML_FILES)} HTML files\n")
print(f"ERRORS: {len(errors)}")
for e in errors: print("  ✗", e)
print(f"\nWARNINGS: {len(warnings)}")
for w in warnings[:40]: print("  !", w)
if len(warnings) > 40: print(f"  ... and {len(warnings)-40} more")
sys.exit(1 if errors else 0)
