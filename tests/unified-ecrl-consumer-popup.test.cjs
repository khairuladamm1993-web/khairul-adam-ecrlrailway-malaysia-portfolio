const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><section id="ecrl-controls"></section><section id="ecrl-assets"></section></body></html>',{url:'https://example.test/',runScripts:'outside-only'});
const w=dom.window;
for(const path of ['assets/unified-ecrl/source/data.js','assets/unified-ecrl/source/i18n.js'])vm.runInNewContext(fs.readFileSync(path,'utf8'),{window:w});
const adapter=require('../assets/unified-ecrl/adapter').create(w.MRS10ECRLGISV1,w.MRS10ECRLI18N);
vm.runInNewContext(fs.readFileSync('assets/unified-ecrl/integration-ui.js','utf8'),{window:w,document:w.document});
let locale='ms',category='ECRL';
const ui=w.MRS10ECRLIntegrationUI.create(adapter,{getLocale:()=>locale,getCategory:()=>category,onSelect:()=>{},onFlags:(kind,v)=>{adapter.flags[kind]=v}});
test('consumer popup keeps only essential facts visible and engineering data behind disclosure',()=>{
 const c=ui.content('ecrl-stn-10');
 assert.match(c.querySelector('.ecrl-name').textContent,/STN11 · Kuantan Port City/);
 assert.match(c.querySelector('.ecrl-accuracy').textContent,/rujukan kawasan/i);
 assert.match(c.querySelector('.ecrl-status').textContent,/operasi awam/i);
 assert.match(c.querySelector('.ecrl-key-facts').textContent,/Seksyen.*B/);
 assert.match(c.querySelector('.ecrl-key-facts').textContent,/Penumpang.*Kargo/i);
 const engineering=c.querySelector('details.ecrl-engineering'),sources=c.querySelector('details.ecrl-sources');
 assert(engineering&&!engineering.open&&sources&&!sources.open);
 assert.match(engineering.textContent,/LEGACY_PUBLIC_LOCALITY_REFERENCE/);
 assert.match(engineering.textContent,/UNKNOWN/);
 assert.match(engineering.textContent,/ecrl-stn-10/);
 assert.equal(c.querySelector('.ecrl-key-facts').textContent.includes('LEGACY_PUBLIC_LOCALITY_REFERENCE'),false);
 assert.equal(c.querySelectorAll('details.ecrl-engineering').length,1);
});
test('historical and port reference warnings remain unambiguous',()=>{
 const historical=ui.content('ecrl-stn-18'),port=ui.content('ecrl-port-northport');
 assert.match(historical.querySelector('.ecrl-accuracy').textContent,/2017/);
 assert.match(historical.querySelector('.ecrl-key-facts').textContent,/Konflik sumber/);
 assert.match(historical.querySelector('.ecrl-engineering').textContent,/SOURCE_CONFLICT/);
 assert.match(port.querySelector('.ecrl-accuracy').textContent,/pelabuhan/);
 assert.match(port.querySelector('.ecrl-accuracy').textContent,/bukan terminal rel/i);
 assert.match(port.querySelector('.ecrl-engineering').textContent,/MARITIME/);
 assert(port.querySelector('.ecrl-sources a[href]'));
});
test('four locales maintain public-safe reference and engineering disclosure',()=>{
 for(const lang of ['ms','en','zh','th']){
  locale=lang;const c=ui.content('ecrl-stn-10');
  assert(c.querySelector('.ecrl-accuracy').textContent.length>12,lang);
  assert(c.querySelector('.ecrl-engineering>summary').textContent.length>3,lang);
  assert(c.querySelector('.ecrl-sources>summary').textContent.length>3,lang);
  assert.match(c.querySelector('.ecrl-name').textContent,/STN11/);
 }
 locale='ms';
});
test('all source references and category toggles remain accessible without changing GIS',()=>{
 ui.render();const switches=w.document.querySelectorAll('#ecrl-controls input[type=checkbox]');assert.equal(switches.length,3);
 assert.equal(w.document.querySelectorAll('#ecrl-assets button').length,33);
 assert.equal(adapter.refs.length,22);assert.equal(adapter.snapshot().physicalSegments,0);
 assert(w.document.querySelector('details.ecrl-source-policy'));assert(w.document.querySelector('details.ecrl-asset-list'));
 category='MRT';ui.render();assert.equal(w.document.getElementById('ecrl-controls').hidden,true);
});
