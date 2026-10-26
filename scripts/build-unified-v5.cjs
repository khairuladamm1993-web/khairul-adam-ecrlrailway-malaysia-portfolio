'use strict';
// V5 public-only package composed from audited V4 public-only package.
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
cp.execFileSync(process.execPath,[path.join(root,'scripts/build-unified-v4.cjs')],{stdio:'inherit'});
const src=path.join(root,'dist-unified-v4'),out=path.join(root,'dist-unified-v5');
if(fs.existsSync(out))fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(src,out,{recursive:true});
for(const file of ['unified-map-v5.html','assets/unified-v5-map.js','assets/unified-v5.css']){
 const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest);
}
for(const deny of ['.env','api','assets/member-gateway.js','assets/gateway.js','assets/questions.js']){
 if(fs.existsSync(path.join(out,deny)))throw Error('V5_PRIVATE_PREVIEW_ASSET:'+deny);
}
for(const must of ['assets/unified-v5-map.js','assets/unified-v4-registry.js','assets/railway-track-registry-kl.js','unified-map-v5.html']){
 if(!fs.existsSync(path.join(out,must)))throw Error('V5_MISSING_ASSET:'+must);
}
const policy=fs.readFileSync(path.join(out,'_headers'),'utf8');
if(!policy.includes('services5.arcgis.com')||!policy.includes("frame-ancestors 'none'"))throw Error('V5_CSP_INVALID');
console.log('V5_PUBLIC_ONLY_SAFE_BUILD',out);
