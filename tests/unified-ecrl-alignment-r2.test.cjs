'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const evidence=require('../assets/unified-ecrl/alignment-evidence-r2.js');
const w={};for(const path of ['assets/unified-ecrl/source/data.js','assets/unified-ecrl/source/i18n.js'])vm.runInNewContext(fs.readFileSync(path,'utf8'),{window:w});
const adapter=require('../assets/unified-ecrl/adapter.js').create(w.MRS10ECRLGISV1,w.MRS10ECRLI18N);
test('7 historical PL are CH-linked but physically unlocated, including PL07 C1 only',()=>{
 assert.equal(evidence.passingLoops.length,7);
 for(const item of evidence.passingLoops){
  const a=adapter.get(item.assetId);assert(a);assert.equal(a.plCode,item.code);
  assert.match(a.chainageLabel,/^CH\d+\+\d{3}$/);
  assert.equal(item.point,null);assert.equal(item.geometry,null);
  assert.equal(item.placement,'LIST_ONLY_PENDING_GEOSPATIAL_VERIFICATION');
  assert.equal(adapter.reference(item.assetId),undefined);
 }
 assert.equal(evidence.passingLoops.at(-1).section,'C1');
 assert.match(evidence.passingLoops.at(-1).evidenceClass,/DO_NOT_RELOCATE_TO_C2/);
 assert.equal(adapter.snapshot().verifiedLoopPoints,0);
});
test('7 distinct freight interface concepts preserve KP1 vs KP2 and unknown physical ends',()=>{
 assert.equal(evidence.spurs.length,7);
 assert.deepEqual(evidence.spurs.map(x=>x.code),['KERTEH_PETRONAS','KEMAMAN_PORT','KUANTAN_KP1','KUANTAN_KP2','TEMERLOH_KTMB','NORTHPORT','WESTPORTS']);
 for(const s of evidence.spurs){
  assert.equal(s.verifiedLine,null);assert.equal(s.verifiedRailEndpoint,null);
  assert.equal(s.verifiedLoadingBay,null);assert.equal(s.verifiedTransitLane,null);
  assert.equal(s.physicalConnectivityVerified,false);
  assert.equal(s.passengerRoutingEligible,false);
  assert.equal(s.geometryStatus,'SCHEMATIC_ONLY');
 }
 assert.equal(adapter.snapshot().physicalSegments,0);
 assert.equal(adapter.snapshot().referenceCount,25);
});
test('government, operator, and OSM evidence cannot silently promote physical track',()=>{
 assert.equal(evidence.snapshot().approvedTrackLines,0);
 assert.equal(evidence.snapshot().accuratePLPins,0);
 assert.equal(evidence.snapshot().verifiedEndLanes,0);
 assert.equal(evidence.snapshot().syntheticTracks,0);
 for(const s of Object.values(evidence.sources)){assert(s.url.startsWith('https://'));assert.equal(s.surveyGeometry,false);}
 assert.equal(evidence.placementReview(null).readyForPublicMap,false);
 const weak=evidence.placementReview({assetId:'ecrl-loop-historical-05',geometry:{type:'LineString',coordinates:[[102.2,3.4],[102.3,3.5]]}});
 assert.equal(weak.status,'BLOCKED');assert(weak.reason.includes('NO_INDEPENDENT_ENGINEERING_PROVENANCE'));
 assert(weak.reason.includes('LANDUSE_CLEARANCE_MISSING'));
});
test('even all claimed survey gates only create a review candidate, never auto publish',()=>{
 const candidate={
  assetId:'ecrl-loop-historical-05',geometry:{type:'LineString',coordinates:[[102.2,3.4],[102.3,3.5]]},
  crs:'EPSG:4326',datumValidated:true,evidenceClass:'AS_BUILT_ENGINEERING_SURVEY',
  asBuilt:true,independentReview:true,sourceUrl:'https://example.test/survey.pdf',
  revision:'verified 2026',sourceDocumentId:'internal-reviewed-plan',
  ownerApproved:true,railwayLandUseVerified:true,roadParcelConflictChecked:true,
  residentialParcelConflictChecked:true,parcelConflictFree:true
 };
 const gate=evidence.placementReview(candidate);
 assert.equal(gate.status,'REVIEW_CANDIDATE_ONLY');
 assert.equal(gate.readyForPublicMap,false);
 assert.equal(gate.requiresOwnerPublishApproval,true);
 assert.equal(evidence.placementReview({...candidate,geometry:{type:'LineString',coordinates:[[101,3],[999,999]]}}).status,'BLOCKED');
 assert.equal(evidence.placementReview({...candidate,assetId:'wrong'}).status,'BLOCKED');
 assert.equal(evidence.placementReview({...candidate,parcelConflictFree:false}).status,'BLOCKED');
});
test('four language UI exposes 7+7 evidence rows without adding a fake LineString',()=>{
 const dom=new JSDOM('<!doctype html><body><section id="ecrl-controls"></section><section id="ecrl-assets"></section></body>',{url:'https://example.test/'});
 const win=dom.window;
 vm.runInNewContext(fs.readFileSync('assets/unified-ecrl/integration-ui.js','utf8'),{window:win,document:win.document});
 let locale='ms';
 const ui=win.MRS10ECRLIntegrationUI.create(adapter,{getLocale:()=>locale,getCategory:()=> 'ECRL',onSelect:()=>{},onFlags:()=>{}});
 for(const l of ['ms','en','zh','th']){
  locale=l;ui.render();
  const audit=win.document.querySelector('.ecrl-alignment-readiness');
  assert(audit);
  assert.equal(audit.querySelectorAll('.ecrl-evidence-list').length,2);
  assert.equal(audit.querySelectorAll('.ecrl-evidence-row').length,14);
  assert.match(audit.textContent,/CH415\+180/);
  assert.match(audit.textContent,/KUANTAN|Kuantan|关丹|กวนตัน/i);
  assert.equal(audit.open,false);
  assert.equal(win.document.querySelectorAll('#ecrl-assets button').length,37);
 }
 dom.window.close();
});
