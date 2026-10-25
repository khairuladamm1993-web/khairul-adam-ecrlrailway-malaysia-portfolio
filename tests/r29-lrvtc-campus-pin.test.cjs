const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const location=require('../assets/map-language-lab.js');
test('Owner-approved LRVTC campus uses sourced OSM WGS84 centroid and correct campus address',()=>{
 const c=location.LRVTC_CAMPUS;
 assert.equal(c.id,'lrvtc-guantang-campus');
 assert.equal(c.osmWay,'631232606');
 assert.deepEqual(c.lngLat,[109.52917,24.39864]);
 assert.match(c.address,/No\. 2 Wenyuan Road, Yufeng District/);
 assert.match(c.positionClass,/not surveyed entrance/);
 assert.notEqual(c.address.includes('Heping Road'),true);
 assert(Object.isFrozen(c));
});
test('pin language content spans BM EN Chinese Thai without publishing private media',()=>{
 for(const l of ['ms','en','zh','th']){
  assert(location.campusText[l]?.button.includes('🎓'),l);
  assert(location.campusText[l]?.note.length>=12,l);
 }
 const script=read('assets/map-language-lab.js');
 assert.match(script,/setDOMContent\(makeCampusPopup\(\)\)/);
 assert.doesNotMatch(script,/service_role|authorization.*Bearer|images\/personal/);
});
function setup(){
 const html=read('map-language-lab.html');
 const d=new JSDOM(html,{url:'https://preview.example/map-language-lab.html',runScripts:'outside-only'});
 const w=d.window,maps=[];
 class MockPopup{
  setDOMContent(x){this.node=x;return this}
  isOpen(){return this.open||false}
 }
 class MockMarker{
  constructor({element}){this.element=element;this.visible=false;this.removed=false;this.toggleCount=0;}
  setLngLat(p){this.coords=p;return this}
  setPopup(p){this.popup=p;return this}
  addTo(m){this.visible=true;this.map=m;m.marker=this;return this}
  getElement(){return this.element}
  getPopup(){return this.popup}
  remove(){this.removed=true;return this}
  togglePopup(){this.popup.open=true;this.toggleCount++;return this}
 }
 class MockMap{
  constructor(args){this.args=args;this.listeners={};this.layers=[];this.sources={};maps.push(this)}
  addControl(){}
  on(k,fn){this.listeners[k]=fn}
  getStyle(){return {layers:this.layers.length?this.layers:[{type:'symbol',id:'label_city',source:'osm','source-layer':'place',layout:{'text-field':['get','name']}}],sources:{osm:{type:'vector'}}}}
  getSource(k){return this.sources[k]}
  getLayer(k){return this.layers.find(x=>x.id===k)}
  addSource(k,s){this.sources[k]=s}
  addLayer(l){this.layers.push(l)}
  setLayoutProperty(k,p,v){let l=this.getLayer(k);if(l){l.layout||={};l.layout[p]=v;}}
  isStyleLoaded(){return true}
  flyTo(o){this.lastFly=o}
  setStyle(s){this.args.style=s;this.listeners['style.load']?.()}
 }
 w.maplibregl={Map:MockMap,Marker:MockMarker,Popup:MockPopup,NavigationControl:class {}};
 w.eval(read('assets/map-language-lab.js'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 assert.equal(maps.length,1);
 maps[0].listeners['style.load']();
 return {w,map:maps[0]};
}
test('campus is an in-map icon only when China selected; no external focus button',()=>{
 const {w,map}=setup(),d=w.document;
 assert.equal(d.getElementById('campus-focus'),null);
 assert.equal(d.getElementById('campus-location'),null);
 assert.equal(map.marker,undefined);
 d.querySelector('[data-region="china"]').click();
 assert(map.marker?.visible);
 assert.deepEqual(Array.from(map.marker.coords),[109.52917,24.39864]);
 assert.equal(map.marker.getElement().textContent,'🎓');
 assert.match(map.marker.getElement().getAttribute('aria-label'),/LRVTC/);
 assert.match(map.marker.getPopup().node.textContent,/Wenyuan Road/);
 d.querySelector('[data-region="thailand"]').click();
 assert.equal(map.marker.removed,true);
 w.close();
});
test('campus marker and popup follow languages without fabricating a gate',()=>{
 const {w,map}=setup(),d=w.document;
 d.querySelector('[data-region="china"]').click();
 d.querySelector('[data-locale="zh"]').click();
 assert.match(map.marker.getElement().getAttribute('aria-label'),/柳州铁道职业技术学院/);
 assert.match(map.marker.getPopup().node.textContent,/不是经过核实/);
 d.querySelector('[data-locale="en"]').click();
 assert.match(map.marker.getPopup().node.textContent,/not a verified gate/);
 w.close();
});
test('no extra campus coordinates, no ECRL geometry changes, popup stays MapLibre owned',()=>{
 const h=read('map-language-lab.html'),s=read('assets/map-language-lab.js');
 assert(!h.includes('id="campus-focus"'));
 assert(!h.includes('id="campus-location"'));
 assert.match(s,/campusMarker\.remove\(\)/);
 assert.match(s,/maplibregl\.Marker/);
 assert.match(s,/maplibregl\.Popup/);
 assert.doesNotMatch(s,/STN0[1-9]|CH338|auth\\.users/);
 assert.match(read('assets/map-gateway.js'),/EXACT_ZOOM=11/);
});
