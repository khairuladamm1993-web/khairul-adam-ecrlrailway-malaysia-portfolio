const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('map-language-lab.html'),script=read('assets/map-language-lab.js');
function setup(){
 const w=new JSDOM(html,{url:'https://preview.example/map-language-lab.html',runScripts:'outside-only'}).window;
 const maps=[];w.scrollTo=()=>{};
 class Popup{constructor(options){this.options=options}setDOMContent(node){this.node=node;return this}isOpen(){return !!this.open}}
 class Marker{
  constructor({element}){this.element=element;this.removed=false;}
  setLngLat(coords){this.coords=coords;return this}
  setPopup(p){this.popup=p;return this}
  addTo(map){this.map=map;map.marker=this;return this}
  getElement(){return this.element}
  getPopup(){return this.popup}
  remove(){this.removed=true;return this}
 }
 class Map{
  constructor(args){this.args=args;this.handlers={};this.layers=[];this.sources={};maps.push(this)}
  addControl(){}
  on(event,cb){this.handlers[event]=cb}
  getStyle(){return {layers:this.layers.length?this.layers:[{id:'label_city',type:'symbol',source:'osm',layout:{'text-field':['get','name']}}],sources:{osm:{type:'vector'}}}}
  getSource(k){return this.sources[k]}
  getLayer(k){return this.layers.find(x=>x.id===k)}
  addSource(k,v){this.sources[k]=v}
  addLayer(l){this.layers.push(l)}
  setLayoutProperty(k,p,v){const o=this.getLayer(k);if(o){o.layout||={};o.layout[p]=v}}
  isStyleLoaded(){return true}
  flyTo(v){this.lastFly=v}
  resize(){}
  setStyle(v){this.args.style=v;this.handlers['style.load']?.()}
 }
 w.maplibregl={Map,Marker,Popup,NavigationControl:class {}};
 w.eval(script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 maps[0].handlers['style.load']();
 return {w,map:maps[0],d:w.document};
}
test('R2.12 removes external college and legend controls but preserves map',()=>{
 const d=new JSDOM(html).window.document;
 assert(!d.getElementById('campus-focus'));
 assert(!d.getElementById('campus-location'));
 const legend=d.getElementById('railway-legend'),shell=d.getElementById('map-shell');
 assert(legend && shell.contains(legend));
 assert(legend.querySelector('summary'));
 assert.equal(legend.querySelectorAll('[data-rail-legend]').length,8);
 assert(d.getElementById('map-expand'));
 assert(d.getElementById('railway-btn'));
});
test('R2.12 map legend swatches remain visible after locale changes; colour click updates detail',()=>{
 const {w,d}=setup();
 d.getElementById('railway-btn').click();
 const legend=d.getElementById('railway-legend');
 assert(legend.hidden===false);
 legend.open=true;
 d.querySelector('[data-locale="ms"]').click();
 const branch=d.querySelector('[data-rail-legend="2"]');
 assert(branch.querySelector('.rail-legend-swatch'));
 assert.match(branch.textContent,/Branch line/);
 branch.click();
 assert.equal(branch.getAttribute('aria-pressed'),'true');
 assert.match(d.getElementById('rail-legend-selected-note').textContent,/cabang/);
 d.querySelector('[data-locale="en"]').click();
 assert.match(d.getElementById('rail-legend-selected-note').textContent,/Branch off/);
 d.querySelector('[data-locale="zh"]').click();
 assert.match(d.getElementById('railway-legend-title').textContent,/铁路/);
 d.querySelector('[data-locale="th"]').click();
 assert(d.getElementById('railway-legend-trigger').getAttribute('aria-label').length>5);
 assert(branch.querySelector('.rail-legend-swatch'));
 w.close();
});
test('R2.12 campus only appears after China selection; marker remains a real geographic point',()=>{
 const {w,map,d}=setup();
 assert.equal(map.marker,undefined);
 d.querySelector('[data-region="china"]').click();
 assert.deepEqual(Array.from(map.marker.coords),[109.52917,24.39864]);
 assert.equal(map.marker.getElement().textContent,'🎓');
 assert.match(map.marker.popup.node.textContent,/campus|Kampus/i);
 d.querySelector('[data-region="malaysia"]').click();
 assert(map.marker.removed);
 w.close();
});
test('R2.12 legend is informational and does not claim raster pickability or fabricate individual railway names',()=>{
 assert.match(script,/legendExplanations/);
 assert.match(script,/exact route name needs source evidence/);
 assert(!script.includes('queryRenderedFeatures('));
 assert(script.includes('tiles.openrailwaymap.org'));
 for(const c of ['#FF8100','#FF0C00','#DACA00','#0300C3','#00BD14','#D877B8','#87491D','#000000'])assert(html.includes(c),c);
});
test('R2.12 retains Expand Map, the accessibility targets and project boundaries',()=>{
 for(const token of ['id="map-expand"','id="visitor-map"','#map-shell.is-expanded','44px','© OpenRailwayMap'])assert(html.includes(token),token);
 assert(script.includes('function setExpanded(value)'));
 assert(!/supabase\.co|service_role|owner_account/.test(script));
 assert(!html.includes('data-chainage'));
});
