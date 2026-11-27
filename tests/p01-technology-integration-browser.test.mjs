import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require('playwright');
const base=process.env.P01_QA_ORIGIN||'http://127.0.0.1:8765';
const out=process.env.P01_QA_OUTPUT||'artifacts/p01-technology-integration';
const vendor=process.env.P01_MAPLIBRE_DIST;
assert.ok(vendor,'P01_MAPLIBRE_DIST must point to the pinned MapLibre browser assets');
await fs.mkdir(out,{recursive:true});
const moduleRoot='https://unpkg.com/maplibre-gl@6.13.0/dist/';
const loader=await fetch(base+'/assets/p01-maplibre.js');
assert.equal(loader.status,200);
// Attach a camera probe to the local loader. The verified SDK and worker bytes remain intact.
const loaderWithProbe=await loader.text()+`
import {Map as ProbeMap,getVersion as probeVersion} from '${moduleRoot}maplibre-gl.mjs';
window.ecrlTestVersion=probeVersion();
const jump=ProbeMap.prototype.jumpTo;
ProbeMap.prototype.jumpTo=function(...args){window.ecrlTestMap=this;return jump.apply(this,args)};
`;
const rows=[];
const batchOnly=process.env.P01_QA_ECRL_BATCH_ONLY==='1';
const sharedOnly=process.env.P01_QA_SHARED_CORE_ONLY==='1';
const hierarchyOnly=process.env.P01_QA_RAILWAY_HIERARCHY_ONLY==='1';
const compositionOnly=process.env.P01_QA_MAP_COMPOSITION_ONLY==='1';
const profiles=[['desktop',1200,900],['ipad',810,1080],['iphone',390,844],['iphone-landscape',844,390]];
const arcgis=/^https:\/\/[^/]*arcgis\.com\//;
const emptyGis=r=>r.fulfill({json:{features:[]},headers:{'access-control-allow-origin':'*'}});

async function checkPublicAssetLookup(page){
  const list=page.locator('#asset-reference-list'),search=page.locator('#asset-search');
  await list.locator('li').first().waitFor();
  await search.fill('ECRL Depot Kuantan');
  assert.equal(await list.locator('li').count(),1);
  assert.equal(await list.locator('li').getAttribute('data-asset-id'),'ecrl-depot-kuantan');
  assert.match(await list.innerText(),/Lokasi fizikal belum disahkan/);
  await page.locator('[data-asset-kind=PL]').click();
  assert.equal(await list.locator('li').count(),0);
  await search.fill('pl 1');
  assert.equal(await list.locator('li').count(),1);
  assert.match(await list.innerText(),/PL01/);
}

async function checkSharedIdentity(page){
 const projection='/data/ecrl-public-identity-v1.json';
 assert.equal((await page.goto(base+'/unified-map-v7.html')).status(),200);
 await page.locator('#filters').getByRole('button',{name:'Semua',exact:true}).click();
 const search=page.locator('#search'), results=page.locator('#search-results');
 await search.fill('PL 1');
 const row=results.locator('[data-ecrl-identity="ecrl-loop-historical-01"]');
 await row.waitFor();
 assert.match(await row.innerText(),/belum disahkan.*PL01/);
 const response=await page.request.get(base+projection);
 assert.equal(response.status(),200);
 const payload=await response.json();
 const current=payload.records.find(item=>item.code==='PL01');
 const originalRoute=await page.locator('#route-buttons [aria-pressed=true]').innerText();
 await row.press('Enter');
 const context=page.locator('#ecrl-context');
 assert.equal(await context.isVisible(),true);
 assert.equal(await page.locator('#rail-lineup-panel').isHidden(),true);
 assert.equal(await context.locator('h2').evaluate(h=>h===document.activeElement),true);
 assert.match(await context.locator('h2').innerText(),new RegExp(' · '+current.section+'$'));
 assert.deepEqual(await context.locator('li').evaluateAll(items=>items.map(item=>item.dataset.assetId)),
  payload.records.filter(item=>item.section===current.section).map(item=>item.assetId));
 assert.equal(await context.locator('[aria-current=true]').getAttribute('data-asset-id'),current.assetId);
 assert.equal(new URL(page.url()).pathname,'/unified-map-v7.html');
 await page.locator('#ecrl-context-back').click();
 assert.equal(await context.isHidden(),true);
 assert.equal(await page.locator('#rail-lineup-panel').isVisible(),true);
 assert.equal(await page.locator('#route-buttons [aria-pressed=true]').innerText(),originalRoute);
 assert.equal(await search.evaluate(input=>input===document.activeElement),true);
 await search.fill('ecrl-depot-kuantan');
 const depot=results.locator('[data-ecrl-identity="ecrl-depot-kuantan"]');
 await depot.click();
 assert.equal(await context.locator('[aria-current=true]').getAttribute('data-asset-id'),'ecrl-depot-kuantan');
 await search.fill('PL06');
 await results.locator('[data-ecrl-identity="ecrl-loop-historical-06"]').click();
 assert.match(await context.locator('h2').innerText(),/ · C1$/);
 assert.equal(await context.locator('[aria-current=true]').getAttribute('data-asset-id'),'ecrl-loop-historical-06');
 await search.fill('Serendah Baru');
 await results.locator('[data-ecrl-identity="ecrl-stn-17"]').click();
 assert.match(await context.locator('h2').innerText(),/ · C2$/);
 assert.equal(await context.locator('[aria-current=true]').getAttribute('data-asset-id'),'ecrl-stn-17');
 await search.fill('Westports');
 await results.locator('[data-ecrl-identity="ecrl-port-westports"]').click();
 assert.match(await context.locator('h2').innerText(),/ · D$/);
 assert.equal(await context.locator('[aria-current=true]').getAttribute('data-type'),'PORT');
 await page.locator('#reset').click();
 assert.equal(await context.isHidden(),true);
 assert.equal((await page.goto(base+'/ecrl-asset-reference.html')).status(),200);
 const catalogue=page.locator('#asset-reference-list li');
 await catalogue.first().waitFor();
 assert.deepEqual(await catalogue.evaluateAll(items=>items.map(item=>[item.dataset.assetId,item.dataset.type,item.querySelector('small').textContent])),
  payload.records.map(({assetId,type,section})=>[assetId,type,({STN:section==='C2'?'Stesen dirancang':'Stesen',PL:'Passing loop',DEPOT:'Depot',YARD:'Terminal kargo cadangan',PORT:'Antara muka pelabuhan dirancang'})[type]+' · Seksyen '+section+' · '+
   (type==='PORT'?'Rujukan kawasan pelabuhan; sambungan rel belum disahkan':'Lokasi fizikal belum disahkan')]));
 await page.locator('[data-asset-kind=YARD]').click();
 assert.deepEqual(await catalogue.evaluateAll(items=>items.map(item=>item.dataset.assetId)),['ecrl-yard-puncak-alam']);
 await page.locator('[data-asset-kind=PORT]').click();
 assert.deepEqual(await catalogue.evaluateAll(items=>items.map(item=>item.dataset.assetId)),['ecrl-port-northport','ecrl-port-westports']);
 await page.locator('[data-asset-kind=ALL]').click();
 await checkPublicAssetLookup(page);
 assert.equal(payload.records.length,32);
 for(const record of payload.records){
  assert.deepEqual(Object.keys(record).sort(),['assetId','code','name','section','type']);
 }
 for(const path of ['/data/owner-project-registry.json','/api/member','/supabase/config.toml','/release-manifest.json','/assets/quiz-core.js']){
  assert.equal((await page.request.get(base+path)).status(),404,path);
 }
 await page.route(base+projection,r=>r.fulfill({status:503,body:'Unavailable fixture'}));
 await page.goto(base+'/unified-map-v7.html');
 await page.locator('#search').fill('Kajang');
 assert.ok(await page.locator('#search-results').getByRole('button').count()>0);
 await page.goto(base+'/ecrl-asset-reference.html');
 await page.getByText('Rujukan aset belum tersedia.').waitFor();
 await page.unroute(base+projection);
}

async function checkAlignmentRetry(page){
 const url=base+'/data/ecrl-reference-alignment.geojson';
 let attempts=0;
 await page.route(url,route=>{
  attempts++;
  if(attempts===1)return route.fulfill({status:503,body:'Fixture unavailable'});
  if(attempts===2)return route.fulfill({json:{type:'FeatureCollection',features:[]}});
  return route.continue();
 });
 assert.equal((await page.goto(base+'/unified-map-v7.html')).status(),200);
 const retry=page.getByRole('button',{name:'Cuba lagi'});
 for(let expected=1;expected<=2;expected++){
  await retry.waitFor();
  assert.equal(attempts,expected);
  assert.match(await page.locator('#map-status-message').innerText(),/Jajaran rujukan ECRL gagal dimuatkan/);
  assert.equal(await page.evaluate(()=>window.MRS10V7Diagnostics.snapshot().ecrlReferenceFeatures),0);
  await retry.click();
 }
 await page.waitForFunction(()=>window.MRS10V7Diagnostics.snapshot().ecrlReferenceFeatures===453&&
  !!window.ecrlTestMap.getLayer('mrs10-v7-ecrl-reference-alignment'));
 assert.equal(attempts,3);
 assert.equal(await retry.isHidden(),true);
 await page.unroute(url);
}

async function checkMapComposition(page,engine,device){
 const tap=locator=>device==='desktop'?locator.click():locator.tap();
 await page.route(base+'/context-fixture-tiles/**',route=>route.fulfill({status:204}));
 await page.route('https://tiles.openfreemap.org/styles/**',route=>route.fulfill({json:{
  version:8,sources:{transport:{type:'vector',tiles:[base+'/context-fixture-tiles/{z}/{x}/{y}.pbf']}},
  layers:[{id:'bg',type:'background',paint:{'background-color':'#dce6e4'}},
   {id:'fixture-transport',type:'line',source:'transport','source-layer':'transportation'}]
 },headers:{'access-control-allow-origin':'*'}}));
 assert.equal((await page.goto(base+'/unified-map-v7.html')).status(),200);
 await page.waitForFunction(()=>{
  const d=window.MRS10V7Diagnostics?.snapshot();
  return d?.stage==='DONE'&&d.styleLoaded&&d.webglReady&&d.layerCount>0&&
   !!window.ecrlTestMap.getLayer('mrs10-v7-ecrl-localities-point')&&
   !!window.ecrlTestMap.getLayer('mrs10-v7-ecrl-reference-alignment');
 });
 assert.equal(await page.locator('#filters [aria-pressed=true]').innerText(),'ECRL');
 assert.equal(await page.locator('.p01-v7-map-badge').innerText(),'MR-S10');
 const layers=await page.evaluate(async ()=>{
  const map=window.ecrlTestMap,source=map.getSource('mrs10-v7-ecrl-localities');
  const data=await source.getData(),rail=map.getLayer('mrs10-v7-rail-context');
  const marker=map.getLayer('mrs10-v7-ecrl-localities-point');
  return {types:[...new Set(data.features.map(f=>f.geometry.type))],codes:data.features.map(f=>f.properties.code),
   markerType:marker.type,iconSize:map.getLayoutProperty(marker.id,'icon-size'),
   iconRegistered:map.hasImage(map.getLayoutProperty(marker.id,'icon-image')),
   iconCanOverlapBasemap:map.getLayoutProperty(marker.id,'icon-allow-overlap'),
   railSource:rail.source,railType:rail.type,legacyVisibility:map.getLayoutProperty('mrs10-v7-mrt-kajang','visibility'),
   centre:map.getCenter().toArray()};
 });
 assert.deepEqual(layers.types,['Point']);
 assert.equal(layers.codes.length,16);
 assert.equal(layers.markerType,'symbol');
 assert.equal(layers.iconRegistered,true);
 assert.equal(layers.iconCanOverlapBasemap,true);
 assert.deepEqual(layers.iconSize,['step',['zoom'],0.62,8,0.82,12,1]);
 assert.ok(!layers.codes.includes('STN10'));
 assert.equal(layers.legacyVisibility,'none');
 assert.equal(layers.railSource,'transport');
 assert.equal(layers.railType,'line');
 const alignmentLayer='mrs10-v7-ecrl-reference-alignment';
 await page.waitForFunction(id=>window.ecrlTestMap.queryRenderedFeatures({layers:[id]}).length>0,alignmentLayer);
 const alignment=await page.evaluate(async id=>{
  const map=window.ecrlTestMap, source=map.getSource(id), style=map.getStyle();
  const {features}=await source.getData();
  return {count:features.length,dash:map.getPaintProperty(id,'line-dasharray'),
   beforeMarker:style.layers.findIndex(l=>l.id===id)<style.layers.findIndex(l=>l.id==='mrs10-v7-ecrl-localities-point'),
   attributed:source.attribution.includes('ODbL 1.0'),
   verifiedLayer:!!map.getLayer('mrs10-v7-ecrl-engineering-alignment')};
 },alignmentLayer);
 assert.deepEqual(alignment,{count:453,dash:[2.4,1.5],beforeMarker:true,attributed:true,verifiedLayer:false});
 assert.match(await page.locator('#legend').innerText(),/rujukan OSM.*pembinaan/);
 assert.match(await page.locator('#legend').innerText(),/Jajaran disahkan kejuruteraan.*belum tersedia/);
 await page.screenshot({path:out+'/'+engine+'-'+device+'-ecrl-reference-alignment.png'});
 const opener=page.locator('#ecrl-context-open'),panel=page.locator('#ecrl-context');
 const fullscreen=page.locator('#p01-v7-fullscreen');
 const mapPath=new URL(page.url()).pathname;
 const camera=()=>page.evaluate(()=>({
  center:window.ecrlTestMap.getCenter().toArray(),
  zoom:window.ecrlTestMap.getZoom(),
  layers:window.ecrlTestMap.getStyle().layers.map(({id})=>id)
 }));
 await tap(fullscreen);
 await page.waitForFunction(()=>{
  const map=window.ecrlTestMap;
  const container=map.getContainer().getBoundingClientRect();
  return !map.isMoving()&&Math.abs(map.getCanvas().clientHeight-container.height)<2;
 });
 const before=await camera();
 await tap(opener);
 assert.equal(await opener.getAttribute('aria-expanded'),'true');
 assert.match(await panel.locator('#ecrl-context-status').innerText(),/jajaran fizikal belum disahkan/);
 const {records}=await (await page.request.get(base+'/data/ecrl-public-identity-v1.json')).json();
 const tally={STN:0,PL:0,DEPOT:0,YARD:0,PORT:0};
 for(const section of new Set(records.map(row=>row.section))){
  const button=panel.getByRole('button',{name:section,exact:true});
  await tap(button);
  assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.deepEqual(await panel.locator('li').evaluateAll(items=>items.map(({dataset})=>[dataset.assetId,dataset.type])),
   records.filter(row=>row.section===section).map(({assetId,type})=>[assetId,type]));
  for(const type of Object.keys(tally))tally[type]+=await panel.locator('li[data-type="'+type+'"]').count();
 }
 assert.deepEqual(tally,{STN:20,PL:7,DEPOT:2,YARD:1,PORT:2});
 await tap(panel.getByRole('button',{name:'C2',exact:true}));
 assert.equal(await panel.locator('[data-map-station]').count(),0);
 await tap(panel.getByRole('button',{name:'Puncak Alam Freight Yard',exact:true}));
 assert.equal(await panel.locator('[aria-current=true]').getAttribute('data-type'),'YARD');
 assert.match(await panel.locator('#ecrl-context-status').innerText(),/Lokasi semasa dan jajaran belum disahkan/);
 assert.deepEqual(await camera(),before);
 await page.screenshot({path:out+'/'+engine+'-'+device+'-c2-reference.png'});
 await tap(panel.getByRole('button',{name:'D',exact:true}));
 assert.equal(await panel.locator('[data-map-station]').count(),0);
 assert.match(await panel.locator('#ecrl-context-status').innerText(),/ECRL 1435 mm.*KTMB 1000 mm.*sambungan.*belum disahkan/);
 for(const [name,id] of [['Northport','ecrl-port-northport'],['Westports','ecrl-port-westports']]){
  await tap(panel.getByRole('button',{name,exact:true}));
  const active=panel.locator('[aria-current=true]');
  assert.equal(await active.getAttribute('data-asset-id'),id);
  assert.equal(await active.getAttribute('data-type'),'PORT');
  assert.deepEqual(await camera(),before);
 }
 await page.screenshot({path:out+'/'+engine+'-'+device+'-d-port-interfaces.png'});
 const bSection=panel.getByRole('button',{name:'B',exact:true});
 await tap(bSection);
 assert.equal(await panel.locator('#ecrl-context-list').evaluate(list=>list.scrollTop),0);
 assert.equal(await panel.locator('[data-asset-id="ecrl-loop-historical-06"]').count(),0);
 assert.deepEqual(await panel.locator('[data-asset-id="ecrl-depot-kuantan"]').evaluate(item=>
  [item.previousElementSibling.dataset.assetId,item.dataset.type,item.nextElementSibling.dataset.assetId]),
 ['ecrl-stn-09','DEPOT','ecrl-stn-10']);
 assert.equal(await panel.locator('#ecrl-context-list').evaluate(list=>{
  list.scrollTop=list.scrollHeight;
  return list.lastElementChild.getBoundingClientRect().bottom<=list.getBoundingClientRect().bottom+1;
 }),true);
 await tap(panel.getByRole('button',{name:'C1',exact:true}));
 assert.equal(await panel.locator('#ecrl-context-list').evaluate(list=>list.scrollTop),0);
 assert.equal(await panel.locator('#ecrl-context-list li').first().getAttribute('data-asset-id'),'ecrl-loop-historical-06');
 assert.equal(await page.locator('#search').inputValue(),'');
 assert.deepEqual(await camera(),before);
 assert.equal(new URL(page.url()).pathname,mapPath);
 assert.equal(await fullscreen.getAttribute('aria-pressed'),'true');
 assert.equal(await panel.evaluate(node=>{
  const box=node.getBoundingClientRect(),map=node.closest('.mapbox').getBoundingClientRect();
  return box.left>=map.left&&box.top>=map.top&&box.right<=map.right&&box.bottom<=map.bottom;
 }),true);
 assert.equal(await page.evaluate(()=>{
  const overlap=(a,b)=>{
   if(!a||!b||a.hidden||b.hidden)return false;
   const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
   return x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;
  };
  return !overlap(document.querySelector('.p01-v7-map-actions'),document.querySelector('.maplibregl-ctrl-attrib'))
   &&!overlap(document.querySelector('#map-error'),document.querySelector('.maplibregl-ctrl-zoom-in'));
 }),true);
 await page.screenshot({path:out+'/'+engine+'-'+device+'-composition.png'});
 await tap(panel.locator('#ecrl-context-back'));
 assert.equal(await panel.isHidden(),true);
 assert.equal(await opener.evaluate(button=>button===document.activeElement),true);
 const position=await page.evaluate(async ()=>{
  const map=window.ecrlTestMap;
  const data=await map.getSource('mrs10-v7-ecrl-localities').getData();
  const {geometry}=data.features.find(f=>f.properties.code==='STN15');
  map.jumpTo({center:geometry.coordinates,zoom:10});
  const {x,y}=map.project(geometry.coordinates);
  return {x,y};
 });
 await page.waitForFunction(({x,y})=>window.ecrlTestMap.queryRenderedFeatures([x,y],{layers:['mrs10-v7-ecrl-localities-point']})
  .some(f=>f.properties.code==='STN15'),position);
 const canvas=page.locator('#map canvas');
 if(device==='desktop')await canvas.click({position});else await canvas.tap({position});
 assert.equal(await panel.locator('[aria-current=true]').getAttribute('data-asset-id'),'ecrl-stn-14');
 assert.match(await panel.locator('#ecrl-context-detail').innerText(),/KTMB.*Temerloh.*belum disahkan/);
 await page.screenshot({path:out+'/'+engine+'-'+device+'-geographic-stn15.png'});
 await tap(panel.getByRole('button',{name:'Mentakab · KTM ERT'}));
 assert.equal(await panel.isHidden(),true);
 await page.locator('.maplibregl-popup').getByText('MENTAKAB',{exact:true}).waitFor();
 await tap(fullscreen);
 await page.locator('#filters').getByRole('button',{name:'Semua',exact:true}).click();
 assert.equal(await page.locator('#rail-lineup-panel').isVisible(),true);
 await page.locator('#theme').click();
 await page.waitForFunction(id=>window.ecrlTestMap.isStyleLoaded()&&window.ecrlTestMap.hasImage('mrs10-ecrl-station-type-2')&&
  !!window.ecrlTestMap.getLayer(id),alignmentLayer);
 await page.locator('#filters').getByRole('button',{name:'KTM',exact:true}).click();
 assert.equal(await page.evaluate(id=>window.ecrlTestMap.getLayoutProperty(id,'visibility'),alignmentLayer),'none');
 await page.locator('#filters').getByRole('button',{name:'ECRL',exact:true}).click();
 assert.equal(await page.evaluate(id=>window.ecrlTestMap.getLayoutProperty(id,'visibility'),alignmentLayer),'visible');
 const loopLayer='mrs10-v7-ecrl-loop-reference';
 const loops=await page.evaluate(async id=>{
  const map=window.ecrlTestMap,{features}=await map.getSource(id).getData();
  return {codes:features.map(f=>f.properties.code),minzoom:map.getLayer(id).minzoom,
   coordinate:features[0].geometry.coordinates};
 },loopLayer);
 assert.deepEqual(loops.codes,['PL02','PL03','PL04','PL05']);
 assert.equal(loops.minzoom,9);
 await tap(fullscreen);
 await page.waitForFunction(()=>{
  const map=window.ecrlTestMap;
  return Math.abs(map.getCanvas().clientHeight-map.getContainer().getBoundingClientRect().height)<2;
 });
 const moveTo=zoom=>page.evaluate(({center,zoom})=>{window.ecrlTestMap.jumpTo({center,zoom});},{center:loops.coordinate,zoom});
 await moveTo(8);
 await page.waitForFunction(()=>window.ecrlTestMap.areTilesLoaded());
 assert.equal(await page.evaluate(id=>window.ecrlTestMap.queryRenderedFeatures({layers:[id]}).length,loopLayer),0);
 await moveTo(10);
 await page.waitForFunction(({coordinate,id})=>{
  const map=window.ecrlTestMap,{x,y}=map.project(coordinate);
  return map.queryRenderedFeatures([x,y],{layers:[id]}).some(row=>row.properties.code==='PL02');
 },{coordinate:loops.coordinate,id:loopLayer});
 const loopPosition=await page.evaluate(c=>{const {x,y}=window.ecrlTestMap.project(c);return {x,y}},loops.coordinate);
 if(device==='desktop')await canvas.click({position:loopPosition});else await canvas.tap({position:loopPosition});
 const selectedLoop=panel.locator('[aria-current=true]');
 assert.equal(await selectedLoop.getAttribute('data-asset-id'),'ecrl-loop-historical-02');
 assert.match(await selectedLoop.innerText(),/Passing loop · rujukan kawasan/);
 await page.screenshot({path:out+'/'+engine+'-'+device+'-pl02-locality.png'});
}

async function checkRailwayHierarchy(page,engine,device){
 // Deterministic overlap fixture for two existing station identities. Never published as data.
 const coordinate=[101.58,3.17];
 const specs={
  kajang:'mrs10-v7-mrt-kajang',putrajaya:'mrs10-v7-mrt-putrajaya',
  road:'fixture-road-label',water:'fixture-water-label',place:'fixture-place-label'
 };
 await page.route('**/FeatureServer/6/query?*',route=>route.fulfill({json:{features:[
  {attributes:{STN_NAME:'Kwasa Damansara',STN_CODE:'KG01'},geometry:{x:coordinate[0],y:coordinate[1]}}
 ]},headers:{'access-control-allow-origin':'*'}}));
 await page.route('**/FeatureServer/8/query?*',route=>route.fulfill({json:{features:[
  {attributes:{STN_NAME:'Kwasa Damansara',STN_CODE:'PY01'},geometry:{x:coordinate[0],y:coordinate[1]}}
 ]},headers:{'access-control-allow-origin':'*'}}));
 await page.route(base+'/hierarchy-fixture-tiles/**',route=>route.fulfill({status:204}));
 await page.route('https://tiles.openfreemap.org/styles/**',route=>{
  const dark=route.request().url().endsWith('/dark');
  return route.fulfill({json:{
   version:8,sources:{labels:{type:'vector',tiles:[base+'/hierarchy-fixture-tiles/{z}/{x}/{y}.pbf']}},
   layers:[{id:'bg',type:'background',paint:{'background-color':dark?'#16272a':'#dce6e4'}},
    {id:specs.road,type:'symbol',source:'labels','source-layer':'transportation_name',paint:{'text-opacity':dark?0.6:0.8}},
    {id:specs.water,type:'symbol',source:'labels','source-layer':'water_name'},
    {id:specs.place,type:'symbol',source:'labels','source-layer':'place',paint:{'text-opacity':0.9}}
   ]},headers:{'access-control-allow-origin':'*'}});
 });
 assert.equal((await page.goto(base+'/unified-map-v7.html')).status(),200);
 const ready=()=>page.waitForFunction(()=>{
  const d=window.MRS10V7Diagnostics?.snapshot();
  return d?.stage==='DONE'&&d.styleLoaded&&d.webglReady&&d.layerCount>0;
 },null,{timeout:45000});
 const position=()=>page.evaluate(center=>window.ecrlTestMap.jumpTo({center,zoom:12}),coordinate);
 const snapshot=()=>page.evaluate(({specs,coordinate})=>{
  const map=window.ecrlTestMap,point=map.project(coordinate);
  return {
   pick:map.queryRenderedFeatures(point,{layers:[specs.kajang,specs.putrajaya]}).map(x=>x.layer.id),
   road:map.getPaintProperty(specs.road,'text-opacity'),
   water:map.getPaintProperty(specs.water,'text-opacity')??null,
   place:map.getPaintProperty(specs.place,'text-opacity'),
   railOpacity:map.getPaintProperty(specs.putrajaya,'circle-opacity'),
   colours:[map.getPaintProperty(specs.kajang,'circle-color'),map.getPaintProperty(specs.putrajaya,'circle-color')]
  };
 },{specs,coordinate});
 const picture=label=>page.locator('#map').screenshot({path:out+'/'+engine+'-'+device+'-'+label+'.png'});
 const waitForTop=top=>page.waitForFunction(({top,specs,coordinate})=>{
  const map=window.ecrlTestMap;
  return map?.queryRenderedFeatures(map.project(coordinate),{layers:[specs.kajang,specs.putrajaya]})[0]?.layer.id===top;
 },{top,specs,coordinate},{timeout:12000});
 await ready();
 await page.locator('#filters').getByRole('button',{name:'Semua',exact:true}).click();
 await position();
 await waitForTop(specs.putrajaya);
 const before=await snapshot();
 assert.deepEqual(before.pick,[specs.putrajaya,specs.kajang]);
 assert.equal(before.road,0.8);
 await picture('overview');
 await page.locator('#route-buttons button').filter({hasText:'MRT Kajang'}).click();
 await position();
 await waitForTop(specs.kajang);
 const focus=await snapshot();
 assert.deepEqual(focus.pick,[specs.kajang,specs.putrajaya]);
 assert.equal(focus.road,0.4);
 assert.equal(focus.water,0.5);
 assert.equal(focus.place,before.place);
 assert.equal(focus.railOpacity,0.65);
 assert.deepEqual(focus.colours,before.colours);
 await picture('railway-focus');
 await page.locator('#theme').click();
 await ready();
 await position();
 await waitForTop(specs.kajang);
 assert.equal((await snapshot()).road,0.3);
 await page.locator('#search').fill('PL 1');
 await page.locator('[data-ecrl-identity="ecrl-loop-historical-01"]').click();
 await waitForTop(specs.putrajaya);
 const context=await snapshot();
 assert.equal(context.road,0.6);
 assert.equal(context.water,null);
 assert.equal(context.railOpacity,1);
 await page.locator('#ecrl-context-back').click();
 await page.locator('#route-buttons button').filter({hasText:'MRT Kajang'}).click();
 await page.locator('#reset').click();
 assert.equal(await page.locator('#filters [aria-pressed=true]').innerText(),'ECRL');
 await page.locator('#filters').getByRole('button',{name:'Semua',exact:true}).click();
 await position();
 await waitForTop(specs.putrajaya);
 const reset=await snapshot();
 assert.equal(reset.road,0.6);
 assert.equal(reset.railOpacity,1);
 assert.deepEqual(reset.colours,before.colours);
}

async function checkMemberKeyboardSearch(page){
  const search=page.locator('#search'), searchResults=page.locator('#search-results');
  await search.fill('PL01');
  const result=searchResults.getByRole('button',{name:/ecrl-loop-historical-01/i});
  await result.waitFor();
  await search.press('ArrowDown');
  assert.equal(await result.evaluate(button=>document.activeElement===button),true);
  await result.press('ArrowUp');
  assert.equal(await search.evaluate(input=>document.activeElement===input),true);
  await search.press('ArrowDown');
  await result.press('Escape');
  assert.equal(await search.inputValue(),'');
  assert.equal(await searchResults.isHidden(),true);
  assert.equal(await search.evaluate(input=>document.activeElement===input),true);
  await search.fill('PL01');
  await search.press('ArrowDown');
  await result.press('Enter');
  await page.locator('#ecrl-no-point').waitFor();
  assert.match(await page.locator('#ecrl-no-point').innerText(),/Lokasi PL belum disahkan/);
  assert.equal(await searchResults.isHidden(),true);
  assert.equal(await search.evaluate(input=>document.activeElement===input),true);
  await page.locator('#ecrl-no-point > button').click();
}

async function checkPublicNavigation(page,engine,device){
 const otherDeployments=[];
 page.setDefaultTimeout(12000);
 const recordNavigation=frame=>{
  const url=frame.url();
  if(url.startsWith('http')&&new URL(url).origin!==new URL(base).origin)otherDeployments.push(url);
 };
 page.on('framenavigated',recordNavigation);
 try{
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.abort());
  await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('#continue').click();
  await page.waitForURL('**/gateway.html');
  await page.locator('[data-category="map"]').click();
  const stage=page.locator('[data-map-audience="public"]');
  await stage.locator('iframe[src="unified-map-v7.html"]').waitFor();
  assert.equal(await page.locator('[data-gis-reference],iframe[src="unified-map-v8.html"]').count(),0);
  await stage.locator('a[href="unified-map-v7.html"]').click();
  await page.waitForURL('**/unified-map-v7.html');
  await page.locator('#search').fill('Kajang');
  assert.ok(await page.locator('#search-results button').count()>0);
  const filter=page.locator('#filters button').last();
  await filter.click();
  assert.equal(await filter.getAttribute('aria-pressed'),'true');
  const fullscreen=page.locator('#p01-v7-fullscreen');
  await fullscreen.click();
  assert.equal(await fullscreen.getAttribute('aria-pressed'),'true');
  await page.screenshot({path:out+'/'+engine+'-'+device+'-public-fullscreen.png'});
  await page.keyboard.press('Escape');
  assert.equal(await fullscreen.getAttribute('aria-pressed'),'false');
  await page.locator('.p01-public-map-nav a[href^="map-language-lab.html"]').click();
  await page.waitForURL('**/map-language-lab.html?railPilot=1');
  await page.locator('#visitor-map canvas').waitFor({timeout:45000});
  const expand=page.locator('#map-expand');
  await expand.click();
  assert.equal(await expand.getAttribute('aria-expanded'),'true');
  await expand.click();
  assert.equal(await expand.getAttribute('aria-expanded'),'false');
  await page.locator('.p01-public-map-nav a[href="ecrl-asset-reference.html"]').click();
  await page.waitForURL('**/ecrl-asset-reference.html');
  const assets=page.locator('#asset-reference-list');
  await assets.locator('li').first().waitFor();
  assert.equal(await assets.locator('[data-type=STN]').count(),16);
  assert.equal(await assets.locator('[data-type=PL]').count(),7);
  assert.equal(await assets.locator('[data-type=DEPOT]').count(),2);
  assert.equal(await assets.getByText('STN10',{exact:false}).count(),0);
  await checkPublicAssetLookup(page);
  await page.locator('[data-asset-kind=ALL]').click();
  await page.locator('#asset-search').fill('STN12');
  assert.equal(await assets.locator('li').count(),1);
  assert.match(await assets.innerText(),/Lokasi fizikal belum disahkan/);
  await page.locator('#asset-search').fill('');
  await page.locator('[data-asset-kind=PL]').click();
  assert.equal(await assets.locator('li').count(),7);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  await page.screenshot({path:out+'/'+engine+'-'+device+'-ecrl-public.png'});
  await page.locator('.p01-public-map-nav a[href="gateway.html#map"]').click();
  await page.waitForURL('**/gateway.html#map');
  await page.locator('[data-map-audience="public"] iframe[src="unified-map-v7.html"]').waitFor();
  await page.locator('[data-map-audience="public"] a[href="unified-map-v7.html"]').click();
  await page.locator('footer a[href="./ampang-line-r219.html"]').click();
  await page.waitForURL('**/ampang-line-r219.html');
  await page.locator('a[href="./gateway.html#map"]').click();
  await page.waitForURL('**/gateway.html#map');
  await page.locator('a[href="index.html"]').first().click();
  await page.waitForURL('**/index.html');
  assert.deepEqual(otherDeployments,[]);
 }finally{page.off('framenavigated',recordNavigation)}
}
async function checkUnavailableRenderer(browser){
 const page=await browser.newPage();
 try{
  await page.route(moduleRoot+'**',r=>r.abort());
  await page.route(arcgis,emptyGis);
  for(const version of [7,8]){
   assert.equal((await page.goto(base+'/unified-map-v'+version+'.html')).status(),200);
   await page.waitForFunction(v=>window['MRS10V'+v+'Diagnostics']?.snapshot()?.stage==='DONE'&&
    document.querySelector('#lineup li')&&document.querySelector('#map-error')?.textContent.includes('gagal dimuatkan'),version);
   assert.match(await page.locator('#map-error').innerText(),/Peta geografi gagal dimuatkan/);
   assert.ok(await page.locator('#lineup li').count()>0);
  }
  console.log('P01_MAPLIBRE_UNAVAILABLE_CATALOGUE_PASS V7 V8');
 }finally{await page.close()}
}
for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch({headless:true,args:engine==='chromium'?['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']:[]});
 try{
  if(!batchOnly&&!sharedOnly&&!hierarchyOnly&&!compositionOnly&&engine==='chromium')await checkUnavailableRenderer(browser);
  for(const [device,width,height] of profiles){
   if((batchOnly||sharedOnly||hierarchyOnly)&&!["desktop","iphone"].includes(device))continue;
   const page=await browser.newPage({viewport:{width,height},hasTouch:device!=='desktop',isMobile:device!=='desktop'});
   // Run the local smoke test with the application's opt-out for external analytics.
   await page.addInitScript(()=>Object.defineProperty(navigator,'globalPrivacyControl',{value:true}));
   const errors=[];
   const localFailures=[];
   page.on('response',r=>{if(r.url().startsWith(base+'/')&&!r.ok())localFailures.push(new URL(r.url()).pathname)});
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(/^V8_MAP_LAYER_INSTALL_FAILED/.test(m.text())) errors.push(m.text())});
   const allowedAssets=new Set(['maplibre-gl.css','maplibre-gl.mjs','maplibre-gl-shared.mjs','maplibre-gl-worker.mjs']);
   await page.route(moduleRoot+'**',async r=>{
    const name=new URL(r.request().url()).pathname.split('/').pop();
    assert.ok(allowedAssets.has(name),name);
    return r.fulfill({
     path:vendor+'/'+name,contentType:name.endsWith('.css')?'text/css':'application/javascript',
     headers:{'access-control-allow-origin':'*'}
    });
   });
   await page.route(base+'/assets/p01-maplibre.js',r=>r.fulfill({body:loaderWithProbe,contentType:'application/javascript'}));
   await page.route('https://tiles.openfreemap.org/styles/**', r=>r.fulfill({json:{version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#dce6e4'}}]},headers:{'access-control-allow-origin':'*'}}));
   await page.route(arcgis,emptyGis);
   try{
    if(compositionOnly){
     await checkMapComposition(page,engine,device);
     if(device==='desktop'){
      await checkSharedIdentity(page);
      await checkAlignmentRetry(page);
      assert.equal((await page.goto(base+'/unified-map-v8.html')).status(),200);
      const lanchang=await page.evaluate(()=>{
       const {dataContract}=window.MRS10P01MapCore.createEcrlContext();
       const current=dataContract.records.find(row=>row.code==='PL06');
       const evidence=window.MRS10ECRLAlignmentEvidence.passingLoops.find(row=>row.code==='PL06');
       return {contractSection:current.section,evidenceSection:evidence.section,historicalSection:evidence.historicalSection};
      });
      assert.deepEqual(lanchang,{contractSection:'C1',evidenceSection:'C1',historicalSection:'B'});
     }
     assert.deepEqual(errors,[]);
     assert.ok(localFailures.every(path=>path==='/data/ecrl-public-identity-v1.json'||
      device==='desktop'&&path==='/data/ecrl-reference-alignment.geojson'));
     rows.push({engine,device,status:'PASS',mapComposition:true,physicalLayersUnchanged:true,
      plReferenceMarkers:4,alignmentRetry:device==='desktop',touch:device!=='desktop'});
     continue;
    }
    if(hierarchyOnly){
     await checkRailwayHierarchy(page,engine,device);
     assert.deepEqual(errors,[]);
     assert.deepEqual(localFailures,[]);
     rows.push({engine,device,status:'PASS',railwayHierarchy:true,renderedOverlap:true,basemapLabelFocus:true});
     continue;
    }
    if(sharedOnly){
     await checkSharedIdentity(page);
     assert.deepEqual(errors,[]);
     assert.ok(localFailures.every(path=>path==='/data/ecrl-public-identity-v1.json'));
     rows.push({engine,device,status:'PASS',sharedIdentity:true,g1DataStaticBoundary:true,referenceContext:true});
     continue;
    }
    if(batchOnly){
     assert.equal((await page.goto(base+'/ecrl-asset-reference.html')).status(),200);
     await checkPublicAssetLookup(page);
     assert.equal((await page.goto(base+'/unified-map-v8.html')).status(),200);
     await page.waitForFunction(()=>{
      const d=window.MRS10V8Diagnostics?.snapshot();
      return d?.stage==='DONE'&&d.styleLoaded&&d.webglReady&&d.ecrl?.layersPresent;
     },null,{timeout:45000});
     await checkMemberKeyboardSearch(page);
     assert.equal(await page.evaluate(()=>window.MRS10V8Diagnostics.snapshot().ecrl.physicalSegments),0);
     assert.deepEqual(errors,[]);
     assert.deepEqual(localFailures,[]);
     rows.push({engine,device,status:'PASS',publicAssetLookup:true,memberKeyboardSearch:true});
     continue;
    }
    await checkPublicNavigation(page,engine,device);
    assert.equal((await page.goto(base+'/unified-map-v7.html')).status(),200);
    await page.waitForFunction(()=>{
     const d=window.MRS10V7Diagnostics?.snapshot();
     return d?.stage==='DONE'&&d.styleLoaded&&d.webglReady&&d.layerCount>0;
    },null,{timeout:45000});
    assert.equal(await page.evaluate(()=>window.ecrlTestVersion),'6.13.0');
    assert.equal((await page.goto(base+'/unified-map-v8.html')).status(),200);
    assert.equal(await page.evaluate(()=>window.ecrlTestVersion),'6.13.0');
    assert.equal(await page.evaluate(()=>window.MRS10RailwayDataContractV1.VERSION),1);
    assert.equal(await page.locator('.mrs10-product-badge').innerText(),'MR-S10 · Railway Intelligence');
    await page.waitForFunction(()=>{const d=window.MRS10V8Diagnostics?.snapshot();return d?.stage==='DONE'&&d.styleLoaded&&d.webglReady&&d.ecrl?.layersPresent},null,{timeout:45000});
    await checkMemberKeyboardSearch(page);
    await page.locator('#filters').getByRole('button',{name:'ECRL',exact:true}).click();
    await page.locator('#map-fullscreen').click();
    const panel=page.locator('#ecrl-schematic');
    assert.equal(await panel.locator('[data-schematic-asset]').count(),25);
    assert.deepEqual(await page.evaluate(()=>window.ecrlTestMap.getLayoutProperty('mrs10-v8-ecrl-infra-station-marker','icon-size')),
     ['step',['zoom'],0.62,8,0.82,12,1]);
    for(const [tier,zoom,pl,depot,spur] of [['far',7,0,0,0],['mid',9,7,0,0],['near',12,7,2,7]]){
     await page.evaluate(z=>window.ecrlTestMap.jumpTo({center:[103,3.8],zoom:z}),zoom);
     await page.waitForFunction(k=>document.querySelector('#ecrl-schematic').dataset.detail===k,tier);
     if(tier==='far')await panel.locator('summary').click();
     assert.match(await panel.innerText(),/bukan peta jajaran fizikal/);
     for(const [type,n] of [['stn',16],['pl',pl],['depot',depot],['spur',spur]])
      assert.equal(await panel.locator('.ecrl-schematic-'+type+':visible').count(),n);
     const size=await panel.locator('.ecrl-schematic-stn .ecrl-design-icon').first().evaluate(n=>n.getBoundingClientRect().width);
     assert.equal(size,34);
     if(pl)assert.equal(await panel.locator('.ecrl-schematic-pl .ecrl-design-icon').first().evaluate(n=>n.getBoundingClientRect().width),26);
     if(depot)assert.equal(await panel.locator('.ecrl-schematic-depot .ecrl-design-icon').first().evaluate(n=>n.getBoundingClientRect().width),26);
     const panelBox=await panel.boundingBox(), fullscreenBox=await page.locator('#map-fullscreen').boundingBox();
     assert.ok(panelBox.x>=fullscreenBox.x+fullscreenBox.width);
     if(device==='iphone'||tier==='near')await page.screenshot({path:`${out}/${engine}-${device}-${tier}.png`});
    }
    await panel.locator('[data-schematic-asset="ecrl-loop-historical-01"]').click();
    await page.locator('#ecrl-no-point').waitFor();
    assert.match(await page.locator('#ecrl-no-point').innerText(),/Lokasi PL belum disahkan/);
    await page.locator('#ecrl-no-point > button').click();
    assert.equal(await page.evaluate(()=>window.MRS10ECRLCandidateQA.inspectAsset('ecrl-stn-11')),true);
    const canvas=page.locator('#map canvas');
    const hit=await page.waitForFunction(()=>{
     const m=window.ecrlTestMap,n='mrs10-v8-ecrl-infra';
     const info=m?.getImage(n+'-train');
     if(!info||!m.isStyleLoaded())return null;
     const matched=m.queryRenderedFeatures({layers:[n+'-station-marker']}).find(f=>f.properties.assetId==='ecrl-stn-11');
     if(!matched)return null;
     return {size:info.data.width/info.pixelRatio,point:m.project(matched.geometry.coordinates)};
    },null,{timeout:10000});
    const {point,size}=await hit.jsonValue();
    assert.equal(size,34);
    await canvas.click({position:point});
    const popup=page.locator('.p01-map-popup');
    await popup.getByText('STN12 · Kota SAS',{exact:true}).waitFor();
    const measure=()=>page.evaluate(()=>{
     const bounds=s=>document.querySelector(s).getBoundingClientRect();
     const p=bounds('.p01-map-popup'),c=bounds('.maplibregl-popup-close-button');
     const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
     const controls=['#map-fullscreen','#my-location','.maplibregl-ctrl-top-right'];
     return {inside:p.top>=0&&p.left>=0&&p.bottom<=innerHeight+1&&p.right<=innerWidth+1,
      obstruction:controls.some(s=>overlaps(p,bounds(s))),
      closeVisible:c.top>=p.top&&c.bottom<=p.bottom&&c.width>=44&&c.height>=44};
    });
    assert.deepEqual(await measure(),{inside:true,obstruction:false,closeVisible:true});
    await popup.locator('.ecrl-engineering > summary').click();
    assert.equal(await popup.locator('.ecrl-engineering').evaluate(e=>e.open),true);
    assert.ok(await popup.locator('.maplibregl-popup-content').evaluate(e=>{
     e.scrollTop=e.scrollHeight;
     return e.scrollTop>0;
    }));
    assert.deepEqual(await measure(),{inside:true,obstruction:false,closeVisible:true});
    await page.screenshot({path:`${out}/${engine}-${device}-popup.png`});
    await popup.locator('.maplibregl-popup-close-button').click();
    await popup.waitFor({state:'detached'});
    const fullscreen=page.locator('#map-fullscreen');
    await fullscreen.click();
    await page.waitForFunction(()=>!document.fullscreenElement&&!document.querySelector('.mapbox').classList.contains('is-fullscreen'));
    await page.locator('.mapbox').evaluate(box=>{
     box.requestFullscreen=()=>Promise.reject(new Error('Fullscreen API unavailable'));
    });
    await fullscreen.click();
    await page.waitForFunction(()=>!document.querySelector('#map-fullscreen').disabled);
    assert.equal(await fullscreen.getAttribute('aria-label'),'Keluar daripada skrin penuh');
    assert.equal(await fullscreen.getAttribute('aria-pressed'),'true');
    assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
    await canvas.focus();
    await page.keyboard.press('Escape');
    assert.equal(await fullscreen.getAttribute('aria-label'),'Skrin penuh');
    assert.equal(await fullscreen.getAttribute('aria-pressed'),'false');
    assert.equal(await fullscreen.evaluate(button=>document.activeElement===button),true);
    assert.equal(await page.locator('.mapbox.is-fullscreen').count(),0);
    await fullscreen.click();
    await fullscreen.click();
    await page.waitForFunction(()=>document.querySelector('#map-fullscreen').getAttribute('aria-pressed')==='false');
    assert.equal(await page.evaluate(()=>window.MRS10V8Diagnostics.snapshot().ecrl.physicalSegments),0);
    assert.deepEqual(errors,[]);
    assert.deepEqual(localFailures,[]);
    rows.push({engine,device,status:'PASS',maplibre:'6.13.0',publicV7:true,publicNavigation:true,tiers:[[16,0,0,0],[16,7,0,0],[16,7,2,7]],stationPopup:true,popupScroll:true,controlsClear:true,plNoPoint:true,fullscreenFallbackEscape:true});
   }catch(e){rows.push({engine,device,status:'FAIL',error:String(e.stack||e)});await page.screenshot({path:`${out}/${engine}-${device}-fail.png`}).catch(()=>{})}
   finally{await fs.writeFile(out+'/visual-qa.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.at(-1)));await page.close()}
  }
 }finally{await browser.close()}
}
if(rows.some(row=>row.status==='FAIL'))process.exitCode=1;
