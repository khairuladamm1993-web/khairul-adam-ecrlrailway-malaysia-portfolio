'use strict';
/* V6 Preview is additive to the audited V5 packager; no private scripts, APIs, or credentials. */
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
cp.execFileSync(process.execPath,[path.join(root,'scripts/build-unified-v5.cjs')],{stdio:'inherit'});
const src=path.join(root,'dist-unified-v5'),out=path.join(root,'dist-unified-v6');
if(fs.existsSync(out))fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(src,out,{recursive:true});
for(const file of ['unified-map-v6.html','assets/unified-v6-map.js',
 'assets/unified-v6/sri-catalogue.js','assets/unified-v6/sri-gis.js',
 'assets/unified-v6/monorail-registry.js','assets/unified-v6/erl-model.js',
 'assets/unified-v6/erl-gis.js','assets/unified-v6/adapter.js']){
 const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(path.join(root,file),dest);
}
const headersPath=path.join(out,'_headers'),before=fs.readFileSync(headersPath,'utf8');
if(!before.includes('https://services5.arcgis.com'))throw Error('V6_CSP_ARCGIS_MISSING');
fs.writeFileSync(headersPath,before.replace('https://services5.arcgis.com',
 'https://services5.arcgis.com https://overpass.kumi.systems'));
for(const denied of ['api','.env','assets/member-gateway.js','assets/questions.js','assets/gateway.js']){
 if(fs.existsSync(path.join(out,denied)))throw Error('V6_PRIVATE_FILE:'+denied);
}
if(!fs.existsSync(path.join(out,'unified-map-v5.html')))throw Error('V5_ROLLBACK_MISSING');
console.log('V6_PUBLIC_ONLY_8_LAYERS_PREVIEW',out);
