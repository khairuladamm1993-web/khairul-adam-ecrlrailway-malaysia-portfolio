const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('map-language-lab.html'),script=read('assets/map-language-lab.js');
function setup(){
 const w=new JSDOM(html,{url:'https://mrs10-qa.example/map-language-lab.html?railPilot=1',runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};
 let map;
 class Map{
  constructor(args){map=this;this.args=args;this.handlers={};this.layers=[];this.sources={};}
  addControl(){}
  on(e,handler){if(typeof handler==='function')this.handlers[e]=handler;}
  isStyleLoaded(){return true}
  getStyle(){return {layers:[{id:'base',type:'symbol',source:'osm','source-layer':'place',layout:{'text-field':['get','name']}}],sources:{osm:{type:'vector'}}}}
  getLayer(k){return this.layers.find(l=>l.id===k)}
  getSource(k){return this.sources[k]}
  addSource(k,v){this.sources[k]=v}
  addLayer(layer){this.layers.push(layer)}
  setLayoutProperty(k,p,v){const o=this.getLayer(k);if(o){o.layout||={};o.layout[p]=v}}
  flyTo(){}
  resize(){}
  setStyle(v){this.args.style=v;this.handlers['style.load']?.();}
 }
 class Popup{setDOMContent(n){this.node=n;return this}isOpen(){return false}}
 class Marker{constructor({element}){this.element=element}setLngLat(){return this}setPopup(p){this.popup=p;return this}addTo(){return this}remove(){}getElement(){return this.element}getPopup(){return this.popup}}
 w.maplibregl={Map,Popup,Marker,NavigationControl:class {}};
 w.eval(script);
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {w,d:w.document,map};
}
test('R2.14.1 half-contrast theme icon has persistent compact 44px tap target and multilingual accessibility',()=>{
 const {w,d,map}=setup(),btn=d.getElementById('theme-btn');
 assert.equal(btn.querySelectorAll('.theme-contrast-icon').length,1);
 assert.equal(btn.textContent,'');
 assert.equal(btn.getAttribute('aria-pressed'),'false');
 assert.match(btn.getAttribute('aria-label'),/gelap|Dark|暗|มืด/i);
 btn.click();
 assert.equal(d.documentElement.dataset.theme,'dark');
 assert.equal(btn.getAttribute('aria-pressed'),'true');
 assert.equal(btn.textContent,'');
 assert.equal(btn.title,btn.getAttribute('aria-label'));
 assert(map.args.style.endsWith('/dark'));
 for(const locale of ['en','zh','th','ms']){
  d.querySelector('[data-locale="'+locale+'"]').click();
  assert(btn.getAttribute('aria-label').length>3);
  assert.equal(btn.title,btn.getAttribute('aria-label'));
  assert.equal(btn.textContent,'');
 }
 btn.click();
 assert.equal(d.documentElement.dataset.theme,'light');
 assert.equal(btn.getAttribute('aria-pressed'),'false');
 assert(map.args.style.endsWith('/positron'));
 w.close();
});
test('R2.14.1 compact language/country controls remain accessible 44px and three-country logic unchanged',()=>{
 const doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelectorAll('[data-locale]').length,4);
 assert.equal(doc.querySelectorAll('[data-region]').length,3);
 for(const needle of [
  '#theme-btn{width:44px;min-width:44px;height:44px;min-height:44px',
  '.theme-contrast-icon{display:block',
  '.controls[aria-label="Language selector"] button{min-width:44px;min-height:44px;height:44px',
  '.controls[aria-label="Countries"] button{min-width:0;min-height:44px;height:44px'
 ]) assert(html.includes(needle),needle);
});
test('R2.14.1 opening code panel hides pilot banner, closing panel restores it and closes legend',()=>{
 const {w,d}=setup();
 d.querySelector('[data-region="china"]').click();
 const trigger=d.getElementById('china-code-trigger'),panel=d.getElementById('china-code-panel');
 const shell=d.getElementById('map-shell'),legend=d.getElementById('railway-legend');
 assert(!trigger.hidden);
 legend.open=true;
 trigger.click();
 assert.equal(panel.hidden,false);
 assert.equal(trigger.getAttribute('aria-expanded'),'true');
 assert(shell.classList.contains('is-code-open'));
 assert.equal(legend.open,false);
 d.querySelector('[data-china-code="44930"]').click();
 assert.match(d.getElementById('china-code-result').textContent,/Róng'ān Zhàn/);
 d.getElementById('china-code-close').click();
 assert.equal(panel.hidden,true);
 assert(!shell.classList.contains('is-code-open'));
 assert.equal(trigger.getAttribute('aria-expanded'),'false');
 trigger.click();assert(shell.classList.contains('is-code-open'));
 d.querySelector('[data-region="malaysia"]').click();
 assert(panel.hidden && trigger.hidden);
 assert(!shell.classList.contains('is-code-open'));
 w.close();
});
test('R2.14.1 compact lookup panel is legible and scrollable in Light/Dark without 50% transparency',()=>{
 assert(html.includes('max-height:min(40dvh,290px)'));
 assert(html.includes('background:rgba(255,255,255,.96)'));
 assert(html.includes('background:rgba(20,46,62,.96)'));
 assert(html.includes('backdrop-filter:blur(12px)'));
 assert(html.includes('overscroll-behavior:contain'));
 assert(html.includes('font-size:16px'));
 assert(html.includes('#map-shell.is-code-open .railway-pilot-status{display:none}'));
});
