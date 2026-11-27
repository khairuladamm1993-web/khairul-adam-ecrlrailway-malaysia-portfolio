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
 assert.equal(new Set(records.map(row=>row.assetId)).size,32);
 assert.deepEqual(records.slice(0,25),data.records.map(({assetId,type,section,code,name})=>({assetId,type,section,code,name})));
 assert.deepEqual(records.slice(25,30).map(({assetId,type,code,name,section})=>[assetId,type,code,name,section]),[
  ['ecrl-stn-17','STN',null,'Serendah Baru','C2'],
  ['ecrl-stn-18','STN',null,'Puncak Alam','C2'],
  ['ecrl-stn-19','STN',null,'Kapar','C2'],
  ['ecrl-stn-20','STN',null,'Jalan Kastam (Port Klang)','C2'],
  ['ecrl-yard-puncak-alam','YARD',null,'Puncak Alam Freight Yard','C2']
 ]);
 for(const {assetId} of records.slice(25,30)){
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

test('Section D projects separate planned port interfaces without track positions',()=>{
 const core=require('../assets/p01-map-core.js');
 const records=core.publicAssetIdentity(data,adapter).slice(30);
 assert.deepEqual(records,[
  {assetId:'ecrl-port-northport',type:'PORT',code:null,name:'Northport',section:'D'},
  {assetId:'ecrl-port-westports',type:'PORT',code:null,name:'Westports',section:'D'}
 ]);
 assert.deepEqual(core.sectionDGauges,{ecrl:1435,ktmb:1000});
 const scheme=adapter.registry.segments.find(row=>row.segmentId==='ecrl-d-port-access');
 assert.equal(scheme.trackArrangement,'SEPARATE_PARALLEL_STANDARD_AND_METRE_GAUGE');
 assert.equal(scheme.geometry,null);
 for(const {assetId} of records){
  const asset=adapter.get(assetId);
  assert.equal(asset.assetType,'PORT_INTERFACE');
  assert.equal(asset.assetStatus,'PLANNED_CONNECTION');
  assert.equal(asset.verificationStatus,'PARTIAL');
  assert.equal(asset.point,null);
  assert.equal(adapter.chainage.get(assetId),null);
  assert.equal(asset.referenceSourceId,'PKA22');
  assert.ok(asset.sourceIds.includes('MOT_D25'));
 }
});

test('PL02–PL05 keep their chainage order and cannot use locality coordinates as map pins',()=>{
 const core=require('../assets/p01-map-core.js');
 const records=core.publicAssetIdentity(data,adapter);
 const scope={window:{}};
 vm.runInNewContext(fs.readFileSync('assets/corridor-reference.js','utf8'),scope);
 const localities=scope.window.RailwayCorridorReference;
 const held=records.filter(core.isPassingLoopPlacementHeld);
 assert.deepEqual(held.map(row=>[row.code,row.section]),[['PL02','A'],['PL03','B'],['PL04','B'],['PL05','B']]);
 assert.deepEqual(held.map(row=>data.records.find(asset=>asset.assetId===row.assetId).chainage.metres),
  [172450,353242,377950,415180]);
 for(const row of held){
  assert.ok(localities.some(ref=>ref.name===row.name&&ref.type==='PL'));
  assert.deepEqual(core.findPublicAssets(records,row.code),[row]);
  assert.equal(data.records.find(asset=>asset.assetId===row.assetId).physicalGeometry,null);
 }
 assert.deepEqual(core.publicPassingLoopReferences(records,localities),[]);
 const current=localities.find(r=>r.name==='Bukit Payung');
 const other=records.find(row=>row.code==='PL01');
 const validFixture={...current,name:other.name};
 assert.equal(core.publicPassingLoopReferences([other],[validFixture]).length,1);
 assert.equal(core.publicPassingLoopReferences([other],[{...validFixture,phase:'historical'}]).length,0);
 assert.equal(core.publicPassingLoopReferences([other],[{...validFixture,locationConfidence:'Personal Field-Validated Location'}]).length,0);
 assert.equal(core.publicPassingLoopReferences([other],[{...validFixture,coordinateSource:'No validated coordinate'}]).length,0);
 assert.equal(core.publicPassingLoopReferences([other],[validFixture,validFixture]).length,0);
});

test('Public reference alignment accepts uncalibrated ODbL data and rejects other tiers',()=>{
 const core=require('../assets/p01-map-core.js');
 const content=fs.readFileSync('data/ecrl-reference-alignment.geojson','utf8');
 const payload=JSON.parse(content);
 const {structureTags,branchTags,...baselineMetadata}=payload.metadata;
 const featuresAt=content.indexOf(',"features":[');
 const baseline=JSON.stringify({type:payload.type,metadata:baselineMetadata}).slice(0,-1)+content.slice(featuresAt);
 assert.equal(require('node:crypto').createHash('sha256').update(baseline).digest('hex'),
  '89bdc6486cf00f7c0bac6f9384dbdbc1f783cd4c893149e1e739b6ae88e77eb7');
 assert.deepEqual(Object.values(structureTags).reduce((counts,[kind])=>{
  counts[kind]=(counts[kind]??0)+1;return counts;
 },{}),{tunnel:26,bridge:170,viaduct:6});
 const projection=core.publicReferenceAlignment(payload);
 const ids=new Set(projection.features.map(f=>f.id));
 assert.ok(Object.entries(structureTags).every(([id,[,version]])=>ids.has(id)&&Number.isSafeInteger(version)&&version>0));
 assert.equal(Object.keys(branchTags).length,7);
 assert.ok(Object.entries(branchTags).every(([id,version])=>ids.has(id)&&Number.isSafeInteger(version)&&version>0));
 assert.equal(projection.features.length,453);
 assert.equal(new Set(projection.features.map(f=>f.properties.osmWayId)).size,444);
 assert.equal(projection.features.reduce((n,f)=>n+f.geometry.coordinates.length,0),3278);
 assert.equal('metadata' in projection,false);
 for(const change of [{physicalVerified:true},{scope:'PRIVATE_REVIEW'},{license:'PRIVATE_ONLY'},
   {classification:'HISTORICAL_PLANNING'},{dataset:'R1.5b_HOLD'}]){
  assert.throws(()=>core.publicReferenceAlignment({...payload,metadata:{...payload.metadata,...change}}),/ALIGNMENT_CONTRACT/);
 }
 assert.throws(()=>core.publicReferenceAlignment({...payload,features:[]}),/ALIGNMENT_CONTRACT/);
 const feature=payload.features[0];
 assert.throws(()=>core.publicReferenceAlignment({...payload,features:[feature,{...feature}]}),/ALIGNMENT_FEATURE/);
 assert.throws(()=>core.publicReferenceAlignment({...payload,features:[
  {...feature,properties:{...feature.properties,sourceGraph:'private'}}
 ]}),/ALIGNMENT_FEATURE/);
});

test('Rail structure and branch detail are restricted to admitted IDs, tags and way versions',async t=>{
 const core=require('../assets/p01-map-core.js');
 const payload=JSON.parse(fs.readFileSync('data/ecrl-reference-alignment.geojson','utf8'));
 const [allowed,invalidVersion,invalidTag]=payload.features;
 payload.metadata.structureTags={
  [allowed.id]:['tunnel',3],[invalidVersion.id]:['bridge',0],[invalidTag.id]:['yard',2],
  'not-an-admitted-feature':['bridge',5],
 };
 payload.metadata.branchTags={[allowed.id]:12,[invalidVersion.id]:0,'not-an-admitted-feature':5};
 t.mock.method(global,'fetch',async()=>({ok:true,json:async()=>payload}));
 const {geometry,structures,branches}=await core.loadPublicReferenceAlignment();
 assert.equal(geometry.features.length,453);
 assert.deepEqual([...structures],[[allowed.id,{kind:'tunnel',version:3}]]);
 assert.deepEqual([...branches],[[allowed.id,12]]);
});

test('V1 seals collection, rows and nested values independently of source arrays',()=>{
 const first=data.records[0];
 assert.throws(()=>data.records.pop(),TypeError);
 assert.throws(()=>{first.confidence.position='VERIFIED'},TypeError);
 assert.throws(()=>{first.chainage.metres=0},TypeError);
 assert.throws(()=>{first.referencePosition.coordinates[0]=0},TypeError);
 assert.notEqual(first.referencePosition.coordinates,adapter.reference(first.assetId).coordinates);
});

test('Public and Member share the exact admitted ECRL rail projection and paint, never physical promotion',async t=>{
 const core=require('../assets/p01-map-core.js');
 const payload=JSON.parse(fs.readFileSync('data/ecrl-reference-alignment.geojson','utf8'));
 t.mock.method(global,'fetch',async()=>({ok:true,json:async()=>payload}));
 const alignment=await core.loadPublicReferenceAlignment();
 const publicSpec=core.referenceAlignmentSpec('v7',alignment,'light');
 const memberSpec=core.referenceAlignmentSpec('v8',alignment,'light');
 assert.deepEqual(publicSpec.source,memberSpec.source);
 assert.deepEqual(publicSpec.layer.paint,memberSpec.layer.paint);
 assert.equal(memberSpec.source.data.features.length,453);
 assert.equal(memberSpec.source.data.features.filter(f=>f.properties.branch).length,7);
 assert.equal(memberSpec.source.data.features.filter(f=>f.properties.structure!=='unclassified').length,202);
 assert.equal(memberSpec.source.data.features.every(f=>f.properties.segmentId===f.id),true);
 assert.match(memberSpec.source.attribution,/ODbL 1.0/);
 assert.deepEqual(memberSpec.layer.paint['line-dasharray'],[2.4,1.5]);
 assert.equal(memberSpec.layer.source,'v8');
 assert.equal(payload.metadata.physicalVerified,false);
 assert.equal(core.referenceAlignmentVisible('MRS10'),true);
 assert.equal(core.referenceAlignmentVisible('ECRL','INFRASTRUCTURE_FOCUS'),true);
 assert.equal(core.referenceAlignmentVisible('KTM'),false);
 assert.equal(core.referenceAlignmentVisible('ECRL','TRACK_FOCUS'),false);
 assert.equal(core.referenceAlignmentVisible('ECRL','NORMAL',false),false);
 const layers=new Map([['marker',{id:'marker'}]]),sources=new Map();
 const map={getLayer:id=>layers.get(id),getSource:id=>sources.get(id),
  addSource:(id,spec)=>sources.set(id,spec),addLayer:(layer,before)=>{assert.equal(before,'marker');layers.set(layer.id,layer)}};
 assert.equal(core.installReferenceAlignment(map,'v8',alignment,'light','marker'),true);
 assert.equal(core.installReferenceAlignment(map,'v8',alignment,'light','marker'),false);
 assert.equal(sources.size,1);
 assert.equal(layers.size,2);
 layers.delete('v8');sources.delete('v8');
 assert.equal(core.installReferenceAlignment(map,'v8',alignment,'dark','marker'),true);
 assert.equal(layers.get('v8').paint['line-color'][2],'#76d697');
});
