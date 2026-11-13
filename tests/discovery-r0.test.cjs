const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const catalogue=require('../data/openmr-r3/intelligence.json');
const html=fs.readFileSync('discovery/index.html','utf8');
function app(){
  return new JSDOM(html,{
    url:'https://example.test/discovery/',
    runScripts:'dangerously',
    beforeParse(window){
      window.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve(catalogue)});
      window.matchMedia=()=>({matches:false});
    }
  });
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('discovery preserves P01 R3 source catalogue and evidence boundaries',()=>{
 assert.equal(catalogue.facilities.length,14);
 assert.equal(catalogue.relationships.length,6);
 assert.equal(catalogue.sectors.length,11);
 assert.equal(new Set(catalogue.facilities.map(f=>f.id)).size,catalogue.facilities.length);
 const ids=new Set(catalogue.facilities.map(f=>f.id));
 for(const relation of catalogue.relationships){
   assert(ids.has(relation.from),relation.id+': missing from');
   assert(ids.has(relation.to),relation.id+': missing to');
   assert.equal(relation.type,'DOCUMENTARY_RELATION_NOT_GEOMETRY');
   assert.equal(relation.geometry,null);
 }
 for(const record of [...catalogue.facilities,...catalogue.relationships,...catalogue.sectors]) assert.match(record.sourceURL,/^https:\/\//);
});
test('discovery page compiles without private access side effects',()=>{
 const js=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
 assert(js,'inline application script found');
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.match(js,/\.\.\/data\/openmr-r3\/intelligence\.json/);
 assert(!/\.innerHTML\s*=|document\.write|localStorage|sessionStorage|navigator\.geolocation/.test(js));
 assert(!/addLayer\(|setLngLat\(/.test(js));
 assert(!/<meta name="robots" content="noindex/i.test(html));
});
test('discovery renders, searches, filters and displays source links',async()=>{
 const dom=app();
 try{
  await settle();
  const doc=dom.window.document;
  assert.equal(doc.querySelectorAll('.result').length,31);
  assert.match(doc.getElementById('count').textContent,/31 hasil/);
  const search=doc.getElementById('search');
  search.value='Kuantan';
  search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  assert(doc.querySelectorAll('.result').length>0);
  assert(doc.querySelectorAll('.result').length<31);
  search.value='';
  search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  doc.querySelector('[data-kind="sector"]').click();
  assert.equal(doc.querySelectorAll('.result').length,11);
  doc.querySelector('[data-kind="all"]').click();
  assert.equal(doc.querySelectorAll('.result').length,31);
  doc.querySelector('.result button').click();
  const src=doc.querySelector('#detailBody a');
  assert(src);
  assert.match(src.href,/^https:\/\//);
  assert.equal(src.rel,'noopener noreferrer');
 }finally{dom.window.close()}
});
