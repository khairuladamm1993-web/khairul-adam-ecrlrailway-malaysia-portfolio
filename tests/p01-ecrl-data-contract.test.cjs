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

test('V1 matches the Owner reference inventory for all 25 assets in order',()=>{
 assert.equal(data.version,1);
 assert.equal(data.corridor,'ECRL');
 assert.equal(data.records.length,25);
 assert.equal(new Set(data.records.map(row=>row.assetId)).size,25);
 assert.deepEqual(data.records.map(({section,type,code,name})=>[section,type,code,name]),[
  ['A','STN','STN01','Kota Bharu'],['A','STN','STN02','Pasir Puteh'],
  ['A','STN','STN03','Jerteh'],['A','STN','STN04','Bandar Permaisuri'],
  ['A','PL','PL01','Pekan Sg. Tong'],['A','STN','STN05','Kuala Terengganu'],
  ['A','PL','PL02','Bukit Payung'],['A','STN','STN06','Dungun'],
  ['B','STN','STN07','Kemasik'],['B','STN','STN08','Chukai'],
  ['B','STN','STN09','Cherating'],['B','DEPOT',null,'Kuantan Port City Depot'],
  ['B','STN','STN11','Kuantan Port City'],['B','STN','STN12','Kota SAS'],
  ['B','STN','STN13','Paya Besar'],['B','PL','PL03','Felda Lepar'],
  ['B','PL','PL04','Kampung Alur Gading'],['B','STN','STN14','Maran'],
  ['B','PL','PL05','Chenor'],['B','STN','STN15','Temerloh'],
  ['C1','PL','PL06','Lanchang'],['C1','STN','STN16','Bentong'],
  ['C1','PL','PL07','Alang Sedayu'],['C1','DEPOT',null,'Gombak North EMU Depot'],
  ['C1','STN','STN17','ITT Gombak']
 ]);
 assert.deepEqual(data.records.filter(row=>row.type!=='DEPOT').map(row=>row.assetId),
  adapter.chainage.records.map(row=>row.assetId));
 assert.equal(data.records.find(row=>row.code==='STN11').assetId,'ecrl-stn-10');
 assert.equal(data.records.find(row=>row.code==='PL06').assetId,'ecrl-loop-historical-06');
 assert.deepEqual(data.records.filter(row=>row.type==='DEPOT').map(row=>row.assetId),
  ['ecrl-depot-kuantan','ecrl-depot-gombak-north']);
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
 const kuantan=data.records.find(row=>row.assetId==='ecrl-depot-kuantan');
 const gombak=data.records.find(row=>row.assetId==='ecrl-depot-gombak-north');
 assert.equal(kuantan.chainage,null);
 assert.equal(gombak.chainage.label,'CH519+750');
 assert.match(gombak.confidence.chainage,/NOT_SURVEYED/);
 assert.equal(gombak.chainage.datum,null);
});

test('V7 joins only previously public station localities and retains V8 provenance positions',()=>{
 vm.runInNewContext(fs.readFileSync('assets/corridor-reference.js','utf8'),{window});
 const core=require('../assets/p01-map-core.js');
 const identity=core.publicAssetIdentity(data,adapter);
 const localities=window.RailwayCorridorReference;
 const points=core.publicStationReferences(identity,localities);
 assert.equal(points.length,16);
 for(const point of points){
  const source=data.records.find(row=>row.assetId===point.id);
  assert.equal(source.type,'STN');
  assert.equal(point.geometry.type,'Point');
  assert.deepEqual(point.geometry.coordinates,[...source.referencePosition.coordinates]);
  assert.deepEqual(Object.keys(point.properties).sort(),['assetId','code','name']);
 }
 const duplicate=localities.find(row=>row.name==='Temerloh');
 assert.equal(core.publicStationReferences(identity,[...localities,duplicate]).length,15);
 const misplaced={...duplicate,name:'Serendah Baru'};
 assert.equal(core.publicStationReferences(identity,[...localities,misplaced]).length,16);
});

test('C2 is a separate five-field scheme projection with unchanged source provenance',()=>{
 const core=require('../assets/p01-map-core.js');
 const records=core.publicAssetIdentity(data,adapter);
 assert.equal(new Set(records.map(row=>row.assetId)).size,30);
 assert.deepEqual(records.slice(0,25),data.records.map(({assetId,type,section,code,name})=>({assetId,type,section,code,name})));
 assert.deepEqual(records.slice(25).map(({assetId,type,code,name,section})=>[assetId,type,code,name,section]),[
  ['ecrl-stn-17','STN',null,'Serendah Baru','C2'],
  ['ecrl-stn-18','STN',null,'Puncak Alam','C2'],
  ['ecrl-stn-19','STN',null,'Kapar','C2'],
  ['ecrl-stn-20','STN',null,'Jalan Kastam (Port Klang)','C2'],
  ['ecrl-yard-puncak-alam','YARD',null,'Puncak Alam Freight Yard','C2']
 ]);
 for(const {assetId} of records.slice(25)){
  const a=adapter.get(assetId);
  assert.equal(a.point,null);
  assert.equal(a.chainageStartKm,null);
  assert.equal(adapter.chainage.get(assetId),null);
  assert.equal(Object.keys(records.find(r=>r.assetId===assetId)).length,5);
  if(a.assetType==='STATION'){
   assert.equal(a.referenceSourceId,'EIA17');
   assert.equal(a.assetStatus,'PLANNED_NOT_OPERATIONAL');
  }else{
   assert.equal(a.assetStatus,'PROPOSED_OFFICIAL');
   assert.equal(a.sourceIds[0],'C2_25');
   assert.equal(a.focusReferenceAssetId,'ecrl-stn-18');
  }
 }
 assert.deepEqual(records.slice(25,29).map(r=>adapter.get(r.assetId).verificationStatus),['PARTIAL','SOURCE_CONFLICT','PARTIAL','SOURCE_CONFLICT']);
});

test('V1 seals collection, rows and nested values independently of source arrays',()=>{
 const first=data.records[0];
 assert.throws(()=>data.records.pop(),TypeError);
 assert.throws(()=>{first.confidence.position='VERIFIED'},TypeError);
 assert.throws(()=>{first.chainage.metres=0},TypeError);
 assert.throws(()=>{first.referencePosition.coordinates[0]=0},TypeError);
 assert.notEqual(first.referencePosition.coordinates,adapter.reference(first.assetId).coordinates);
});
