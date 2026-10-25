const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=require('../assets/railway-track-registry-kl.js');

test('R2.16.2: only two exact source-observed KG code station labels become conservative catalogue candidates',()=>{
 const examples=[['KG16 Pasar Seni','Pasar Seni',12],['KG35 Kajang','Kajang',29]];
 for(const [name,officialName,pos] of examples){
  const x=api.matchSourcedKajangPoi({class:'railway',subclass:'station',name,'name:en':officialName});
  assert.equal(x.stationName,officialName);
  assert.equal(x.stopPosition,pos);
  assert.equal(x.stopCount,29);
  assert.equal(x.routeId,'mrt-kajang');
  assert.equal(x.status,'CANDIDATE_EXACT_CARTOGRAPHIC_LABEL_MATCH');
  assert.equal(x.physicalTrackId,null);
  assert.equal(x.geometry,null);
  assert.equal(x.relationId,null);
  assert.equal(x.routeGeometryStatus,'UNVERIFIED');
 }
 assert.equal(api.catalog.physicalSegments.length,0);
 assert.equal(api.osmRelationAudit.verifiedPhysicalTracks,0);
 assert.deepEqual(api.osmRelationAudit.acceptedWayIds,[]);
 assert.deepEqual(api.osmRelationAudit.acceptedRelationIds,[]);
});
test('R2.16.2: refuse unsupported generic names, similarly named LRT, nearby rails and contradictory attributes',()=>{
 for(const p of [
  null,{}, {class:'railway',subclass:'station',name:'Kajang'},
  {class:'railway',subclass:'station',name:'Pasar Seni'},
  {class:'railway',subclass:'station',name:'KG35 Kajang ',name_en:'Unknown station'},
  {class:'railway',subclass:'halt',name:'KG35 Kajang'},
  {class:'transit',subclass:'subway',name:'KG35 Kajang'},
  {class:'railway',subclass:'station',name:'MR3 Maharajalela'},
  {class:'railway',subclass:'station',name:'KG35 Sungai Buloh'},
  {class:'railway',subclass:'station',name:'KG29 Kajang'},
  {class:'railway',subclass:'station',name:'KG16 Pasar Seni LRT'}
 ])assert.equal(api.matchSourcedKajangPoi(p),null,JSON.stringify(p));
});
function boot(featureProps){
 const w=new JSDOM(read('map-language-lab.html'),{url:'https://qa.example/map-language-lab.html?railPilot=1',runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={osm:{type:'vector'}};}
  on(event,fn){(this.handlers[event]??=[]).push(fn)}
  fire(event,payload){for(const f of this.handlers[event]||[])f(payload||{})}
  addControl(){}isStyleLoaded(){return true}
  getStyle(){return{sources:this.sources,layers:[
   {id:'base_rail',source:'osm','source-layer':'transportation',type:'line'},
   {id:'base_poi',source:'osm','source-layer':'poi',type:'circle'},
   {id:'label',source:'osm',type:'symbol',layout:{'text-field':['get','name']}},
   ...this.layers]};}
  addLayer(l){this.layers.push(l)}getLayer(id){return this.layers.find(x=>x.id===id)}
  addSource(id,v){this.sources[id]=v}getSource(id){return this.sources[id]}
  queryRenderedFeatures(_rect,opts){
   return opts?.layers?.includes('mrl-pilot-stations')?
    [{layer:{id:'mrl-pilot-stations'},properties:featureProps}]:[];
  }
  setLayoutProperty(){}resize(){}flyTo(){}setStyle(){this.fire('style.load')}
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
test('R2.16.2: a source-backed Kajang POI popup displays a candidate 29/29 with no physical track claim',()=>{
 const{w,map,doc}=boot({class:'railway',subclass:'station',name:'KG35 Kajang','name:en':'Kajang'});
 doc.querySelector('[data-locale="en"]').click();
 map.fire('click',{point:{x:120,y:150},lngLat:{lng:101.79,lat:2.99}});
 const text=map.popup?.node?.textContent||'';
 assert.match(text,/Kajang/);assert.match(text,/29\/29/);
 assert.match(text,/Map name match \(candidate\)/);
 assert.match(text,/Physical track unverified/);
 assert.match(text,/OpenMapTiles/);
 w.close();
});
test('R2.16.2: ambiguous station POI cannot falsely join the MRT Kajang service route',()=>{
 const{w,map}=boot({class:'railway',subclass:'station',name:'Kajang'});
 map.fire('click',{point:{x:120,y:150},lngLat:{lng:101.79,lat:2.99}});
 assert(map.popup?.node);
 assert.doesNotMatch(map.popup.node.textContent,/29\/29|name match \(candidate\)/i);
 w.close();
});
test('R2.16.2: crosswalk is Malaysia-only; China and Thailand preserve source-backed station popups',()=>{
 const{w,map,doc}=boot({class:'railway',subclass:'station',name:'KG16 Pasar Seni','name:en':'Pasar Seni'});
 for(const country of ['thailand','china']){
  doc.querySelector('[data-region="'+country+'"]').click();
  map.fire('click',{point:{x:100,y:130},lngLat:{lng:100,lat:15}});
  assert(map.popup?.node);
  assert.doesNotMatch(map.popup.node.textContent,/12\/29|name match \(candidate\)/i);
 }
 w.close();
});
