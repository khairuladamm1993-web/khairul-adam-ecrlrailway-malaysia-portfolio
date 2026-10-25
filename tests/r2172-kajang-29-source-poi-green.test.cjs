'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=require('../assets/railway-track-registry-kl.js');
const station=(name,english)=>({class:'railway',subclass:'subway',name,...(english?{'name:en':english}:{})});
test('R2.17.2: crosswalk covers all 29 operator-confirmed service stations using code and exact name',()=>{
 const route=api.findRoute('mrt-kajang');
 assert.equal(route.stationSequence.length,29);
 const candidates=api.kajangServicePoiCandidates,ids=[...new Set(candidates.map(c=>c.stationId))];
 assert.equal(ids.length,29);
 assert.deepEqual(ids,route.stationSequence);
 assert.equal(api.kajangPoiSourceNames.length,candidates.length);
 assert.equal(new Set(api.kajangPoiSourceNames).size,candidates.length);
 const codes=[...new Set(candidates.map(c=>c.code))];
 assert.equal(codes.length,29);
 assert(codes.includes('KG18A'),'not all KG codes are consecutive integers');
 assert(!codes.includes('KG11')&&!codes.includes('KG19')&&!codes.includes('KG32'));
 assert.equal(candidates.filter(c=>c.confidence==='OWNER_SAFARI_SOURCE_LABEL_OBSERVED').length,3);
 assert(candidates.some(c=>c.raw==='KG13 Pusat Bandar Damansara'));
 assert(candidates.some(c=>c.raw==='KG16 Pasar Seni'));
 assert(candidates.some(c=>c.raw==='KG35 Kajang'));
 assert.equal(api.osmRelationAudit.acceptedWayIds.length,0);
 assert.equal(api.catalog.physicalSegments.length,0);
});
test('R2.17.2: Owner-observed KG13 name and code produce 9/29 candidate, not physical track',()=>{
 const x=api.matchSourcedKajangPoi(station('KG13 Pusat Bandar Damansara','Pusat Bandar Damansara'));
 assert.equal(x.stationName,'Pusat Bandar Damansara');
 assert.equal(x.stopPosition,9);assert.equal(x.stopCount,29);
 assert.equal(x.stationCode,'KG13');
 assert.equal(x.status,'CANDIDATE_EXACT_CARTOGRAPHIC_LABEL_MATCH');
 assert.equal(x.confidence,'OWNER_SAFARI_SOURCE_LABEL_OBSERVED');
 assert.match(x.evidence,/OWNER_SAFARI/);
 assert.equal(x.physicalTrackId,null);assert.equal(x.geometry,null);assert.equal(x.relationId,null);
 assert.equal(x.routeGeometryStatus,'UNVERIFIED');
});
test('R2.17.2: unobserved exact candidates are marked as such and do not assert source coverage',()=>{
 const samples=[
 ['KG04 Kwasa Damansara','Kwasa Damansara',1],
 ['KG18A Bukit Bintang','Bukit Bintang',14],
 ['KG20 Tun Razak Exchange','Tun Razak Exchange (TRX)',15],
 ['KG30 Batu 11 Cheras','Batu Sebelas Cheras',25],
 ['KG34 Stadium Kajang','Stadium Kajang',28]
 ];
 for(const [name,official,pos] of samples){
  const x=api.matchSourcedKajangPoi(station(name,official));
  assert.equal(x?.stopPosition,pos);
  assert.equal(x?.stationName,official);
  assert.equal(x?.status,'CANDIDATE_UNOBSERVED_SOURCE_CODE_NAME_MATCH');
  assert.equal(x?.geometry,null);
 }
});
test('R2.17.2: reject anonymous, ambiguous and wrong-service points',()=>{
 const invalid=[
  {class:'railway',subclass:'subway',name:'Pusat Bandar Damansara'},
  {class:'railway',subclass:'subway',name:'KG13 Kajang'},
  {class:'railway',subclass:'subway',name:'KG35 Pusat Bandar Damansara'},
  {class:'railway',subclass:'subway',name:'KG13 Pusat Bandar Damansara','name:en':'KTM Kajang'},
  {class:'railway',subclass:'subway',name:'KG13 Pusat Bandar Damansara','name:en':'Unknown'},
  {class:'railway',subclass:'station',name:'KTM Kajang'},
  {class:'railway',subclass:'station',name:'KG32 Taman Mesra'},
  {class:'railway',subclass:'subway',name:'KG18 Bukit Bintang'},
  {class:'railway',subclass:'tram_stop',name:'KG13 Pusat Bandar Damansara'},
  {class:'transit',subclass:'subway',name:'KG13 Pusat Bandar Damansara'},
  null,{}
 ];
 for(const obj of invalid)assert.equal(api.matchSourcedKajangPoi(obj),null,JSON.stringify(obj));
});
function render(featureProps){
 const w=new JSDOM(read('map-language-lab.html'),{url:'https://qa.example/map-language-lab.html?railPilot=1',runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={osm:{type:'vector'}};}
  on(ev,fn){(this.handlers[ev]??=[]).push(fn)}
  fire(ev,payload){for(const fn of this.handlers[ev]||[])fn(payload||{})}
  addControl(){}isStyleLoaded(){return true}
  getStyle(){return{sources:this.sources,layers:[
   {id:'base_rail',source:'osm','source-layer':'transportation',type:'line'},
   {id:'base_poi',source:'osm','source-layer':'poi',type:'circle'},
   {id:'labels',source:'osm',type:'symbol',layout:{'text-field':['get','name']}},
   ...this.layers]}}
  addLayer(l){this.layers.push(l)}
  getLayer(id){return this.layers.find(l=>l.id===id)||null}
  addSource(id,v){this.sources[id]=v}getSource(id){return this.sources[id]||null}
  queryRenderedFeatures(_rect,opts){return opts?.layers?.includes('mrl-pilot-stations')?
    [{layer:{id:'mrl-pilot-stations'},properties:featureProps}]:[]}
  setLayoutProperty(id,field,val){const layer=this.getLayer(id);if(layer){layer.layout||={};layer.layout[field]=val}}
  resize(){}flyTo(){}setStyle(){this.layers=[];this.fire('style.load')}
  getCanvasContainer(){return w.document.getElementById('visitor-map')}
 }
 class Popup{
  setLngLat(){return this}setDOMContent(node){this.node=node;return this}
  addTo(){map.popup=this;return this}remove(){}isOpen(){return false}
 }
 class Marker{
  constructor({element}){this.element=element}
  setLngLat(){return this}setPopup(){return this}addTo(){return this}remove(){}
  getElement(){return this.element}getPopup(){return{isOpen:()=>false}}
 }
 w.maplibregl={Map,Popup,Marker,NavigationControl:class{}};
 w.eval(read('assets/railway-track-registry-kl.js'));
 w.eval(read('assets/map-language-lab.js'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 map.fire('style.load');
 return{w,map,doc:w.document};
}
test('R2.17.2: KG13 popup shows 9/29 and marker becomes green when user selects Kajang route',()=>{
 const{w,map,doc}=render(station('KG13 Pusat Bandar Damansara','Pusat Bandar Damansara'));
 const layer=map.getLayer('mrl-kajang-known-poi'),selector=doc.getElementById('kl-registry-route');
 assert(layer,'a source-POI filter layer must exist');
 // Inspect what MapLibre would actually paint, not a fixed nested-array index.
 const passes=require('./helpers/kajang-filter-evaluator.cjs');
 assert(passes(layer.filter,station('KG13 Pusat Bandar Damansara','Pusat Bandar Damansara')),
  'source-matched KG13 must remain green');
 assert(!passes(layer.filter,station('KG13 Pusat Bandar Damansara','KTM Kajang')),
  'contradictory source POI must remain neutral');
 assert.equal(layer.layout.visibility,'none');
 selector.value='mrt-kajang';selector.dispatchEvent(new w.Event('change'));
 assert.equal(layer.layout.visibility,'visible');
 map.fire('click',{point:{x:100,y:100},lngLat:{lng:101.665,lat:3.14}});
 let popupText=map.popup?.node?.textContent||'';
 assert.match(popupText,/Pusat Bandar Damansara/);
 assert.match(popupText,/9\/29/);
 assert.match(popupText,/Physical track unverified|Trek fizikal belum disahkan/);
 assert(map.popup.node.classList.contains('kajang-match'),'green popup heading accent');
 selector.value='mrt-kajang';selector.dispatchEvent(new w.Event('change'));
 doc.querySelector('[data-region="thailand"]').click();
 assert.equal(layer.layout.visibility,'none','green marker must never bleed into Thailand');
 w.close();
});
