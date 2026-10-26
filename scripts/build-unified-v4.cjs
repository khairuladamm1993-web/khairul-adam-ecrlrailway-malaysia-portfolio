'use strict';
/* Isolated V4 public preview — preserve the existing public-only packager. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist-unified-v4');
if(fs.existsSync(out))fs.rmSync(out,{recursive:true,force:true});
cp.execFileSync('python3',[path.join(root,'scripts/build-preview.py'),out],{stdio:'inherit'});
for(const f of ['unified-map-v4.html','assets/unified-v4-registry.js','assets/unified-v4-map.js','assets/unified-v4.css']){
 const dest=path.join(out,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,f),dest);
}
const headers=[
 '/*',
 '  X-Robots-Tag: noindex, nofollow',
 '  X-Content-Type-Options: nosniff',
 '  Referrer-Policy: strict-origin-when-cross-origin',
 "  Content-Security-Policy: default-src 'none'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; font-src 'self' data: https://tiles.openfreemap.org; img-src 'self' data: blob: https://tiles.openfreemap.org https://tiles.openrailwaymap.org; connect-src 'self' https://tiles.openfreemap.org https://tiles.openrailwaymap.org https://services5.arcgis.com https://unpkg.com; worker-src blob:",
 ''
].join('\n');
fs.writeFileSync(path.join(out,'_headers'),headers);
for(const p of ['.env','assets/questions.js','assets/quiz-core.js','assets/member-gateway.js','assets/gateway.js','api'])
 if(fs.existsSync(path.join(out,p)))throw new Error('PRIVATE_ASSET_IN_PREVIEW:'+p);
for(const p of ['unified-map-v4.html','assets/unified-v4-map.js','assets/railway-track-registry-kl.js','assets/mrs10-r219-ampang-gis.js'])
 if(!fs.existsSync(path.join(out,p)))throw new Error('MISSING_PREVIEW_ASSET:'+p);
console.log('UNIFIED_V4_PUBLIC_PREVIEW_READY');
