'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),get=p=>fs.readFileSync(path.join(root,p),'utf8');
const registry=require('../assets/unified-v4-registry.js');
const kl=require('../assets/railway-track-registry-kl.js');
const am=require('../assets/mrs10-r219-ampang-service.js');
test('V5 inherits exactly four verified service identities 29/37/18/36',()=>{
 const m=registry.loadManifest(kl,am);
 assert.equal(m.length,4);
 assert.equal(m.reduce((sum,r)=>sum+r.stops.length,0),120);
 assert.deepEqual(m.map(r=>r.id),['mrt-kajang','lrt-kelana-jaya','lrt-ampang','mrt-putrajaya']);
 assert.deepEqual(m.map(r=>r.color),['#087D43','#D50032','#A65100','#FBCD20']);
 assert(m.every(r=>r.alignment===null));
});
test('V5 one MapLibre runtime with unique route-specific GIS Source + Layer IDs',()=>{
 const js=get('assets/unified-v5-map.js'),html=get('unified-map-v5.html');
 assert.equal((js.match(/new maplibregl\.Map\(/g)||[]).length,1);
 assert.match(js,/const srcId=id=>'mrs10-v5-source-'\+id/);
 assert.match(js,/const layerId=id=>'mrs10-v5-'\+id/);
 assert.match(js,/map\.addSource\(source,\{type:'geojson',data\}\)/);
 assert.match(js,/map\.addLayer\(\{id:lid,type:'circle',source/);
 assert.match(js,/for\(const r of state\.manifest\)\{/);
 assert.match(js,/map\.queryRenderedFeatures\(\{layers:\[layer\]\}\)/);
 assert(!html.includes('<iframe'));
 assert(html.includes('unified-v5-map.js'));
 assert(html.includes('maplibre-gl@5.12.0/dist/maplibre-gl.js'));
});
test('V5 fail closed on empty canvas, missing basemap or invisible route',()=>{
 const js=get('assets/unified-v5-map.js');
 for(const requirement of ['tilesLoaded','webglReady','styleLoaded','x.rendered>0','mapReady','state.map.isStyleLoaded()'])
  assert(js.includes(requirement),requirement);
 assert(js.includes("visualPending:'Data GIS dipadankan tetapi paparan peta belum disahkan.'"));
 assert(js.includes("state.map.on('idle'"));
});
test('V5 keeps transfer identities as relationships not coordinate deduplication',()=>{
 const js=get('assets/unified-v5-map.js'),routes=registry.loadManifest(kl,am);
 assert(registry.interchangeRegistry.some(x=>x.station==='Kwasa Damansara'));
 assert.notEqual(routes[0].stops[0].id,routes[3].stops[0].id);
 assert(js.includes('focusStation(service.id,stop.id)'));
 assert(js.includes('shared-services'));
});
test('V5 separate HTML, reversible branch, no leaked private scripts',()=>{
 const html=get('unified-map-v5.html'),builder=get('scripts/build-unified-v5.cjs'),docs=get('docs/MRS10_P01_UNIFIED_V5_RECOVERY.md');
 assert(html.includes('id="map"')&&html.includes('id="lineup"'));
 assert(builder.includes('build-unified-v4.cjs'));
 assert(builder.includes('V5_PRIVATE_PREVIEW_ASSET'));
 assert(docs.includes('Owner Safari'));
 assert(!/assets\/member-gateway\.js/.test(html));
});

test('V5 style replacement recovers sources on idle without stale mapReady gate',()=>{
 const js=get('assets/unified-v5-map.js');
 const pos=js.indexOf("state.map.on('idle'");
 const block=js.slice(pos,js.indexOf("state.map.on('error'",pos));
 assert(block.includes('state.map.isStyleLoaded()'));
 assert(block.includes('state.mapReady=true'));
 assert(block.includes('state.manifest.some'));
 assert(block.includes('!state.map.getSource(srcId(route.id))'));
 assert(block.includes('!state.map.getLayer(layerId(route.id))'));
 assert(!block.includes('if(state.mapReady&&'),'stale ready state must not prevent recovery');
});
