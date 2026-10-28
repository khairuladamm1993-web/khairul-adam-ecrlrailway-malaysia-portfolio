'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const chainage=require('../assets/unified-ecrl/chainage-manifest.js');
const w={};for(const path of ['assets/unified-ecrl/source/data.js','assets/unified-ecrl/source/i18n.js'])vm.runInNewContext(fs.readFileSync(path,'utf8'),{window:w});
const raw=w.MRS10ECRLGISV1,adapter=require('../assets/unified-ecrl/adapter.js').create(raw,w.MRS10ECRLI18N);
const journey=require('../assets/consumer-foundation/journey-engine.js');
test('CH project manifest is chronological, protected and distinct from official operational surveying',()=>{
 assert.equal(chainage.records.length,23);
 assert.equal(new Set(chainage.records.map(x=>x.assetId)).size,23);
 assert(chainage.records.every((x,i,a)=>i===0||x.metres>a[i-1].metres));
 assert.equal(chainage.get('ecrl-stn-10').label,'CH301+735');
 assert.equal(chainage.get('ecrl-stn-16').label,'CH524+160');
 assert.equal(chainage.get('ecrl-loop-historical-05').label,'CH415+180');
 assert.equal(chainage.get('ecrl-loop-historical-07').label,'CH515+725');
 assert.equal(chainage.get('ecrl-stn-17'),null);
 assert(chainage.records.every(r=>r.geometryVerified===false&&r.trackPoint===null));
 assert.match(chainage.status,/PENDING_INDEPENDENT_VERIFICATION/);
});
test('PL01–PL07 have accessible identities and reference CH without manufactured GIS points',()=>{
 assert.equal(adapter.loops.length,7);assert.equal(adapter.assets.length,35);
 assert.equal(adapter.refs.length,24);assert.equal(adapter.features().features.length,24);
 for(let i=1;i<=7;i++){
  const id='ecrl-loop-historical-'+String(i).padStart(2,'0');
  const loop=adapter.get(id);
  assert.equal(loop.plCode,'PL'+String(i).padStart(2,'0'));
  assert.match(loop.chainageLabel,/^CH\d+\+\d{3}$/);
  assert.equal(loop.point,null);assert.equal(adapter.reference(id),undefined);
  assert.equal(adapter.search(loop.plCode).length,1);
  assert.equal(adapter.search(loop.plCode)[0].assetId,id);
  assert.equal(loop.verificationStatus,'PENDING_VALIDATION');
 }
 assert.equal(adapter.search('CH415+180')[0].assetId,'ecrl-loop-historical-05');
 assert.deepEqual([...raw.loops].map(x=>x.chainageStartKm),Array(7).fill(null));
});
test('all 16 original stations expose chainage references; revised C2 remains UNKNOWN',()=>{
 assert.equal(adapter.stations.filter(s=>s.chainageLabel).length,16);
 assert.equal(adapter.stations.filter(s=>s.section==='C2'&&s.chainageLabel!==null).length,0);
 assert.equal(adapter.get('ecrl-stn-13').chainageLabel,'CH396+900');
 assert.equal(adapter.get('ecrl-stn-11').chainageLabel,'CH315+000');
 assert.equal(adapter.get('ecrl-stn-10').stationCode,'STN11');
 assert.equal(adapter.search('STN10').length,0);
 assert(raw.stations.every(s=>s.chainageStartKm===null));
});
test('difference of CH anchors is simulation-only, never GPS, ETA or measured remainder',()=>{
 const d=chainage.referenceDelta('ecrl-stn-11','ecrl-stn-01');
 assert.equal(d.referenceKm,314.33);assert.equal(d.status,'PROJECT_REFERENCE_DELTA_ONLY');
 assert.equal(d.isLive,false);assert.equal(d.isPassengerArrivalEstimate,false);
 assert.equal(chainage.referenceDelta('ecrl-loop-historical-05','ecrl-stn-13').referenceKm,18.28);
 assert.equal(chainage.referenceDelta('ecrl-stn-17','ecrl-stn-01').referenceKm,null);
 const j=journey.create(adapter.stations,'ecrl-stn-11','ecrl-stn-01'),p=journey.progress(j);
 assert.equal(p.referenceRemainingKm,314.33);assert.equal(p.referenceDistanceStatus,'SIMULATED_CH_STATION_ANCHOR_DIFFERENCE');
 assert.equal(p.isLiveDistance,false);assert.equal(p.currentTrainChainage,null);
 assert.equal(j.eta.arrivalAt,null);assert.equal(j.location.permission,'NOT_REQUESTED');
 assert.equal(journey.progress(journey.advance(j)).referenceRemainingKm,301.065);
 const unknown=journey.progress(journey.create(adapter.stations,'ecrl-stn-17','ecrl-stn-18'));
 assert.equal(unknown.referenceRemainingKm,null);
});
test('consumer popup and PL list present project CH in all four languages and keep technical provenance',()=>{
 const dom=new JSDOM('<!doctype html><body><section id="ecrl-controls"></section><section id="ecrl-assets"></section></body>',{url:'https://localhost.test/'});
 const window=dom.window;
 window.MRS10ECRLChainage=chainage;
 vm.runInNewContext(fs.readFileSync('assets/unified-ecrl/integration-ui.js','utf8'),{window,document:window.document});
 let locale='ms';
 const ui=window.MRS10ECRLIntegrationUI.create(adapter,{getLocale:()=>locale,getCategory:()=> 'ECRL',onSelect:()=>{},onFlags:()=>{}});
 for(const language of ['ms','en','zh','th']){
  locale=language;ui.render();
  const pop=ui.content('ecrl-stn-13');
  assert.match(pop.querySelector('.ecrl-key-facts').textContent,/CH396\+900/);
  assert.match(pop.querySelector('.ecrl-engineering').textContent,/MR_S10_OWNER_ACCEPTED_CORRIDOR_MANIFEST/);
  const loop=ui.content('ecrl-loop-historical-05');
  assert.match(loop.querySelector('.ecrl-name').textContent,/PL05/);
  assert.match(loop.querySelector('.ecrl-key-facts').textContent,/CH415\+180/);
  assert.equal(window.document.querySelectorAll('.ecrl-pl-guide-item').length,7);
  assert.match(window.document.querySelector('.ecrl-chainage-guide').textContent,/CH515\+725/);
  assert.equal(window.document.querySelectorAll('#ecrl-assets button').length,35);
 }
});
