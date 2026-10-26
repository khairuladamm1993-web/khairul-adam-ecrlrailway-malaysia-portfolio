'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const sri=require('../assets/unified-v6/sri-catalogue.js'),sriGIS=require('../assets/unified-v6/sri-gis.js');
const mono=require('../assets/unified-v6/monorail-registry.js');
const erl=require('../assets/unified-v6/erl-model.js'),erlGIS=require('../assets/unified-v6/erl-gis.js');
const adapter=require('../assets/unified-v6/adapter.js');
const deps={sri,sriGIS,mono,erl,erlGIS};
test('V6 preserves modules, unique service IDs and 120 verified baseline stops',()=>{
 const r=adapter.routes(deps);
 assert.deepEqual(r.map(x=>x.expected),[29,11,3,6]);
 assert.equal(r.reduce((a,x)=>a+x.expected,0),49);
 assert(r.every(x=>x.alignment===null));
 assert.deepEqual(r.map(x=>x.id),['lrt-sri-petaling','kl-monorail','erl-klia-ekspres','erl-klia-transit']);
 assert.equal(new Set(r.flatMap(x=>x.stops.map(s=>x.id+':'+s.id))).size,49);
});
test('No fake geometry, certified ERL codes or unverified track line',()=>{
 assert(sri.validate());assert(mono.validate());assert(erl.validate());
 assert.equal(erl.infrastructure.physicalPolyline,null);
 assert.equal(mono.route.geometry,null);
 assert.equal(sri.route.railwayAlignment,null);
 assert(erl.stops.every(x=>x.officialStationCode===null));
});
test('V6 GIS decoders fail closed and preserve distinct ERL stop services',()=>{
 assert.equal(sriGIS.decode([],sri).matched,0);
 assert.equal(mono.sourceBacked([]).matched,0);
 assert.equal(erlGIS.decode([],erl).matched,0);
 const r=adapter.routes(deps);
 assert(r[2].stops.every(x=>r[3].stops.some(y=>y.id===x.id)));
});
test('One runtime, different source+layer per route, theme recovery and public-only page',()=>{
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const js=read('assets/unified-v6-map.js'),html=read('unified-map-v6.html');
 assert.equal((js.match(/new maplibregl\.Map\(/g)||[]).length,1);
 assert(js.includes("const srcId=id=>'mrs10-v6-source-'+id"));
 assert(js.includes("const layerId=id=>'mrs10-v6-'+id"));
 assert(js.includes('integration.fetchRoute(route)'));
 assert(js.includes('integration.transfersFor('));
 assert(js.includes('state.map.isStyleLoaded()'));
 assert(!html.includes('<iframe'));
 assert(html.includes('unified-v6/adapter.js'));
 assert(html.includes('maplibre-gl@5.12.0/dist/maplibre-gl.js'));
});
test('V6 isolated public packaging and exact module audit',()=>{
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 assert(read('scripts/build-unified-v6.cjs').includes('build-unified-v5.cjs'));
 assert(read('scripts/build-unified-v6.cjs').includes('V6_PRIVATE_FILE'));
 assert(read('docs/MRS10_P01_UNIFIED_V6_THREE_MODULE_HANDOFF.md').includes('Safari Owner UAT'));
});

test('V6 strict public ArcGIS layer5 Monorail matching: all 11 exact codes, duplicates rejected',()=>{
 const fake=mono.stations.map((s,i)=>({attributes:{FID:i+1,STN_NAME:s.name.toUpperCase(),STN_CODE:'MR'+(i+1)},
  geometry:{x:101.690+i*.001,y:3.135+i*.001}}));
 const ok=adapter.decodeMonorailArcGIS(fake,mono);
 assert.equal(ok.matched,11);
 assert.equal(adapter.decodeMonorailArcGIS([...fake,fake[0]],mono).matched,10);
 assert.equal(adapter.decodeMonorailArcGIS(fake.map((f,i)=>({...f,attributes:{...f.attributes,STN_CODE:'MR'+(i+2)}})),mono).matched,0);
 assert.equal(adapter.routes(deps).find(r=>r.id==='kl-monorail').decoder,'MONO_ARCGIS');
});
