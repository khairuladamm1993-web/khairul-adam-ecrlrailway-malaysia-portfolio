const test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
const read=x=>fs.readFileSync(path.join(__dirname,'..',x),'utf8');
function chapter(theme,language){
 const dom=new JSDOM(read('reading/railway-fundamentals-01.html'),{url:'https://mrs10.example/reading/railway-fundamentals-01.html',runScripts:'outside-only'});
 const w=dom.window;w.localStorage.setItem('railway-theme',theme);w.localStorage.setItem('railway-language',language);
 w.eval(read('reading/chapter-01-i18n.js'));return w;
}
test('light and dark user preference overrides OS media query in Chapter 01 CSS',()=>{
 const source=read('reading/railway-fundamentals-01.html');
 const os=source.indexOf('@media(prefers-color-scheme:light)');
 for(const marker of [':root[data-theme="light"] body',':root[data-theme="dark"] body',
   ':root[data-theme="light"] .muted',':root[data-theme="dark"] .muted',
   ':root[data-theme="light"] .note',':root[data-theme="dark"] .note']){
  assert(source.indexOf(marker)>os,marker);
 }
});
test('theme button changes CSS root attribute, saved preference and selected Thai label',()=>{
 const w=chapter('light','th'),b=w.document.getElementById('article-theme');
 assert.equal(w.document.documentElement.dataset.theme,'light');
 assert.equal(b.textContent,'โหมดมืด');
 b.click();
 assert.equal(w.document.documentElement.dataset.theme,'dark');
 assert.equal(w.localStorage.getItem('railway-theme'),'dark');
 assert.equal(b.textContent,'โหมดสว่าง');
 b.click();
 assert.equal(w.document.documentElement.dataset.theme,'light');
 assert.equal(w.localStorage.getItem('railway-theme'),'light');
});
test('Chapter 01 EN and Chinese controls translate with primary article text',()=>{
 const w=chapter('dark','th'),picker=w.document.getElementById('article-language');
 picker.value='en';picker.dispatchEvent(new w.Event('change'));
 assert.equal(w.document.querySelector('label[for="article-language"]').textContent,'Language');
 assert.equal(w.document.getElementById('article-theme').textContent,'Light Mode');
 picker.value='zh';picker.dispatchEvent(new w.Event('change'));
 assert.equal(w.document.querySelector('label[for="article-language"]').textContent,'语言');
 assert.equal(w.document.getElementById('article-theme').textContent,'浅色模式');
});
test('vector visitor map exports proper name fallback in all four languages',()=>{
 const map=require('../assets/map-language-lab.js');
 assert.deepEqual(map.nameExpression('en'),['coalesce',['get','name:en'],['get','name:latin'],['get','name']]);
 assert.deepEqual(map.nameExpression('ms'),['coalesce',['get','name:ms'],['get','name:en'],['get','name:latin'],['get','name']]);
 for(const l of ['th','zh'])assert.equal(map.nameExpression(l)[1][1],'name:'+l);
 assert.equal(map.isNameLayer({type:'symbol',id:'label_city',layout:{'text-field':['get','name']}}),true);
 assert.equal(map.isNameLayer({type:'symbol',id:'highway-shield-us-interstate',layout:{'text-field':['get','ref']}}),false);
 assert.equal(map.isNameLayer({type:'line',id:'road_skeleton',layout:{'text-field':['get','name']}}),false);
});
test('public vector map uses sourced OpenFreeMap and railway-overlay only; no secret API key',()=>{
 const html=read('map-language-lab.html'),script=read('assets/map-language-lab.js');
 assert.match(html,/maplibre-gl@6\.13\.0\/dist\/maplibre-gl\.mjs/);
 assert.match(script,/tiles\.openfreemap\.org\/styles/);
 assert.match(script,/tiles\.openrailwaymap\.org\/standard/);
 assert.match(script,/setLayoutProperty\(layer\.id,'text-field'/);
 assert.match(html,/data-region="thailand"/);
 assert.match(html,/data-region="china"/);
 assert(!script.includes('mapboxAccessToken'));
 assert(!script.includes('supabase.co'));
});
test('visitor map packaged into main Unified Gateway but separate from canonical ECRL map layers',()=>{
 const prod=read('scripts/build-production.py');
 const pub=read('assets/public-gateway.js');
 assert(prod.includes('"map-language-lab.html"'));
 assert(pub.includes('href="map-language-lab.html"'));
 assert(pub.includes('mountMap'));
});
