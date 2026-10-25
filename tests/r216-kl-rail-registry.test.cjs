const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=x=>fs.readFileSync(path.join(__dirname,'..',x),'utf8');
const api=require('../assets/railway-track-registry-kl.js');
test('R2.16 official-reference registry has 10 service routes and no invented physical tracks',()=>{
 const c=api.catalog;
 assert.equal(c.routes.length,10);
 assert.equal(c.physicalSegments.length,0);
 assert.equal(api.validateRegistry(),true);
 assert.equal(new Set(c.routes.map(r=>r.id)).size,c.routes.length);
 for(const route of c.routes){
  assert.equal(route.geometry,null);
  assert.deepEqual(route.physicalTrackIds,[]);
  assert.deepEqual(route.vectorFeatureIds,[]);
  assert.equal(route.geometryStatus,'UNVERIFIED');
  assert.equal(route.physicalTrackStatus,'UNVERIFIED');
  assert(route.sourceUrls.every(u=>typeof u==='string'&&u.startsWith('https://')));
 }
 assert.equal(api.findRoute('unknown'),null);
});
test('R2.16.1 operator sources confirm ERL and 29-stop MRT Kajang service sequences',()=>{
 const route=api.findRoute('erl-klia-transit'),names=route.stationSequence.map(id=>api.catalog.stations.find(s=>s.id===id)?.name);
 assert.equal(route.stationSequenceStatus,'SOURCE_CONFIRMED');
 assert.deepEqual(names,['KL Sentral','Bandar Tasik Selatan','Putrajaya & Cyberjaya','Salak Tinggi','KLIA T1','KLIA T2']);
 assert.equal(api.catalog.routes.filter(x=>x.stationSequenceStatus==='SOURCE_CONFIRMED').length,3);
 assert(api.catalog.routes.filter(x=>x.stationSequenceStatus==='NOT_YET_VERIFIED').every(x=>!x.stationSequence.length));
 const mapPois=api.catalog.stations.filter(s=>s.confidence==='OWNER_SAFARI_VECTOR_POI');
 assert.deepEqual(mapPois.map(x=>x.name),['Maharajalela','Pasar Seni']);
 assert(mapPois.every(x=>x.linkedRouteId===null));
});
test('R2.16.1 Kajang official 29 stops and 28 passenger-service adjacency pairs are NOT physical track segments',()=>{
 const c=api.catalog,r=api.findRoute('mrt-kajang');
 assert.equal(r.stationSequence.length,29);
 assert.equal(r.stationSequenceStatus,'SOURCE_CONFIRMED');
 assert.equal(r.serviceAdjacencies.length,28);
 const names=r.stationSequence.map(id=>c.stations.find(st=>st.id===id)?.name);
 assert.equal(names[0],'Kwasa Damansara');
 assert.equal(names[1],'Kwasa Sentral');
 assert.equal(names[11],'Pasar Seni');
 assert.equal(names[14],'Tun Razak Exchange (TRX)');
 assert.equal(names[28],'Kajang');
 assert.equal(new Set(names).size,29);
 assert(!names.includes('Sungai Buloh'));
 assert(!names.includes('Kampung Selamat'));
 assert.equal(c.sourceAudit.mrtKajang.stationCount,29);
 assert.match(c.sourceAudit.mrtKajang.conflict,/28 entries/);
 assert.match(r.sourceUrls[0],/^https:\/\/www\.mymrt\.com\.my\//);
 assert(r.serviceAdjacencies.every((e,i)=>e.fromStationId===r.stationSequence[i]&&
   e.toStationId===r.stationSequence[i+1]&&e.relation==='CONSECUTIVE_SERVICE_STOPS'&&
   e.physicalTrackId===null&&e.geometry===null));
 assert.equal(c.physicalSegments.length,0);
 const clone=JSON.parse(JSON.stringify(c));
 clone.routes.find(x=>x.id==='mrt-kajang').serviceAdjacencies[0].physicalTrackId='T1';
 assert.equal(api.validateRegistry(clone),false,'do not smuggle physical track IDs into service edges');
});
test('R2.16 validation rejects fabricated coordinates or asserted station order',()=>{
 const clone=JSON.parse(JSON.stringify(api.catalog));
 clone.routes[0].geometry={type:'LineString',coordinates:[[101.7,3.1],[101.8,3.2]]};
 assert.equal(api.validateRegistry(clone),false);
 clone.routes[0].geometry=null;
 clone.routes[0].stationSequence=['kl-sentral'];
 assert.equal(api.validateRegistry(clone),false);
 clone.routes[0].stationSequence=[];clone.physicalSegments.push({physicalTrackId:'P1'});
 assert.equal(api.validateRegistry(clone),false);
});
function boot(search='?railPilot=1'){
 const w=new JSDOM(read('map-language-lab.html'),{url:'https://qa.example/map-language-lab.html'+search,runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={osm:{type:'vector'}};}
  addControl(){}
  on(ev,fn){(this.handlers[ev]??=[]).push(fn);}
  fire(ev,arg){for(const fn of (this.handlers[ev]||[]))fn(arg||{});}
  isStyleLoaded(){return true;}
  getStyle(){return {sources:this.sources,layers:[
   {id:'rail-line',source:'osm','source-layer':'transportation',type:'line'},
   {id:'pois',source:'osm','source-layer':'poi',type:'circle'},
   {id:'labels',source:'osm',type:'symbol',layout:{'text-field':['get','name']}},
   ...this.layers]};}
  getLayer(id){return this.layers.find(x=>x.id===id)}
  getSource(id){return this.sources[id]}
  addSource(id,x){this.sources[id]=x}
  addLayer(l){this.layers.push(l)}
  setLayoutProperty(){}
  resize(){}flyTo(){}queryRenderedFeatures(){return []}
  setStyle(){this.fire('style.load');}
  getCanvasContainer(){return w.document.getElementById('visitor-map')}
 }
 class Popup{setLngLat(){return this}setDOMContent(){return this}addTo(){return this}remove(){}isOpen(){return false}}
 class Marker{
  constructor({element}){this.element=element}
  setLngLat(){return this}setPopup(){return this}addTo(){return this}remove(){}
  getElement(){return this.element}getPopup(){return {isOpen:()=>false}}
 }
 w.maplibregl={Map,Popup,Marker,NavigationControl:class{}};
 w.eval(read('assets/railway-track-registry-kl.js'));
 w.eval(read('assets/map-language-lab.js'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return{w,doc:w.document,map};
}
test('R2.16 registry stays collapsed and outside map; Malaysia pilot shows read-only catalogue',()=>{
 const {w,doc}=boot();
 const panel=doc.getElementById('kl-registry'),map=doc.getElementById('map-shell'),select=doc.getElementById('kl-registry-route');
 assert.equal(panel.hidden,false);
 assert.equal(panel.open,false);
 assert.equal(map.contains(panel),false);
 assert.equal(select.options.length,10);
 assert.match(doc.getElementById('kl-registry-counts').textContent,/3 turutan laluan disahkan/);
 assert.match(doc.getElementById('kl-registry-counts').textContent,/0 trek fizikal disahkan/);
 assert.equal(doc.getElementById('kl-registry-station-order').hidden,true);
 select.value='erl-klia-transit';select.dispatchEvent(new w.Event('change'));
 assert.equal(doc.getElementById('kl-registry-station-order').querySelectorAll('li').length,6);
 select.value='mrt-kajang';select.dispatchEvent(new w.Event('change'));
 const kajangItems=Array.from(doc.getElementById('kl-registry-station-order').querySelectorAll('li')).map(x=>x.textContent);
 assert.equal(kajangItems.length,29);
 assert.deepEqual(kajangItems.slice(0,2),['Kwasa Damansara','Kwasa Sentral']);
 assert.equal(kajangItems.at(-1),'Kajang');
 assert.match(doc.getElementById('kl-registry-route-status').textContent,/Turutan perhentian disahkan/);
 assert(doc.getElementById('kl-registry-sources').querySelector('a[href^="https://"]'));
 w.close();
});
test('R2.16 route inventory is limited to Malaysia pilot, and language updates only the UI',()=>{
 const{w,doc}=boot();
 doc.querySelector('[data-locale="en"]').click();
 assert.match(doc.getElementById('kl-registry-title').textContent,/Registry/);
 doc.querySelector('[data-region="thailand"]').click();
 assert.equal(doc.getElementById('kl-registry').hidden,true);
 doc.querySelector('[data-region="china"]').click();
 assert.equal(doc.getElementById('kl-registry').hidden,true);
 doc.querySelector('[data-region="malaysia"]').click();
 assert.equal(doc.getElementById('kl-registry').hidden,false);
 assert.equal(doc.getElementById('kl-registry-route').options.length,10);
 w.close();
 const standard=boot('');
 assert.equal(standard.doc.getElementById('kl-registry').hidden,true,'ordinary map has no pilot registry');
 standard.w.close();
});
