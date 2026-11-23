'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const bridge=require('../assets/unified-ecrl/adapter.js');
const master=require('../assets/unified-ecrl/master-intelligence.js');
const contract=require('../assets/unified-ecrl/railway-data-contract-v1.js');

const window={};
for(const file of ['data.js','i18n.js']){
 vm.runInNewContext(fs.readFileSync('assets/unified-ecrl/source/'+file,'utf8'),{window});
}
const adapter=bridge.create(window.MRS10ECRLGISV1,window.MRS10ECRLI18N);
const data=contract.create(adapter,master.create(adapter));

test('V1 projects the V8 schematic inventory in its existing order',()=>{
 assert.equal(data.version,1);
 assert.equal(data.corridor,'ECRL');
 assert.equal(data.records.length,25);
 assert.equal(new Set(data.records.map(row=>row.assetId)).size,25);
 assert.deepEqual(data.records.slice(0,23).map(row=>row.assetId),adapter.chainage.records.map(row=>row.assetId));
 assert.deepEqual(data.records.filter(row=>row.type==='STN').map(row=>row.code),
  [...Array(17)].map((_,i)=>i+1).filter(i=>i!==10).map(i=>'STN'+String(i).padStart(2,'0')));
 assert.equal(data.records.filter(row=>row.type==='PL').length,7);
 assert.deepEqual(data.records.filter(row=>row.type==='DEPOT').map(row=>row.assetId),['ecrl-depot-gombak-north','ecrl-depot-kuantan']);
});

test('V1 preserves independent confidence and source provenance without promoting coordinates',()=>{
 for(const row of data.records){
  assert.equal(row.physicalGeometry,null);
  assert.equal(row.confidence.identity,adapter.get(row.assetId).verificationStatus);
  if(row.type==='STN'){
   const original=adapter.reference(row.assetId);
   assert.deepEqual([...row.referencePosition.coordinates],[...original.coordinates]);
   assert.equal(row.referencePosition.sourceId,original.sourceId);
   assert.equal(row.confidence.position,'AREA_REFERENCE_ONLY');
  }else{
   assert.equal(row.referencePosition,null);
   assert.equal(row.confidence.position,'UNVERIFIED');
  }
 }
 const depots=data.records.filter(row=>row.type==='DEPOT');
 assert.equal(depots[0].chainage.label,'CH519+750');
 assert.match(depots[0].confidence.chainage,/NOT_SURVEYED/);
 assert.equal(depots[0].chainage.datum,null);
 assert.equal(depots[1].chainage,null);
});

test('V1 seals collection, rows and nested values independently of source arrays',()=>{
 const first=data.records[0];
 assert.throws(()=>data.records.pop(),TypeError);
 assert.throws(()=>{first.confidence.position='VERIFIED'},TypeError);
 assert.throws(()=>{first.chainage.metres=0},TypeError);
 assert.throws(()=>{first.referencePosition.coordinates[0]=0},TypeError);
 assert.notEqual(first.referencePosition.coordinates,adapter.reference(first.assetId).coordinates);
});
