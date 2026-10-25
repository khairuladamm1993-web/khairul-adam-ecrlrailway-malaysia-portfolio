const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const languages=['ms','en','zh','th'];
const src={i18n:read('assets/i18n.js'),thai:read('assets/translations-th.js'),
 map:read('assets/map-locale.js'),article:read('reading/chapter-01-i18n.js'),
 html:read('reading/railway-fundamentals-01.html'),gate:read('gateway.html')};
function chapter(locale,stored='ms'){
 const w=new JSDOM(src.html,{url:'https://mrs10.example/reading/railway-fundamentals-01.html?lang='+locale,runScripts:'outside-only'}).window;
 w.localStorage.setItem('railway-language',stored);w.eval(src.article);return w;
}
test('four languages are selectable at Welcome, Gateway, Portfolio, article',()=>{
 for(const page of ['index.html','gateway.html','portfolio.html']){
  const html=read(page);
  for(const l of languages)assert(html.includes('data-lang="'+l+'"'),page+' '+l);
  assert(html.includes('assets/translations-th.js'));
 }
 for(const l of languages)assert(src.html.includes('value="'+l+'"'));
 for(const l of languages)assert(src.i18n.includes("'"+l+"'"));
});
test('Thai translation merge preserves existing three-language properties',()=>{
 const t={window:{railwayTranslations:{'Public':{ms:'Awam',en:'Public',zh:'公众'}}}};
 vm.runInNewContext(src.thai,t);
 assert.equal(t.window.railwayTranslations.Public.en,'Public');
 assert.equal(t.window.railwayTranslations.Public.zh,'公众');
 assert.equal(t.window.railwayTranslations.Public.th,'สาธารณะ');
 assert(Object.keys(t.window.railwayTranslations).length>90);
});
test('Thai Chapter 01 renders complete sections and references without dropped content',()=>{
 const d=chapter('th').document;
 assert.equal(d.documentElement.lang,'th');
 assert.match(d.querySelector('main h1').textContent,/บทที่ 01/);
 assert.match(d.querySelector('#kawalan p').textContent,/ระยะเบรก/);
 assert.match(d.querySelector('#interaksi p').textContent,/สถานี A/);
 assert.match(d.querySelector('#rujukan h2').textContent,/เอกสารอ้างอิง/);
 assert.equal(d.querySelectorAll('.toc a').length,8);
 assert.equal(d.querySelectorAll('#komponen .diagram strong').length,6);
 assert.equal(d.querySelectorAll('#semak details').length,3);
 assert.equal(d.querySelectorAll('#rujukan ol a').length,3);
 assert.equal(d.querySelector('#article-language').value,'th');
 assert.equal(d.defaultView.localStorage.getItem('railway-language'),'th');
});
test('switching languages from Chapter 01 preserves one global preference',()=>{
 const w=chapter('ms'),s=w.document.querySelector('#article-language');
 for(const l of ['th','zh','en','ms']){
  s.value=l;s.dispatchEvent(new w.Event('change'));
  assert.equal(w.localStorage.getItem('railway-language'),l);
  assert.equal(w.document.documentElement.lang,l==='zh'?'zh-Hans':l);
 }
});
test('Map locale switches UI labels without changing map location metadata or Leaflet nodes',()=>{
 const w=new JSDOM('<section id="map"><label>Search</label><input data-map-search placeholder="Station name; Member code / chainage when available"><button>FIT FULL ROUTE</button><div class="map-canvas"><span>南宁</span></div><h3>Select an asset</h3><p>Basemap labels remain in source language; website controls follow your selected language.</p></section>',{url:'https://example.com/',runScripts:'outside-only'}).window;
 w.eval(src.map);
 const host=w.document.getElementById('map'),canvas=host.querySelector('.map-canvas');
 const val=(s)=>[...host.querySelectorAll('button,label,h3,p')].find(el=>el.tagName==='LABEL')?.textContent;
 w.RailwayMapLocale.apply(host,'th');
 assert.equal(host.querySelector('label').textContent,'ค้นหา');
 assert.equal(host.querySelector('.map-canvas').textContent,'南宁');
 assert.match(host.querySelector('input').placeholder,/ชื่อสถานี/);
 w.RailwayMapLocale.apply(host,'zh');
 assert.equal(host.querySelector('label').textContent,'搜索');
 assert.equal(host.querySelector('.map-canvas'),canvas);
 w.RailwayMapLocale.apply(host,'en');
 assert.equal(host.querySelector('label').textContent,'Search');
 assert.equal(host.querySelector('.map-canvas').textContent,'南宁');
 assert.equal(host.dataset.mapLanguage,'en');
});
test('Map explicitly distinguishes provider raster labels from owned interface translations',()=>{
 const map=read('assets/map-gateway.js');
 const publicUi=read('assets/public-gateway.js');
 assert.match(map,/tile\.openstreetmap\.org/);
 assert.match(map,/tiles\.openrailwaymap\.org/);
 assert.match(map,/data-map-localization-note/);
 assert.match(map,/RailwayMapLocale\?\.apply/);
 assert.match(map,/localeObservers/);
 assert.match(publicUi,/assets\/map-locale\.js/);
 assert.match(publicUi,/category==='map'&&window\.RailwayMap\?\.mounted/);
 assert.match(publicUi,/R\.language/);
 assert.equal((()=>{const o={};vm.runInNewContext(src.map,{window:o});return o.RailwayMapLocale.sourceLabelsLocalized;})(),false);
});
test('Thai Reader and central preference do not alter Owner/admin protections',()=>{
 const gate=read('gateway.html'),script=read('assets/i18n.js');
 assert.match(gate,/owner-center-shortcut"[^>]+aria-hidden="true"[^>]+hidden/);
 assert(!src.thai.includes('supabase.auth'));
 assert(!src.map.includes('supabase.auth'));
 assert(!src.article.includes('fetch('));
 assert.match(script,/railway-language/);
});
test('builds include reading and map language files and no remote translation API',()=>{
 const prod=read('scripts/build-production.py'),preview=read('scripts/build-preview.py');
 assert(prod.includes('"translations-th.js"'));
 assert(prod.includes('"map-locale.js"'));
 assert(preview.includes("root/'assets'"));
 assert(!src.thai.includes('fetch('));
});
