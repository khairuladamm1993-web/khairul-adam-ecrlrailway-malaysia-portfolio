'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../assets/unified-ecrl/route-lab-engine.js'),C=require('../assets/unified-ecrl/chainage-manifest.js'),rows=E.checkpoints(C);
const geo=(reversed=false,disconnected=false)=>({type:'FeatureCollection',source:'OSM_TEST_FIXTURE_SYNTHETIC_NOT_REAL_ECRL',anchors:[
 {code:'STN01',coordinates:[102,3],source:'TEST_ONLY'}, {code:'STN02',coordinates:[102.298,3],source:'TEST_ONLY'}
],features:[
 {type:'Feature',properties:{railway:'construction',sourceRef:'TEST-WAY-1'},geometry:{type:'LineString',coordinates:[[102,3],[102.15,3]]}},
 {type:'Feature',properties:{railway:'construction',sourceRef:'TEST-WAY-2'},geometry:{type:'LineString',coordinates:disconnected?[[102.16,3],[102.298,3]]:reversed?[[102.298,3],[102.15,3]]:[[102.15,3],[102.298,3]]}}
]});
test('all 23 ordered CH assets and single train manual progress',()=>{
 assert.equal(rows.length,23);assert.equal(rows.filter(x=>x.code.startsWith('PL')).length,7);
 let s=E.start(rows);assert.equal(s.currentCH,670);assert.equal(s.trainId,'D102-SIM');
 assert.equal(E.progress(s,rows).remainingKm,523.49);
 s=E.advance(s,rows,33700,'2026-10-29T00:00:00Z');
 assert.equal(E.progress(s,rows).next.code,'STN03');
 assert.equal(s.events.filter(e=>e.type==='SIM_CHECKPOINT')[0].code,'STN02');
 assert.throws(()=>E.advance(s,rows,100),/INVALID_CH/);
 const r=E.review(s,rows,'STN02','Confirmed the simulated arrival against the model');
 assert.equal(r.reviews[0].classification,'OWNER_SIMULATION_REVIEW');
 assert.equal(r.reviews[0].surveyVerified,false);
 assert.throws(()=>E.review(s,rows,'PL01','good note here'),/CHECKPOINT_REVIEW/);
});
test('two OSM rail line parts join in either orientation without synthesizing a gap',()=>{
 for(const reversed of [false,true]){const a=E.assemble(geo(reversed));assert.equal(a.status,'CONTINUOUS_CANDIDATE');
 assert.equal(a.paths.length,1);assert.equal(a.joins,1);assert.equal(a.syntheticBridges,0);
 assert.equal(a.asBuiltVerified,false);
 const matched=E.fit(rows,a,geo().anchors);assert.equal(matched.status,'INFERRED_CH_MATCH_ONLY');
 const start=E.positionAt(670,a,matched),mid=E.positionAt(17000,a,matched);
 assert(start&&mid);assert.match(mid.quality,/SIMULATION_INFERRED/);
 }
});
test('gaps, roads and incomplete controls cannot create public train alignment',()=>{
 const a=E.assemble(geo(false,true));assert.equal(a.status,'GAPS_OR_BRANCHES');assert.equal(a.paths.length,2);
 assert.equal(E.fit(rows,a,geo().anchors).status,'NO_CONNECTED_RAIL_GEOMETRY');
 assert.equal(E.positionAt(17000,a,E.fit(rows,a,geo().anchors)),null);
 const road=geo();road.features[0].properties.railway='highway';
 assert.throws(()=>E.assemble(road),/NON_RAILWAY|UNSAFE/);
 const incomplete=geo();incomplete.anchors[1].coordinates=[102.05,3];
 assert.notEqual(E.fit(rows,E.assemble(incomplete),incomplete.anchors).status,'INFERRED_CH_MATCH_ONLY');
});
test('owner calibration never counts as survey and never uses device GPS',()=>{
 const code=fs.readFileSync('assets/unified-ecrl/route-lab-ui.js','utf8'),html=fs.readFileSync('ecrl-alignment-lab.html','utf8');
 assert(!code.includes('navigator.geolocation'));assert(!code.includes('watchPosition('));
 assert(!code.includes('service_role'));assert(!code.includes('supabase'));
 assert(html.includes('EXPERIMENTAL / SIMULASI'));assert(html.includes('route-lab-ui.js'));
 assert(html.includes('not a secured Owner portal'));
});
