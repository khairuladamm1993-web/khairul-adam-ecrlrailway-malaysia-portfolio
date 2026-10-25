const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const js=require('../assets/map-language-lab.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('R2.14 verified codes contain citations, pinyin, names and no invented matches',()=>{
 assert.deepEqual(Object.keys(js.chinaRailCodeRecords).sort(),['0073','0081','44906','44930','44957'].sort());
 for(const code of Object.keys(js.chinaRailCodeRecords)){
  const r=js.lookupChinaRailCode(code);
  assert.equal(r.code,code);
  assert.match(r.source,/^https:\/\//);
  assert(r.english&&r.hanzi&&r.pinyin);
  assert(Object.isFrozen(js.chinaRailCodeRecords[code]));
 }
 for(const code of ['44915','44921','44975','0083','73','0','449300','00000','<svg>','44930x',44930,null])
  assert.equal(js.lookupChinaRailCode(code),null);
});
test('R2.14 correct station codes and leading-zero line numbers',()=>{
 const station=js.lookupChinaRailCode('44930');
 assert.equal(station.kind,'station');
 assert.equal(station.hanzi,'融安站');
 assert.equal(station.english,"Rong'an Railway Station");
 assert.equal(station.pinyin,"Róng'ān Zhàn");
 assert.equal(js.lookupChinaRailCode('0073').hanzi,'衡柳铁路');
 assert.equal(js.lookupChinaRailCode('0081').hanzi,'黔桂铁路');
 assert.equal(js.lookupChinaRailCode('0073').code,'0073');
 assert.equal(js.lookupChinaRailCode('0073').kind,'line');
});
test('R2.14 minimalist China-only code panel embedded in map',()=>{
 const doc=new JSDOM(read('map-language-lab.html')).window.document;
 const shell=doc.getElementById('map-shell');
 const trigger=doc.getElementById('china-code-trigger'),panel=doc.getElementById('china-code-panel');
 assert(shell.contains(trigger)&&shell.contains(panel));
 assert(trigger.hidden&&panel.hidden);
 assert.equal(doc.querySelectorAll('[data-china-code]').length,2);
 assert.equal(doc.getElementById('china-code-input').getAttribute('maxlength'),'5');
 assert.equal(doc.getElementById('china-code-input').getAttribute('pattern'),'[0-9]{4,5}');
 assert(!doc.getElementById('campus-focus'));
});
function browser(pilot){
 const w=new JSDOM(read('map-language-lab.html'),{url:'https://preview.example/map-language-lab.html'+(pilot?'?railPilot=1':''),runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={};}
  addControl(){} on(e,a){if(typeof a==='function')this.handlers[e]=a;}
  getStyle(){return{layers:[{id:'label_city',type:'symbol',source:'osm',layout:{'text-field':['get','name']}}],sources:{osm:{type:'vector'}}};}
  getLayer(n){return this.layers.find(x=>x.id===n);}
  getSource(n){return this.sources[n];}
  addSource(n,v){this.sources[n]=v;} addLayer(l){this.layers.push(l);}
  setLayoutProperty(){} isStyleLoaded(){return true;} flyTo(){} resize(){}
  setStyle(){this.handlers['style.load']?.();}
 }
 class Marker{
  constructor({element}){this.element=element;}
  setLngLat(){return this;}setPopup(v){this.popup=v;return this;}
  addTo(){return this;}remove(){}
  getElement(){return this.element;}getPopup(){return this.popup;}
 }
 class Popup{setDOMContent(n){this.node=n;return this;}isOpen(){return false;}}
 w.maplibregl={Map,Marker,Popup,NavigationControl:class{}};
 w.eval(read('assets/map-language-lab.js'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return{w,d:w.document,map};
}
test('R2.14 code sample and search are interactive only in China pilot',()=>{
 const{w,d}=browser(true);
 const tr=d.getElementById('china-code-trigger'),panel=d.getElementById('china-code-panel'),result=d.getElementById('china-code-result');
 assert(tr.hidden);
 d.querySelector('[data-region="china"]').click();
 assert.equal(tr.hidden,false);
 tr.click();assert.equal(panel.hidden,false);
 d.querySelector('[data-china-code="0073"]').click();
 assert.match(result.textContent,/0073/);
 assert.match(result.textContent,/Hengyang/);
 assert.match(result.textContent,/衡柳铁路/);
 d.getElementById('china-code-input').value='44915';
 d.getElementById('china-code-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.match(result.textContent,/belum disahkan/);
 d.querySelector('[data-locale="en"]').click();
 assert.match(result.textContent,/not verified/);
 d.querySelector('[data-region="thailand"]').click();
 assert(tr.hidden&&panel.hidden);
 w.close();
});
test('R2.14 code panel is unavailable in public nonpilot map',()=>{
 const{w,d}=browser(false);
 d.querySelector('[data-region="china"]').click();
 assert(d.getElementById('china-code-trigger').hidden);
 assert(d.getElementById('china-code-panel').hidden);
 w.close();
});