'use strict';
// Only builds an isolated preview candidate; Production deployment/pipeline is unchanged.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {runInNewContext}=require('node:vm');
const mapCore=require('../assets/p01-map-core.js');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.argv[2]||'dist-p01-map-candidate');
if(fs.existsSync(out))throw Error('OUTPUT_MUST_BE_FRESH');
cp.execFileSync('python3',[path.join(root,'scripts/build-production.py'),out],{cwd:root,stdio:'inherit'});
const rootPages=['unified-map-v7.html','unified-map-v8.html','ecrl-asset-reference.html','openmr-privacy.html'];
const assets=['assets/unified-v5.css','assets/unified-v7-map.js','assets/unified-v8-map.js','assets/railway-track-registry-kl.js','assets/mrs10-r219-ampang-service.js','assets/mrs10-r219-ampang-gis.js','assets/unified-v4-registry.js'];
const assetDirs=['assets/unified-v6','assets/unified-v7','assets/unified-v8','assets/unified-v81','assets/unified-ecrl','assets/consumer-foundation','assets/unified-complete','assets/openmr'];
const dataDirs=['data/openmr-r3','data/unified-v8','data/unified-v81-integration','singapore/data'];
const dataFiles=['data/ecrl-reference-alignment.geojson','data/unified-complete/borneo-registry.json','data/unified-complete/shuttle-audit.json','data/unified-complete/china-references.json'];
const allowedStatic=/\.(?:js|css|json|geojson|png|svg)$/i;
const copy=file=>{
 const src=path.join(root,file),dest=path.join(out,file);
 if(!fs.statSync(src).isFile())throw Error('NOT_A_FILE:'+file);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(src,dest);
};
for(const file of [...rootPages,...assets,...dataFiles,'map-language-lab.html'])copy(file);
for(const dir of [...assetDirs,...dataDirs]){
 const walk=sub=>{
  for(const entry of fs.readdirSync(path.join(root,sub),{withFileTypes:true})){
   const item=path.posix.join(sub,entry.name);
   if(entry.isDirectory()){walk(item);continue;}
   if(!entry.isFile()||!allowedStatic.test(entry.name))continue;
   if(/(?:^|\/)(?:accepted-auth-lock|secret|credentials|token)(?:\.|\/)/i.test(item))throw Error('UNSAFE_FILE:'+item);
   copy(item);
  }
 };
 walk(dir);
}
for(const denied of ['api','supabase','server','assets/questions.js','assets/quiz-core.js','assets/gateway.js','data/unified-complete/accepted-auth-lock.json']){
 if(fs.existsSync(path.join(out,denied)))throw Error('PRIVATE_FILE:'+denied);
}
for(const page of ['gateway.html','map-language-lab.html','ampang-line-r219.html',...rootPages]){
 const html=fs.readFileSync(path.join(out,page),'utf8');
 for(const match of html.matchAll(/(?:src|href)="([^"#?]+)"/g)){
  const loc=match[1];if(/^(?:https?:|data:|mailto:)/i.test(loc))continue;
  const target=path.resolve(out,loc);
  if(!target.startsWith(out+path.sep)||!fs.existsSync(target))throw Error('BROKEN_MAP_REFERENCE:'+page+':'+loc);
 }
}
for(const file of ['data/openmr-r3/intelligence.json','data/unified-v8/physical-network.json','data/unified-complete/borneo-registry.json']){
 if(!fs.existsSync(path.join(out,file)))throw Error('MAP_RUNTIME_DATA_MISSING:'+file);
}
// Build the Public identity projection from the same contract used by V8.
const ecrl={
 MRS10UnifiedECRL:require('../assets/unified-ecrl/adapter.js'),
 MRS10ECRLMasterIntelligence:require('../assets/unified-ecrl/master-intelligence.js'),
 MRS10RailwayDataContractV1:require('../assets/unified-ecrl/railway-data-contract-v1.js')
};
for(const file of ['data.js','i18n.js']){
 const source=path.join(root,'assets/unified-ecrl/source',file);
 runInNewContext(fs.readFileSync(source,'utf8'),{window:ecrl},{filename:source,timeout:3000});
}
const {dataContract,adapter}=mapCore.createEcrlContext(ecrl);
const records=mapCore.publicAssetIdentity(dataContract,adapter);
for(const {assetId,type,code,name,section} of records){
 if(!/^ecrl-[a-z0-9-]+$/.test(assetId)||!['STN','PL','DEPOT','YARD','PORT'].includes(type)||
  (code!==null&&!/^(STN|PL)\d{2}$/.test(code))||typeof name!=='string'||typeof section!=='string')
  throw Error('P01_PUBLIC_ECRL_INVALID_IDENTITY');
}
fs.writeFileSync(path.join(out,'data/ecrl-public-identity-v1.json'),
 JSON.stringify({version:dataContract.version,corridor:dataContract.corridor,records},null,2)+'\n');
console.log('P01_MAP_CANDIDATE_ARTIFACT_PASS',out);
