const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const moduleFile=require('../assets/map-language-lab.js');
function initialize(locale='en'){
 const html=read('map-language-lab.html').replace(/<script type="module">[\s\S]*?<\/script>/,'');
 const d=new JSDOM(html,{url:'https://mrs10-preview.example/map-language-lab.html',runScripts:'outside-only',pretendToBeVisual:true});
 const w=d.window,instances=[];
 w.localStorage.setItem('railway-language',locale);
 class MockMap{
  constructor(options){this.options=options;this.handlers={};this.sources={};this.layers=[];this.changes=[];instances.push(this);}
  addControl(){}on(name,fn){this.handlers[name]=fn;}
  getSource(n){return this.sources[n]};addSource(n,o){this.sources[n]=o}
  getStyle(){return {layers:this.layers.length?this.layers:[{id:'label_city',type:'symbol',layout:{'text-field':['get','name']}}]};}
  addLayer(l,before){this.layers.push(l);this.insertBefore=before;}
  getLayer(n){return this.layers.find(x=>x.id===n);}
  setLayoutProperty(id,prop,val){this.changes.push({id,prop,val});const l=this.getLayer(id);if(l){l.layout||={};l.layout[prop]=val;}}
  isStyleLoaded(){return true;}flyTo(o){this.lastFly=o;}
  setStyle(x){this.currentStyle=x;this.sources={};this.layers=[];this.handlers['style.load']?.();}
 }
 class NavigationControl{}
 w.maplibregl={Map:MockMap,NavigationControl};
 w.eval(read('assets/map-language-lab.js'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 const map=instances[0];assert(map);
 map.handlers['style.load']();
 return {w,map,instances};
}
test('blue numeric railway reference can be hidden without losing map or language labels',()=>{
 const {w,map}=initialize('en');
 const overlay=map.getLayer('mrl-railway');
 assert.equal(overlay.layout.visibility,'none');
 assert.equal(w.document.getElementById('railway-btn').getAttribute('aria-pressed'),'false');
 assert.equal(w.document.getElementById('railway-btn').textContent,'Railway details: OFF');
 w.document.getElementById('railway-btn').click();
 assert.equal(map.getLayer('mrl-railway').layout.visibility,'visible');
 assert.equal(w.document.getElementById('railway-btn').getAttribute('aria-pressed'),'true');
 w.document.getElementById('railway-btn').click();
 assert.equal(map.getLayer('mrl-railway').layout.visibility,'none');
 assert.equal(map.sources['mrl-railway'].tiles[0].includes('openrailwaymap.org'),true);
});
test('rail layer toggle label and state follow Chinese and Thai with intact viewport',()=>{
 const {w,map}=initialize('en');
 w.document.querySelector('[data-locale="zh"]').click();
 assert.match(w.document.getElementById('railway-btn').textContent,/铁路详情/);
 assert.equal(w.localStorage.getItem('railway-language'),'zh');
 w.document.getElementById('railway-btn').click();
 assert.match(w.document.getElementById('railway-btn').textContent,/开启/);
 w.document.querySelector('[data-locale="th"]').click();
 assert.match(w.document.getElementById('railway-btn').textContent,/รายละเอียดรถไฟ/);
 assert.equal(map.options.center[0],102.75);
 assert.equal(map.options.center[1],4.4);
});
test('dark mode shows readable explicit named button and accepts persisted setting',()=>{
 const {w,map}=initialize();
 const theme=w.document.getElementById('theme-btn');
 assert.equal(theme.textContent,'Switch to Dark Mode');
 theme.click();
 assert.equal(w.document.documentElement.dataset.theme,'dark');
 assert.equal(theme.textContent,'Switch to Light Mode');
 assert.equal(w.localStorage.getItem('railway-theme'),'dark');
 assert(map.currentStyle.endsWith('/dark'));
 assert.equal(map.getLayer('mrl-railway').layout.visibility,'none');
 theme.click();
 assert.equal(w.document.documentElement.dataset.theme,'light');
 assert(map.currentStyle.endsWith('/positron'));
});
test('high contrast dark CSS and mobile safe area prevent low visibility under status bar',()=>{
 const h=read('map-language-lab.html');
 assert(h.includes('--fg:#f3faff'));
 assert(h.includes('--muted:#d0e1ee'));
 assert(h.includes('padding-top:max(55px,env(safe-area-inset-top))'));
 assert(h.includes('.maplibregl-ctrl-attrib'));
 assert(h.includes('button:focus-visible'));
 assert(h.includes('id="railway-btn"'));
});
test('name translations, layer filtering and attribution remain stable with new control',()=>{
 assert.equal(moduleFile.railVisibility(false),'none');
 assert.equal(moduleFile.railVisibility(true),'visible');
 assert.equal(moduleFile.nameExpression('en')[1][1],'name:en');
 assert.equal(moduleFile.nameExpression('zh')[1][1],'name:zh');
 assert.equal(moduleFile.nameExpression('th')[1][1],'name:th');
 assert(!moduleFile.isNameLayer({id:'railway-milestone',type:'raster',layout:{'text-field':'x'}}));
 assert.match(read('map-language-lab.html'),/© OpenMapTiles, © OpenStreetMap/);
 assert.match(read('assets/map-language-lab.js'),/tiles\.openrailwaymap\.org/);
});
