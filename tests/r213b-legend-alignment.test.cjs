const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'../map-language-lab.html'),'utf8');
const script=fs.readFileSync(path.join(__dirname,'../assets/map-language-lab.js'),'utf8');
function load(pilot=false){
 const w=new JSDOM(html,{url:'https://preview.example/map-language-lab.html'+(pilot?'?railPilot=1':''),runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};
 let map;
 class Map{
  constructor(){map=this;this.events={};this.layers=[];this.sources={};}
  addControl(){}on(e,a,f){if(typeof a==='function')this.events[e]=a;}
  getStyle(){return {layers:[{id:'trans',source:'osm','source-layer':'transportation',type:'line'},{id:'poi',source:'osm','source-layer':'poi',type:'symbol'}],sources:{osm:{type:'vector'}}}}
  getSource(n){return this.sources[n]} getLayer(n){return this.layers.find(l=>l.id===n)}
  addSource(n,o){this.sources[n]=o} addLayer(l){this.layers.push(l)}
  setLayoutProperty(n,p,v){const l=this.getLayer(n);if(l){l.layout||={};l.layout[p]=v}}
  isStyleLoaded(){return true}flyTo(){}resize(){}setStyle(){this.events['style.load']?.()}
 }
 class Popup{setDOMContent(x){this.node=x;return this}isOpen(){return false}}
 class Marker{constructor({element}){this.element=element}setLngLat(){return this}setPopup(){return this}addTo(){return this}remove(){}getElement(){return this.element}getPopup(){return {}}}
 w.maplibregl={Map,Marker,Popup,NavigationControl:class {}};
 w.eval(script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 map.events['style.load']?.();
 return {w,d:w.document};
}

test('R2.13b category swatches cover the full standard raster legend including green light rail and pink tram',()=>{
 const {w,d}=load();
 const lines=[...d.querySelectorAll('[data-rail-legend]')];
 assert.equal(lines.length,8);
 assert.equal(lines[4].querySelector('.rail-legend-swatch').style.backgroundColor,'rgb(0, 189, 20)');
 assert.equal(lines[5].querySelector('.rail-legend-swatch').style.backgroundColor,'rgb(216, 119, 184)');
 lines[4].click();assert.match(d.getElementById('rail-legend-selected-note').textContent,/LRT/);
 lines[5].click();assert.match(d.getElementById('rail-legend-selected-note').textContent,/merah jambu/);
 lines[7].click();assert.equal(lines[7].getAttribute('aria-pressed'),'true');
 w.close();
});
test('R2.13b legend region follows 3 pilot cities and all 4 languages without asserting line ownership',()=>{
 const {w,d}=load(true);
 assert.equal(d.getElementById('railway-legend-region').textContent,'Kuala Lumpur');
 d.querySelector('[data-region="thailand"]').click();
 assert.equal(d.getElementById('railway-legend-region').textContent,'Bangkok');
 d.querySelector('[data-region="china"]').click();
 assert.equal(d.getElementById('railway-legend-region').textContent,'Liuzhou');
 d.querySelector('[data-locale="zh"]').click();
 assert.equal(d.getElementById('railway-legend-region').textContent,'柳州');
 d.querySelector('[data-locale="th"]').click();
 assert.equal(d.getElementById('railway-legend-region').textContent,'หลิ่วโจว');
 w.close();
});
test('R2.13b clearly discloses 60 percent railway opacity and basemap composite',()=>{
 const {w,d}=load();
 d.querySelector('[data-locale="en"]').click();
 assert.match(d.getElementById('railway-legend-note').textContent,/60% opaque/);
 assert.match(d.getElementById('railway-legend-note').textContent,/blend/);
 assert.match(script,/"raster-opacity":0\.60|'raster-opacity':0\.60/);
 assert.doesNotMatch(script,/queryRenderedFeatures\([^)]*mrl-railway/);
 w.close();
});
