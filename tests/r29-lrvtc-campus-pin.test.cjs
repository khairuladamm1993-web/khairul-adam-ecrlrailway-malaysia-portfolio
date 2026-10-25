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
  addTo(m){this.visible=true;this.map=m;return this}
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
test('single campus pin appears only in China map and vanishes on Malaysia/Thailand',()=>{
 const {w,map}=setup();
 const focus=w.document.getElementById('campus-focus'),panel=w.document.getElementById('campus-location');
 assert(panel.hidden);
 w.document.querySelector('[data-region="china"]').click();
 assert.equal(panel.hidden,false);
 assert.match(focus.textContent,/LRVTC/);
 focus.click();
 assert.deepEqual(Array.from(map.lastFly.center),[109.52917,24.39864]);
 assert.equal(map.lastFly.zoom,13);
 w.document.querySelector('[data-region="thailand"]').click();
 assert.equal(panel.hidden,true);
 w.document.querySelector('[data-region="malaysia"]').click();
 assert.equal(panel.hidden,true);
});
test('campus popup re-localizes and keeps college source address',()=>{
 const {w}=setup();
 w.document.querySelector('[data-region="china"]').click();
 w.document.querySelector('[data-locale="zh"]').click();
 assert.match(w.document.querySelector('#campus-focus').textContent,/柳州铁道职业技术学院/);
 w.document.querySelector('#campus-focus').click();
 assert(w.document.querySelector('#liuzhou-guide').hidden===false);
 w.document.querySelector('[data-locale="en"]').click();
 assert.match(w.document.querySelector('#campus-focus').textContent,/Guantang Campus/);
});
test('ECRL coordinates and technical map remain separate; website retains 1 optional campus item',()=>{
 const h=read('map-language-lab.html'),s=read('assets/map-language-lab.js');
 assert.equal((h.match(/id="campus-focus"/g)||[]).length,1);
 assert.match(h,/#campus-location\[hidden\]\{display:none\}/);
 assert.match(s,/campusMarker\.remove\(\)/);
 assert.match(s,/maplibregl\.Marker/);
 assert.match(s,/maplibregl\.Popup/);
 assert.doesNotMatch(s,/STN0[1-9]|CH338|auth\\.users/);
 assert.match(read('assets/map-gateway.js'),/EXACT_ZOOM=11/);
});
