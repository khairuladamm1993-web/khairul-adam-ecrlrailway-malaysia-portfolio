"""Build a static, analytics-isolated preview. Never copies credentials/backend files."""
import pathlib, re, subprocess, sys, json
root=pathlib.Path(__file__).resolve().parents[1]
out=pathlib.Path(sys.argv[1]).resolve(); out.mkdir(parents=True,exist_ok=True)
# Refuse stale output: old quiz/member assets must never survive a rebuild.
if any(out.iterdir()): raise SystemExit('Use a fresh empty output directory.')
files=['index.html','gateway.html','portfolio.html','references.html','PRIVACY.md']+[str(p.relative_to(root)) for p in (root/'assets').iterdir() if p.is_file() and p.name not in {'questions.js','quiz-core.js','gateway.js'}]
for name in files:
    data=(root/name).read_bytes()
    if name.endswith('.html'): data=re.sub(rb'<script\b[^>]*src="assets/analytics\.js"[^>]*>\s*</script>',b'',data)
    if name=='assets/analytics.js': data=b'/* Preview only: analytics submission disabled. */\n'
    dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
(out/'compatibility.html').write_bytes((root/'tests/preview-responsive.html').read_bytes())
(out/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
(out/'_headers').write_text("/*\n  X-Robots-Tag: noindex, nofollow\n  Content-Security-Policy: connect-src 'none'\n")
print('Preview built; analytics removed and connect-src blocked.')

assert not any((out/'assets'/name).exists() for name in ['questions.js','quiz-core.js','gateway.js'])
