'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),root=path.resolve(__dirname,'..');
cp.execFileSync(process.execPath,[path.join(root,'scripts/build-unified-v7.cjs')],{stdio:'inherit'});
const out=path.join(root,'dist-unified-v7-live');
if(fs.existsSync(out))fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(path.join(root,'dist-unified-v7'),out,{recursive:true});
for(const p of ['unified-map-v7-live-lab.html','assets/unified-v7-live-map.js','assets/rail-live-source-gate.js','api/ktmb-public-telemetry.mjs']){
 const dest=path.join(out,p);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(path.join(root,p),dest);
}
if(!fs.existsSync(path.join(out,'unified-map-v7.html')))throw Error('V7_ROLLBACK_MISSING');
const src=fs.readFileSync(path.join(out,'api/ktmb-public-telemetry.mjs'),'utf8');
if(!src.includes('NOT_PUBLISHED')||!src.includes('api.data.gov.my'))throw Error('LIVE_SOURCE_GATE_MISSING');
console.log('ISOLATED_LIVE_GTFRT_SOURCE_GATE_READY');
