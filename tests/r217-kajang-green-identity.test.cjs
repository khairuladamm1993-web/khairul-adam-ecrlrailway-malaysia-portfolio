const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=require('../assets/railway-track-registry-kl.js');
const html=read('map-language-lab.html'),script=read('assets/map-language-lab.js');
test('R2.17: official Kajang green identity covers 29 ordered service stops, without physical-track claims',()=>{
 const route=api.findRoute('mrt-kajang');
 assert.equal(route.stationSequence.length,29);
 assert.deepEqual(route.visualIdentity,{
  name:'Kajang Line Green',light:'#087D43',dark:'#50E2A0',
  use:'SERVICE_AND_VERIFIED_STATION_REFERENCE_ONLY',physicalAlignmentStatus:'UNVERIFIED'
 });
 assert.equal(route.stationSequence[0],'mrt-kwasa-damansara');
 assert.equal(route.stationSequence[28],'mrt-kajang');
 assert(route.serviceAdjacencies.every(e=>e.geometry===null&&e.physicalTrackId===null));
 assert.equal(api.catalog.physicalSegments.length,0);
 assert.equal(api.osmRelationAudit.acceptedWayIds.length,0);
 assert(api.catalog.routes.filter(r=>r.id!=='mrt-kajang').every(r=>r.visualIdentity===null));
});
test('R2.17: mobile registry styles 29 numbered green nodes, with contrasting Dark Mode colour',()=>{
 assert.match(html,/--kg-green:#087D43/);
 assert.match(html,/:root\[data-theme="dark"\]\{--kg-green:#087D43;--kg-text:#50E2A0\}/);
 assert.match(html,/\.kl-registry\[data-route="mrt-kajang"\] \.kl-registry-stations li::before/);
 assert.match(html,/content:counter\(kg-stop\)/);
 assert.match(html,/\.campus-popup\.kajang-match/);
 assert.match(html,/max-height:min\(43dvh,340px\)/);
});
function start(){
 const w=new JSDOM(html,{url:'https://qa.example/map-language-lab.html?railPilot=1',runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={osm:{type:'vector'}};}
  addControl(){}on(e,fn){(this.handlers[e]??=[]).push(fn)}
  fire(e,arg){for(const f of this.handlers[e]||[])f(arg||{})}
  getStyle(){return {sources:this.sources,layers:[
   {id:'rails-base',type:'line',source:'osm','source-layer':'transportation'},
   {id:'pois-base',type:'circle',source:'osm','source-layer':'poi'},
   {id:'label',type:'symbol',source:'osm',layout:{'text-field':['get','name']}},
   ...this.layers]}}
  getLayer(id){return this.layers.find(l=>l.id===id)||null}
  getSource(id){return this.sources[id]||null}
  addSource(id,src){this.sources[id]=src}
  addLayer(l){this.layers.push(l)}
  setLayoutProperty(id,key,val){const l=this.getLayer(id);if(l){l.layout||={};l.layout[key]=val;}}
  resize(){}flyTo(){}setStyle(){this.layers=[];this.fire('style.load')}
  queryRenderedFeatures(){return []}
  getCanvasContainer(){return w.document.getElementById('visitor-map')}
 }
 class Popup{setLngLat(){return this}setDOMContent(){return this}addTo(){return this}remove(){}isOpen(){return false}}
 class Marker{
  constructor({element}){this.element=element}setLngLat(){return this}setPopup(){return this}
  addTo(){return this}remove(){}getElement(){return this.element}getPopup(){return{isOpen:()=>false}}
 }
 w.maplibregl={Map,Popup,Marker,NavigationControl:class{}};
 w.eval(read('assets/railway-track-registry-kl.js'));
 w.eval(script);
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 map.fire('style.load');
 return{w,map,doc:w.document};
}
test('R2.17: all 29 list items become green only when MRT Kajang selected, and other routes are unchanged',()=>{
 const{w,map,doc}=start();
 const container=doc.getElementById('kl-registry'),selector=doc.getElementById('kl-registry-route');
 assert.notEqual(container.dataset.route,'mrt-kajang');
 selector.value='mrt-kajang';selector.dispatchEvent(new w.Event('change'));
 assert.equal(container.dataset.route,'mrt-kajang');
 assert.equal(doc.querySelectorAll('#kl-registry-station-order li').length,29);
 assert.match(doc.getElementById('kl-registry-route-status').textContent,/bukan jajaran fizikal/);
 selector.value='ktm-batu-caves-pulau-sebang';selector.dispatchEvent(new w.Event('change'));
 assert.equal(container.dataset.route,'ktm-batu-caves-pulau-sebang');
 assert.equal(doc.getElementById('kl-registry-station-order').hidden,true);
 w.close();
});
test('R2.17: only exact source-backed KG16/KG35 map POIs turn green; no whole alignment recolouring',()=>{
 const {w,map,doc}=start();
 const layer=map.getLayer('mrl-kajang-known-poi');
 assert(layer,'source-backed highlight must be installed');
 assert.equal(layer.type,'circle');
 assert.equal(layer.source,'osm');
 assert.equal(layer['source-layer'],'poi');
 assert.deepEqual(layer.filter[3][2][1],['KG16 Pasar Seni','KG35 Kajang']);
 assert.equal(layer.paint['circle-color'],'#087D43');
 assert.equal(layer.layout.visibility,'none');
 const selector=doc.getElementById('kl-registry-route');
 selector.value='mrt-kajang';selector.dispatchEvent(new w.Event('change'));
 assert.equal(layer.layout.visibility,'visible');
 assert(map.getLayer('mrl-pilot-stations'),'existing source-backed hit layer preserved');
 assert(map.getLayer('mrl-pilot-rail-hits'),'existing rail hit layer preserved');
 assert.equal(map.getLayer('mrl-kajang-alignment'),null,'do not invent railway line geometry');
 selector.value='lrt-kelana-jaya';selector.dispatchEvent(new w.Event('change'));
 assert.equal(layer.layout.visibility,'none');
 selector.value='mrt-kajang';selector.dispatchEvent(new w.Event('change'));
 doc.querySelector('[data-region="thailand"]').click();
 assert.equal(layer.layout.visibility,'none');
 w.close();
});
test('R2.17: Dark Mode and language selection preserve service identity without changing geometry',()=>{
 const{w,map,doc}=start(),select=doc.getElementById('kl-registry-route');
 select.value='mrt-kajang';select.dispatchEvent(new w.Event('change'));
 doc.querySelector('[data-locale="en"]').click();
 assert.match(doc.getElementById('kl-registry-route-status').textContent,/Green = service identity/);
 doc.getElementById('theme-btn').click();
 assert.equal(doc.getElementById('kl-registry').dataset.route,'mrt-kajang');
 assert.equal(doc.querySelectorAll('#kl-registry-station-order li').length,29);
 assert.equal(api.catalog.physicalSegments.length,0);
 w.close();
});
