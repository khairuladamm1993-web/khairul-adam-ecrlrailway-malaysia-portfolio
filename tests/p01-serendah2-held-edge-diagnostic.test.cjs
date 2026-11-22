'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

function mapFixture(t, canReadMemberContent) {
 const {JSDOM}=require('jsdom');
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only'});
 t.after(()=>dom.window.close());
 const w=dom.window;
 const host=w.document.querySelector('main');
 let onLanguage;
 w.Railway={language:'ms',onLanguage:callback=>{onLanguage=callback;}};
 w.RailwayAccess={canReadMemberContent,cachedData:{content:[]}};
 w.L={
  map:()=>({invalidateSize(){},remove(){}}),
  tileLayer:()=>({addTo(){}}),
 };
 w.eval(read('assets/map-gateway.js'));
 return {w,host,selector:'[data-map-serendah-hold]',language(value){w.Railway.language=value;onLanguage();}};
}

test('Serendah 2 is an explanatory BM/EN HOLD disclosure without adding an asset or geometry',async t=>{
 const {w,host,selector,language}=mapFixture(t,true);
 await w.RailwayMap.mount(host);
 t.after(()=>w.RailwayMap.unmount());
 assert.equal(host.dataset.mapReady,'true');
 const disclosure=host.querySelector(selector);
 assert.match(disclosure.textContent,/Serendah 2.*HOLD/);
 assert.match(disclosure.textContent,/13055510163 → 13785440684/);
 assert.match(disclosure.textContent,/9,503\.9 m.*2,500 m/);
 assert.match(disclosure.textContent,/tidak menunjukkan geometri segmen yang ditahan/);
 disclosure.open=true;
 language('en');
 assert.equal(disclosure.lang,'en');
 assert.equal(disclosure.open,true);
 assert.match(disclosure.textContent,/The as-built centreline, portals and chainage remain unverified/);
 assert.equal(disclosure.querySelectorAll('canvas,svg,[data-map-point]').length,0);
 assert.equal(disclosure.querySelector('a').href,'https://www.openstreetmap.org/way/1420666687');
});

test('Serendah 2 disclosure is absent from public UI and removed when Member entitlement ends',async t=>{
 const {w,host,selector,language}=mapFixture(t,false);
 await w.RailwayMap.mount(host);
 t.after(()=>w.RailwayMap.unmount());
 assert.equal(host.dataset.mapReady,'true');
 assert.equal(host.querySelector(selector),null);
 const refresh=async allowed=>{
  w.RailwayAccess.canReadMemberContent=allowed;
  w.dispatchEvent(new w.Event('railway-access-change'));
  await Promise.resolve();
 };
 await refresh(true);
 assert.equal(host.querySelectorAll(selector).length,1);
 await refresh(false);
 language('en');
 assert.equal(host.querySelector(selector),null);
});
