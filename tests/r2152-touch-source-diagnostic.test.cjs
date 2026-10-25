const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const js=read('assets/map-language-lab.js');
const {railTapProbe}=require('../assets/map-language-lab.js');
test('R2.15.2 rendered source probe distinguishes visible, clickable and raw rail data, never invents identifiers',()=>{
 let called=[];
 const map={
  getLayer:id=>({id}),
  queryRenderedFeatures:(bounds,opt)=>{called.push({bounds,opt});
   const ids=opt?.layers||[];
   if(ids.includes('mrl-pilot-rail-hits'))return [{layer:{id:'mrl-pilot-rail-hits'},properties:{class:'transit',subclass:'subway'}}];
   if(ids.includes('mrl-readable-rail-lines'))return [{layer:{id:'mrl-readable-rail-lines'},properties:{class:'transit',subclass:'subway'}}];
   return [{layer:{id:'base-transportation'},properties:{class:'transit',subclass:'subway'}},{layer:{id:'road'},properties:{class:'motorway'}}];
  }
 };
 const p=railTapProbe(map,{x:100,y:150});
 assert.deepEqual({selectable:p.selectable,visible:p.visible,rawRail:p.rawRail,subclass:p.subclass},
 {selectable:1,visible:1,rawRail:1,subclass:'subway'});
 assert.deepEqual(called[0].bounds,[[88,138],[112,162]]);
 assert.equal(called.length,3);
});
test('R2.15.2 empty rendered geometry returns no fabricated line, and zoom cannot conjure unprovided source geometry',()=>{
 const map={getLayer:()=>null,queryRenderedFeatures:()=>[]};
 const p=railTapProbe(map,{x:11,y:12});
 assert.equal(p.selectable,0);assert.equal(p.rawRail,0);assert.equal(p.visible,0);
 assert.equal(p.hitLayer,false);
 assert.equal(railTapProbe(map,{x:NaN,y:1}).selectable,0);
});
function browser(qs){
 const w=new JSDOM(read('map-language-lab.html'),{url:'https://qa.example/map-language-lab.html?'+qs,runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={};}
  addControl(){}
  on(e,a){if(typeof a==='function')this.handlers[e]=a;}
  getCanvasContainer(){return w.document.getElementById('visitor-map')}
  isStyleLoaded(){return true}
  getStyle(){return{layers:[{id:'base-rail',source:'osm','source-layer':'transportation',type:'line'},{id:'base-poi',source:'osm','source-layer':'poi',type:'circle'},{id:'label_city',type:'symbol',source:'osm',layout:{'text-field':['get','name']}},...this.layers],sources:{osm:{type:'vector'}}}}
  getLayer(id){return this.layers.find(x=>x.id===id)}
  getSource(id){return this.sources[id]}
  addLayer(l){this.layers.push(l)}
  addSource(id,o){this.sources[id]=o}
  setLayoutProperty(){}
  flyTo(){}resize(){}setStyle(){this.handlers['style.load']?.()}
  queryRenderedFeatures(){return []}
 }
 class Popup{setLngLat(){return this}setDOMContent(){return this}addTo(){return this}remove(){}isOpen(){return false}}
 class Marker{constructor({element}){this.element=element}setLngLat(){return this}setPopup(){return this}addTo(){return this}remove(){}getElement(){return this.element}getPopup(){return{isOpen:()=>false}}}
 w.maplibregl={Map,Popup,Marker,NavigationControl:class{}};
 w.eval(js);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 map.handlers['style.load']?.();
 return {w,doc:w.document,map};
}
test('R2.15.2 real pointer event and MapLibre click counters provide inspectable and privacy-safe Safari diagnosis',()=>{
 const {w,doc,map}=browser('railPilot=1&railDebug=1');
 const node=doc.getElementById('rail-tap-diagnostic');
 assert.equal(node.hidden,false);assert.match(node.textContent,/TOUCH 0 \/ MAP CLICK 0/);
 doc.getElementById('visitor-map').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
 assert.match(node.textContent,/TOUCH 1 \/ MAP CLICK 0/);
 assert.match(node.textContent,/Canvas pointer received/);
 map.handlers.click({point:{x:150,y:150},lngLat:{lng:101.68,lat:3.14}});
 assert.match(node.textContent,/TOUCH 1 \/ MAP CLICK 1/);
 assert.match(node.textContent,/source features 0 \/ visible 0 \/ raw rail 0/);
 assert(!node.textContent.includes('101.68'));
 w.close();
});
test('R2.15.2 debug opt-in never shows instrumentation on ordinary public or pilot map',()=>{
 for(const qs of ['railPilot=1','railDebug=1','']){
  const{w,doc}=browser(qs);assert(doc.getElementById('rail-tap-diagnostic').hidden);w.close();
 }
});
