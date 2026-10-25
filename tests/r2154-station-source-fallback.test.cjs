const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const file=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const moduleApi=require('../assets/map-language-lab.js');
const {pilotStationVectorSource,queryPilotVectorFeature}=moduleApi;
test('R2.15.4 prefers explicitly styled POI source when available',()=>{
 const style={sources:{source_rail:{type:'vector'},source_poi:{type:'vector'}},layers:[
 {id:'rails',source:'source_rail','source-layer':'transportation'},
 {id:'poi',source:'source_poi','source-layer':'poi'}]};
 assert.deepEqual(pilotStationVectorSource(style),{source:'source_poi',discovery:'styled-poi'});
});
test('R2.15.4 recovers shared vector source when POI is absent from visible style layers',()=>{
 const style={sources:{ofm:{type:'vector'}},layers:[{id:'rails',source:'ofm','source-layer':'transportation'}]};
 assert.deepEqual(pilotStationVectorSource(style),{source:'ofm',discovery:'shared-vector-source; poi content unverified'});
 assert.deepEqual(pilotStationVectorSource({sources:{osm:{type:'raster'}},layers:[{id:'roads',source:'osm','source-layer':'transportation'}]}),
 {source:null,discovery:'no-vector-source'});
 assert.deepEqual(pilotStationVectorSource(null),{source:null,discovery:'no-vector-source'});
});
function boot(){
 const w=new JSDOM(file('map-language-lab.html'),{url:'https://qa.example/map-language-lab.html?railPilot=1&railDebug=1',runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={osm:{type:'vector'}};}
  addControl(){}
  on(ev,fn){(this.handlers[ev]??=[]).push(fn);}
  fire(ev,x){for(const fn of this.handlers[ev]||[])fn(x||{});}
  isStyleLoaded(){return false;}
  getStyle(){return{sources:this.sources,layers:[
   {id:'transport',type:'line',source:'osm','source-layer':'transportation'},
   {id:'label_city',type:'symbol',source:'osm',layout:{'text-field':['get','name']}},
   ...this.layers
  ]}}
  addSource(id,data){this.sources[id]=data}
  getSource(id){return this.sources[id]}
  addLayer(l){this.layers.push(l)}
  getLayer(id){return this.layers.find(l=>l.id===id)}
  getCanvasContainer(){return w.document.getElementById('visitor-map')}
  queryRenderedFeatures(_,opts){
   if(opts?.layers?.includes('mrl-pilot-stations'))
    return [{layer:{id:'mrl-pilot-stations'},properties:{class:'railway',subclass:'station',name:'Test Station','name:en':'Test Station'}}];
   return [];
  }
  setLayoutProperty(){}
  resize(){}flyTo(){}setStyle(){this.layers=[];this.fire('style.load');}
 }
 class Popup{setLngLat(){return this}setDOMContent(n){this.node=n;return this}addTo(){map.popup=this;return this}remove(){}isOpen(){return false}}
 class Marker{constructor({element}){this.element=element}setLngLat(){return this}setPopup(){return this}addTo(){return this}remove(){}getElement(){return this.element}getPopup(){return{isOpen:()=>false}}}
 w.maplibregl={Map,Popup,Marker,NavigationControl:class{}};
 w.eval(file('assets/map-language-lab.js'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return{w,map,d:w.document};
}
test('R2.15.4 missing styled POI does not prevent source-backed station circle layer and real selected feature popup',()=>{
 const{w,map,d}=boot();
 map.fire('style.load');
 assert.equal(map.getLayer('mrl-pilot-stations').source,'osm');
 assert.equal(map.getLayer('mrl-pilot-stations')['source-layer'],'poi');
 assert.equal(map.getLayer('mrl-pilot-rail-hits').source,'osm');
 assert.match(d.getElementById('railway-pilot-status').textContent,/station data unverified/);
 const hit=queryPilotVectorFeature(map,{x:110,y:100});
 assert.equal(hit.kind,'station');
 map.fire('click',{point:{x:110,y:100},lngLat:{lng:101.69,lat:3.13}});
 assert.match(map.popup.node.textContent,/Test Station/);
 w.close();
});
test('R2.15.4 station source is not equivalent to a verified station feature; identity remains source-only',()=>{
 assert.equal(moduleApi.pilotEligibleStation({class:'railway',subclass:'station'}),true);
 assert.equal(moduleApi.pilotEligibleStation({class:'railway',subclass:'platform'}),false);
 const map={getLayer:id=>id==='mrl-pilot-stations'?{id}:null,queryRenderedFeatures:()=>[]};
 assert.equal(queryPilotVectorFeature(map,{x:1,y:2}),null);
});
