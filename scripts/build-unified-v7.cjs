'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
cp.execFileSync(process.execPath,[path.join(root,'scripts/build-unified-v6.cjs')],{stdio:'inherit'});
const out=path.join(root,'dist-unified-v7');
if(fs.existsSync(out))fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(path.join(root,'dist-unified-v6'),out,{recursive:true});
for(const p of ['unified-map-v7.html','assets/unified-v7-map.js',
'assets/unified-v7/ktm-dataset.js','assets/unified-v7/ktm-adapter.js']){
 const dest=path.join(out,p);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(path.join(root,p),dest);
}
for(const denied of ['api','.env','assets/member-gateway.js','assets/questions.js','assets/gateway.js']){
 if(fs.existsSync(path.join(out,denied)))throw Error('V7_PRIVATE_ASSET:'+denied);
}
const html=fs.readFileSync(path.join(out,'unified-map-v7.html'),'utf8');
const js=fs.readFileSync(path.join(out,'assets/unified-v7/ktm-dataset.js'),'utf8');
if(!html.includes('Shuttle Timur dikecualikan')||
  js.includes('ktmb-shuttle-timuran')||!js.includes('KTMB_OFFICIAL_GTFS_PUBLIC_SNAPSHOT'))
 throw Error('V7_SHUTTLE_TIMUR_POLICY_FAILED');
if(!fs.existsSync(path.join(out,'unified-map-v6.html')))throw Error('V6_ROLLBACK_LOST');
console.log('V7_NO_SHUTTLE_TIMUR_PUBLIC_ONLY',out);
