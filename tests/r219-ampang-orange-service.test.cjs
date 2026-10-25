'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=require('../assets/mrs10-r219-ampang-service.js');
const viewer=read('ampang-line-r219.html');
const mapBridge=read('assets/mrs10-r219-map-bridge.js');
const ampangGIS=require('../assets/mrs10-r219-ampang-gis.js');
const geoOverlay=read('assets/mrs10-r219-ampang-gis-overlay.js');
const existingMap=read('assets/map-language-lab.js');
const existingRegistry=require('../assets/railway-track-registry-kl.js');

test('R2.19: Ampang station count, order, codes, immutable membership and evidence',()=>{
 assert(api.validate());
 assert.equal(api.stations.length,18);
 assert.equal(api.route.stationSequence.length,18);
 assert.equal(api.route.serviceAdjacencies.length,17);
 assert.equal(api.stations[0].name,'Sentul Timur');
 assert.equal(api.stations[17].name,'Ampang');
 assert.deepEqual(api.stations.map(x=>x.serviceCode),Array.from({length:18},(_,i)=>'AG'+(i+1)));
 assert(api.stations.every(x=>x.sourceUrls.length>=2&&x.sourceUrls.every(x=>/^https:\/\//.test(x))));
 assert.equal(api.stationByCode('AG2').name,'Sentul');
 assert.equal(api.stationByCode('AG11').name,'Chan Sow Lin');
 assert.equal(api.stationByCode('AG19'),null);
 assert.equal(new Set(api.stations.map(s=>s.id)).size,18);
});
test('R2.19: shared 11 stops, then seven Ampang-only stops; not duplicate tracks',()=>{
 const a=api.stations;
 assert(a.slice(0,11).every(x=>x.sharedPassengerService&&x.serviceIds.includes('lrt-sri-petaling')));
 assert(a.slice(11).every(x=>!x.sharedPassengerService&&!x.serviceIds.includes('lrt-sri-petaling')));
 assert.equal(api.route.sharedServiceSection.stationCount,11);
 assert.equal(api.route.branch.serviceDivergenceAt,'Chan Sow Lin');
 assert.equal(api.route.branch.physicalJunctionGeometry,'UNVERIFIED');
 assert.equal(api.route.sharedServiceSection.geometry,null);
 assert.equal(api.route.sharedServiceSection.trackCount,'UNVERIFIED');
 assert.equal(api.route.acceptedPhysicalTrackWays.length,0);
});
test('R2.19: orange official family but exact hex and alignment unverified',()=>{
 assert.equal(api.officialServiceColor.label,'Orange / Oren');
 assert.equal(api.officialServiceColor.officialHex,'UNVERIFIED');
 assert.equal(api.officialServiceColor.alignmentColorAllowed,false);
 assert.equal(api.route.geometry,null);
 assert(api.stations.every(s=>s.geometry===null&&s.poiMatchStatus==='UNVERIFIED'&&
  s.physicalTrackIds.length===0&&s.railwayWayIds.length===0));
 assert(api.route.serviceAdjacencies.every(e=>e.geometry===null&&e.railwayWayId===null));
});
test('R2.19: exact-code candidate matching rejects fabricated, ambiguous and cross-line POIs',()=>{
 const expected=api.candidatePoi({class:'railway',subclass:'subway',name:'AG13 Maluri'});
 assert.equal(expected.stationId,'mrs10-lrt-ampang-ag13');
 assert.equal(expected.classification,'UNVERIFIED_CARTOGRAPHIC_CANDIDATE_NOT_ALLOWED_FOR_HIGHLIGHT');
 const rejects=[null,{}, {class:'railway',subclass:'station',name:'Maluri'},
  {class:'railway',subclass:'station',name:'AG13 Merdeka'},
  {class:'railway',subclass:'station',name:'AG99 Maluri'},
  {class:'railway',subclass:'station',name:'AG13 Maluri','name:en':'Wrong'},
  {class:'railway',subclass:'halt',name:'AG13 Maluri'},
  {class:'transit',subclass:'subway',name:'AG13 Maluri'},
  {class:'railway',subclass:'subway',name:'KG22 Maluri'}];
 assert(rejects.every(x=>api.candidatePoi(x)===null));
 assert.equal(api.observedPoiCrosswalk.length,0);
 assert.equal(api.verifiedPoi({class:'railway',subclass:'subway',name:'AG13 Maluri'}),null);
});
test('R2.19: isolated viewer retains existing map with no App JS or shared registry rewrite',()=>{
 assert.doesNotMatch(viewer,/<iframe\b/i);
 assert.match(viewer,/id="r219-map"/);
 assert.match(viewer,/assets\/mrs10-r219-map-bridge\.js/);
 assert.match(viewer,/<script src="\.\/assets\/mrs10-r219-ampang-service\.js"/);
 assert.doesNotMatch(viewer,/mrl-ampang-physical-alignment/);
 assert.match(viewer,/#A65100/);
 assert.match(viewer,/#FFBB7B/);
 assert.equal(existingRegistry.findRoute('mrt-kajang').stationSequence.length,29);
 assert.equal(existingRegistry.findRoute('lrt-ampang').stationSequenceStatus,'NOT_YET_VERIFIED');
 assert.equal(existingRegistry.catalog.physicalSegments.length,0);
 assert.match(existingMap,/syncKajangPoiHighlights/);
 assert.doesNotMatch(existingMap,/mrl-ampang-physical-alignment/);
});
function boot(){
 const dom=new JSDOM(viewer,{url:'https://qa.example/ampang-line-r219.html',runScripts:'outside-only'});
 const w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.eval(read('assets/mrs10-r219-ampang-service.js'));
 const inline=viewer.match(/<script>([\s\S]*?)<\/script>/);
 assert(inline,'standalone viewer script');
 w.eval(inline[1]);return w;
}
test('R2.19: 18 tappable orange station references, source popup, four-language and Dark Mode',()=>{
 const w=boot(),d=w.document,items=()=>d.querySelectorAll('#station-list li');
 assert.equal(items().length,18);
 assert.match(items()[0].textContent,/Sentul Timur/);
 items()[6].querySelector('button').click();
 assert.equal(d.getElementById('details').open,true);
 assert.match(d.getElementById('station-title').textContent,/Masjid Jamek/);
 assert.match(d.getElementById('station-interchange').textContent,/lrt-kelana-jaya/);
 assert.match(d.getElementById('station-geometry').textContent,/BELUM DISAHKAN/);
 assert.match(d.getElementById('station-source').href,/prasarana\.com\.my/);
 for(const l of ['en','zh','th','ms']){
  const select=d.getElementById('lang');select.value=l;
  select.dispatchEvent(new w.Event('change'));
  assert.equal(d.documentElement.lang,l);
  assert.equal(items().length,18);
  assert.match(items()[6].textContent,/Masjid Jamek/);
 }
 d.getElementById('theme').click();
 assert.equal(d.documentElement.dataset.theme,'dark');
 assert.equal(items().length,18);
 d.getElementById('close').click();
 assert.equal(d.getElementById('details').open,false);
 w.close();
});

test('R2.19 Safari UX: same-page MapLibre map and one numbered orange service timeline',()=>{
 const d=boot().document;
 const registry=d.getElementById('registry'),mapPanel=d.getElementById('r219-map-shell');
 assert(registry&&mapPanel);
 assert(mapPanel.compareDocumentPosition(registry)&d.defaultView.Node.DOCUMENT_POSITION_FOLLOWING);
 assert.equal(d.querySelectorAll('iframe').length,0);
 assert.match(d.getElementById('r219-map-note').textContent,/Geometri fizikal belum disahkan/);
 assert(d.getElementById('r219-expand'));
 assert(d.getElementById('r219-region'));
 assert.equal(d.querySelectorAll('#station-list li').length,18);
 assert.equal(d.querySelectorAll('#station-list .shared-tag').length,11);
 assert.equal(d.querySelectorAll('#station-list li:nth-child(n+12) .shared-tag').length,0);
 for(const l of ['en','zh','th']){
  const select=d.getElementById('lang');select.value=l;select.dispatchEvent(new d.defaultView.Event('change'));
  assert.notEqual(d.getElementById('r219-map-note').textContent,'');
  assert.equal(d.querySelectorAll('#station-list li').length,18);
  assert.equal(d.querySelectorAll('#station-list .shared-tag').length,11);
 }
 d.defaultView.close();
});

test('R2.19 MapLibre adapter: source-only map and exact candidate popup; no fabricated orange geometry',()=>{
 assert.match(mapBridge,/new maplibre\.Map\(/);
 assert.match(mapBridge,/styles\/.*positron/);
 assert.match(mapBridge,/styles\/.*dark/);
 assert.match(mapBridge,/map\.on\('click',stationPopup\)/);
 assert.match(mapBridge,/map\.queryRenderedFeatures\(/);
 assert.match(mapBridge,/api\.candidatePoi\(props\)/);
 assert.match(mapBridge,/api\.verifiedPoi\(props\)/);
 assert.match(mapBridge,/NO orange vector or line layer/);
 assert.doesNotMatch(mapBridge,/mrl-ampang-physical-alignment/);
 assert.doesNotMatch(mapBridge,/coordinates.*AG\d+\b/i);
 const current=api.stationByCode('AG7');
 assert.equal(current.name,'Masjid Jamek');
 assert.equal(current.geometry,null);
 assert.equal(api.verifiedPoi({class:'railway',subclass:'subway',name:'AG7 Masjid Jamek'}),null);
});
test('R2.19 MapLibre adapter: theme, locale, full-screen and region wired to native map',()=>{
 for(const id of ['r219-map-shell','r219-expand','r219-region','r219-map','lang','theme'])
  assert.match(viewer,new RegExp('id="'+id+'"'));
 assert.match(viewer,/mrs10-r219-theme/);
 assert.match(mapBridge,/map\.setStyle\(mapStyle\(\)\)/);
 assert.match(mapBridge,/map\.flyTo\(/);
 assert.match(mapBridge,/map\.resize\(\)/);
 assert.match(mapBridge,/locale\?\.addEventListener\('change'/);
 assert.match(mapBridge,/lastAppliedLang===language/);
 assert.match(viewer,/--orange:#FFBB7B/);
});

test('R2.19: authoritative service sequence reconciles only individually sourced GIS point features',()=>{
 assert.match(ampangGIS.sourceUrl,/SELANGOR_RAILWAY_MAP\/FeatureServer\/1$/);
 assert.match(ampangGIS.requestUrl,/outSR=4326/);
 const samples=api.stations.map((st,i)=>({
  attributes:{STN_NAME:st.name,STN_CODE:st.serviceCode,OBJECTID:i+1},
  geometry:{x:101.694+i*0.002,y:3.122+i*0.003}
 }));
 const result=ampangGIS.decode(samples,api);
 assert.equal(result.ok,true);
 assert.equal(result.matched,18);
 assert.equal(result.missing,0);
 assert.equal(result.reason,'SOURCE_MATCH_18_OF_18');
 assert.deepEqual(result.data.map(x=>x.code),api.stations.map(x=>x.serviceCode));
 assert.equal(result.data[0].confidence,'SECONDARY_GIS_CANDIDATE_SOURCE_BACKED_NOT_SURVEYED');
 assert.equal(result.data[0].physicalTrackStatus,'UNVERIFIED');
 const geo=ampangGIS.toFeatureCollection(result);
 assert.equal(geo.type,'FeatureCollection');
 assert.equal(geo.features.length,18);
 assert.deepEqual(geo.features[0].geometry.coordinates,[101.694,3.122]);
 // Test doubles only: synthetic locations above are not ever committed as production station coordinates.
 assert.equal(api.stations[0].geometry,null);
});
test('R2.19: reject wrong service names, mixed AG codes, out-of-bounds points and duplicates',()=>{
 const right={attributes:{STN_NAME:'Sentul Timur',STN_CODE:'AG1',OBJECTID:1},geometry:{x:101.70,y:3.17}};
 const wrong=[
  {attributes:{STN_NAME:'Gombak',STN_CODE:'KJ1'},geometry:{x:101.71,y:3.16}},
  {attributes:{STN_NAME:'Sentul Timur',STN_CODE:'AG2'},geometry:{x:101.70,y:3.17}},
  {attributes:{STN_NAME:'Sentul Timur',STN_CODE:'AG1'},geometry:{x:103.00,y:3.17}},
  {attributes:{STN_NAME:'Sentul Timur',STN_CODE:'AG1'},geometry:{x:null,y:3.17}},
  {attributes:{STN_NAME:'Sentul Timur',STN_CODE:'AG1'},geometry:null}
 ];
 const a=ampangGIS.decode([right,...wrong],api);
 assert.equal(a.matched,1);assert.equal(a.missing,17);
 assert.equal(a.rejected,5);
 const dupe=ampangGIS.decode([right,{...right,attributes:{...right.attributes,OBJECTID:22}}],api);
 assert.equal(dupe.matched,0);
 assert.equal(dupe.missing,18);
 assert.equal(ampangGIS.decode([],api).matched,0);
 assert.equal(ampangGIS.toFeatureCollection(ampangGIS.decode([],api)).features.length,0);
});
test('R2.19: native GIS overlay preserves MapLibre tap, responsive popup and country/theme boundaries',()=>{
 assert.match(viewer,/assets\/mrs10-r219-ampang-gis\.js/);
 assert.match(viewer,/assets\/mrs10-r219-ampang-gis-overlay\.js/);
 assert.match(viewer,/id="r219-gis-status"/);
 assert.match(mapBridge,/MRS10AmpangGISOverlay\?\.at\?\.\(e\)/);
 assert.match(mapBridge,/MRS10AmpangGISOverlay\?\.attach\?\./);
 assert.match(mapBridge,/MRS10AmpangGISOverlay\?\.toggle\?\./);
 assert.match(geoOverlay,/map\.on\('style\.load'/);
 assert.match(geoOverlay,/source:sourceId/);
 assert.match(geoOverlay,/map\.fitBounds\(/);
 assert.match(geoOverlay,/source location: public GIS|Sumber titik: GIS awam/);
 assert.match(geoOverlay,/if\(!result\)/);
 assert.doesNotMatch(geoOverlay,/openrailwaymap\.org\/standard/);
 assert.equal(ampangGIS.decode([],api).missing,18);
});

test('R2.19 AG3 source provenance: exact ArcGIS FID16 TITWANGSA AG03 maps to official Titiwangsa',()=>{
 const src=ampangGIS.sourceCorrection;
 assert.equal(src.fid,16);
 assert.equal(src.rawName,'TITWANGSA');
 assert.equal(src.rawCode,'AG03');
 assert.match(src.audit,/40238891427/);
 // Test coordinates are synthetic, in bounding box, NOT registry location data.
 const observed={attributes:{FID:16,STN_NAME:'TITWANGSA',STN_CODE:'AG03'},
  geometry:{x:101.715,y:3.170}};
 const r=ampangGIS.decode([observed],api);
 assert.equal(r.ok,true);
 assert.equal(r.matched,1);
 assert.equal(r.missing,17);
 assert.equal(r.data[0].code,'AG3');
 assert.equal(r.data[0].name,'Titiwangsa');
 assert.equal(r.data[0].sourceRawName,'TITWANGSA');
 assert.equal(r.data[0].sourceRawCode,'AG03');
 assert.equal(r.data[0].matchMethod,'OBSERVED_GIS_TYPO_AND_PADDED_CODE_FID16');
 assert.equal(r.data[0].correctionEvidence,src.audit);
 assert.equal(r.data[0].physicalTrackStatus,'UNVERIFIED');
 assert.equal(api.stationByCode('AG3').geometry,null);
});
test('R2.19 AG3 correction rejects wrong FID, name, padded code and out-of-bounds',()=>{
 const source={FID:16,STN_NAME:'TITWANGSA',STN_CODE:'AG03'};
 const example={x:101.715,y:3.170};
 for(const obj of [
  {attrs:{...source,FID:15},geom:example},
  {attrs:{...source,STN_CODE:'AG04'},geom:example},
  {attrs:{...source,STN_NAME:'OTHER STATION'},geom:example},
  {attrs:source,geom:{x:104.5,y:3.170}},
  {attrs:source,geom:{x:101.715,y:null}}
 ]){
  const d=ampangGIS.decode([{attributes:obj.attrs,geometry:obj.geom}],api);
  assert.equal(d.matched,0);
  assert.equal(d.missing,18);
 }
 const duplicate=ampangGIS.decode([
  {attributes:source,geometry:example},
  {attributes:source,geometry:{x:101.716,y:3.171}}
 ],api);
 assert.equal(duplicate.matched,0);
 assert.equal(duplicate.missing,18);
});
