'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const sandbox={window:{}};vm.createContext(sandbox);
vm.runInContext(file('assets/ecrl-gis-v1/data.js'),sandbox);
vm.runInContext(file('assets/ecrl-gis-v1/i18n.js'),sandbox);
const D=sandbox.window.MRS10ECRLGISV1,I=sandbox.window.MRS10ECRLI18N;
test('A/B/C1/C2 register precisely 20 official station identities',()=>{
 assert.equal(D.stations.length,20);assert.deepEqual([...D.stations.reduce((m,a)=>(m.set(a.section,(m.get(a.section)||0)+1),m),new Map())].map(x=>Array.from(x)),[['A',6],['B',8],['C1',2],['C2',4]]);
});
test('C2 station order and passenger/freight/future distinction',()=>{
 assert.deepEqual(Array.from(D.stations.filter(a=>a.section==='C2').map(a=>a.officialName)),
 ['Serendah Baru','Puncak Alam','Kapar','Jalan Kastam (Port Klang)']);
 assert.equal(D.stations[17].serviceType,'UNKNOWN');assert.equal(D.stations[17].verificationStatus,'SOURCE_CONFLICT');
 assert.equal(D.stations[18].serviceType,'FUTURE_PASSENGER');
 assert.equal(D.stations[16].serviceType,'PASSENGER_FREIGHT');
 assert.equal(D.stations[19].serviceType,'UNKNOWN');assert.equal(D.stations[19].verificationStatus,'SOURCE_CONFLICT');
});
test('Source conflict reason retained for Puncak Alam and Jalan Kastam',()=>{
 assert.equal(D.stations[17].conflicts.length,1);assert.equal(D.stations[19].conflicts.length,1);
 assert.ok(D.sources.MRL24.url.endsWith('/Slides-MRL.pdf'));
});
test('All records have stable unique IDs and grounded sources',()=>{
 const assets=[...D.stations,...D.loops,...D.facilities];
 assert.equal(new Set(assets.map(a=>a.assetId)).size,assets.length);
 for(const a of assets)for(const s of a.sourceIds)assert.ok(D.sources[s]?.url.startsWith('https://'),a.assetId+' '+s);
});
test('Seven historical PL labels are not promoted into verified physical passing loops',()=>{
 assert.equal(D.loops.length,7);
 for(const a of D.loops){assert.equal(a.verificationStatus,'PENDING_VALIDATION');assert.equal(a.point,null);assert.equal(a.officialName,null);}
});
test('C2 remains coordinate-less until independent GIS evidence',()=>{
 for(const a of D.stations.filter(a=>a.section==='C2')){assert.equal(a.point,null);assert.equal(a.geometryType,'NONE');assert.equal(a.chainageStartKm,null);}
});
test('Historical map points are localities, never surveyed railway asset coordinates',()=>{
 for(const a of D.stations.filter(a=>a.point)){const [lon,lat]=a.point;
 assert.ok(lon>=99&&lon<=105&&lat>=1&&lat<=8);
 assert.equal(a.geometryProvenance,'LEGACY_PUBLIC_LOCALITY_REFERENCE');
 assert.equal(a.geometryAccuracy,'NOT_ASSET_SURVEY');
 }
});
test('C2 proposed yard remains non-operating',()=>{
 const yard=D.facilities.find(a=>a.assetId==='ecrl-yard-puncak-alam');
 assert.equal(yard.assetStatus,'PROPOSED_OFFICIAL');assert.equal(yard.point,null);
 assert.ok(yard.sourceIds.includes('C2_25'));
});
test('Northport and Westports are freight interfaces with no invented geometry',()=>{
 for(const x of ['northport','westports']){const p=D.facilities.find(a=>a.assetId==='ecrl-port-'+x);assert.ok(p);assert.equal(p.point,null);}
});
test('C2 topology relations are metadata, not geometry',()=>{
 const ids=new Set([...D.stations,...D.facilities,...D.loops].map(a=>a.assetId));
 assert.equal(D.topology.length,7);
 for(const link of D.topology){assert.ok(ids.has(link.from));assert.ok(ids.has(link.to));assert.ok(['PLANNED_CONNECTION','FREIGHT_INTERFACE'].includes(link.relation));}
});
test('No fabricated LineString and no unsourced permitted/station/TSR speed',()=>{
 assert.equal(D.segments.length,1);
 for(const s of D.segments){assert.equal(s.geometry,null);assert.equal(s.maximumPermittedSpeedKmh,null);assert.equal(s.stationApproachSpeedKmh,null);assert.equal(s.stationThroughSpeedKmh,null);assert.equal(s.tsr,null);}
 for(const station of D.stations){assert.equal(station.speed.approachKmh,null);assert.equal(station.speed.throughKmh,null);assert.equal(station.speed.tsr,null);}
 assert.equal(D.schemeSpeedReference.scope,'PROJECT_LEVEL_ONLY');
});
test('All four languages contain identical complete UI keysets',()=>{
 const locales=['ms','en','zh','th'];
 const base=Object.keys(I.ms).sort();
 for(const lang of locales){
  assert.deepEqual(Object.keys(I[lang]).sort(),base);
  for(const [key,value] of Object.entries(I[lang]))assert.ok(typeof value==='string'&&value.trim(),lang+'/'+key);
 }
});
test('Multilingual buttons and persistent UX use the isolated MapLibre viewer',()=>{
 const html=file('ecrl-gis-v1.html'),js=file('assets/ecrl-gis-v1/app.js');
 for(const lang of ['ms','en','zh','th'])assert.match(html,new RegExp('data-lang="'+lang+'"'));
 assert.match(js,/state\.selectedId=id/);
 assert.match(js,/state\.lang=b\.dataset\.lang;translate\(\);renderMarkers\(\)/);
 assert.doesNotMatch(js,/setStyle\s*\(/);
 assert.doesNotMatch(js,/ML\.supported\s*\(/);
 assert.match(js,/getSource\(sourceName\)/);
 assert.match(html,/tiles\.openfreemap\.org|assets\/ecrl-gis-v1\/app\.js/);
});
test('Square crossing loop SVG/CSS semantics and 44px hit targets are defined',()=>{
 const css=file('assets/ecrl-gis-v1/styles.css');
 assert.match(css,/\.loop-demo\{border-radius:3px/);
 assert.match(css,/\.ecrl-pin\{width:44px;height:44px/);
 assert.match(css,/data-shape="loop"/);
});
test('No legacy/Unified/production content is directly modified',()=>{
 const html=file('ecrl-gis-v1.html');assert.match(html,/ISOLATED/);
 assert.doesNotMatch(html,/supabase\.co/);
});
