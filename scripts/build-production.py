"""Build the production GitHub Pages artifact from the migration source tree.

The repository may retain legacy quiz fixtures for regression/migration history, but the
production artifact must never publish them. Authenticated Member content is fetched at
runtime from Supabase after server-authorized role resolution.
"""
import pathlib, re, shutil, sys

root=pathlib.Path(__file__).resolve().parents[1]
out=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else root/"dist-production").resolve()
out.mkdir(parents=True,exist_ok=True)
if any(out.iterdir()):
    raise SystemExit("Use a fresh empty production output directory.")

root_files=[
    ".nojekyll","index.html","gateway.html","portfolio.html","references.html",
    "PRIVACY.md","robots.txt","sitemap.xml"
]
forbidden_assets={"questions.js","quiz-core.js","gateway.js"}
allowed_asset_suffixes={".js",".css",".jpeg",".jpg",".png",".webp",".svg",".gif",".ico"}

for name in root_files:
    src=root/name
    if not src.exists():
        raise SystemExit(f"Missing required production file: {name}")
    dest=out/name
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dest)

for src in (root/"assets").iterdir():
    if not src.is_file() or src.name in forbidden_assets or src.suffix.lower() not in allowed_asset_suffixes:
        continue
    dest=out/"assets"/src.name
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dest)

# Fail the build if a protected legacy quiz/controller asset can be served directly.
for name in forbidden_assets:
    if (out/"assets"/name).exists():
        raise SystemExit(f"Forbidden production asset present: assets/{name}")

required_assets={
    "access.js","public-gateway.js","member-gateway.js","module-previews.js",
    "analytics.js","gateway.css","theme.js","theme.css","i18n.js","map-intelligence.js","map-gateway.js","corridor-reference.js","owner-map.js"
}
missing=sorted(name for name in required_assets if not (out/"assets"/name).exists())
if missing:
    raise SystemExit("Missing required authenticated/public runtime assets: "+", ".join(missing))

# Guard against accidentally embedding the retained legacy bank in another public file.
protected_markers=(b"window.RailwayModules=",b"df8b_inspection-1",b'"correct":0')
for p in out.rglob("*"):
    if not p.is_file() or p.suffix.lower() not in {".html",".js",".css",".md",".xml",".txt"}:
        continue
    data=p.read_bytes()
    for marker in protected_markers:
        if marker in data:
            raise SystemExit(f"Protected quiz marker found in production artifact: {p.relative_to(out)}")

# Every local HTML script/style/link target must resolve inside the artifact.
attr=re.compile(r'''(?:href|src)=["']([^"'#?]+)''')
for page in out.glob("*.html"):
    text=page.read_text(encoding="utf-8")
    for url in attr.findall(text):
        if re.match(r"^(?:https?:|mailto:|data:|javascript:)",url):
            continue
        target=(page.parent/url).resolve()
        try:
            target.relative_to(out)
        except ValueError:
            raise SystemExit(f"Local reference escapes artifact: {page.name}: {url}")
        if not target.exists():
            raise SystemExit(f"Broken production reference: {page.name}: {url}")

print("Production artifact built safely.")
print("Excluded protected legacy assets: "+", ".join(sorted(forbidden_assets)))
