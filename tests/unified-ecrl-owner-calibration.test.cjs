'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const calibration=require('../assets/unified-ecrl/owner-calibration.js');
const row=code=>{
 const assetId='ecrl-loop-historical-'+code.slice(-2);
 return {id:assetId,geometry:{type:'Point',coordinates:[10,20]},
  properties:{assetId,code,referenceOnly:true,physicalVerified:false}};
};
const payload=references=>({version:'MR-S10-R57-OWNER-PL-V1',references});
const valid=()=>['PL01','PL04','PL07'].map(row);
test('R57 accepts only three distinct reference-only PL records',()=>{
 const records=calibration.parse(payload(valid()));
 assert.deepEqual(records.map(r=>r.code),['PL01','PL04','PL07']);
 assert(records.every(r=>!r.physicallyVerified&&!r.surveyConfirmed&&r.kind==='OWNER_REFERENCE_NOT_TRACK'));
});
test('invalid and unresolved locations fail closed for the entire private import',()=>{
 for(const code of ['PL02','PL03','PL05','PL06','DEPOT'])assert.equal(calibration.parse(payload([row('PL01'),row('PL04'),row(code)])),null);
 assert.equal(calibration.parse(payload([row('PL01'),row('PL01'),row('PL07')])),null);
 const [first,...rest]=valid();
 for(const bad of [
  {...first,geometry:{...first.geometry,coordinates:['10',20]}},
  {...first,geometry:{...first.geometry,coordinates:[0,0]}},
  {...first,properties:{...first.properties,physicalVerified:true}},
  {...first,id:'unrelated'}
 ])assert.equal(calibration.parse(payload([bad,...rest])),null);
});
test('owner overlay uses a local, integrity-checked file without storage or network I/O',()=>{
 const code=fs.readFileSync('assets/unified-ecrl/owner-calibration.js','utf8');
 assert.doesNotMatch(code,/fetch\s*\(|fetchMemberBundle|localStorage|sessionStorage|indexedDB|geolocation|service_role/);
 assert.match(code,/file\.arrayBuffer\(\)/);
 assert.match(code,/subtle\.digest\('SHA-256'/);
 assert.match(code,/canAdmin===true/);
});
