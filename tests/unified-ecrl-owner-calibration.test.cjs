'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const calibration=require('../assets/unified-ecrl/owner-calibration.js');
const row=(id,confidence,approved=true,lat=3.5,lon=102.5)=>({id,kind:'corridor',approved,updated_at:'2026-10-13T00:00:00Z',body:{location:{latitude:lat,longitude:lon,locationConfidence:confidence,coordinateSource:'Owner-approved source evidence, not railway survey GIS'}}});
const sample=[row('PL01','Personal Field-Validated Location'),row('PL02','Public Reference Location'),row('PL06','Pending Validation')];
test('admin calibration parser accepts approved PL references but never upgrades survey status',()=>{
 const refs=calibration.parse([...sample,row('PL03','Public Reference Location',false),row('PL08','Validated Location'),row('PL04','INVALID'),row('PL05','Public Reference Location',true,0,0)]);
 assert.deepEqual(refs.map(r=>r.code),['PL01','PL02','PL06']);
 assert(refs.every(r=>!r.physicallyVerified&&!r.surveyConfirmed&&r.kind==='OWNER_REFERENCE_NOT_TRACK'));
 assert.deepEqual(refs[0].coordinates,[102.5,3.5]);
 assert.equal(refs[0].assetId,'ecrl-loop-historical-01');
});
test('owner reference source contains no hardcoded private coordinates or storage/network writes',()=>{
 const code=fs.readFileSync('assets/unified-ecrl/owner-calibration.js','utf8');
 assert(!code.includes('kfudisbzdgsefdjoopzu'));
 assert(!code.includes('service_role'));assert(!code.includes('localStorage'));
 assert(!/geolocation\.getCurrentPosition|navigator\.geolocation/.test(code));
 assert.match(code,/RailwayAccess\.fetchMemberBundle\(\)/);
});
function harness(){
 const dom=new JSDOM('<!doctype html><body></body>',{url:'https://preview.example.test'});
 const w=dom.window;let admin=false,session='public',requests=0;
 const A={get canAdmin(){return admin},get status(){return session},async fetchMemberBundle(){requests++;return {content:sample}}};
 w.RailwayAccess=A;
 let source=null;const layers=new Map();
 const map={
  getStyle:()=>({version:8}),isStyleLoaded:()=>true,
  getSource:id=>id===calibration.NS?source:null,
  addSource(_id,geo){source={data:geo.data,setData(value){this.data=value}};return source},
  hasImage:()=>true,addImage(){},getLayer:id=>layers.get(id),
  addLayer:l=>layers.set(l.id,{...l,visibility:'visible'}),
  setLayoutProperty(id,_key,value){layers.get(id).visibility=value},
  project:c=>({x:c[0]*10,y:c[1]*10})
 };
 vm.runInNewContext(fs.readFileSync('assets/unified-ecrl/owner-calibration.js','utf8'),{window:w,document:w.document});
 const inst=w.MRS10ECRLOwnerCalibration.create({map,getCategory:()=> 'ECRL',onSelect:()=>{}});
 return {inst,source:()=>source,layers,grant(){admin=true;session='authenticated'},revoke(){admin=false;session='public'},get requests(){return requests},dom};
}
test('signed-out or member sessions are denied, authenticated admin loads and logout clears points',async()=>{
 const h=harness();
 assert.equal((await h.inst.sync()).status,'NO_AUTH');assert.equal(h.source(),null);assert.equal(h.requests,0);
 h.grant();const result=await h.inst.sync();
 assert.equal(result.status,'OWNER_REFERENCE_ONLY');assert.equal(result.count,3);
 assert.equal(h.source().data.features.length,3);
 assert.equal(h.inst.reference('ecrl-loop-historical-01').code,'PL01');
 assert.equal(h.inst.count,3);
 h.revoke();assert.equal((await h.inst.sync()).status,'NO_AUTH');
 assert.equal(h.inst.count,0);assert.equal(h.inst.reference('ecrl-loop-historical-01'),null);
 assert.equal(h.source().data.features.length,0);
 h.dom.window.close();
});
test('a newly authenticated session refreshes approved backend data without clientside persistence',async()=>{
 const h=harness();h.grant();h.inst.connect();await h.inst.sync();
 const before=h.requests;h.dom.window.dispatchEvent(new h.dom.window.Event('railway-access-change'));
 await new Promise(resolve=>setImmediate(resolve));
 assert(h.requests>before);assert.equal(h.inst.count,3);h.dom.window.close();
});
