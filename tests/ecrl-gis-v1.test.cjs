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
test('MOT-approved Section D is separate standard-gauge and metre-gauge tracks without fake geometry',()=>{
 const sectionD=D.segments.find(s=>s.section==='D');
 assert.equal(sectionD.schemeLengthKm,25);
 assert.equal(sectionD.geometry,null);
 assert.equal(sectionD.trackArrangement,'SEPARATE_PARALLEL_STANDARD_AND_METRE_GAUGE');
 assert.equal(sectionD.ktmbMetreGaugeMm,1000);
 assert.equal(sectionD.olderProposal,'SINGLE_DUAL_GAUGE_SUPERSEDED');
 for(const id of ['ecrl-port-northport','ecrl-port-westports']){
   const p=D.facilities.find(a=>a.assetId===id);assert.equal(p.section,'D');assert.ok(p.sourceIds.includes('MOT_D25'));
 }
});
test('No fabricated LineString and no unsourced permitted/station/TSR speed',()=>{
 assert.equal(D.segments.length,2);
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
 assert.match(js,/setStyle\s*\(/);
 assert.match(js,/basemapStyles\[state\.basemap\]/);
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

test('C2 historic EIA site proposal coordinates come from 2017 Table 1-2, not current station GIS',()=>{
 const coords=[['ecrl-stn-17',101+35/60+19.36/3600,3+21/60+51.93/3600],['ecrl-stn-18',101+24/60+42.42/3600,3+14/60+55.31/3600],['ecrl-stn-19',101+23/60+39.86/3600,3+7/60+30/3600],['ecrl-stn-20',101+24/60+11.85/3600,3+55.16/3600]];
 for(const [id,lon,lat] of coords){const a=D.stations.find(x=>x.assetId===id);assert.equal(a.point,null);assert.equal(a.geometryType,'NONE');assert.equal(a.referenceKind,'HISTORICAL_EIA2017_PROPOSED_STATION');assert.equal(a.referenceSourceId,'EIA17');assert.ok(Math.abs(a.referencePoint[0]-lon)<1e-8);assert.ok(Math.abs(a.referencePoint[1]-lat)<1e-8);}
});
test('Both port maritime reference coordinates preserve null ECRL railway point',()=>{
 const ports=[['ecrl-port-northport',101+22/60,3+1/60],['ecrl-port-westports',101+18.5/60,2+57/60]];
 for(const [id,lon,lat] of ports){const a=D.facilities.find(x=>x.assetId===id);assert.equal(a.point,null);assert.equal(a.referenceKind,'PORT_FACILITY_AREA_PKA22');assert.equal(a.referenceSourceId,'PKA22');assert.ok(Math.abs(a.referencePoint[0]-lon)<1e-8);assert.ok(Math.abs(a.referencePoint[1]-lat)<1e-8);assert.ok(a.sourceIds.includes('DOE_D26'));}
});
test('Proposed freight yard uses a Puncak Alam area-focus proxy, no invented yard coordinates',()=>{
 const y=D.facilities.find(x=>x.assetId==='ecrl-yard-puncak-alam');
 assert.equal(y.point,null);assert.equal(y.referencePoint,undefined);assert.equal(y.focusReferenceAssetId,'ecrl-stn-18');
});
test('Four languages provide EIA and PKA non-survey warnings and a distinct marker legend',()=>{
 for(const lang of ['ms','en','zh','th'])for(const k of ['historicRef','portArea','proxyArea','legendHistoric','legendPort','referenceWarning','portReferenceWarning','yardFocusWarning','referenceBadge'])assert.ok(I[lang][k]);
 const html=file('ecrl-gis-v1.html'),css=file('assets/ecrl-gis-v1/styles.css'),app=file('assets/ecrl-gis-v1/app.js');
 for(const x of ['legend-historic','legend-port'])assert.ok(html.includes(x));
 for(const shape of ['historical-reference','port-reference'])assert.ok(css.includes('data-shape="'+shape+'"'));
 assert.match(app,/const geoPoint=a=>a\?\.point\|\|a\?\.referencePoint\|\|null/);
 assert.match(app,/const focusPoint=a=>/);
});

test('Quiet OpenFreeMap Positron replaces high-contrast roads by default with reversible Liberty choice',()=>{
 const js=file('assets/ecrl-gis-v1/app.js'),html=file('ecrl-gis-v1.html'),css=file('assets/ecrl-gis-v1/styles.css');
 assert.match(js,/basemap:'quiet'/);
 assert.match(js,/quiet:'https:\/\/tiles\.openfreemap\.org\/styles\/positron'/);
 assert.match(js,/standard:'https:\/\/tiles\.openfreemap\.org\/styles\/liberty'/);
 assert.match(js,/setStyle\(basemapStyles\[next\]\)/);
 assert.match(js,/state\.map\.on\('idle'/);
 assert.match(js,/!state\.map\.getSource\(sourceName\)\|\|!state\.map\.getLayer\(layerName\)/);
 assert.match(html,/id="basemap-style"/);
 assert.match(css,/\.basemap-choices button/);
 for(const lang of ['ms','en','zh','th'])for(const key of ['basemapQuiet','basemapStandard','basemapSwitch'])assert.ok(I[lang][key]);
 assert.equal(D.segments.every(s=>s.geometry===null),true);
});

test('Ordinary-road mode dims road paint 40 percent, never ECRL rail markers',()=>{
 const sandbox2={window:{}};vm.createContext(sandbox2);
 vm.runInContext(file('assets/ecrl-gis-v1/road-style.js'),sandbox2);
 const road=sandbox2.window.MRS10ECRLRoadStyle;
 assert.equal(road.factor,0.6);
 const changed=[];const map={
  getStyle:()=>({layers:[
   {id:'road_major',type:'line',paint:{'line-opacity':0.8}},
   {id:'road_secondary',type:'line',paint:{}},
   {id:'road_label',type:'symbol',layout:{'text-field':'name'},paint:{'text-opacity':0.9}},
   {id:'road_area',type:'fill',paint:{'fill-opacity':0.4}},
   {id:'railway_line',type:'line',paint:{'line-opacity':1}},
   {id:'metro_station',type:'symbol',layout:{'text-field':'name'}},
   {id:'landcover',type:'fill',paint:{'fill-opacity':1}}
  ]}),
  setPaintProperty:(id,prop,val)=>changed.push({id,prop,val})
 };
 assert.equal(road.apply(map),4);
 assert.equal(changed.length,4);
 assert.ok(changed.every(c=>c.id.startsWith('road_')));
 assert.equal(changed.find(c=>c.id==='road_major').val,0.48);
 assert.equal(changed.find(c=>c.id==='road_secondary').val,0.6);
 assert.ok(Math.abs(changed.find(c=>c.id==='road_label').val-0.54)<1e-10);
 assert.equal(changed.find(c=>c.id==='road_area').val,0.24);
 const zoomFade=road.scaledOpacity({stops:[[12,0],[12.5,1]]});
 assert.deepEqual(JSON.parse(JSON.stringify(zoomFade)),['interpolate',['linear'],['zoom'],12,0,12.5,0.6]);
 assert.equal(road.scaledOpacity({property:'kind',stops:[['road',1]]}),null);
});
test('Road dimming stays in standard basemap and reapplies after style reload',()=>{
 const html=file('ecrl-gis-v1.html'),js=file('assets/ecrl-gis-v1/app.js');
 assert.match(html,/assets\/ecrl-gis-v1\/road-style\.js/);
 assert.ok(html.indexOf('road-style.js')<html.indexOf('app.js'));
 assert.match(js,/state\.basemap!=='standard'/);
 assert.match(js,/applyStandardRoadDimming\(\)/);
 assert.match(js,/state\.roadDimmingApplied=false/);
 assert.match(js,/roadOpacityFactor:/);
 assert.match(js,/ROAD\.apply\(state\.map\)/);
});
