const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'../map-language-lab.html'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../assets/map-language-lab.js'),'utf8');
function browser(){
 const w=new JSDOM(html,{url:'https://qa.example/map-language-lab.html?railPilot=1&railDebug=1',runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={osm:{type:'vector'}};this.popup=null;this.styleStable=false;}
  addControl(){}
  on(e,cb){if(typeof cb!=='function')return;(this.handlers[e]??=[]).push(cb);}
  fire(e,arg){for(const cb of this.handlers[e]||[])cb(arg||{});}
  getCanvasContainer(){return w.document.getElementById('visitor-map')}
  getStyle(){return {sources:this.sources,layers:[
   {id:'base_rail',type:'line',source:'osm','source-layer':'transportation'},
   {id:'base_poi',type:'circle',source:'osm','source-layer':'poi'},
   {id:'label_city',type:'symbol',source:'osm',layout:{'text-field':['get','name']}},...this.layers]}}
  isStyleLoaded(){return this.styleStable;}
  addLayer(l){this.layers.push(l);}
  getLayer(id){return this.layers.find(l=>l.id===id)||null;}
  addSource(id,s){this.sources[id]=s;}
  getSource(id){return this.sources[id]||null;}
  setLayoutProperty(){}
  setStyle(){this.styleStable=false;this.layers=[];this.sources={osm:{type:'vector'}};this.fire('style.load');}
  queryRenderedFeatures(rect,opt){
   if(opt?.layers?.includes('mrl-pilot-rail-hits'))return [
    {layer:{id:'mrl-pilot-rail-hits'},properties:{class:'transit',subclass:'light_rail',name:'Test source geometry'}}];
   if(opt?.layers?.includes('mrl-readable-rail-lines'))return [
    {layer:{id:'mrl-readable-rail-lines'},properties:{class:'transit',subclass:'light_rail'}}];
   return [];
  }
  resize(){}flyTo(){}
 }
 class Popup{
  setLngLat(){return this;}setDOMContent(n){this.node=n;return this;}
  addTo(){map.lastPopup=this;return this;}remove(){}isOpen(){return false;}
 }
 class Marker{
  constructor({element}){this.element=element;}
  setLngLat(){return this;}setPopup(){return this;}addTo(){return this;}remove(){}
  getElement(){return this.element;}getPopup(){return{isOpen:()=>false}}
 }
 w.maplibregl={Map,Popup,Marker,NavigationControl:class{}};
 w.eval(js);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {w,d:w.document,map};
}
test('R2.15.3 installs rail/POI layers at style.load even though isStyleLoaded is false due to pending tile loads',()=>{
 const {w,map}=browser();
 assert.equal(map.isStyleLoaded(),false);
 map.fire('style.load');
 assert(map.getLayer('mrl-readable-rail-lines'));
 assert(map.getLayer('mrl-pilot-rail-hits'));
 assert(map.getLayer('mrl-pilot-stations'));
 const before=map.layers.length;
 map.styleStable=true;
 map.fire('idle');
 assert.equal(map.layers.length,before,'idle must not duplicate healthy layers');
 w.close();
});
test('R2.15.3 real rendered transit geometry responds to map click after the layer has been installed',()=>{
 const {w,d,map}=browser();
 map.fire('style.load');map.styleStable=true;map.fire('idle');
 map.fire('click',{point:{x:130,y:170},lngLat:{lng:101.7,lat:3.15}});
 assert(map.lastPopup?.node);
 assert.match(map.lastPopup.node.textContent,/light_rail/);
 const debug=d.getElementById('rail-tap-diagnostic').textContent;
 assert.match(debug,/MAP CLICK 1/);
 assert.match(debug,/rail READY \/ station READY/);
 w.close();
});
test('R2.15.3 rebuilds MapLibre style-owned pilot layers after dark/light style swap without duplicated click handler',()=>{
 const {w,d,map}=browser();
 map.fire('style.load');
 const before=(map.handlers.click||[]).length;
 d.getElementById('theme-btn').click();
 assert(map.getLayer('mrl-pilot-rail-hits'));
 assert(map.getLayer('mrl-pilot-stations'));
 assert.equal((map.handlers.click||[]).length,before);
 w.close();
});
