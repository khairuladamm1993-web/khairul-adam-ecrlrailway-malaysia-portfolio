'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const data=require('../assets/unified-v7/ktm-dataset.js');
const ktm=require('../assets/unified-v7/ktm-adapter.js');
const read=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');
test('V7 retains V6 and adds only six Komuter plus 38 ETS and 23 ERT; excludes Eastern Shuttle',()=>{
 assert(ktm.validate(data));const routes=ktm.routes(data);
 assert.equal(routes.length,8);
 assert.deepEqual(routes.map(x=>x.expected),[27,34,13,13,7,2,38,23]);
 assert.equal(routes.reduce((s,r)=>s+r.expected,0),157);
 assert.equal(routes[6].id,'ktmb-ets-v1');assert.equal(routes[7].id,'ktmb-ert');
 assert(!data.tripServices.some(x=>x.routeId==='SH'));
 assert(!data.tripServices.some(x=>x.id.includes('shuttle')));
 assert(!read('assets/unified-v7/ktm-dataset.js').includes('ktmb-shuttle-timuran'));
 assert(routes.every(x=>x.alignment===null));
});
test('KTM Komuter source-based 85 official service station associations; missing remain fail-closed',async()=>{
 const routes=ktm.routes(data),seen=[];
 for(const route of routes){
  if(route.decoder==='KTM_KOMUTER_OFFICIAL'&&route.sector==='central')continue;
  const r=await ktm.fetchRoute(route,data);
  assert(r.ok);assert.equal(r.matched,route.expected);
  seen.push(r);
 }
 assert.equal(seen.length,6);
});
test('KTM exact official station membership is scoped per service and exact names',()=>{
 const routes=ktm.routes(data);
 let matched=0;
 for(const r of routes.slice(0,6)){
  const dataByName=new Map(data.komuterStations.map(p=>[ktm.canonical(p.name),p]));
  matched+=r.stops.filter(s=>dataByName.get(ktm.canonical(s.name))?.serviceIds.includes(r.id)).length;
 }
 assert.equal(matched,85);
 assert.equal(data.komuterStations.length,77);
 assert.equal(data.tripServices[0].stops.length,38);assert.equal(data.tripServices[1].stops.length,23);
});
test('V7 one MapLibre with dynamic 16 separate source/layer and category filters',()=>{
 const js=read('assets/unified-v7-map.js'),html=read('unified-map-v7.html');
 assert.equal((js.match(/new maplibregl\.Map\(/g)||[]).length,1);
 assert(js.includes("const srcId=id=>'mrs10-v7-source-'+id"));
 assert(js.includes("const layerId=id=>'mrs10-v7-'+id"));
 assert(js.includes('...ktm.routes()'));
 assert(js.includes("['All','MRT','LRT','Monorail','ERL','KTM','ETS','Intercity']"));
 assert(js.includes('ktm.fetchRoute(route)'));
 assert(html.includes('Shuttle Timur dikecualikan'));
 assert(html.includes('unified-v6/adapter.js'));
 assert(!html.includes('<iframe'));
 assert(js.includes('state.map.isStyleLoaded()'));
});
test('Only public V7 assets with provenance and V6 rollback',()=>{
 const build=read('scripts/build-unified-v7.cjs');
 assert(build.includes('build-unified-v6.cjs'));
 assert(build.includes('V7_PRIVATE_ASSET'));
 assert(read('docs/MRS10_P01_UNIFIED_V7_KTM_NO_SHUTTLE_TIMUR.md').includes('85/96'));
});
