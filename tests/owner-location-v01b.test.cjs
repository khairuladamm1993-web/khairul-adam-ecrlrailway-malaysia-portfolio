const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/owner-map-v01b.js'),'utf8');

function mock(role=true){
 let requests=0;
 const elements=new Map();
 const slot={
  html:'',
  set innerHTML(v){this.html=v;elements.clear()},
  get innerHTML(){return this.html},
  replaceChildren(){this.html='';elements.clear()},
  querySelector(selector){
   const key=(selector.match(/data-v-([\w]+)/)||[])[1];
   if(!key)return null;
   if(!elements.has(key))elements.set(key,{onclick:null,value:key==='lat'?'3.677090':key==='lon'?'103.030010':key==='note'?'Authorized site observation':key==='evidence'?'OWNER_FIELD_OBSERVATION':''});
   return elements.get(key);
  }
 };
 const marker=(coords,options)=>({
  coords,options,addTo(){return this},bindTooltip(){return this},on(event,fn){if(event==='dragend')this.dragHandler=fn;return this},
  setLatLng(coords){this.coords=coords},getLatLng(){return {lat:this.coords[0],lng:this.coords[1]}},remove(){this.removed=true}
 });
 const ctx={
  leaflet:{divIcon:()=>({}),marker,circle:()=>({addTo(){return this},remove(){}})},
  map:{},
  getSelected:()=>({id:'PL03',name:'Felda Lepar',type:'PL',lat:3.67709,lon:103.03001,overlay:{code:'PL03',chainage:'CH353+242'}})
 };
 const app={RailwayAccess:{canAdmin:role}};
 const navigator={geolocation:{getCurrentPosition(success){requests++;success({coords:{latitude:3.68,longitude:103.04,accuracy:12}})}}};
 vm.runInNewContext(source,{window:app,navigator,Number,Math,Object,String,Date});
 return {app,ctx,slot,get requests(){return requests},set(k,v){slot.querySelector('[data-v-'+k+']').value=v},click(k){const b=slot.querySelector('[data-v-'+k+']');assert.equal(typeof b.onclick,'function',k);b.onclick()}};
}
test('non-Owner cannot mount mock editing UI',()=>{
 for(const role of [false,null]){const h=mock(role);assert.equal(h.app.RailwayOwnerMapV01B.mount(h.ctx,h.slot),false);assert.equal(h.slot.innerHTML,'')}
});
test('Owner can mount CURRENT from selected canonical record',()=>{
 const h=mock();assert.equal(h.app.RailwayOwnerMapV01B.mount(h.ctx,h.slot),true);assert.match(h.slot.innerHTML,/3\.677090, 103\.030010/);
});
test('manual proposal and Undo do not change CURRENT',()=>{
 const h=mock();h.app.RailwayOwnerMapV01B.mount(h.ctx,h.slot);
 h.set('lat','3.68');h.set('lon','103.04');h.click('apply');assert.match(h.slot.innerHTML,/3\.680000, 103\.040000/);assert.match(h.slot.innerHTML,/CURRENT<\/strong>: 3\.677090, 103\.030010/);
 h.click('undo');assert.match(h.slot.innerHTML,/PROPOSED<\/strong>: 3\.677090, 103\.030010/);
});
test('reset proposal returns to CURRENT',()=>{
 const h=mock();h.app.RailwayOwnerMapV01B.mount(h.ctx,h.slot);h.set('lat','3.68');h.set('lon','103.04');h.click('apply');h.click('reset');assert.match(h.slot.innerHTML,/PROPOSED<\/strong>: 3\.677090, 103\.030010/);
});
test('GPS permission is deferred until explicit click; clear removes in-memory fix',()=>{
 const h=mock();h.app.RailwayOwnerMapV01B.mount(h.ctx,h.slot);assert.equal(h.requests,0);h.click('gps');assert.equal(h.requests,1);assert.match(h.slot.innerHTML,/GPS reported accuracy: 12\.0 m/);h.click('gpsclear');assert.match(h.slot.innerHTML,/GPS cleared/);
});
test('save and review are mock only, never canonical publish',()=>{
 const h=mock();h.app.RailwayOwnerMapV01B.mount(h.ctx,h.slot);h.set('note','Reference observation');h.click('save');assert.match(h.slot.innerHTML,/Mock saved: 1/);h.click('approve');assert.match(h.slot.innerHTML,/Mock review events: 1/);assert.doesNotMatch(source,/adminPublishLocation|adminRestoreLocation|\bfetch\s*\(|sendBeacon\s*\(|localStorage|sessionStorage|service_role/);
});
test('prototype performs no telemetry and no persistent raw GPS writes',()=>{
 assert.doesNotMatch(source,/console\.log|google-analytics|\.analytics\s*\(|navigator\.sendBeacon|indexedDB|localStorage|sessionStorage/);
});
test('unmount clears active state',()=>{
 const h=mock();h.app.RailwayOwnerMapV01B.mount(h.ctx,h.slot);h.app.RailwayOwnerMapV01B.unmount();assert.equal(h.app.RailwayOwnerMapV01B.active,false);
});
test('host only loads V0.1B through Owner module on demand',()=>{
 const host=fs.readFileSync(path.join(__dirname,'../assets/owner-map.js'),'utf8');
 assert.match(host,/data-owner-v01b/);
 assert.match(host,/assets\/owner-map-v01b\.js/);
 assert.match(host,/RailwayOwnerMapV01B\?\.unmount\(\)/);
 assert.match(source,/OWNER_REVIEWED/);
});
