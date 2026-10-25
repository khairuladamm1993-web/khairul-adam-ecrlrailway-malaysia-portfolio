const test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=require('../assets/map-language-lab.js');
// Representative layer IDs checked against the OpenFreeMap Dark and Positron
// source styles: https://github.com/hyperknot/openfreemap-styles
test('R2.18.1: dark place labels are eligible, motorway reference labels remain untouched',()=>{
 const layer=(id,sourceLayer='place')=>({
  id,type:'symbol','source-layer':sourceLayer,layout:{'text-field':['get','name']}});
 for(const id of ['place_city','place_town','place_suburb','place_country_major','water_name','highway_name_other',
  'label_city','label_country_1','water_name_point_label','highway-name-major']){
  assert.equal(api.isNameLayer(layer(id)),true,id);
 }
 for(const id of ['highway_name_motorway','highway-shield-us-interstate','mrl-pilot-stations']){
  assert.equal(api.isNameLayer(layer(id)),false,id);
 }
 assert.equal(api.isNameLayer({id:'place_city',type:'fill',layout:{'text-field':['get','name']}}),false);
});
function boot(initialTheme='dark'){
 const w=new JSDOM(read('map-language-lab.html'),{
  url:'https://qa.example/map-language-lab.html?railPilot=1',runScripts:'outside-only'
 }).window;
 w.localStorage.setItem('railway-theme',initialTheme);w.scrollTo=()=>{};
 let map;
 class MockMap{
  constructor(opts){
   map=this;this.handlers={};this.sources={osm:{type:'vector'}};
   this.layers=[];this.coreLayers=this.baseLayers(opts.style);this.styleReady=false;
  }
  baseLayers(uri){
   const dark=uri.includes('/dark');
   const nameIds=dark?['place_city','place_town','place_country_major','water_name','highway_name_other','highway_name_motorway']:
    ['label_city','label_country_1','water_name_point_label','highway-name-major','highway-shield-us-interstate'];
   return [{id:'base-track',type:'line',source:'osm','source-layer':'transportation'},
    {id:'base-poi',type:'circle',source:'osm','source-layer':'poi'},
    ...nameIds.map(id=>({id,type:'symbol',source:'osm','source-layer':id==='water_name'?'water_name':'place',
     layout:{'text-field':['get',id.startsWith('highway')?'ref':'name']}}))];
  }
  addControl(){}on(ev,fn){(this.handlers[ev]??=[]).push(fn)}
  fire(ev,data){for(const fn of this.handlers[ev]||[])fn(data||{})}
  getStyle(){return {sources:this.sources,layers:[...this.coreLayers,...this.layers]}}
  getLayer(id){return this.getStyle().layers.find(x=>x.id===id)||null}
  getSource(id){return this.sources[id]||null}
  addSource(id,s){this.sources[id]=s}
  addLayer(l){this.layers.push(l)}
  setLayoutProperty(id,k,v){const layer=this.getLayer(id);if(!layer)throw Error('unknown layer '+id);
   layer.layout||={};layer.layout[k]=v}
  isStyleLoaded(){return this.styleReady}
  setStyle(uri){
   this.layers=[];this.coreLayers=this.baseLayers(uri);this.styleReady=false;
   this.fire('style.load');this.styleReady=true;this.fire('idle');
  }
  finishLoading(){this.styleReady=true;this.fire('idle')}
  queryRenderedFeatures(){return []}
  resize(){}flyTo(){}
  getCanvasContainer(){return w.document.getElementById('visitor-map')}
 }
 class Popup{setLngLat(){return this}setDOMContent(){return this}addTo(){return this}remove(){}isOpen(){return false}}
 class Marker{
  constructor({element}){this.element=element}
  setLngLat(){return this}setPopup(){return this}addTo(){return this}remove(){}
  getElement(){return this.element}getPopup(){return {isOpen:()=>false}}
 }
 w.maplibregl={Map:MockMap,Popup,Marker,NavigationControl:class{}};
 w.eval(read('assets/railway-track-registry-kl.js'));
 w.eval(read('assets/map-language-lab.js'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 map.fire('style.load');
 return {w,map,doc:w.document};
}
test('R2.18.1: Dark Mode 中文 / ไทย modify actual dark style labels after asynchronous style readiness',()=>{
 const {w,map,doc}=boot();
 const textField=id=>JSON.stringify(map.getLayer(id).layout['text-field']);
 const initial=textField('place_city');
 assert.equal(initial,JSON.stringify(['get','name']),'style has not finished loading');
 doc.querySelector('[data-locale="zh"]').click(); // deferred while style not ready
 assert.equal(doc.documentElement.lang,'zh-Hans');
 map.finishLoading();
 assert.match(textField('place_city'),/name:zh/);
 assert.match(textField('place_country_major'),/name:zh/);
 assert.match(textField('water_name'),/name:zh/);
 assert.match(textField('highway_name_other'),/name:zh/);
 assert.equal(textField('highway_name_motorway'),JSON.stringify(['get','ref']));
 doc.querySelector('[data-locale="th"]').click();
 assert.equal(doc.documentElement.lang,'th');
 assert.match(textField('place_city'),/name:th/);
 assert.match(textField('place_town'),/name:th/);
 assert.equal(doc.getElementById('kl-registry').hidden,false);
 doc.querySelector('[data-region="thailand"]').click();
 assert.equal(doc.getElementById('kl-registry').hidden,true);
 doc.querySelector('[data-region="malaysia"]').click();
 assert.equal(doc.getElementById('kl-registry').hidden,false);
 w.close();
});
test('R2.18.1: light/dark style reload preserves latest locale and station identity without altering track geometry',()=>{
 const {w,map,doc}=boot('light');
 map.finishLoading();
 doc.querySelector('[data-locale="zh"]').click();
 assert.match(JSON.stringify(map.getLayer('label_city').layout['text-field']),/name:zh/);
 const selector=doc.getElementById('kl-registry-route');
 selector.value='lrt-kelana-jaya';selector.dispatchEvent(new w.Event('change'));
 assert.equal(doc.querySelectorAll('#kl-registry-station-order li').length,37);
 doc.getElementById('theme-btn').click();
 assert.equal(doc.documentElement.dataset.theme,'dark');
 assert.match(JSON.stringify(map.getLayer('place_city').layout['text-field']),/name:zh/);
 doc.querySelector('[data-locale="th"]').click();
 assert.match(JSON.stringify(map.getLayer('place_city').layout['text-field']),/name:th/);
 doc.getElementById('theme-btn').click();
 assert.equal(doc.documentElement.dataset.theme,'light');
 assert.match(JSON.stringify(map.getLayer('label_city').layout['text-field']),/name:th/);
 assert.equal(selector.value,'lrt-kelana-jaya');
 assert.equal(map.getLayer('mrl-kelana-alignment'),null);
 assert.equal(w.MRS10KLRegistry.catalog.physicalSegments.length,0);
 w.close();
});

function evalMapName(exp,feature){
 if(!Array.isArray(exp))return exp;
 if(exp[0]==='get')return Object.prototype.hasOwnProperty.call(feature,exp[1])?feature[exp[1]]:null;
 if(exp[0]==='coalesce'){for(const value of exp.slice(1)){const item=evalMapName(value,feature);if(item!==null&&item!==undefined)return item;}return null}
 if(exp[0]==='match'){const key=evalMapName(exp[1],feature);for(let i=2;i<exp.length-1;i+=2)if(key===exp[i])return evalMapName(exp[i+1],feature);return evalMapName(exp[exp.length-1],feature)}
 throw Error('Unrecognised expression in deterministic fixture '+exp[0]);
}
test('R2.18.2: Thai source-attested Malaysia place names are visible if tile name:th is absent',()=>{
 const {w,map,doc}=boot();
 map.finishLoading();
 doc.querySelector('[data-locale="th"]').click();
 const expression=map.getLayer('place_city').layout['text-field'];
 assert.equal(evalMapName(expression,{'name_en':'Kuala Lumpur','name':'Kuala Lumpur'}),'กัวลาลัมเปอร์');
 assert.equal(evalMapName(expression,{'name_en':'Shah Alam','name':'Shah Alam'}),'ชาห์อาลัม');
 assert.equal(evalMapName(expression,{'name_en':'Petaling Jaya','name':'Petaling Jaya'}),'เปอตาลิงจายา');
 assert.equal(evalMapName(expression,{'name_en':'Selangor','name':'Selangor'}),'สลังงอร์');
 assert.equal(evalMapName(expression,{'name':'Putrajaya'}),'ปุตราจายา');
 assert.equal(evalMapName(expression,{'name_en':'Kuala Lumpur','name:th':'ชื่อไทยจากต้นฉบับ'}),'ชื่อไทยจากต้นฉบับ');
 assert.equal(evalMapName(expression,{'name_en':'Unmapped Township','name':'Unmapped Township'}),'Unmapped Township');
 assert.equal(map.getLayer('highway_name_motorway').layout['text-field'][1],'ref');
 assert(!JSON.stringify(map.getLayer('water_name').layout['text-field']).includes('เปอตาลิงจายา'));
 assert.equal(map.getLayer('mrl-kelana-alignment'),null);
 w.close();
});
test('R2.18.2: curated Thai aliases only in Malaysia place labels; themes preserve source and city labels',()=>{
 const {w,map,doc}=boot('light');map.finishLoading();
 doc.querySelector('[data-locale="th"]').click();
 const city=()=>map.getLayer('label_city').layout['text-field'];
 assert.equal(evalMapName(city(),{'name_en':'Kuala Lumpur'}),'กัวลาลัมเปอร์');
 doc.getElementById('theme-btn').click();
 assert.equal(evalMapName(map.getLayer('place_city').layout['text-field'],{'name_en':'Kuala Lumpur'}),'กัวลาลัมเปอร์');
 doc.querySelector('[data-region="thailand"]').click();
 assert.equal(evalMapName(map.getLayer('place_city').layout['text-field'],{'name_en':'Kuala Lumpur'}),'Kuala Lumpur');
 doc.querySelector('[data-region="malaysia"]').click();
 assert.equal(evalMapName(map.getLayer('place_city').layout['text-field'],{'name_en':'Kuala Lumpur'}),'กัวลาลัมเปอร์');
 doc.querySelector('[data-locale="zh"]').click();
 assert(!JSON.stringify(map.getLayer('place_city').layout['text-field']).includes('กัวลาลัมเปอร์'));
 assert.equal(w.document.documentElement.lang,'zh-Hans');
 w.close();
});
