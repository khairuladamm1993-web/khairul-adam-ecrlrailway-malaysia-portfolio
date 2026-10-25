const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const file=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pilot=require('../assets/map-language-lab.js');
test('R2.13 pilot city AREA anchors have evidence and never impersonate station positions',()=>{
 const p=pilot.pilotCenters;
 assert.deepEqual(p.malaysia.center,[101.68653,3.1412]);
 assert.deepEqual(p.thailand.center,[100.50144,13.75398]);
 assert.deepEqual(p.china.center,[109.424,24.3285]);
 assert(file('assets/map-language-lab.js').includes('https://digital.library.unt.edu/explore/locations/p09469/'));
 assert(file('assets/map-language-lab.js').includes('https://mapcarta.com/Liuzhou'));
});
test('R2.13 only actual rail/station tags qualify; roads, bus stops and fabricated attributes do not',()=>{
 assert.equal(pilot.pilotEligibleStation({class:'railway',subclass:'station'}),true);
 assert.equal(pilot.pilotEligibleStation({class:'railway',subclass:'halt'}),true);
 assert.equal(pilot.pilotEligibleStation({class:'bus',subclass:'bus_stop'}),false);
 assert.equal(pilot.pilotEligibleStation({class:'railway',subclass:'platform'}),false);
 assert.equal(pilot.pilotEligibleRail({class:'rail',subclass:'rail'}),true);
 assert.equal(pilot.pilotEligibleRail({class:'motorway'}),false);
});
test('R2.13 BM/EN uses sourced English name and NO invented pinyin',()=>{
 const p={'name':'柳州站','name_en':'Liuzhou Railway Station',class:'railway',subclass:'station'};
 assert.equal(pilot.pilotFeatureInfo(p,'station','ms').title,'Liuzhou Railway Station');
 assert.equal(pilot.pilotFeatureInfo(p,'station','en').pinyin,'');
 assert.equal(pilot.pilotFeatureInfo({name:'柳州站'},'station','en').title,'English name unavailable');
 const named=pilot.pilotFeatureInfo({...p,'name:zh-Latn-pinyin':'Liǔzhōu Zhàn'},'station','ms');
 assert.equal(named.pinyin,'Liǔzhōu Zhàn');
 assert.equal(named.original,'柳州站');
});
test('R2.13 extracts vector POI source only when it belongs to an actual vector style',()=>{
 const sty={layers:[{source:'osm','source-layer':'poi'}],sources:{osm:{type:'vector'}}};
 assert.equal(pilot.pilotSourceForLayer(sty,'poi'),'osm');
 assert.equal(pilot.pilotSourceForLayer({layers:[{source:'x','source-layer':'poi'}],sources:{x:{type:'raster'}}},'poi'),null);
});
function loadPilot(enabled){
 const html=file('map-language-lab.html');
 const w=new JSDOM(html,{url:'https://qa.example/map-language-lab.html'+(enabled?'?railPilot=1':''),runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let model;
 class Popup{constructor(opt){this.opt=opt}setLngLat(p){this.lngLat=p;return this}setDOMContent(node){this.node=node;return this}addTo(map){map.lastPopup=this;return this}remove(){this.removed=true;return this}isOpen(){return false}}
 class Marker{constructor({element}){this.element=element}setLngLat(p){this.lngLat=p;return this}setPopup(p){this.popup=p;return this}addTo(map){map.marker=this;return this}remove(){this.removed=true;return this}getElement(){return this.element}getPopup(){return this.popup}}
 class Map{
  constructor(){model=this;this.handlers={};this.delegates={};this.layers=[];this.sources={};}
  addControl(){}
  on(event,arg,fn){if(typeof arg==='string'){this.delegates[arg]=fn;}else this.handlers[event]=arg}
  getStyle(){return {layers:[{id:'railway-source',type:'line',source:'osm','source-layer':'transportation'},
    {id:'poi-source',type:'circle',source:'osm','source-layer':'poi'},
    {id:'label_city',type:'symbol',source:'osm',layout:{'text-field':['get','name']}},
    ...this.layers],sources:{osm:{type:'vector'}}}}
  isStyleLoaded(){return true}
  getLayer(id){return this.layers.find(l=>l.id===id)}
  getSource(id){return this.sources[id]}
  addSource(id,obj){this.sources[id]=obj}
  addLayer(layer){this.layers.push(layer)}
  setLayoutProperty(id,k,v){const l=this.getLayer(id);if(l){l.layout||={};l.layout[k]=v}}
  flyTo(v){this.fly=v}
  resize(){}
  queryRenderedFeatures(){return []}
  setStyle(){this.handlers['style.load']?.()}
 }
 w.maplibregl={Map,Popup,Marker,NavigationControl:class {}};
 w.eval(file('assets/map-language-lab.js'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 model.handlers['style.load']();
 return {w,map:model,doc:w.document};
}
test('R2.13 pilot is disabled by default and enabled only with explicit query opt-in',()=>{
 let f=loadPilot(false);
 assert(!f.map.getLayer('mrl-pilot-stations'));
 assert(!f.map.getLayer('mrl-pilot-rail-hits'));
 assert(f.doc.getElementById('railway-pilot-status').hidden);
 f.w.close();
 f=loadPilot(true);
 assert(f.map.getLayer('mrl-pilot-stations'));
 assert(f.map.getLayer('mrl-pilot-rail-hits'));
 assert(!f.doc.getElementById('railway-pilot-status').hidden);
 assert.equal(f.map.getLayer('mrl-pilot-stations')['source-layer'],'poi');
 f.w.close();
});
test('R2.13 country selectors focus 3 pilot cities, not arbitrary station coordinates',()=>{
 const {w,map,doc}=loadPilot(true);
 for(const [country,coords] of Object.entries({malaysia:[101.68653,3.1412],thailand:[100.50144,13.75398],china:[109.424,24.3285]})){
  doc.querySelector('[data-region="'+country+'"]').click();
  assert.deepEqual(Array.from(map.fly.center),coords);
  assert.equal(map.fly.zoom,12.5);
 }
 w.close();
});
test('R2.13 station and rail clicks show SOURCE attributes without inventing railway identity',()=>{
 const {w,map}=loadPilot(true);
 const click=map.delegates['mrl-pilot-stations'],railClick=map.delegates['mrl-pilot-rail-hits'];
 assert.equal(typeof click,'function');assert.equal(typeof railClick,'function');
 click({features:[{properties:{class:'railway',subclass:'station',name:'柳州站','name:en':'Liuzhou Railway Station'}}],lngLat:{lng:109.4,lat:24.3}});
 assert.match(map.lastPopup.node.textContent,/Liuzhou Railway Station/);
 assert.match(map.lastPopup.node.textContent,/柳州站/);
 railClick({features:[{properties:{class:'rail',subclass:'rail'}}],lngLat:{lng:109.4,lat:24.3},point:{x:1,y:2}});
 assert.match(map.lastPopup.node.textContent,/English name unavailable/);
 assert.doesNotMatch(map.lastPopup.node.textContent,/High-speed railway/);
 w.close();
});
