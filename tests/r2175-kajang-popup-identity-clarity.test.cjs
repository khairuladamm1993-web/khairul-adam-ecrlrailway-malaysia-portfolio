'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=require('../assets/railway-track-registry-kl.js');
const station=(name,english,extras={})=>({class:'railway',subclass:'subway',name,...(english?{'name:en':english}:{}),...extras});
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
  constructor(opts){this.options=opts}
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

test('R2.17.5: matched KG13 popup keeps full official station title, code source and candidate 9/29',()=>{
 const{w,map}=render(station('KG13 Pusat Bandar Damansara','Pusat Bandar Damansara'));
 map.fire('click',{point:{x:100,y:100},lngLat:{lng:101.67,lat:3.14}});
 const node=map.popup?.node;
 assert(node,'popup must open');
 assert.equal(node.querySelector(':scope>strong').textContent,'Pusat Bandar Damansara');
 assert.equal(node.getAttribute('aria-label'),'Pusat Bandar Damansara · MRT · Kajang Line');
 assert.match(node.textContent,/KG13 Pusat Bandar Damansara/);
 assert.match(node.textContent,/9\/29/);
 assert.match(node.textContent,/Physical track unverified|Trek fizikal belum disahkan/);
 assert(node.classList.contains('kajang-match'));
 assert.match(map.popup.options.className,/mrl-kajang-matched-popup/);
 assert.equal(api.osmRelationAudit.acceptedWayIds.length,0);
 w.close();
});
test('R2.17.5: all legitimate exact-code service station popups get corresponding official title',()=>{
 for(const [raw,official,pos] of [
  ['KG04 Kwasa Damansara','Kwasa Damansara',1],
  ['KG13 Pusat Bandar Damansara','Pusat Bandar Damansara',9],
  ['KG35 Kajang','Kajang',29]
 ]){
  const{w,map}=render(station(raw,official));
  map.fire('click',{point:{x:100,y:100},lngLat:{lng:101.67,lat:3.14}});
  assert.equal(map.popup.node.querySelector(':scope>strong').textContent,official);
  assert.match(map.popup.node.textContent,new RegExp(pos+'/29'));
  w.close();
 }
});
test('R2.17.5: truncated cartographic station label or nearby KTM station cannot falsely receive Kajang identity',()=>{
 for(const p of [
  station('KG13 Pusat Bandar Damansara','Damansara'),
  station('KTM Kajang','KTM Kajang'),
  station('Damansara','Damansara')
 ]){
  assert.equal(api.matchSourcedKajangPoi(p),null,'reject ambiguous source identity');
  const{w,map}=render(p);
  map.fire('click',{point:{x:100,y:100},lngLat:{lng:101.67,lat:3.14}});
  assert(!map.popup.node.classList.contains('kajang-match'));
  assert(!map.popup.options.className.includes('mrl-kajang-matched-popup'));
  assert(!map.popup.node.textContent.includes('9/29'));
  w.close();
 }
});
test('R2.17.5: Chinese and Thai source translations remain available; official full name stays in accessible label',()=>{
 for(const [locale,field,translated] of [
  ['zh','name:zh','白沙罗市中心'],
  ['th','name:th','ปูซัต บันดาร์ ดามันซารา']
 ]){
  const{w,map,doc}=render(station('KG13 Pusat Bandar Damansara','Pusat Bandar Damansara',{[field]:translated}));
  doc.querySelector('[data-locale="'+locale+'"]').click();
  map.fire('click',{point:{x:100,y:100},lngLat:{lng:101.67,lat:3.14}});
  assert.equal(map.popup.node.querySelector(':scope>strong').textContent,translated);
  assert.match(map.popup.node.getAttribute('aria-label'),/Pusat Bandar Damansara/);
  w.close();
 }
});
test('R2.17.5: expanded matched popup keeps station heading sticky and does not alter generic popup dimensions',()=>{
 const html=read('map-language-lab.html');
 assert.match(html,/\.mrl-kajang-matched-popup \.maplibregl-popup-content\{max-height:min\(44dvh,250px\)\}/);
 assert.match(html,/\.campus-popup\.kajang-match>strong\{/);
 assert.match(html,/position:sticky;top:0/);
 assert.match(html,/\.mrl-campus-popup \.maplibregl-popup-content\{background:var\(--popup-bg\);color:var\(--popup-fg\);padding:44px 10px 9px;border-radius:10px;max-height:min\(34dvh,170px\)\}/);
 assert.equal(api.osmRelationAudit.verifiedPhysicalTracks,0);
});

function evalKajangStyleFilter(expr,props){
 if(!Array.isArray(expr))return expr;
 const [op,...args]=expr;
 const read=x=>evalKajangStyleFilter(x,props);
 switch(op){
  case 'all':return args.every(read);
  case 'any':return args.some(read);
  case '!':return !read(args[0]);
  case '==':return read(args[0])===read(args[1]);
  case 'get':return props[args[0]];
  case 'has':return Object.prototype.hasOwnProperty.call(props,args[0]);
  case 'literal':return args[0];
  case 'to-string':return String(read(args[0]));
  case 'downcase':return read(args[0]).toLowerCase();
  case 'in':return read(args[1]).includes(read(args[0]));
  default:throw Error('Unexpected MapLibre filter expression '+op);
 }
}
test('R2.17.6: green POI visual filter rejects contradictory English fields like the popup matcher',()=>{
 const{w,map}=render(station('KG13 Pusat Bandar Damansara','Pusat Bandar Damansara'));
 const layer=map.getLayer('mrl-kajang-known-poi');
 assert(layer,'source-backed green candidate layer must exist');
 const passes=p=>evalKajangStyleFilter(layer.filter,p);
 const official=station('KG13 Pusat Bandar Damansara','Pusat Bandar Damansara');
 assert(passes(official),'legitimate KG13 must remain green');
 assert(passes(station('KG13 Pusat Bandar Damansara')),'missing optional English is allowed');
 assert(passes(station('KG13 Pusat Bandar Damansara','Pusat Bandar Damansara',{'name:zh':'白沙罗市中心'})));
 for(const props of [
  station('KG13 Pusat Bandar Damansara','KTM Kajang'),
  station('KG13 Pusat Bandar Damansara','Pusat Bandar Damansara',{name_en:'KTM Kajang'}),
  station('KTM Kajang','KTM Kajang'),
  station('Damansara','Damansara'),
  {...official,class:'highway'}
 ])assert(!passes(props),'contradictory or ambiguous source must not receive Kajang green: '+props.name);
 for(const raw of api.kajangPoiSourceNames){
  const match=api.matchSourcedKajangPoi(station(raw));
  assert(match,'Registry candidate must be code+name verified: '+raw);
  assert(passes(station(raw,match.stationName)),'do not regress allowed station: '+raw);
 }
 assert.equal(api.osmRelationAudit.verifiedPhysicalTracks,0);
 assert.deepEqual(api.osmRelationAudit.acceptedWayIds,[]);
 w.close();
});
