'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const D=require('../assets/unified-ecrl/route-lab-d102-preflight.js');
const T=require('../assets/unified-ecrl/route-lab-d102-observations.js');
function storage(){const o=new Map();return {getItem:k=>o.get(k)||null,setItem:(k,v)=>o.set(k,v)}}
test('pre-run 23 checkpoint model has 16 STN, 7 PL and zero fabricated PL coordinates',()=>{
 assert.equal(D.controls.length,23);
 assert.equal(D.controls.filter(x=>x.type==='STATION').length,16);
 assert.equal(D.controls.filter(x=>x.type==='PASSING_LOOP').length,7);
 assert(D.controls.filter(x=>x.type==='PASSING_LOOP').every(x=>x.publicReference===null));
 assert.equal(D.controls[0].CHLabel,'CH000+670');
 assert.equal(D.controls.at(-1).CHLabel,'CH524+160');
 assert.equal(D.controls.find(x=>x.code==='PL04').CH,377950);
 assert.equal(D.controls.find(x=>x.code==='STN11').name,'Kuantan Port City');
 const d=D.create(storage()).checks();
 assert.equal(d.completed,0);assert.equal(d.missing.length,23);
 assert.equal(d.readyForOwnerModelWalkthrough,false);
 assert.equal(d.readyForGeographicRailMovement,false);
});
test('Owner candidate requires complete source+note and geographic Malaysia coordinate, persists locally only',()=>{
 const mem=storage(),s=D.create(mem),stn=D.controls.find(x=>x.code==='STN01');
 assert(stn.publicReference);
 assert.throws(()=>s.check('PL03',3.1,103.2,'OSM','Missing evidence'),/EVIDENCE_SOURCE/);
 assert.throws(()=>s.check('PL03',3.1,103.2,'OSM reference','bad'),/OWNER_REVIEW_NOTE/);
 assert.throws(()=>s.check('PL03',12.9,103.2,'OSM reference','detailed note'),/INVALID_WGS84/);
 const a=s.check('STN01',stn.publicReference.latitude,stn.publicReference.longitude,
  'Public locality reference, not station track','Owner model candidate subject to rail geometry QA');
 assert.equal(a.surveyVerified,false);
 assert.equal(s.checks().completed,1);
 assert.equal(D.create(mem).checks().completed,1);
 assert.equal(s.checks().missing.length,22);
 assert(s.revoke('STN01'));assert.equal(s.checks().completed,0);
});
test('neighbor CH comparison rejects impossible straight-line > measured CH without claiming a route',()=>{
 const s=D.create(storage());
 s.check('STN01',6.1,101.8,'Candidate source A','Owner model test point one');
 s.check('STN02',6.1,103.5,'Candidate source B','Owner model test point two');
 const report=s.checks();
 assert.equal(report.adjacentPairsChecked,1);assert.equal(report.issues.length,1);
 assert.equal(report.pairedComparisons[0].lowerBoundCheck,'REVIEW_INCOMPATIBLE_CH');
 assert.equal(report.readyForGeographicRailMovement,false);
 assert.equal(report.fullRunReleaseStatus,'BLOCKED_NO_COMPLETE_AUTHORIZED_RAIL_GEOMETRY');
});
test('D102 instrument captures CH-linked, explicitly unverified engineering events and recovers after reload',()=>{
 const mem=storage(),l=T.create(mem);
 assert(T.TYPES.includes('TUNNEL_ENTRY'));assert(T.TYPES.includes('PASSING_LOOP'));assert(T.TYPES.includes('GRADIENT_CHANGE'));
 assert(T.TYPES.includes('TRACK_GAUGE_REFERENCE'));assert(T.TYPES.includes('GPS_OBSERVATION_MANUAL'));
 assert.throws(()=>l.log({type:'BAD',title:'Test',notes:'Meaningful details'},670),/UNKNOWN/);
 assert.throws(()=>l.log({type:'TUNNEL_ENTRY',title:'Portal',notes:'Not verified tunnel yet',source:'OWNER_SIMULATED_OBSERVATION'},600000),/OUT_OF_CORRIDOR/);
 const event=l.log({type:'TUNNEL_ENTRY',title:'Tunnel reference',notes:'Observed only as simulation model candidate',evidenceClass:'SIMULATED',source:'LOCAL_TRAINING_REFERENCE'},33800);
 assert.equal(event.CHLabel,'CH033+800');assert.equal(event.absoluteLatitude,null);assert.equal(event.absoluteLongitude,null);
 assert.equal(event.gradientPerMille,null);assert.equal(event.designSpeedKmh,null);
 const after=T.create(mem).snapshot();assert.equal(after.observationCount,1);
 assert.equal(after.actualGPSCaptured,false);assert.equal(after.cloudSynced,false);
 const payload=JSON.stringify(l.exportLog());assert(!payload.includes('geometry.coordinates'));assert(payload.includes('D102-SIM'));
});
test('browser page includes private register and source-linked telemetry without runtime GPS',()=>{
 const html=fs.readFileSync('ecrl-alignment-lab.html','utf8');
 const ui=fs.readFileSync('assets/unified-ecrl/route-lab-ui.js','utf8');
 const pre=fs.readFileSync('assets/unified-ecrl/route-lab-d102-preflight-ui.js','utf8');
 assert(html.includes('lab-d102-preflight')&&html.includes('lab-d102-observations'));
 assert(html.includes('route-lab-d102-preflight.js')&&html.includes('route-lab-d102-observations.js'));
 assert(ui.includes('MRS10ECRLD102PreflightUI?.connect(map)'));
 assert(!pre.includes('navigator.geolocation'));
 assert(!pre.includes('service_role'));
 assert(pre.includes('not a')===false||pre.includes('SIMULASI'));
});
