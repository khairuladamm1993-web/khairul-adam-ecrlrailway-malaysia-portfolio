"""Build a static, analytics-isolated and auth-isolated public preview."""
import pathlib, re, sys
root=pathlib.Path(__file__).resolve().parents[1]
out=pathlib.Path(sys.argv[1]).resolve(); out.mkdir(parents=True,exist_ok=True)
if any(out.iterdir()): raise SystemExit('Use a fresh empty output directory.')
excluded={'questions.js','quiz-core.js','gateway.js','member-gateway.js','owner-map.js'}
files=['index.html','gateway.html','portfolio.html','references.html','PRIVACY.md']+[str(p.relative_to(root)) for p in (root/'assets').iterdir() if p.is_file() and p.name not in excluded]
for name in files:
    data=(root/name).read_bytes()
    if name.endswith('.html'):
        data=re.sub(rb'<script\b[^>]*src="assets/analytics\.js"[^>]*>\s*</script>',b'',data)
        data=re.sub(rb'<script\b[^>]*src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2\.117\.2"[^>]*>\s*</script>',b'',data)
        data=re.sub(rb'<script\b[^>]*src="assets/member-gateway\.js"[^>]*>\s*</script>',b'',data)
    if name=='assets/analytics.js':
        data=b'/* Preview only: analytics submission disabled. */\n'
    if name=='assets/access.js':
        data=b"(()=>{window.RailwayAccess=Object.freeze({level:'public',status:'preview-public-only',canReadMemberContent:false,canAdmin:false,email:null,error:null,activityConsent:false,snapshot(){return this;},init:async()=>this,refresh:async()=>this});})();\n"
    dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
(out/'compatibility.html').write_bytes((root/'tests/preview-responsive.html').read_bytes())
(out/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
(out/'_headers').write_text("/*\n  X-Robots-Tag: noindex, nofollow\n  Content-Security-Policy: connect-src 'none'\n")
print('Preview built; analytics and member authentication disabled; connect-src blocked.')
assert not any((out/'assets'/name).exists() for name in ['questions.js','quiz-core.js','gateway.js','member-gateway.js'])
