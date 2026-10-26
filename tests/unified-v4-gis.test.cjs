'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const core=require('../assets/unified-v4-registry.js');
const kl=require('../assets/railway-track-registry-kl.js');
const am=require('../assets/mrs10-r219-ampang-service.js');
const gis=require('../assets/mrs10-r219-ampang-gis.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('V4 exact baseline totals, identity colors and GIS layers',()=>{
 const m=core.loadManifest(kl,am);
 assert.deepEqual(m.map(x=>x.expected),[29,37,18,36]);
 assert.equal(m.reduce((n,r)=>n+r.stops.length,0),120);
 assert.deepEqual(m.map(x=>x.color),['#087D43','#D50032','#A65100','#FBCD20']);
 assert(m.every(x=>x.alignment===null&&x.source.startsWith('https://services5.arcgis.com/')));
 assert.deepEqual(m.map(x=>x.layer),[6,3,1,8]);
});
test('V4 includes only source-matched points; never invents geometry',()=>{
 const [kajang,kelana]=core.loadManifest(kl,am);
 const record={features:[{attributes:{STN_NAME:kajang.stops[0].name,STN_CODE:'KG04',OBJECTID:88},geometry:{x:101.6,y:3.2}}]};
 const r=core.decodeArcgis(kajang,record,gis,am);
 assert.equal(r.matched,1);assert.equal(r.points[0].id,kajang.stops[0].id);
 assert.equal(core.toGeoJSON([r]).features[0].geometry.type,'Point');
 assert.equal(core.toGeoJSON([r]).features[0].properties.provenance,'ARCGIS_PUBLIC_THIRD_PARTY_GIS_REFERENCE');
 assert.equal(core.decodeArcgis(kelana,{features:[{attributes:{STN_NAME:'Random stop'},geometry:{x:101.6,y:3.2}}]},gis,am).matched,0);
 assert.equal(core.decodeArcgis(kajang,{features:[{attributes:{STN_NAME:kajang.stops[0].name},geometry:{x:0,y:0}}]},gis,am).matched,0);
 assert.equal(core.decodeArcgis(kajang,{error:{message:'blocked'}},gis,am).ok,false);
});
test('V4 repeated source matches are removed to prevent false coordinates',()=>{
 const [r]=core.loadManifest(kl,am),s=r.stops[0];
 const source={attributes:{STN_NAME:s.name},geometry:{x:101.5,y:3.1}};
 const response=core.decodeArcgis(r,{features:[source,source]},gis,am);
 assert.equal(response.matched,0);assert.equal(response.rejectedAmbiguous,1);
});
test('V4 interchanges are relationships, not merged software IDs',()=>{
 const regs=core.loadManifest(kl,am);
 assert.equal(core.interchangeRegistry.length,5);
 assert.notEqual(regs[0].stops[0].id,regs[3].stops[0].id);
 assert(core.interchangeRegistry.every(x=>x.routes.every(id=>regs.some(r=>r.id===id))));
});
test('V4 UI contains map, search, four languages, filters, popup and style recovery',()=>{
 const html=read('unified-map-v4.html'),js=read('assets/unified-v4-map.js'),reg=read('assets/unified-v4-registry.js');
 for(const s of ['id="map"','id="lineup"','id="search"','id="filters"','unified-v4-map.js'])assert(html.includes(s),s);
 for(const s of ['ms:','en:','zh:','th:','style.load','setStyle','fetchRoute','applyVisibility','fitBounds','queryRenderedFeatures','setDOMContent'])assert(js.includes(s),s);
 assert(!/geocode\(|Turf\.lineString/.test(reg));
 assert(!/service_role|authorization:/i.test(js));
});
test('V4 public packager allowlists GIS and blocks private modules',()=>{
 const p=read('scripts/build-unified-v4.cjs');
 assert(p.includes('build-preview.py'));
 assert(p.includes('https://services5.arcgis.com'));
 assert(p.includes('worker-src blob:'));
 assert(p.includes('PRIVATE_ASSET_IN_PREVIEW'));
 assert(p.includes('member-gateway.js'));
});

test('V4 two exact live ArcGIS Kajang typo records match, but near matches are rejected',()=>{
 const kajang=core.loadManifest(kl,am)[0];
 const tuples=[
  {attributes:{OBJECTID:21,STN_NAME:'TAMAN CONNAUGH',STN_CODE:'KG26'},geometry:{x:101.7,y:3.1}},
  {attributes:{OBJECTID:25,STN_NAME:'BATU 11 CHERAS',STN_CODE:'KG3O'},geometry:{x:101.8,y:3.2}}
 ];
 const corrected=core.decodeArcgis(kajang,{features:tuples},gis,am);
 assert.deepEqual(corrected.points.map(x=>x.id),['mrt-taman-connaught','mrt-batu-sebelas-cheras']);
 const forged=core.decodeArcgis(kajang,{features:[
  {...tuples[0],attributes:{...tuples[0].attributes,OBJECTID:500}},
  {...tuples[1],attributes:{...tuples[1].attributes,STN_CODE:'KG30'}}
 ]},gis,am);
 assert.equal(forged.matched,0);
});
