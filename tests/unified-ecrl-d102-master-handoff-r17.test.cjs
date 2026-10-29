'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
function setup(){
 const dom=new JSDOM('<!doctype html><main></main>',{url:'https://owner.preview.test'});
 const w=dom.window,ctx={window:w,document:w.document,Blob:w.Blob,FileReader:w.FileReader};
 const paths=['assets/unified-ecrl/chainage-manifest.js',
 'assets/unified-ecrl/source/data.js','assets/unified-ecrl/alignment-evidence-r2.js',
 'assets/unified-ecrl/route-lab-station-intelligence.js',
 'assets/unified-ecrl/route-lab-master-handoff-r17.js'];
 for(const p of paths)vm.runInNewContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
 const rows=w.MRS10ECRLChainage.records;
 const stub={bundleId:'test-complete',reviewStatus:'OWNER_APPROVED',commands:[
  {id:'DONE',action:'FOCUS_ASSET',status:'COMPLETED',assetCode:'STN01'}]};
 const deps={
  getInstructions:()=>({active:stub,audit:[],gaps:[],publicPublish:false}),
  getLayouts:()=>({get:code=>code==='STN01'?{
    code:'STN01',CH:670,source:'QA owner-authorized schematic',
    tracks:[{id:'T1',role:'mainline',points:[[0,50],[100,50]]}],
    asBuiltVerified:false,physicalLineString:null}:null}),
  getJourney:()=>({exportData:()=>({infrastructure:[],ledger:[],modelMode:'MANUAL_CH_ONLY',liveGPS:false})}),
  getSession:()=>({schema:1,mode:'SIMULATION',trainId:'D102-SIM',currentCH:670,origin:'STN01',destination:'STN17',events:[]}),
  getAudit:()=>({recordedCHAnchors:23,physicalTrainReleased:false}),
  getImportedGeometry:()=>null
 };
 return {dom,w,rows,stub,deps};
}
test('master archive includes all 23 accepted CH stations / PL with known source layout, no guessed railway GPS',async()=>{
 const o=setup();
 const output=await o.w.MRS10D102MasterHandoff.create(o.deps);
 assert.equal(output.schema,'mrs10-ecrl-d102-master-handoff-v1');
 assert.equal(output.assetRegistry.length,23);
 assert.equal(output.acceptance.stationCount,16);assert.equal(output.acceptance.passingLoopCount,7);
 assert.equal(output.assetRegistry[0].CHLabel,'CH000+670');
 assert.equal(output.assetRegistry.at(-1).CHLabel,'CH524+160');
 assert.equal(output.assetRegistry.at(-1).deltaNextMetres,null);
 assert.equal(output.assetRegistry[0].nextAsset,'STN02');
 assert.equal(output.assetRegistry.find(x=>x.assetCode==='PL04').chainageM,377950);
 assert.equal(output.assetRegistry.find(x=>x.assetCode==='STN01').sourceTrackLayout.tracks.length,1);
 assert.equal(output.assetRegistry.find(x=>x.assetCode==='PL04').physicalLatitude,null);
 assert.equal(output.acceptance.fullContinuousRailVectorVerified,false);
 assert.equal(output.acceptance.publicPwaPublicationAllowed,false);
 assert.equal(output.importedRailGeometry.sourceGeoJSON,null);
 assert.equal(output.fileIntegrity.mediaEncoding,'DATA_URL_BASE64');
 assert.equal(output.d102Session.currentCH,670);
 assert.equal(output.acceptance.allInstructionCommandsCompleted,true);
 o.dom.window.close();
});
test('master export is blocked before approved assignment really finishes',async()=>{
 const o=setup();
 o.stub.commands[0].status='PENDING_OWNER';
 assert.equal(o.w.MRS10D102MasterHandoff.readiness({active:o.stub}).readyForPortableArchive,false);
 await assert.rejects(()=>o.w.MRS10D102MasterHandoff.create(o.deps),/ASSIGNMENT_NOT_ALL_COMPLETED/);
 const draft=await o.w.MRS10D102MasterHandoff.create(o.deps,{allowIncomplete:true});
 assert.equal(draft.acceptance.handoffStatus,'INCOMPLETE_ASSIGNMENT_DRAFT');
 o.dom.window.close();
});
test('master archive embeds source image data within same JSON, tracks source, and never labels image as geometry',async()=>{
 const o=setup();
 const binary=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0,42]);
 o.w.MRS10D102SourceDocuments={list:async code=>code==='STN01'?[
 {assetCode:'STN01',fileName:'STN01 layout source.png',media:'image/png',bytes:binary.length,
  bytesData:binary,source:'Owner public-domain fixture image',importedAt:'2026-10-30T01:00:00Z'}]:[]};
 const data=await o.w.MRS10D102MasterHandoff.create(o.deps);
 assert.equal(data.trackLayoutMedia.length,1);
 assert.equal(data.assetRegistry[0].linkedSourceMedia.length,1);
 assert.match(data.trackLayoutMedia[0].embeddedDataURL,/^data:image\/png;base64,/);
 assert.equal(data.trackLayoutMedia[0].physicalTrackCentrelineExtracted,false);
 o.dom.window.close();
});
test('master source exports unverified imported GeoJSON explicitly and preserves provenance',async()=>{
 const o=setup();o.deps.getImportedGeometry=()=>({type:'FeatureCollection',source:'Owner allowed reference',
 features:[{type:'Feature',properties:{railway:'construction',source:'OSM candidate'},geometry:{type:'LineString',
 coordinates:[[102.23,6.05],[102.24,6.04]]}}]});
 const data=await o.w.MRS10D102MasterHandoff.create(o.deps,{includeMedia:false});
 assert.equal(data.importedRailGeometry.featureCount,1);
 assert.equal(data.importedRailGeometry.actualTrackSurveyVerified,false);
 assert.equal(data.importedRailGeometry.CHChainageMatched,false);
 assert.equal(data.publicPublished,false);
 o.dom.window.close();
});
