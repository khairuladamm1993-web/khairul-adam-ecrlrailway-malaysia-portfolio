const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=x=>fs.readFileSync(path.join(__dirname,'..',x),'utf8');
const api=require('../assets/railway-track-registry-kl.js');
const html=read('map-language-lab.html'),script=read('assets/map-language-lab.js');
test('R2.18: 37 ordered coded KJ stations and 36 service-only adjacencies',()=>{
 const c=api.catalog,r=api.findRoute('lrt-kelana-jaya');
 assert.equal(r.stationSequenceStatus,'SOURCE_CONFIRMED');
 assert.equal(r.stationSequence.length,37);assert.equal(r.serviceAdjacencies.length,36);
 assert.equal(c.sourceAudit.kelanaJaya.stationCount,37);
 const stops=r.stationSequence.map(id=>c.stations.find(s=>s.id===id));
 assert.deepEqual(stops.map(s=>s.code),Array.from({length:37},(_,i)=>'KJ'+(i+1)));
 assert.equal(stops[0].name,'Gombak');assert.equal(stops[13].name,'Pasar Seni');
 assert.equal(stops[14].name,'KL Sentral');assert.equal(stops.at(-1).name,'Putra Heights');
 assert(r.serviceAdjacencies.every(e=>e.geometry===null&&e.physicalTrackId===null));
 assert.equal(r.geometry,null);assert.deepEqual(r.vectorFeatureIds,[]);
 assert.equal(c.physicalSegments.length,0);assert(api.validateRegistry());
 assert.equal(r.serviceIdentity.light,'#D50032');
 assert.equal(r.serviceIdentity.physicalAlignmentStatus,'UNVERIFIED');
 assert.equal(api.findRoute('mrt-kajang').visualIdentity.light,'#087D43');
 assert.match(r.sourceUrls[0],/^https:\/\/myrapid.com.my\//);
 assert.match(c.sourceAudit.kelanaJaya.codeStatus,/SECONDARY_DIRECTORY/);
});
test('R2.18: candidate matching needs exact KJ code+name; reject shared names/contradictions',()=>{
 for(const [name,position] of [['KJ1 Gombak',1],['KJ14 Pasar Seni',14],['KJ15 KL Sentral',15],['KJ37 Putra Heights',37]]){
  const x=api.matchSourcedKelanaPoi({class:'railway',subclass:'subway',name});
  assert.equal(x.stopPosition,position);assert.equal(x.stopCount,37);
  assert.match(x.status,/CANDIDATE/);assert.equal(x.geometry,null);
 }
 for(const props of [null,{}, {class:'railway',subclass:'station',name:'Pasar Seni'},
  {class:'railway',subclass:'station',name:'KL Sentral'},
  {class:'railway',subclass:'station',name:'KG16 Pasar Seni'},
  {class:'railway',subclass:'station',name:'KJ15 Pasar Seni'},
  {class:'railway',subclass:'station',name:'KJ14 Pasar Seni','name:en':'Wrong'},
  {class:'railway',subclass:'halt',name:'KJ37 Putra Heights'},
  {class:'transit',subclass:'subway',name:'KJ1 Gombak'}])
  assert.equal(api.matchSourcedKelanaPoi(props),null);
});
test('R2.18: ruby registry HTML preserves existing green styles, scroll and theme',()=>{
 assert.match(html,/--kj-ruby:#D50032/);
 assert.match(html,/--kj-text:#FF8CA5/);
 assert.match(html,/\.kl-registry\[data-route="lrt-kelana-jaya"\] \.kl-registry-stations li::before/);
 assert.match(html,/max-height:min\(43dvh,340px\)/);
 assert.match(html,/--kg-green:#087D43/);
});
function boot(){
 const w=new JSDOM(html,{url:'https://qa.example/map-language-lab.html?railPilot=1',runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={osm:{type:'vector'}};}
  addControl(){}on(e,fn){(this.handlers[e]??=[]).push(fn)}fire(e,p){for(const fn of this.handlers[e]||[])fn(p||{})}
  isStyleLoaded(){return true}
  getStyle(){return{sources:this.sources,layers:[
   {id:'rail',type:'line',source:'osm','source-layer':'transportation'},
   {id:'poi',type:'circle',source:'osm','source-layer':'poi'},...this.layers]}}
  getLayer(id){return this.layers.find(l=>l.id===id)||null}
  getSource(id){return this.sources[id]||null}
  addSource(id,x){this.sources[id]=x}
  addLayer(x){this.layers.push(x)}
  setLayoutProperty(id,k,v){const l=this.getLayer(id);if(l){l.layout||={};l.layout[k]=v}}
  queryRenderedFeatures(_b,opt){return opt?.layers?.includes('mrl-pilot-stations')?
   [{layer:{id:'mrl-pilot-stations'},properties:{class:'railway',subclass:'subway',name:'KJ14 Pasar Seni','name:en':'Pasar Seni'}}]:[]}
  resize(){}flyTo(){}setStyle(){this.layers=[];this.fire('style.load')}
  getCanvasContainer(){return w.document.getElementById('visitor-map')}
 }
 class Popup{setLngLat(){return this}setDOMContent(n){this.node=n;return this}
  addTo(){map.popup=this;return this}remove(){}isOpen(){return false}}
 class Marker{
  constructor({element}){this.element=element}setLngLat(){return this}setPopup(){return this}
  addTo(){return this}remove(){}getElement(){return this.element}getPopup(){return{isOpen:()=>false}}
 }
 w.maplibregl={Map,Popup,Marker,NavigationControl:class{}};
 w.eval(read('assets/railway-track-registry-kl.js'));
 w.eval(script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 map.fire('style.load');return{w,map,doc:w.document};
}
test('R2.18: source-coded KJ POI is ruby only on selected Malaysian service; Kajang preserved',()=>{
 const{w,map,doc}=boot(),sel=doc.getElementById('kl-registry-route');
 const layer=map.getLayer('mrl-kelana-code-poi'),kg=map.getLayer('mrl-kajang-known-poi');
 assert(layer);assert.equal(layer.source,'osm');assert.equal(layer['source-layer'],'poi');
 assert.equal(layer.paint['circle-color'],'#D50032');
 assert.equal(layer.layout.visibility,'none');assert(kg);
 sel.value='lrt-kelana-jaya';sel.dispatchEvent(new w.Event('change'));
 assert.equal(layer.layout.visibility,'visible');
 assert.equal(doc.querySelectorAll('#kl-registry-station-order li').length,37);
 assert.match(doc.querySelector('#kl-registry-station-order li').textContent,/KJ1 · Gombak/);
 assert.equal(kg.layout.visibility,'none');assert.equal(map.getLayer('mrl-kelana-alignment'),null);
 doc.querySelector('[data-locale="en"]').click();
 assert.match(doc.getElementById('kl-registry-route-status').textContent,/Ruby = service identity/);
 map.fire('click',{point:{x:50,y:60},lngLat:{lng:101.7,lat:3.1}});
 assert.match(map.popup.node.textContent,/14\/37/);
 assert.match(map.popup.node.textContent,/candidate/);
 doc.getElementById('theme-btn').click();assert.equal(sel.value,'lrt-kelana-jaya');
 doc.querySelector('[data-region="thailand"]').click();assert.equal(layer.layout.visibility,'none');
 doc.querySelector('[data-region="china"]').click();assert.equal(layer.layout.visibility,'none');
 doc.querySelector('[data-region="malaysia"]').click();assert.equal(doc.getElementById('kl-registry').hidden,false);
 sel.value='mrt-kajang';sel.dispatchEvent(new w.Event('change'));
 assert.equal(kg.layout.visibility,'visible');assert.equal(layer.layout.visibility,'none');
 w.close();
});
