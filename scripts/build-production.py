"""Build the production GitHub Pages artifact from the migration source tree.

The repository may retain legacy quiz fixtures for regression/migration history, but the
production artifact must never publish them. Authenticated Member content is fetched at
runtime from Supabase after server-authorized role resolution.
"""
import datetime, json, os, pathlib, re, shutil, subprocess, sys

root=pathlib.Path(__file__).resolve().parents[1]
out=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else root/"dist-production").resolve()
out.mkdir(parents=True,exist_ok=True)
if any(out.iterdir()):
    raise SystemExit("Use a fresh empty production output directory.")

root_files=[
    ".nojekyll","index.html","gateway.html","owner-command-center.html","portfolio.html","references.html",
    "PRIVACY.md","robots.txt","sitemap.xml",
    "reading/index.html","reading/library-catalogue.json","reading/railway-fundamentals-01.html","reading/chapter-01-i18n.js"
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

# Owner dashboard registry contains only public-safe project evidence. Never add private data.
registry=root/"data"/"owner-project-registry.json"
if not registry.exists():
    raise SystemExit("Owner Command Center evidence registry missing")
registry_data=json.loads(registry.read_text(encoding="utf-8"))
if registry_data.get("schemaVersion")!="1.0.0" or len(registry_data.get("projects",[]))!=3:
    raise SystemExit("Invalid Owner Command Center evidence registry")
regdest=out/"data"/registry.name
regdest.parent.mkdir(parents=True,exist_ok=True)
shutil.copy2(registry,regdest)

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
    "access.js","public-gateway.js","member-gateway.js","owner-command-center.js","owner-issue-handoff.js","owner-checkpoint-policy.js","owner-center-shortcut.js","owner-two-way-workflow.js","owner-command-center.css","module-previews.js",
    "analytics.js","gateway.css","theme.js","theme.css","i18n.js","map-intelligence.js","map-gateway.js","corridor-reference.js","owner-map.js","owner-map-v01b.js","build-info.js"
}
missing=sorted(name for name in required_assets if not (out/"assets"/name).exists())
if missing:
    raise SystemExit("Missing required authenticated/public runtime assets: "+", ".join(missing))


# Generate non-sensitive build metadata for the Admin-only diagnostic view.
# This intentionally contains no tokens, credentials, user data or analytics payloads.
def git_sha():
    env_sha=os.environ.get("VERCEL_GIT_COMMIT_SHA") or os.environ.get("GITHUB_SHA")
    if env_sha:
        return env_sha
    try:
        return subprocess.check_output(["git","rev-parse","HEAD"],cwd=root,text=True).strip()
    except Exception:
        return None

build_info={
    "application":"MR-S10",
    "version":"Pre-V1.0",
    "environment":os.environ.get("VERCEL_ENV") or ("CI" if os.environ.get("CI") else "LOCAL"),
    "gitSha":git_sha(),
    "deploymentId":os.environ.get("VERCEL_DEPLOYMENT_ID"),
    "deploymentUrl":os.environ.get("VERCEL_URL"),
    "buildTimestamp":datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00","Z"),
    "canonicalHost":"khairul-adam-portfolio-preview-safe.vercel.app"
}
(out/"assets"/"build-info.js").write_text(
    "window.MRS10BuildInfo=Object.freeze("+json.dumps(build_info,separators=(",",":"))+");\n",
    encoding="utf-8"
)

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
for page in out.rglob("*.html"):
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
