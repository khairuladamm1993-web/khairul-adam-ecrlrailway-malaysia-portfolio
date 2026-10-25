const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=x=>fs.readFileSync(path.join(__dirname,'..',x),'utf8');
const html=read('map-language-lab.html'),script=read('assets/map-language-lab.js');
function launch(){
 const w=new JSDOM(html,{url:'https://qa.example/map-language-lab.html?railPilot=1',runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={};}
  addControl(){} on(e,a){if(typeof a==='function')this.handlers[e]=a;}
  getStyle(){return {layers:[{id:'railway-source',type:'line',source:'osm','source-layer':'transportation'},
   {id:'poi-source',type:'circle',source:'osm','source-layer':'poi'},
   {id:'label_city',type:'symbol',source:'osm',layout:{'text-field':['get','name']}},...this.layers],sources:{osm:{type:'vector'}}}}
  isStyleLoaded(){return true;}
  getLayer(id){return this.layers.find(l=>l.id===id);}
  getSource(id){return this.sources[id];}
  addSource(id,data){this.sources[id]=data;}
  addLayer(l){this.layers.push(l);}
  setLayoutProperty(id,p,v){const l=this.getLayer(id);if(l){l.layout||={};l.layout[p]=v;}}
  queryRenderedFeatures(){return [];}
  resize(){} flyTo(){} 
  setStyle(){this.handlers['style.load']?.();}
 }
 class Popup{constructor(){this.node=null;}setLngLat(){return this;}setDOMContent(n){this.node=n;return this;}addTo(){map.popup=this;return this;}remove(){}isOpen(){return false}}
 class Marker{constructor({element}){this.element=element;}setLngLat(){return this;}setPopup(){return this;}addTo(){return this;}remove(){}getPopup(){return{isOpen:()=>false}}getElement(){return this.element}}
 w.maplibregl={Map,Popup,Marker,NavigationControl:class{}};
 w.eval(script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 map.handlers['style.load']();
 return{w,map,doc:w.document};
}
test('R2.15.1 visitors hide raster colour legend, while technical mode retains full 8-swatch legend',()=>{
 const{w,doc}=launch(),l=doc.getElementById('railway-legend'),toggle=doc.getElementById('railway-btn');
 assert.equal(toggle.getAttribute('aria-pressed'),'false');
 assert.equal(l.hidden,true);
 toggle.click();
 assert.equal(toggle.getAttribute('aria-pressed'),'true');
 assert.equal(l.hidden,false);
 assert.equal(l.querySelectorAll('[data-rail-legend]').length,8);
 l.open=true;toggle.click();
 assert.equal(toggle.getAttribute('aria-pressed'),'false');
 assert.equal(l.hidden,true);assert.equal(l.open,false);
 l.open=true;l.dispatchEvent(new w.Event('toggle'));
 assert.equal(l.open,false);
 toggle.click();assert.equal(l.hidden,false);
 w.close();
});
test('R2.15.1 opens a shorter scrollable legend while keeping 44px palette control',()=>{
 assert.match(html,/\.railway-legend\[hidden\]\{display:none\}/);
 assert.match(html,/\.rail-legend-panel\{[^}]*max-height:min\(42dvh,320px\);overflow:auto/);
 assert.match(html,/\.railway-legend summary\{[^}]*width:44px;height:44px;min-height:44px/);
});
test('R2.15.1 genuine map tap reports no source-backed feature and never fabricates an operator',()=>{
 const{w,map,doc}=launch();
 const l=doc.getElementById('railway-legend');assert(l.hidden);
 assert.equal(typeof map.handlers.click,'function');
 map.handlers.click({point:{x:120,y:200},lngLat:{lng:101.7,lat:3.15}});
 const status=doc.getElementById('railway-pilot-status').textContent;
 assert.match(status,/Tiada ciri rel atau stesen vektor/);
 assert(!/KTM|MRT|LRT|Rapid KL/.test(status));
 w.close();
});
test('R2.15.1 source-backed urban transit click still opens popup when real rendered feature is available',()=>{
 const{w,map,doc}=launch();
 assert(doc.getElementById('railway-legend').hidden);
 map.queryRenderedFeatures=()=>[{layer:{id:'mrl-pilot-rail-hits'},properties:{class:'transit',subclass:'subway'}}];
 map.handlers.click({point:{x:130,y:220},lngLat:{lng:101.7,lat:3.15}});
 assert(map.popup?.node);
 assert.match(map.popup.node.textContent,/Rail segment|Segmen landasan/);
 assert.match(map.popup.node.textContent,/subway/);
 assert.doesNotMatch(map.popup.node.textContent,/MRT Kajang|KTM/);
 w.close();
});
